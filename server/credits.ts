import type { FormaDb } from './db.ts'
import { newId } from './auth.ts'
import { resolveOperation, legacyToCatalog, activeCostVersion } from './credit/catalog.ts'
import { grantToBucket, debitFromBuckets, refundToBuckets, bucketSummary } from './credit/buckets.ts'
import { recordEvent } from './credit/events.ts'

/** Starting grant on register (Phase 7). Payments come in Phase 8. */
export const STARTING_CREDITS = 50

export const CREDIT_COSTS = {
  generate: 3,
  revise: 2,
  export_zip: 1,
} as const

export type CreditOperation = keyof typeof CREDIT_COSTS
export type MeteredOperation = 'generate' | 'revise'

export type CreditTxKind = 'grant' | 'reserve' | 'commit' | 'refund' | 'adjust'

export type WalletRow = {
  user_id: string
  balance: number
  updated_at: string
}

export type CreditTransactionRow = {
  id: string
  user_id: string
  kind: string
  amount: number
  balance_after: number
  ref_id: string | null
  meta_json: string | null
  created_at: string
}

export type CreditReservationRow = {
  id: string
  user_id: string
  amount: number
  status: string
  operation: string
  client_request_id: string | null
  created_at: string
  finalized_at: string | null
}

export class CreditsError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'CreditsError'
  }
}

function nowIso(): string {
  return new Date().toISOString()
}

export function costFor(operation: MeteredOperation): number {
  // Legacy constant is the fallback; catalog is the source of truth when seeded.
  return CREDIT_COSTS[operation]
}

/**
 * Resolve cost from the catalog (Phase 10). Falls back to legacy constant
 * if the catalog is not yet seeded (e.g. during early migration).
 */
export function costForCatalog(db: FormaDb, operationId: string): number {
  try {
    const def = resolveOperation(db, operationId)
    return def.creditCost
  } catch {
    // Fallback to legacy
    const legacy = operationId === 'generate' ? CREDIT_COSTS.generate
      : operationId === 'revise' ? CREDIT_COSTS.revise
      : operationId === 'export_zip' ? CREDIT_COSTS.export_zip
      : 0
    return legacy
  }
}

export function getBalance(db: FormaDb, userId: string): number {
  const row = db.prepare(`SELECT balance FROM wallets WHERE user_id = ?`).get(userId) as
    | { balance: number }
    | undefined
  return row?.balance ?? 0
}

export function ensureWallet(db: FormaDb, userId: string, startingGrant = STARTING_CREDITS): void {
  const existing = db.prepare(`SELECT user_id FROM wallets WHERE user_id = ?`).get(userId)
  if (existing) return
  createWalletWithGrant(db, userId, startingGrant)
}

/** Create wallet + starting grant transaction (used on register). */
export function createWalletWithGrant(
  db: FormaDb,
  userId: string,
  amount: number = STARTING_CREDITS,
): void {
  const now = nowIso()
  db.exec('BEGIN')
  try {
    db.prepare(
      `INSERT INTO wallets (user_id, balance, updated_at) VALUES (?, ?, ?)`,
    ).run(userId, amount, now)
    // Phase 10: also create a bonus bucket for the starting grant
    grantToBucket(db, userId, 'bonus', amount, { sourceRef: 'starting_grant' })
    db.prepare(
      `INSERT INTO credit_transactions (id, user_id, kind, amount, balance_after, ref_id, meta_json, created_at)
       VALUES (?, ?, 'grant', ?, ?, NULL, ?, ?)`,
    ).run(
      newId(),
      userId,
      amount,
      amount,
      JSON.stringify({ reason: 'starting_grant' }),
      now,
    )
    db.exec('COMMIT')
  } catch (err) {
    try {
      db.exec('ROLLBACK')
    } catch {
      /* ignore */
    }
    throw err
  }
}

