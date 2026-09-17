/**
 * Subscription model: plans, activation, monthly credit grants, rollover.
 *
 * Plans are configurable via the `subscription_plans` table (admin-managed).
 * Each user can have one active subscription. Monthly credits are granted
 * to an 'included' bucket with an expiry date.
 *
 * Rollover policy (per plan):
 *   - 'none'    : unused included credits expire at period end
 *   - 'partial' : up to rollover_max credits carry to next period
 *   - 'full'    : all unused included credits carry to next period
 */
import type { FormaDb, SubscriptionPlanRow, SubscriptionRow } from '../db.ts'
import { newId } from '../auth.ts'
import { grantToBucket, expireBuckets } from './buckets.ts'

export type Plan = {
  id: string
  label: string
  monthlyPrice: number
  currency: string
  monthlyCredits: number
  maxProjects: number | null
  maxActiveSessions: number | null
  rolloverPolicy: 'none' | 'partial' | 'full'
  rolloverMax: number
  topupEligible: boolean
  enabled: boolean
  displayOrder: number
  description: string | null
  unlimited: boolean
}

export type Subscription = {
  id: string
  userId: string
  planId: string
  status: 'active' | 'cancelled' | 'expired' | 'past_due'
  currentPeriodStart: string
  currentPeriodEnd: string | null
  nextRenewalAt: string | null
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
}

function nowIso(): string {
  return new Date().toISOString()
}

function rowToPlan(row: SubscriptionPlanRow): Plan {
  return {
    id: row.id,
    label: row.label,
    monthlyPrice: row.monthly_price,
    currency: row.currency,
    monthlyCredits: row.monthly_credits,
    maxProjects: row.max_projects,
    maxActiveSessions: row.max_active_sessions,
    rolloverPolicy: row.rollover_policy as Plan['rolloverPolicy'],
    rolloverMax: row.rollover_max,
    topupEligible: row.topup_eligible === 1,
    enabled: row.enabled === 1,
    displayOrder: row.display_order,
    description: row.description,
    unlimited: row.unlimited === 1 || row.id === 'agency',
  }
}

function rowToSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    status: row.status as Subscription['status'],
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    nextRenewalAt: row.next_renewal_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** List all enabled plans. */
export function listPlans(db: FormaDb): Plan[] {
  const rows = db
    .prepare(`SELECT * FROM subscription_plans WHERE enabled = 1 ORDER BY display_order ASC`)
    .all() as SubscriptionPlanRow[]
  return rows.map(rowToPlan)
}

/** List all plans (including disabled) for admin. */
export function listAllPlans(db: FormaDb): Plan[] {
  const rows = db
    .prepare(`SELECT * FROM subscription_plans ORDER BY display_order ASC`)
    .all() as SubscriptionPlanRow[]
  return rows.map(rowToPlan)
}

/** Get a plan by ID. */
export function getPlan(db: FormaDb, planId: string): Plan | undefined {
  const row = db
    .prepare(`SELECT * FROM subscription_plans WHERE id = ?`)
    .get(planId) as SubscriptionPlanRow | undefined
  return row ? rowToPlan(row) : undefined
}

/** Get the user's active subscription. */
export function getActiveSubscription(db: FormaDb, userId: string): Subscription | undefined {
  const row = db
    .prepare(`SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1`)
    .get(userId) as SubscriptionRow | undefined
  return row ? rowToSubscription(row) : undefined
}

/** Agency (and any unlimited plan) skips credit debit while the subscription is active. */
export function userHasUnlimitedDesigns(db: FormaDb, userId: string): boolean {
  const sub = getActiveSubscription(db, userId)
  if (!sub) return false
  const plan = getPlan(db, sub.planId)
  return Boolean(plan?.unlimited)
}

/**
 * Activate or change a subscription for a user.
 * Cancels any existing active subscription and creates a new one.
 * Grants monthly credits immediately as an 'included' bucket.
 */
export function activateSubscription(
  db: FormaDb,
  userId: string,
  planId: string,
): Subscription {
  db.exec('BEGIN IMMEDIATE')
  try {
    const sub = activateSubscriptionUnlocked(db, userId, planId)
    db.exec('COMMIT')
    return sub
  } catch (err) {
    try {
      db.exec('ROLLBACK')
    } catch { /* ignore */ }
    throw err
  }
}

