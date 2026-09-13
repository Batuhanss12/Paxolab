import type { FormaDb } from '../db.ts'
import { newId } from '../auth.ts'
import { grantPurchaseCreditsUnlocked } from '../credits.ts'
import { getPack, type CreditPack } from './catalog.ts'

export type PaymentOrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled'

export type PaymentOrderRow = {
  id: string
  user_id: string
  pack_id: string
  credits: number
  amount_try: number
  currency: string
  status: string
  iyzico_token: string | null
  iyzico_payment_id: string | null
  conversation_id: string
  created_at: string
  updated_at: string
  paid_at: string | null
}

function nowIso(): string {
  return new Date().toISOString()
}

export function createPendingOrder(
  db: FormaDb,
  userId: string,
  pack: CreditPack,
): PaymentOrderRow {
  const id = newId()
  const conversationId = id
  const now = nowIso()
  db.prepare(
    `INSERT INTO payment_orders
       (id, user_id, pack_id, credits, amount_try, currency, status,
        iyzico_token, iyzico_payment_id, conversation_id, created_at, updated_at, paid_at)
     VALUES (?, ?, ?, ?, ?, 'TRY', 'pending', NULL, NULL, ?, ?, ?, NULL)`,
  ).run(id, userId, pack.id, pack.credits, pack.priceTry, conversationId, now, now)
  return db.prepare(`SELECT * FROM payment_orders WHERE id = ?`).get(id) as PaymentOrderRow
}

export function getOrder(db: FormaDb, orderId: string): PaymentOrderRow | undefined {
  return db.prepare(`SELECT * FROM payment_orders WHERE id = ?`).get(orderId) as
    | PaymentOrderRow
    | undefined
}

export function getOrderByToken(db: FormaDb, token: string): PaymentOrderRow | undefined {
  return db.prepare(`SELECT * FROM payment_orders WHERE iyzico_token = ?`).get(token) as
    | PaymentOrderRow
    | undefined
}

export function setOrderToken(db: FormaDb, orderId: string, token: string): void {
  const now = nowIso()
  db.prepare(
    `UPDATE payment_orders SET iyzico_token = ?, updated_at = ? WHERE id = ?`,
  ).run(token, now, orderId)
}

export type FulfillResult = {
  order: PaymentOrderRow
  balance: number
  granted: boolean
  alreadyPaid: boolean
}

/**
 * Mark order paid + grant credits. Idempotent: repeated calls for paid orders skip grant.
 */
export function fulfillPaidOrder(
  db: FormaDb,
  orderId: string,
  opts?: { paymentId?: string | null; expectedUserId?: string | null },
): FulfillResult {
  db.exec('BEGIN IMMEDIATE')
  try {
    const order = db.prepare(`SELECT * FROM payment_orders WHERE id = ?`).get(orderId) as
      | PaymentOrderRow
      | undefined
    if (!order) {
      db.exec('ROLLBACK')
      throw new OrderError(404, 'Sipariş bulunamadı.')
    }
    if (opts?.expectedUserId && order.user_id !== opts.expectedUserId) {
      db.exec('ROLLBACK')
      throw new OrderError(403, 'Sipariş bu kullanıcıya ait değil.')
    }

    if (order.status === 'paid') {
      const grant = grantPurchaseCreditsUnlocked(db, order.user_id, order.credits, order.id)
      db.exec('COMMIT')
      return {
        order,
        balance: grant.balance,
        granted: false,
        alreadyPaid: true,
      }
    }

    if (order.status !== 'pending') {
      db.exec('ROLLBACK')
      throw new OrderError(409, `Sipariş durumu uygun değil: ${order.status}`)
    }

    const now = nowIso()
    const paymentId = opts?.paymentId ?? null
    db.prepare(
      `UPDATE payment_orders
       SET status = 'paid', paid_at = ?, updated_at = ?, iyzico_payment_id = COALESCE(?, iyzico_payment_id)
       WHERE id = ? AND status = 'pending'`,
    ).run(now, now, paymentId, orderId)

    const grant = grantPurchaseCreditsUnlocked(db, order.user_id, order.credits, order.id)

    const updated = db
      .prepare(`SELECT * FROM payment_orders WHERE id = ?`)
      .get(orderId) as PaymentOrderRow
    db.exec('COMMIT')
    return {
      order: updated,
      balance: grant.balance,
      granted: grant.granted,
      alreadyPaid: false,
    }
  } catch (err) {
    if (err instanceof OrderError) throw err
    try {
      db.exec('ROLLBACK')
    } catch {
      /* ignore */
    }
    throw err
  }
}

export function markOrderFailed(db: FormaDb, orderId: string): void {
  const now = nowIso()
  db.prepare(
    `UPDATE payment_orders SET status = 'failed', updated_at = ? WHERE id = ? AND status = 'pending'`,
  ).run(now, orderId)
}

export class OrderError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'OrderError'
  }
}

export function resolvePackOrThrow(packId: string): CreditPack {
  const pack = getPack(packId)
  if (!pack) throw new OrderError(400, 'Geçersiz paket.')
  return pack
}

export function listOrdersForUser(
  db: FormaDb,
  userId: string,
  limit = 20,
): PaymentOrderRow[] {
  const safe = Math.min(Math.max(1, Math.floor(limit) || 20), 100)
  return db
    .prepare(
      `SELECT * FROM payment_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    )
    .all(userId, safe) as PaymentOrderRow[]
}

export function listRecentOrders(db: FormaDb, limit = 50): PaymentOrderRow[] {
  const safe = Math.min(Math.max(1, Math.floor(limit) || 50), 200)
  return db
    .prepare(`SELECT * FROM payment_orders ORDER BY created_at DESC LIMIT ?`)
    .all(safe) as PaymentOrderRow[]
}
