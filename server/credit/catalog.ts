/**
 * Authoritative credit operation catalog + cost versioning.
 *
 * The catalog is seeded into `credit_operation_catalog` on first run
 * (see db.ts `seedDefaults`). This module reads from the DB so admin
 * changes take effect immediately. It also keeps the legacy
 * `CREDIT_COSTS` constant in `credits.ts` in sync for backward
 * compatibility with existing tests.
 */
import type { FormaDb, CreditOperationCatalogRow, CreditCostVersionRow } from '../db.ts'
import { newId } from '../auth.ts'

export type OperationCategory =
  | 'discovery'
  | 'creation'
  | 'revision'
  | 'refinement'
  | 'export'

export type OperationDef = {
  operationId: string
  displayName: string
  description: string
  creditCost: number
  category: OperationCategory
  enabled: boolean
  refundable: boolean
  requiresConfirmation: boolean
  freeTierAllowed: boolean
}

export type CostVersion = {
  id: string
  operationId: string
  creditCost: number
  effectiveFrom: string
  effectiveTo: string | null
}

function rowToDef(row: CreditOperationCatalogRow): OperationDef {
  return {
    operationId: row.operation_id,
    displayName: row.display_name,
    description: row.description,
    creditCost: row.credit_cost,
    category: row.category as OperationCategory,
    enabled: row.enabled === 1,
    refundable: row.refundable === 1,
    requiresConfirmation: row.requires_confirmation === 1,
    freeTierAllowed: row.free_tier_allowed === 1,
  }
}

function rowToVersion(row: CreditCostVersionRow): CostVersion {
  return {
    id: row.id,
    operationId: row.operation_id,
    creditCost: row.credit_cost,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
  }
}

/** List all operations from the DB. */
export function listOperations(db: FormaDb): OperationDef[] {
  const rows = db
    .prepare(`SELECT * FROM credit_operation_catalog ORDER BY credit_cost ASC`)
    .all() as CreditOperationCatalogRow[]
  return rows.map(rowToDef)
}

/** Get a single operation by ID. Returns undefined if not found or disabled. */
export function getOperation(db: FormaDb, operationId: string): OperationDef | undefined {
  const row = db
    .prepare(`SELECT * FROM credit_operation_catalog WHERE operation_id = ?`)
    .get(operationId) as CreditOperationCatalogRow | undefined
  return row ? rowToDef(row) : undefined
}

/** Get the current cost for an operation (from the catalog row). */
export function currentCost(db: FormaDb, operationId: string): number | undefined {
  const row = db
    .prepare(`SELECT credit_cost FROM credit_operation_catalog WHERE operation_id = ?`)
    .get(operationId) as { credit_cost: number } | undefined
  return row?.credit_cost
}

/**
 * Resolve the active cost version for an operation at a given time (default now).
 * Used to preserve historical costs: each consumption record stores the
 * cost_version_id so old operations are never recalculated with new prices.
 */
export function activeCostVersion(
  db: FormaDb,
  operationId: string,
  now: string = new Date().toISOString(),
): CostVersion | undefined {
  const row = db
    .prepare(
      `SELECT * FROM credit_cost_versions
       WHERE operation_id = ? AND effective_from <= ?
       ORDER BY effective_from DESC LIMIT 1`,
    )
    .get(operationId, now) as CreditCostVersionRow | undefined
  return row ? rowToVersion(row) : undefined
}

/**
 * Update an operation's cost. Creates a new cost version row and closes the
 * previous one. Historical operations keep their original cost_version_id.
 */