/** Must be called inside an open IMMEDIATE transaction (order fulfillment). */
export function activateSubscriptionUnlocked(
  db: FormaDb,
  userId: string,
  planId: string,
): Subscription {
  const plan = getPlan(db, planId)
  if (!plan) throw new Error(`Plan bulunamadı: ${planId}`)
  if (!plan.enabled) throw new Error(`Plan devre dışı: ${planId}`)

  const now = new Date()
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

  // Cancel existing active subscription
  const existing = getActiveSubscription(db, userId)
  if (existing) {
    db.prepare(
      `UPDATE subscriptions SET status = 'cancelled', cancelled_at = ?, updated_at = ? WHERE id = ?`,
    ).run(now.toISOString(), now.toISOString(), existing.id)
  }

  // Create new subscription
  const id = newId()
  db.prepare(
    `INSERT INTO subscriptions (id, user_id, plan_id, status, current_period_start, current_period_end, next_renewal_at, cancelled_at, created_at, updated_at)
     VALUES (?, ?, ?, 'active', ?, ?, ?, NULL, ?, ?)`,
  ).run(
    id,
    userId,
    planId,
    now.toISOString(),
    periodEnd.toISOString(),
    periodEnd.toISOString(),
    now.toISOString(),
    now.toISOString(),
  )

  // Grant monthly credits to 'included' bucket with expiry = period end
  if (plan.monthlyCredits > 0) {
    grantToBucket(db, userId, 'included', plan.monthlyCredits, {
      expiresAt: periodEnd.toISOString(),
      sourceRef: id,
    })
    // Update wallet balance
    const walletBalance = (
      db.prepare(`SELECT balance FROM wallets WHERE user_id = ?`).get(userId) as { balance: number }
    ).balance
    db.prepare(`UPDATE wallets SET balance = ?, updated_at = ? WHERE user_id = ?`).run(
      walletBalance + plan.monthlyCredits,
      now.toISOString(),
      userId,
    )
    // Ledger the grant
    db.prepare(
      `INSERT INTO credit_transactions (id, user_id, kind, amount, balance_after, ref_id, meta_json, created_at)
       VALUES (?, ?, 'subscription_grant', ?, ?, ?, ?, ?)`,
    ).run(
      newId(),
      userId,
      plan.monthlyCredits,
      walletBalance + plan.monthlyCredits,
      id,
      JSON.stringify({ reason: 'subscription_grant', planId, subscriptionId: id }),
      now.toISOString(),
    )
  }

  return rowToSubscription(
    db.prepare(`SELECT * FROM subscriptions WHERE id = ?`).get(id) as SubscriptionRow,
  )
}

/** Cancel a subscription (keeps it active until period end). */
export function cancelSubscription(
  db: FormaDb,
  userId: string,
): Subscription | undefined {
  const sub = getActiveSubscription(db, userId)
  if (!sub) return undefined
  const now = nowIso()
  db.prepare(
    `UPDATE subscriptions SET status = 'cancelled', cancelled_at = ?, updated_at = ? WHERE id = ?`,
  ).run(now, now, sub.id)
  return rowToSubscription(
    db.prepare(`SELECT * FROM subscriptions WHERE id = ?`).get(sub.id) as SubscriptionRow,
  )
}

/**
 * Renew a subscription: grant new monthly credits and handle rollover.
 * Called by a cron job or manual trigger at period end.
 */
export function renewSubscription(
  db: FormaDb,
  subscriptionId: string,
): { granted: number; rolledOver: number; expired: number } {
  const sub = db
    .prepare(`SELECT * FROM subscriptions WHERE id = ?`)
    .get(subscriptionId) as SubscriptionRow | undefined
  if (!sub) throw new Error(`Abonelik bulunamadı: ${subscriptionId}`)
  if (sub.status !== 'active') throw new Error(`Abonelik aktif değil: ${sub.status}`)

  const plan = getPlan(db, sub.plan_id)
  if (!plan) throw new Error(`Plan bulunamadı: ${sub.plan_id}`)

  const now = new Date()
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  db.exec('BEGIN IMMEDIATE')
  try {
    // Calculate rollover from expiring included credits
    let rolledOver = 0
    if (plan.rolloverPolicy !== 'none') {
      const expiringIncluded = db
        .prepare(
          `SELECT COALESCE(SUM(balance), 0) AS total FROM credit_buckets
           WHERE user_id = ? AND bucket_type = 'included' AND expires_at IS NOT NULL AND expires_at <= ?`,
        )
        .get(sub.user_id, now.toISOString()) as { total: number }

      const maxRollover = plan.rolloverPolicy === 'full' ? Infinity : plan.rolloverMax
      rolledOver = Math.min(expiringIncluded.total, maxRollover)
    }

    // Expire old included buckets
    const expired = expireBuckets(db, sub.user_id)

    // Grant new monthly credits
    if (plan.monthlyCredits > 0) {
      grantToBucket(db, sub.user_id, 'included', plan.monthlyCredits, {
        expiresAt: periodEnd.toISOString(),
        sourceRef: sub.id,
      })
      const walletBalance = (
        db.prepare(`SELECT balance FROM wallets WHERE user_id = ?`).get(sub.user_id) as { balance: number }
      ).balance
      db.prepare(`UPDATE wallets SET balance = ?, updated_at = ? WHERE user_id = ?`).run(
        walletBalance + plan.monthlyCredits,
        now.toISOString(),
        sub.user_id,
      )
      db.prepare(
        `INSERT INTO credit_transactions (id, user_id, kind, amount, balance_after, ref_id, meta_json, created_at)
         VALUES (?, ?, 'subscription_grant', ?, ?, ?, ?, ?)`,
      ).run(
        newId(),
        sub.user_id,
        plan.monthlyCredits,
        walletBalance + plan.monthlyCredits,
        sub.id,
        JSON.stringify({ reason: 'subscription_renewal', planId: plan.id, rolledOver }),
        now.toISOString(),
      )
    }

    // Add rollover credits as a new included bucket
    if (rolledOver > 0) {
      grantToBucket(db, sub.user_id, 'included', rolledOver, {
        expiresAt: periodEnd.toISOString(),
        sourceRef: `rollover:${sub.id}`,
      })
      const walletBalance = (
        db.prepare(`SELECT balance FROM wallets WHERE user_id = ?`).get(sub.user_id) as { balance: number }
      ).balance
      db.prepare(`UPDATE wallets SET balance = ?, updated_at = ? WHERE user_id = ?`).run(
        walletBalance + rolledOver,
        now.toISOString(),
        sub.user_id,
      )
      db.prepare(
        `INSERT INTO credit_transactions (id, user_id, kind, amount, balance_after, ref_id, meta_json, created_at)
         VALUES (?, ?, 'bonus_grant', ?, ?, ?, ?, ?)`,
      ).run(
        newId(),
        sub.user_id,
        rolledOver,
        walletBalance + rolledOver,
        sub.id,
        JSON.stringify({ reason: 'rollover', planId: plan.id }),
        now.toISOString(),
      )
    }

    // Update subscription period
    db.prepare(
      `UPDATE subscriptions SET current_period_start = ?, current_period_end = ?, next_renewal_at = ?, updated_at = ? WHERE id = ?`,
    ).run(now.toISOString(), periodEnd.toISOString(), periodEnd.toISOString(), now.toISOString(), sub.id)

    db.exec('COMMIT')
    return { granted: plan.monthlyCredits, rolledOver, expired }
  } catch (err) {
    try {
      db.exec('ROLLBACK')
    } catch { /* ignore */ }
    throw err
  }
}

