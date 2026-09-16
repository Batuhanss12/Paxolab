import type { DatabaseSync } from 'node:sqlite'
import { newId } from '../auth.ts'
import { OPERATION_COSTS, SUBSCRIPTION_PLANS } from './plansCatalog.ts'

export function syncBillingCatalog(db: DatabaseSync): void {
  const now = new Date().toISOString()
  const hasUnlimited = db
    .prepare(`PRAGMA table_info(subscription_plans)`)
    .all() as { name: string }[]
  const unlimitedCol = hasUnlimited.some((c) => c.name === 'unlimited')

  for (const plan of SUBSCRIPTION_PLANS) {
    const existing = db.prepare(`SELECT id FROM subscription_plans WHERE id = ?`).get(plan.id) as
      | { id: string }
      | undefined
    if (existing) {
      if (unlimitedCol) {
        db.prepare(
          `UPDATE subscription_plans SET
             label = ?, monthly_price = ?, currency = 'TRY', monthly_credits = ?,
             max_projects = ?, max_active_sessions = ?, rollover_policy = ?, rollover_max = ?,
             topup_eligible = 1, enabled = 1, display_order = ?, description = ?, unlimited = ?,
             updated_at = ?
           WHERE id = ?`,
        ).run(
          plan.label,
          plan.monthlyPrice,
          plan.monthlyCredits,
          plan.maxProjects,
          plan.maxActiveSessions,
          plan.rolloverPolicy,
          plan.rolloverMax,
          plan.displayOrder,
          plan.description,
          plan.unlimited ? 1 : 0,
          now,
          plan.id,
        )
      } else {
        db.prepare(
          `UPDATE subscription_plans SET
             label = ?, monthly_price = ?, currency = 'TRY', monthly_credits = ?,
             max_projects = ?, max_active_sessions = ?, rollover_policy = ?, rollover_max = ?,
             topup_eligible = 1, enabled = 1, display_order = ?, description = ?, updated_at = ?
           WHERE id = ?`,
        ).run(
          plan.label,
          plan.monthlyPrice,
          plan.monthlyCredits,
          plan.maxProjects,
          plan.maxActiveSessions,
          plan.rolloverPolicy,
          plan.rolloverMax,
          plan.displayOrder,
          plan.description,
          now,
          plan.id,
        )
      }
    } else if (unlimitedCol) {
      db.prepare(
        `INSERT INTO subscription_plans
           (id, label, monthly_price, currency, monthly_credits, max_projects, max_active_sessions,
            rollover_policy, rollover_max, topup_eligible, enabled, display_order, description,
            unlimited, created_at, updated_at)
         VALUES (?, ?, ?, 'TRY', ?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?, ?)`,
      ).run(
        plan.id,
        plan.label,
        plan.monthlyPrice,
        plan.monthlyCredits,
        plan.maxProjects,
        plan.maxActiveSessions,
        plan.rolloverPolicy,
        plan.rolloverMax,
        plan.displayOrder,
        plan.description,
        plan.unlimited ? 1 : 0,
        now,
        now,
      )
    } else {
      db.prepare(
        `INSERT INTO subscription_plans
           (id, label, monthly_price, currency, monthly_credits, max_projects, max_active_sessions,
            rollover_policy, rollover_max, topup_eligible, enabled, display_order, description,
            created_at, updated_at)
         VALUES (?, ?, ?, 'TRY', ?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?)`,
      ).run(
        plan.id,
        plan.label,
        plan.monthlyPrice,
        plan.monthlyCredits,
        plan.maxProjects,
        plan.maxActiveSessions,
        plan.rolloverPolicy,
        plan.rolloverMax,
        plan.displayOrder,
        plan.description,
        now,
        now,
      )
    }
  }

  const keep = SUBSCRIPTION_PLANS.map((p) => p.id)
  const placeholders = keep.map(() => '?').join(', ')
  db.prepare(
    `UPDATE subscription_plans SET enabled = 0, updated_at = ? WHERE id NOT IN (${placeholders})`,
  ).run(now, ...keep)

  for (const [operationId, creditCost] of Object.entries(OPERATION_COSTS)) {
    const row = db
      .prepare(`SELECT credit_cost FROM credit_operation_catalog WHERE operation_id = ?`)
      .get(operationId) as { credit_cost: number } | undefined
    if (!row || row.credit_cost === creditCost) continue
    db.prepare(
      `UPDATE credit_cost_versions SET effective_to = ? WHERE operation_id = ? AND effective_to IS NULL`,
    ).run(now, operationId)
    db.prepare(
      `INSERT INTO credit_cost_versions (id, operation_id, credit_cost, effective_from, effective_to, created_at)
       VALUES (?, ?, ?, ?, NULL, ?)`,
    ).run(newId(), operationId, creditCost, now, now)
    db.prepare(
      `UPDATE credit_operation_catalog SET credit_cost = ?, updated_at = ? WHERE operation_id = ?`,
    ).run(creditCost, now, operationId)
  }
}
