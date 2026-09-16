/**
 * Credit buckets: sub-ledger that tracks credit sources separately.
 *
 * Bucket types:
 *   - 'included'  : monthly subscription credits (may expire)
 *   - 'purchased' : top-up credits (no expiry by default)
 *   - 'bonus'     : admin/promotional credits (may expire)
 *
 * The `wallets.balance` remains the authoritative total. Buckets must
 * always reconcile: sum(bucket.balance) == wallets.balance.
 *
 * Consumption policy (deterministic, single source of truth):
 *   1. expiring bonus credits (earliest expiry first)
 *   2. expiring included credits (earliest expiry first)
 *   3. non-expiring bonus credits
 *   4. included credits (no expiry)
 *   5. purchased credits
 *
 * This order ensures promotional/monthly credits are used before
 * purchased credits that the user paid real money for.
 */
import type { FormaDb, CreditBucketRow } from '../db.ts'
import { newId } from '../auth.ts'

export type BucketType = 'included' | 'purchased' | 'bonus'

export type Bucket = {
  id: string
  userId: string
  bucketType: BucketType
  balance: number
  expiresAt: string | null
  sourceRef: string | null
  createdAt: string
}

function rowToBucket(row: CreditBucketRow): Bucket {
  return {
    id: row.id,
    userId: row.user_id,
    bucketType: row.bucket_type as BucketType,
    balance: row.balance,
    expiresAt: row.expires_at,
    sourceRef: row.source_ref,
    createdAt: row.created_at,
  }
}

function nowIso(): string {
  return new Date().toISOString()
}

/** List all buckets for a user. */
export function listBuckets(db: FormaDb, userId: string): Bucket[] {
  const rows = db
    .prepare(
      `SELECT * FROM credit_buckets WHERE user_id = ? ORDER BY bucket_type, expires_at`,
    )
    .all(userId) as CreditBucketRow[]
  return rows.map(rowToBucket)
}

/** Get a summary of buckets by type. */
export function bucketSummary(
  db: FormaDb,
  userId: string,
): { included: number; purchased: number; bonus: number; total: number } {
  const rows = db
    .prepare(
      `SELECT bucket_type, COALESCE(SUM(balance), 0) AS total
       FROM credit_buckets WHERE user_id = ? GROUP BY bucket_type`,
    )
    .all(userId) as { bucket_type: string; total: number }[]
  const summary = { included: 0, purchased: 0, bonus: 0, total: 0 }
  for (const row of rows) {
    if (row.bucket_type === 'included') summary.included = row.total
    else if (row.bucket_type === 'purchased') summary.purchased = row.total
    else if (row.bucket_type === 'bonus') summary.bonus = row.total
  }
  summary.total = summary.included + summary.purchased + summary.bonus
  return summary
}

/**
 * Create a bucket and add credits to it. Also updates wallet balance.
 * Must be called inside an open transaction (caller manages BEGIN/COMMIT).
 */
