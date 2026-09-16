/**
 * Design sessions: persistent containers for a design workflow within a project.
 *
 * PROJECT → DESIGN SESSION → DESIGN OPERATIONS → DESIGN OUTCOMES
 *
 * Sessions track the brief, intent, and all operations performed.
 * Operations record the credit cost at execution time, the reservation,
 * and the outcome.
 */
import type { FormaDb, DesignSessionRow, DesignOperationRow } from '../db.ts'
import { newId } from '../auth.ts'

export type DesignSession = {
  id: string
  projectId: string
  userId: string
  title: string
  brief: unknown | null
  intent: unknown | null
  status: 'active' | 'archived' | 'deleted'
  createdAt: string
  updatedAt: string
}

export type DesignOperation = {
  id: string
  sessionId: string
  projectId: string
  userId: string
  operationId: string
  creditCost: number
  costVersionId: string | null
  reservationId: string | null
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  outcome: unknown | null
  feedbackText: string | null
  classifiedOperation: string | null
  createdAt: string
  completedAt: string | null
}

function nowIso(): string {
  return new Date().toISOString()
}

function rowToSession(row: DesignSessionRow): DesignSession {
  let brief: unknown = null
  let intent: unknown = null
  try {
    if (row.brief_json) brief = JSON.parse(row.brief_json)
  } catch { /* ignore */ }
  try {
    if (row.intent_json) intent = JSON.parse(row.intent_json)
  } catch { /* ignore */ }
  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    title: row.title,
    brief,
    intent,
    status: row.status as DesignSession['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowToOperation(row: DesignOperationRow): DesignOperation {
  let outcome: unknown = null
  try {
    if (row.outcome_json) outcome = JSON.parse(row.outcome_json)
  } catch { /* ignore */ }
  return {
    id: row.id,
    sessionId: row.session_id,
    projectId: row.project_id,
    userId: row.user_id,
    operationId: row.operation_id,
    creditCost: row.credit_cost,
    costVersionId: row.cost_version_id,
    reservationId: row.reservation_id,
    status: row.status as DesignOperation['status'],
    outcome,
    feedbackText: row.feedback_text,
    classifiedOperation: row.classified_operation,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }
}

/** Create a new design session for a project. */
export function createSession(
  db: FormaDb,
  projectId: string,
  userId: string,
  title: string,
  brief?: unknown,
  intent?: unknown,
): DesignSession {
  const id = newId()
  const now = nowIso()
  db.prepare(
    `INSERT INTO design_sessions (id, project_id, user_id, title, brief_json, intent_json, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
  ).run(
    id,
    projectId,
    userId,
    title,
    brief ? JSON.stringify(brief) : null,
    intent ? JSON.stringify(intent) : null,
    now,
    now,
  )
  return rowToSession(
    db.prepare(`SELECT * FROM design_sessions WHERE id = ?`).get(id) as DesignSessionRow,
  )
}

/** List sessions for a project. */
export function listSessions(db: FormaDb, projectId: string): DesignSession[] {
  const rows = db
    .prepare(`SELECT * FROM design_sessions WHERE project_id = ? AND status != 'deleted' ORDER BY updated_at DESC`)
    .all(projectId) as DesignSessionRow[]
  return rows.map(rowToSession)
}

/** Get a session by ID. */
export function getSession(db: FormaDb, sessionId: string): DesignSession | undefined {
  const row = db
    .prepare(`SELECT * FROM design_sessions WHERE id = ?`)
    .get(sessionId) as DesignSessionRow | undefined
  return row ? rowToSession(row) : undefined
}

/** Update session brief/intent/status. */
export function updateSession(
  db: FormaDb,
  sessionId: string,
  patch: { brief?: unknown; intent?: unknown; status?: string; title?: string },
): DesignSession | undefined {
  const now = nowIso()
  const sets: string[] = []
  const args: unknown[] = []
  if (patch.brief !== undefined) {
    sets.push('brief_json = ?')
    args.push(JSON.stringify(patch.brief))
  }
  if (patch.intent !== undefined) {
    sets.push('intent_json = ?')
    args.push(JSON.stringify(patch.intent))
  }
  if (patch.status !== undefined) {
    sets.push('status = ?')
    args.push(patch.status)
  }
  if (patch.title !== undefined) {
    sets.push('title = ?')
    args.push(patch.title)
  }
  if (sets.length === 0) return getSession(db, sessionId)
  sets.push('updated_at = ?')
  args.push(now)
  args.push(sessionId)
  db.prepare(`UPDATE design_sessions SET ${sets.join(', ')} WHERE id = ?`).run(...args)
  return getSession(db, sessionId)
}

/**
 * Record a design operation within a session.
 * The credit_cost is preserved at execution time (cost versioning).
 */
export function recordOperation(
  db: FormaDb,
  session: { id: string; projectId: string; userId: string },
  operation: {
    operationId: string
    creditCost: number
    costVersionId?: string | null
    reservationId?: string | null
    feedbackText?: string | null
    classifiedOperation?: string | null
  },
): DesignOperation {
  const id = newId()
  const now = nowIso()
  db.prepare(
    `INSERT INTO design_operations
     (id, session_id, project_id, user_id, operation_id, credit_cost, cost_version_id,
      reservation_id, status, outcome_json, feedback_text, classified_operation, created_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, ?, ?, ?, NULL)`,
  ).run(
    id,
    session.id,
    session.projectId,
    session.userId,
    operation.operationId,
    operation.creditCost,
    operation.costVersionId ?? null,
    operation.reservationId ?? null,
    operation.feedbackText ?? null,
    operation.classifiedOperation ?? null,
    now,
  )
  return rowToOperation(
    db.prepare(`SELECT * FROM design_operations WHERE id = ?`).get(id) as DesignOperationRow,
  )
}

/** Mark an operation as running. */
export function startOperation(db: FormaDb, operationId: string): void {
  db.prepare(`UPDATE design_operations SET status = 'running' WHERE id = ?`).run(operationId)
}

/** Mark an operation as completed with an outcome. */
export function completeOperation(
  db: FormaDb,
  operationId: string,
  outcome?: unknown,
): DesignOperation | undefined {
  const now = nowIso()
  db.prepare(
    `UPDATE design_operations SET status = 'completed', outcome_json = ?, completed_at = ? WHERE id = ?`,
  ).run(outcome ? JSON.stringify(outcome) : null, now, operationId)
  const row = db
    .prepare(`SELECT * FROM design_operations WHERE id = ?`)
    .get(operationId) as DesignOperationRow | undefined
  return row ? rowToOperation(row) : undefined
}

/** Mark an operation as failed. */
export function failOperation(
  db: FormaDb,
  operationId: string,
  reason?: string,
): DesignOperation | undefined {
  const now = nowIso()
  db.prepare(
    `UPDATE design_operations SET status = 'failed', outcome_json = ?, completed_at = ? WHERE id = ?`,
  ).run(reason ? JSON.stringify({ error: reason }) : null, now, operationId)
  const row = db
    .prepare(`SELECT * FROM design_operations WHERE id = ?`)
    .get(operationId) as DesignOperationRow | undefined
  return row ? rowToOperation(row) : undefined
}

/** List operations for a session. */
export function listOperations(db: FormaDb, sessionId: string): DesignOperation[] {
  const rows = db
    .prepare(`SELECT * FROM design_operations WHERE session_id = ? ORDER BY created_at DESC`)
    .all(sessionId) as DesignOperationRow[]
  return rows.map(rowToOperation)
}

/** List operations for a user (across all sessions/projects). */
export function listUserOperations(
  db: FormaDb,
  userId: string,
  limit = 50,
): DesignOperation[] {
  const safe = Math.min(Math.max(1, Math.floor(limit) || 50), 200)
  const rows = db
    .prepare(`SELECT * FROM design_operations WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`)
    .all(userId, safe) as DesignOperationRow[]
  return rows.map(rowToOperation)
}

/** Get project-level usage analytics. */
export function projectUsage(db: FormaDb, projectId: string) {
  const ops = db
    .prepare(`SELECT * FROM design_operations WHERE project_id = ?`)
    .all(projectId) as DesignOperationRow[]
  const consumed = ops
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.credit_cost, 0)
  const reserved = ops
    .filter((o) => o.status === 'pending' || o.status === 'running')
    .reduce((sum, o) => sum + o.credit_cost, 0)
  const refunded = ops
    .filter((o) => o.status === 'failed' || o.status === 'cancelled')
    .reduce((sum, o) => sum + o.credit_cost, 0)
  const byCategory: Record<string, number> = {}
  for (const op of ops) {
    byCategory[op.operation_id] = (byCategory[op.operation_id] ?? 0) + 1
  }
  return {
    creditsConsumed: consumed,
    creditsReserved: reserved,
    creditsRefunded: refunded,
    operationCount: ops.length,
    operationsByType: byCategory,
    revisionCount: ops.filter((o) => o.operation_id.includes('revision')).length,
    explorationCount: ops.filter((o) => o.operation_id === 'design_exploration').length,
    alternativeCount: ops.filter((o) => o.operation_id === 'alternative_design').length,
    newDirectionCount: ops.filter((o) => o.operation_id === 'new_direction').length,
    exportCount: ops.filter((o) => o.operation_id === 'final_export').length,
  }
}