export function updateOperationCost(
  db: FormaDb,
  operationId: string,
  newCost: number,
  reason?: string,
): { operationId: string; oldCost: number; newCost: number; versionId: string } {
  if (!Number.isInteger(newCost) || newCost < 0) {
    throw new Error('credit_cost negatif olmayan tam sayı olmalı.')
  }
  const now = new Date().toISOString()
  db.exec('BEGIN IMMEDIATE')
  try {
    const op = db
      .prepare(`SELECT * FROM credit_operation_catalog WHERE operation_id = ?`)
      .get(operationId) as CreditOperationCatalogRow | undefined
    if (!op) {
      db.exec('ROLLBACK')
      throw new Error(`Operasyon bulunamadı: ${operationId}`)
    }
    const oldCost = op.credit_cost

    // Close the current active version
    db.prepare(
      `UPDATE credit_cost_versions SET effective_to = ? WHERE operation_id = ? AND effective_to IS NULL`,
    ).run(now, operationId)

    // Create new version
    const versionId = `ver_${operationId}_${Date.now()}`
    db.prepare(
      `INSERT INTO credit_cost_versions (id, operation_id, credit_cost, effective_from, effective_to, created_at)
       VALUES (?, ?, ?, ?, NULL, ?)`,
    ).run(versionId, operationId, newCost, now, now)

    // Update catalog
    db.prepare(
      `UPDATE credit_operation_catalog SET credit_cost = ?, updated_at = ? WHERE operation_id = ?`,
    ).run(newCost, now, operationId)

    db.exec('COMMIT')
    return { operationId, oldCost, newCost, versionId }
  } catch (err) {
    try {
      db.exec('ROLLBACK')
    } catch {
      /* ignore */
    }
    throw err
  }
}

/** Update operation metadata (display name, description, flags). */
export function updateOperationMeta(
  db: FormaDb,
  operationId: string,
  patch: {
    displayName?: string
    description?: string
    enabled?: boolean
    refundable?: boolean
    requiresConfirmation?: boolean
    freeTierAllowed?: boolean
  },
): OperationDef {
  const now = new Date().toISOString()
  const sets: string[] = []
  const args: unknown[] = []
  if (patch.displayName !== undefined) {
    sets.push('display_name = ?')
    args.push(patch.displayName)
  }
  if (patch.description !== undefined) {
    sets.push('description = ?')
    args.push(patch.description)
  }
  if (patch.enabled !== undefined) {
    sets.push('enabled = ?')
    args.push(patch.enabled ? 1 : 0)
  }
  if (patch.refundable !== undefined) {
    sets.push('refundable = ?')
    args.push(patch.refundable ? 1 : 0)
  }
  if (patch.requiresConfirmation !== undefined) {
    sets.push('requires_confirmation = ?')
    args.push(patch.requiresConfirmation ? 1 : 0)
  }
  if (patch.freeTierAllowed !== undefined) {
    sets.push('free_tier_allowed = ?')
    args.push(patch.freeTierAllowed ? 1 : 0)
  }
  if (sets.length === 0) {
    const def = getOperation(db, operationId)
    if (!def) throw new Error(`Operasyon bulunamadı: ${operationId}`)
    return def
  }
  sets.push('updated_at = ?')
  args.push(now)
  args.push(operationId)
  db.prepare(
    `UPDATE credit_operation_catalog SET ${sets.join(', ')} WHERE operation_id = ?`,
  ).run(...args)
  const updated = getOperation(db, operationId)
  if (!updated) throw new Error(`Operasyon bulunamadı: ${operationId}`)
  return updated
}

/**
 * Map legacy operation IDs ('generate', 'revise') to catalog operation IDs.
 * This preserves backward compatibility with existing tests and the App.tsx
 * reservation flow.
 */
export function legacyToCatalog(legacy: string): string {
  if (legacy === 'generate') return 'initial_design'
  if (legacy === 'revise') return 'focused_revision'
  if (legacy === 'export_zip') return 'final_export'
  return legacy
}

/**
 * Resolve an operation ID (legacy or catalog) to a catalog OperationDef.
 * Throws if the operation is not found or disabled.
 */
export function resolveOperation(db: FormaDb, operationId: string): OperationDef {
  const catalogId = legacyToCatalog(operationId)
  const def = getOperation(db, catalogId) ?? getOperation(db, operationId)
  if (!def) throw new Error(`Bilinmeyen operasyon: ${operationId}`)
  if (!def.enabled) throw new Error(`Devre dışı operasyon: ${operationId}`)
  return def
}