export function listTransactions(
  db: FormaDb,
  userId: string,
  limit = 50,
): CreditTransactionRow[] {
  const safe = Math.min(Math.max(1, Math.floor(limit) || 50), 200)
  return db
    .prepare(
      `SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    )
    .all(userId, safe) as CreditTransactionRow[]
}

export type ReserveResult = {
  reservationId: string
  amount: number
  balance: number
  operation: MeteredOperation
  idempotent: boolean
}

/**
 * Atomic reserve: debit wallet immediately, leave reservation pending until commit/refund.
 * Idempotent when clientRequestId is provided (returns existing pending/committed reservation).
 *
 * Phase 10: also debits from credit buckets following the consumption policy,
 * and records a credit_event for analytics.
 */
export function reserveCredits(
  db: FormaDb,
  userId: string,
  operation: MeteredOperation,
  clientRequestId?: string | null,
): ReserveResult {
  const amount = costFor(operation)
  const clientId =
    typeof clientRequestId === 'string' && clientRequestId.trim()
      ? clientRequestId.trim().slice(0, 128)
      : null

  db.exec('BEGIN IMMEDIATE')
  try {
    if (clientId) {
      const existing = db
        .prepare(
          `SELECT * FROM credit_reservations WHERE user_id = ? AND client_request_id = ?`,
        )
        .get(userId, clientId) as CreditReservationRow | undefined
      if (existing) {
        if (existing.status === 'refunded') {
          db.exec('ROLLBACK')
          throw new CreditsError(409, 'Bu istek için rezervasyon iade edilmiş.')
        }
        const balance = getBalanceUnlocked(db, userId)
        db.exec('COMMIT')
        return {
          reservationId: existing.id,
          amount: existing.amount,
          balance,
          operation: existing.operation as MeteredOperation,
          idempotent: true,
        }
      }
    }

    const wallet = db
      .prepare(`SELECT balance FROM wallets WHERE user_id = ?`)
      .get(userId) as { balance: number } | undefined
    if (!wallet) {
      db.exec('ROLLBACK')
      throw new CreditsError(404, 'Cüzdan bulunamadı.')
    }
    if (wallet.balance < amount) {
      db.exec('ROLLBACK')
      throw new CreditsError(402, 'Krediniz yetersiz')
    }

    const now = nowIso()
    const reservationId = newId()
    const newBalance = wallet.balance - amount

    // Phase 10: debit from buckets (sub-ledger) following consumption policy
    try {
      debitFromBuckets(db, userId, amount)
    } catch {
      // If buckets don't exist yet (legacy wallet without buckets),
      // skip bucket debit — wallet debit is still authoritative.
      // This preserves backward compatibility with pre-Phase 10 wallets.
    }

    db.prepare(
      `INSERT INTO credit_reservations
         (id, user_id, amount, status, operation, client_request_id, created_at, finalized_at)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, NULL)`,
    ).run(reservationId, userId, amount, operation, clientId, now)

    db.prepare(`UPDATE wallets SET balance = ?, updated_at = ? WHERE user_id = ?`).run(
      newBalance,
      now,
      userId,
    )

    db.prepare(
      `INSERT INTO credit_transactions (id, user_id, kind, amount, balance_after, ref_id, meta_json, created_at)
       VALUES (?, ?, 'reserve', ?, ?, ?, ?, ?)`,
    ).run(
      newId(),
      userId,
      -amount,
      newBalance,
      reservationId,
      JSON.stringify({ operation, clientRequestId: clientId }),
      now,
    )

    // Phase 10: record credit event
    try {
      recordEvent(db, {
        userId,
        eventType: 'credit_reservation_created',
        operationId: operation,
        reservationId,
        amount: -amount,
        meta: { clientRequestId: clientId },
      })
    } catch { /* events are best-effort */ }

    db.exec('COMMIT')
    return {
      reservationId,
      amount,
      balance: newBalance,
      operation,
      idempotent: false,
    }
  } catch (err) {
    if (err instanceof CreditsError) throw err
    try {
      db.exec('ROLLBACK')
    } catch {
      /* ignore */
    }
    throw err
  }
}

/**
 * Phase 10: Reserve credits for a catalog operation ID (not legacy).
 * Uses the catalog to resolve cost and stores the catalog operation ID.
 */
export function reserveCreditsForCatalog(
  db: FormaDb,
  userId: string,
  catalogOperationId: string,
  clientRequestId?: string | null,
  context?: { projectId?: string; sessionId?: string; feedbackText?: string },
): ReserveResult & { catalogOperationId: string; costVersionId: string | null } {
  const def = resolveOperation(db, catalogOperationId)
  const amount = def.creditCost
  const clientId =
    typeof clientRequestId === 'string' && clientRequestId.trim()
      ? clientRequestId.trim().slice(0, 128)
      : null

  // Get cost version for historical preservation
  const costVersion = activeCostVersion(db, def.operationId)
  const costVersionId = costVersion?.id ?? null

  db.exec('BEGIN IMMEDIATE')
  try {
    if (clientId) {
      const existing = db
        .prepare(
          `SELECT * FROM credit_reservations WHERE user_id = ? AND client_request_id = ?`,
        )
        .get(userId, clientId) as CreditReservationRow | undefined
      if (existing) {
        if (existing.status === 'refunded') {
          db.exec('ROLLBACK')
          throw new CreditsError(409, 'Bu istek için rezervasyon iade edilmiş.')
        }
        const balance = getBalanceUnlocked(db, userId)
        db.exec('COMMIT')
        return {
          reservationId: existing.id,
          amount: existing.amount,
          balance,
          operation: existing.operation as MeteredOperation,
          idempotent: true,
          catalogOperationId: def.operationId,
          costVersionId,
        }
      }
    }

    const wallet = db
      .prepare(`SELECT balance FROM wallets WHERE user_id = ?`)
      .get(userId) as { balance: number } | undefined
    if (!wallet) {
      db.exec('ROLLBACK')
      throw new CreditsError(404, 'Cüzdan bulunamadı.')
    }
    if (wallet.balance < amount) {
      db.exec('ROLLBACK')
      throw new CreditsError(402, 'Krediniz yetersiz')
    }

    const now = nowIso()
    const reservationId = newId()
    const newBalance = wallet.balance - amount

    // Debit from buckets
    try {
      debitFromBuckets(db, userId, amount)
    } catch {
      /* legacy wallet without buckets — wallet debit is authoritative */
    }

    // Store with legacy operation mapping for backward compat
    const legacyOp = def.operationId === 'initial_design' ? 'generate'
      : def.category === 'revision' || def.category === 'refinement' ? 'revise'
      : 'generate'

    db.prepare(
      `INSERT INTO credit_reservations
         (id, user_id, amount, status, operation, client_request_id, created_at, finalized_at)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, NULL)`,
    ).run(reservationId, userId, amount, legacyOp, clientId, now)

    db.prepare(`UPDATE wallets SET balance = ?, updated_at = ? WHERE user_id = ?`).run(
      newBalance,
      now,
      userId,
    )

    db.prepare(
      `INSERT INTO credit_transactions (id, user_id, kind, amount, balance_after, ref_id, meta_json, created_at)
       VALUES (?, ?, 'reservation', ?, ?, ?, ?, ?)`,
    ).run(
      newId(),
      userId,
      -amount,
      newBalance,
      reservationId,
      JSON.stringify({
        operation: def.operationId,
        legacyOperation: legacyOp,
        clientRequestId: clientId,
        costVersionId,
        projectId: context?.projectId ?? null,
        sessionId: context?.sessionId ?? null,
      }),
      now,
    )

    // Record credit event
    try {
      recordEvent(db, {
        userId,
        eventType: 'credit_reservation_created',
        operationId: def.operationId,
        reservationId,
        projectId: context?.projectId ?? null,
        sessionId: context?.sessionId ?? null,
        amount: -amount,
        meta: { clientRequestId: clientId, costVersionId },
      })
    } catch { /* events are best-effort */ }

    db.exec('COMMIT')
    return {
      reservationId,
      amount,
      balance: newBalance,
      operation: legacyOp,
      idempotent: false,
      catalogOperationId: def.operationId,
      costVersionId,
    }
  } catch (err) {
    if (err instanceof CreditsError) throw err
    try {
      db.exec('ROLLBACK')
    } catch {
      /* ignore */
    }
    throw err
  }
}

function getBalanceUnlocked(db: FormaDb, userId: string): number {
  const row = db.prepare(`SELECT balance FROM wallets WHERE user_id = ?`).get(userId) as
    | { balance: number }
    | undefined
  return row?.balance ?? 0
}

export type FinalizeResult = {
  reservationId: string
  status: 'committed' | 'refunded'
  balance: number
}

export function commitReservation(db: FormaDb, userId: string, reservationId: string): FinalizeResult {
  db.exec('BEGIN IMMEDIATE')
  try {
    const res = db
      .prepare(`SELECT * FROM credit_reservations WHERE id = ? AND user_id = ?`)
      .get(reservationId, userId) as CreditReservationRow | undefined
    if (!res) {
      db.exec('ROLLBACK')
      throw new CreditsError(404, 'Rezervasyon bulunamadı.')
    }
    if (res.status === 'committed') {
      db.exec('ROLLBACK')
      throw new CreditsError(409, 'Rezervasyon zaten tamamlanmış.')
    }
    if (res.status === 'refunded') {
      db.exec('ROLLBACK')
      throw new CreditsError(409, 'Rezervasyon iade edilmiş; tamamlanamaz.')
    }

    const now = nowIso()
    const balance = getBalanceUnlocked(db, userId)

    db.prepare(
      `UPDATE credit_reservations SET status = 'committed', finalized_at = ? WHERE id = ?`,
    ).run(now, reservationId)

    // Funds already deducted on reserve; commit is a ledger note (amount 0).
    db.prepare(
      `INSERT INTO credit_transactions (id, user_id, kind, amount, balance_after, ref_id, meta_json, created_at)
       VALUES (?, ?, 'commit', 0, ?, ?, ?, ?)`,
    ).run(
      newId(),
      userId,
      balance,
      reservationId,
      JSON.stringify({ operation: res.operation, reservedAmount: res.amount }),
      now,
    )

    // Phase 10: record credit event
    try {
      recordEvent(db, {
        userId,
        eventType: 'credit_consumption_committed',
        operationId: res.operation,
        reservationId,
        amount: -res.amount,
        meta: { reservedAmount: res.amount },
      })
    } catch { /* events are best-effort */ }

    db.exec('COMMIT')
    return { reservationId, status: 'committed', balance }
  } catch (err) {
    if (err instanceof CreditsError) throw err
    try {
      db.exec('ROLLBACK')
    } catch {
      /* ignore */
    }
    throw err
  }
}

export function refundReservation(
  db: FormaDb,
  userId: string,
  reservationId: string,
  reason?: string | null,
): FinalizeResult {
  db.exec('BEGIN IMMEDIATE')
  try {
    const res = db
      .prepare(`SELECT * FROM credit_reservations WHERE id = ? AND user_id = ?`)
      .get(reservationId, userId) as CreditReservationRow | undefined
    if (!res) {
      db.exec('ROLLBACK')
      throw new CreditsError(404, 'Rezervasyon bulunamadı.')
    }
    if (res.status === 'refunded') {
      db.exec('ROLLBACK')
      throw new CreditsError(409, 'Rezervasyon zaten iade edilmiş.')
    }
    if (res.status === 'committed') {
      db.exec('ROLLBACK')
      throw new CreditsError(409, 'Tamamlanmış rezervasyon iade edilemez.')
    }

    const now = nowIso()
    const wallet = db
      .prepare(`SELECT balance FROM wallets WHERE user_id = ?`)
      .get(userId) as { balance: number } | undefined
    if (!wallet) {
      db.exec('ROLLBACK')
      throw new CreditsError(404, 'Cüzdan bulunamadı.')
    }

    const newBalance = wallet.balance + res.amount

    // Phase 10: refund to buckets (sub-ledger)
    try {
      refundToBuckets(db, userId, res.amount)
    } catch {
      /* legacy wallet without buckets — wallet credit is authoritative */
    }

    db.prepare(
      `UPDATE credit_reservations SET status = 'refunded', finalized_at = ? WHERE id = ?`,
    ).run(now, reservationId)

    db.prepare(`UPDATE wallets SET balance = ?, updated_at = ? WHERE user_id = ?`).run(
      newBalance,
      now,
      userId,
    )

    db.prepare(
      `INSERT INTO credit_transactions (id, user_id, kind, amount, balance_after, ref_id, meta_json, created_at)
       VALUES (?, ?, 'refund', ?, ?, ?, ?, ?)`,
    ).run(
      newId(),
      userId,
      res.amount,
      newBalance,
      reservationId,
      JSON.stringify({
        operation: res.operation,
        reason: reason ?? 'generation_failed',
      }),
      now,
    )

    // Phase 10: record credit event
    try {
      recordEvent(db, {
        userId,
        eventType: 'credit_reservation_released',
        operationId: res.operation,
        reservationId,
        amount: res.amount,
        meta: { reason: reason ?? 'generation_failed' },
      })
    } catch { /* events are best-effort */ }

    db.exec('COMMIT')
    return { reservationId, status: 'refunded', balance: newBalance }
  } catch (err) {
    if (err instanceof CreditsError) throw err
    try {
      db.exec('ROLLBACK')
    } catch {
      /* ignore */
    }
    throw err
  }
}

export function adjustCredits(
  db: FormaDb,
  adminUserId: string,
  targetUserId: string,
  amount: number,
  reason?: string | null,
): { balance: number; amount: number } {
  if (!Number.isInteger(amount) || amount === 0) {
    throw new CreditsError(400, 'amount tam sayı ve sıfır olmamalı.')
  }

  db.exec('BEGIN IMMEDIATE')
  try {
    const wallet = db
      .prepare(`SELECT balance FROM wallets WHERE user_id = ?`)
      .get(targetUserId) as { balance: number } | undefined
    if (!wallet) {
      db.exec('ROLLBACK')
      throw new CreditsError(404, 'Hedef cüzdan bulunamadı.')
    }
    const newBalance = wallet.balance + amount
    if (newBalance < 0) {
      db.exec('ROLLBACK')
      throw new CreditsError(400, 'Bakiye negatif olamaz.')
    }
    const now = nowIso()
    db.prepare(`UPDATE wallets SET balance = ?, updated_at = ? WHERE user_id = ?`).run(
      newBalance,
      now,
      targetUserId,
    )
    // Phase 10: grant to bonus bucket for positive adjustments
    if (amount > 0) {
      try {
        grantToBucket(db, targetUserId, 'bonus', amount, { sourceRef: `admin_adjust:${adminUserId}` })
      } catch { /* legacy wallet without buckets */ }
    }
    db.prepare(
      `INSERT INTO credit_transactions (id, user_id, kind, amount, balance_after, ref_id, meta_json, created_at)
       VALUES (?, ?, 'manual_admin_adjustment', ?, ?, NULL, ?, ?)`,
    ).run(
      newId(),
      targetUserId,
      amount,
      newBalance,
      JSON.stringify({ reason: reason ?? null, by: adminUserId }),
      now,
    )
    db.exec('COMMIT')
    return { balance: newBalance, amount }
  } catch (err) {
    if (err instanceof CreditsError) throw err
    try {
      db.exec('ROLLBACK')
    } catch {
      /* ignore */
    }
    throw err
  }
}

export type GrantPurchaseResult = {
  balance: number
  granted: boolean
}

/**
 * Grant credits for a completed purchase. Idempotent on orderId (ref_id).
 * Safe to call alone or via fulfillPaidOrder (use unlocked helper inside outer TX).
 */
export function grantPurchaseCredits(
  db: FormaDb,
  userId: string,
  credits: number,
  orderId: string,
): GrantPurchaseResult {
  if (!Number.isInteger(credits) || credits <= 0) {
    throw new CreditsError(400, 'credits pozitif tam sayı olmalı.')
  }
  db.exec('BEGIN IMMEDIATE')
  try {
    const result = grantPurchaseCreditsUnlocked(db, userId, credits, orderId)
    db.exec('COMMIT')
    return result
  } catch (err) {
    try {
      db.exec('ROLLBACK')
    } catch {
      /* ignore */
    }
    throw err
  }
}

/** Must be called inside an open IMMEDIATE transaction. */
export function grantPurchaseCreditsUnlocked(
  db: FormaDb,
  userId: string,
  credits: number,
  orderId: string,
): GrantPurchaseResult {
  const existing = db
    .prepare(
      `SELECT id FROM credit_transactions
       WHERE user_id = ? AND ref_id = ? AND kind = 'grant'`,
    )
    .get(userId, orderId) as { id: string } | undefined
  if (existing) {
    return { balance: getBalanceUnlocked(db, userId), granted: false }
  }

  const wallet = db
    .prepare(`SELECT balance FROM wallets WHERE user_id = ?`)
    .get(userId) as { balance: number } | undefined
  if (!wallet) {
    throw new CreditsError(404, 'Cüzdan bulunamadı.')
  }

  const now = nowIso()
  const newBalance = wallet.balance + credits
  db.prepare(`UPDATE wallets SET balance = ?, updated_at = ? WHERE user_id = ?`).run(
    newBalance,
    now,
    userId,
  )
  // Phase 10: grant to purchased bucket
  try {
    grantToBucket(db, userId, 'purchased', credits, { sourceRef: orderId })
  } catch { /* legacy wallet without buckets */ }
  db.prepare(
    `INSERT INTO credit_transactions (id, user_id, kind, amount, balance_after, ref_id, meta_json, created_at)
     VALUES (?, ?, 'grant', ?, ?, ?, ?, ?)`,
  ).run(
    newId(),
    userId,
    credits,
    newBalance,
    orderId,
    JSON.stringify({ reason: 'purchase', orderId }),
    now,
  )
  return { balance: newBalance, granted: true }
}
