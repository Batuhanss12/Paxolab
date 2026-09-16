/**
 * Structured credit events for analytics, debugging, billing reconciliation,
 * future learning, and abuse detection.
 *
 * Every credit-changing operation should generate events such as:
 *   design_operation_requested
 *   design_operation_classified
 *   credit_reservation_created
 *   design_operation_started
 *   design_operation_completed
 *   credit_consumption_committed
 *   design_operation_failed
 *   credit_reservation_released
 */
import type { FormaDb, CreditEventRow } from '../db.ts'
import { newId } from '../auth.ts'

export type CreditEvent = {
  id: string
  userId: string
  eventType: string
  operationId: string | null
  reservationId: string | null
  projectId: string | null
  sessionId: string | null
  designOperationId: string | null
  amount: number | null
  meta: unknown | null
  createdAt: string
}

function rowToEvent(row: CreditEventRow): CreditEvent {
  let meta: unknown = null
  try {
    if (row.meta_json) meta = JSON.parse(row.meta_json)
  } catch { /* ignore */ }
  return {
    id: row.id,
    userId: row.user_id,
    eventType: row.event_type,
    operationId: row.operation_id,
    reservationId: row.reservation_id,
    projectId: row.project_id,
    sessionId: row.session_id,
    designOperationId: row.design_operation_id,
    amount: row.amount,
    meta,
    createdAt: row.created_at,
  }
}

/** Record a credit event. */
export function recordEvent(
  db: FormaDb,
  input: {
    userId: string
    eventType: string
    operationId?: string | null
    reservationId?: string | null
    projectId?: string | null
    sessionId?: string | null
    designOperationId?: string | null
    amount?: number | null
    meta?: unknown | null
  },
): CreditEvent {
  const id = newId()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO credit_events
     (id, user_id, event_type, operation_id, reservation_id, project_id, session_id, design_operation_id, amount, meta_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.userId,
    input.eventType,
    input.operationId ?? null,
    input.reservationId ?? null,
    input.projectId ?? null,
    input.sessionId ?? null,
    input.designOperationId ?? null,
    input.amount ?? null,
    input.meta ? JSON.stringify(input.meta) : null,
    now,
  )
  return rowToEvent(
    db.prepare(`SELECT * FROM credit_events WHERE id = ?`).get(id) as CreditEventRow,
  )
}

/** List events for a user. */
export function listUserEvents(db: FormaDb, userId: string, limit = 100): CreditEvent[] {
  const safe = Math.min(Math.max(1, Math.floor(limit) || 100), 500)
  const rows = db
    .prepare(`SELECT * FROM credit_events WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`)
    .all(userId, safe) as CreditEventRow[]
  return rows.map(rowToEvent)
}

/** List events by type (admin analytics). */
export function listEventsByType(
  db: FormaDb,
  eventType: string,
  limit = 100,
): CreditEvent[] {
  const safe = Math.min(Math.max(1, Math.floor(limit) || 100), 500)
  const rows = db
    .prepare(`SELECT * FROM credit_events WHERE event_type = ? ORDER BY created_at DESC LIMIT ?`)
    .all(eventType, safe) as CreditEventRow[]
  return rows.map(rowToEvent)
}