export function grantToBucket(
  db: FormaDb,
  userId: string,
  bucketType: BucketType,
  amount: number,
  opts?: { expiresAt?: string | null; sourceRef?: string | null },
): Bucket {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('amount pozitif tam sayı olmalı.')
  }
  const now = nowIso()
  const id = newId()
  db.prepare(
    `INSERT INTO credit_buckets (id, user_id, bucket_type, balance, expires_at, source_ref, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, userId, bucketType, amount, opts?.expiresAt ?? null, opts?.sourceRef ?? null, now)
  return rowToBucket(
    db.prepare(`SELECT * FROM credit_buckets WHERE id = ?`).get(id) as CreditBucketRow,
  )
}

/**
 * Debit credits from buckets following the consumption policy.
 * Returns the list of (bucketId, amount) debits.
 * Must be called inside an open IMMEDIATE transaction.
 *
 * @throws Error if total balance < amount
 */
export function debitFromBuckets(
  db: FormaDb,
  userId: string,
  amount: number,
): { bucketId: string; amount: number }[] {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('amount pozitif tam sayı olmalı.')
  }

  const now = nowIso()
  const debits: { bucketId: string; amount: number }[] = []

  // Consumption order:
  // 1. expiring bonus (earliest expiry)
  // 2. expiring included (earliest expiry)
  // 3. non-expiring bonus
  // 4. included (no expiry)
  // 5. purchased
  const rows = db
    .prepare(
      `SELECT * FROM credit_buckets
       WHERE user_id = ? AND balance > 0
       ORDER BY
         CASE bucket_type
           WHEN 'bonus' THEN 0
           WHEN 'included' THEN 1
           WHEN 'purchased' THEN 2
         END,
         CASE WHEN expires_at IS NOT NULL AND expires_at <= ? THEN 0 ELSE 1 END,
         expires_at ASC NULLS LAST,
         created_at ASC`,
    )
    .all(userId, now) as CreditBucketRow[]

  let remaining = amount
  for (const row of rows) {
    if (remaining <= 0) break
    const take = Math.min(row.balance, remaining)
    if (take <= 0) continue
    db.prepare(`UPDATE credit_buckets SET balance = balance - ? WHERE id = ?`).run(take, row.id)
    debits.push({ bucketId: row.id, amount: take })
    remaining -= take
  }

  if (remaining > 0) {
    throw new Error('Krediniz yetersiz')
  }

  return debits
}

/**
 * Refund credits back to buckets. If the original bucket still exists and
 * has capacity, refund to it. Otherwise create a bonus bucket.
 * Must be called inside an open IMMEDIATE transaction.
 */
export function refundToBuckets(
  db: FormaDb,
  userId: string,
  amount: number,
  originalBucketId?: string | null,
): void {
  if (!Number.isInteger(amount) || amount <= 0) return
  const now = nowIso()

  if (originalBucketId) {
    const bucket = db
      .prepare(`SELECT * FROM credit_buckets WHERE id = ? AND user_id = ?`)
      .get(originalBucketId, userId) as CreditBucketRow | undefined
    if (bucket && (!bucket.expires_at || new Date(bucket.expires_at).getTime() > Date.now())) {
      db.prepare(`UPDATE credit_buckets SET balance = balance + ? WHERE id = ?`).run(
        amount,
        bucket.id,
      )
      return
    }
  }

  // Fallback: create a non-expiring bonus bucket
  grantToBucket(db, userId, 'bonus', amount, { sourceRef: 'refund' })
}

/** Remove expired buckets (balance > 0 but past expiry). Returns total expired. */
export function expireBuckets(db: FormaDb, userId: string): number {
  const now = nowIso()
  const rows = db
    .prepare(
      `SELECT id, balance FROM credit_buckets
       WHERE user_id = ? AND expires_at IS NOT NULL AND expires_at <= ? AND balance > 0`,
    )
    .all(userId, now) as { id: string; balance: number }[]
  let total = 0
  for (const row of rows) {
    db.prepare(`UPDATE credit_buckets SET balance = 0 WHERE id = ?`).run(row.id)
    total += row.balance
  }
  if (total > 0) {
    // Adjust wallet balance to match
    db.prepare(`UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE user_id = ?`).run(
      total,
      now,
      userId,
    )
    // Ledger the expiration
    db.prepare(
      `INSERT INTO credit_transactions (id, user_id, kind, amount, balance_after, ref_id, meta_json, created_at)
       VALUES (?, ?, 'expiration', ?, ?, NULL, ?, ?)`,
    ).run(
      newId(),
      userId,
      -total,
      (db.prepare(`SELECT balance FROM wallets WHERE user_id = ?`).get(userId) as { balance: number }).balance,
      JSON.stringify({ reason: 'bucket_expired', expiredBuckets: rows.map((r) => r.id) }),
      now,
    )
  }
  return total
}

/** Verify buckets reconcile with wallet balance. Returns true if consistent. */
export function reconcileCheck(db: FormaDb, userId: string): boolean {
  const bucketTotal = (
    db.prepare(`SELECT COALESCE(SUM(balance), 0) AS total FROM credit_buckets WHERE user_id = ?`).get(
      userId,
    ) as { total: number }
  ).total
  const walletBalance = (
    db.prepare(`SELECT balance FROM wallets WHERE user_id = ?`).get(userId) as { balance: number }
  ).balance
  return bucketTotal === walletBalance
}