/** Create or update a plan (admin). */
export function upsertPlan(
  db: FormaDb,
  planId: string,
  patch: Partial<Omit<Plan, 'id'>>,
): Plan {
  const now = nowIso()
  const existing = getPlan(db, planId)
  if (existing) {
    const sets: string[] = []
    const args: unknown[] = []
    if (patch.label !== undefined) { sets.push('label = ?'); args.push(patch.label) }
    if (patch.monthlyPrice !== undefined) { sets.push('monthly_price = ?'); args.push(patch.monthlyPrice) }
    if (patch.monthlyCredits !== undefined) { sets.push('monthly_credits = ?'); args.push(patch.monthlyCredits) }
    if (patch.maxProjects !== undefined) { sets.push('max_projects = ?'); args.push(patch.maxProjects) }
    if (patch.maxActiveSessions !== undefined) { sets.push('max_active_sessions = ?'); args.push(patch.maxActiveSessions) }
    if (patch.rolloverPolicy !== undefined) { sets.push('rollover_policy = ?'); args.push(patch.rolloverPolicy) }
    if (patch.rolloverMax !== undefined) { sets.push('rollover_max = ?'); args.push(patch.rolloverMax) }
    if (patch.topupEligible !== undefined) { sets.push('topup_eligible = ?'); args.push(patch.topupEligible ? 1 : 0) }
    if (patch.enabled !== undefined) { sets.push('enabled = ?'); args.push(patch.enabled ? 1 : 0) }
    if (patch.displayOrder !== undefined) { sets.push('display_order = ?'); args.push(patch.displayOrder) }
    if (patch.description !== undefined) { sets.push('description = ?'); args.push(patch.description) }
    if (patch.unlimited !== undefined) { sets.push('unlimited = ?'); args.push(patch.unlimited ? 1 : 0) }
    if (sets.length === 0) return existing
    sets.push('updated_at = ?')
    args.push(now)
    args.push(planId)
    db.prepare(`UPDATE subscription_plans SET ${sets.join(', ')} WHERE id = ?`).run(...args)
  } else {
    db.prepare(
      `INSERT INTO subscription_plans (id, label, monthly_price, currency, monthly_credits, max_projects, max_active_sessions, rollover_policy, rollover_max, topup_eligible, enabled, display_order, description, unlimited, created_at, updated_at)
       VALUES (?, ?, ?, 'TRY', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      planId,
      patch.label ?? planId,
      patch.monthlyPrice ?? 0,
      patch.monthlyCredits ?? 0,
      patch.maxProjects ?? null,
      patch.maxActiveSessions ?? null,
      patch.rolloverPolicy ?? 'none',
      patch.rolloverMax ?? 0,
      patch.topupEligible === false ? 0 : 1,
      patch.enabled === false ? 0 : 1,
      patch.displayOrder ?? 0,
      patch.description ?? null,
      patch.unlimited ? 1 : 0,
      now,
      now,
    )
  }
  const updated = getPlan(db, planId)
  if (!updated) throw new Error(`Plan bulunamadı: ${planId}`)
  return updated
}
