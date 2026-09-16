/**
 * Internal LLM cost tracking (admin only).
 *
 * Records the actual AI/infrastructure cost of an operation.
 * This NEVER determines the user's visible credit balance.
 * The business layer decides: Operation → Credit Cost.
 * The infrastructure layer records: Operation → Actual AI Cost.
 */
import type { FormaDb, LlmCostRecordRow } from '../db.ts'
import { newId } from '../auth.ts'

export type LlmCostRecord = {
  id: string
  operationId: string | null
  designOperationId: string | null
  userId: string | null
  provider: string | null
  model: string | null
  inputTokens: number | null
  outputTokens: number | null
  estimatedCostUsd: number | null
  requestId: string | null
  createdAt: string
}

function rowToRecord(row: LlmCostRecordRow): LlmCostRecord {
  return {
    id: row.id,
    operationId: row.operation_id,
    designOperationId: row.design_operation_id,
    userId: row.user_id,
    provider: row.provider,
    model: row.model,
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    estimatedCostUsd: row.estimated_cost_usd,
    requestId: row.request_id,
    createdAt: row.created_at,
  }
}

/** Record an LLM cost. Never affects user balance. */
export function recordLlmCost(
  db: FormaDb,
  input: {
    operationId?: string | null
    designOperationId?: string | null
    userId?: string | null
    provider?: string | null
    model?: string | null
    inputTokens?: number | null
    outputTokens?: number | null
    estimatedCostUsd?: number | null
    requestId?: string | null
  },
): LlmCostRecord {
  const id = newId()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO llm_cost_records
     (id, operation_id, design_operation_id, user_id, provider, model, input_tokens, output_tokens, estimated_cost_usd, request_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.operationId ?? null,
    input.designOperationId ?? null,
    input.userId ?? null,
    input.provider ?? null,
    input.model ?? null,
    input.inputTokens ?? null,
    input.outputTokens ?? null,
    input.estimatedCostUsd ?? null,
    input.requestId ?? null,
    now,
  )
  return rowToRecord(
    db.prepare(`SELECT * FROM llm_cost_records WHERE id = ?`).get(id) as LlmCostRecordRow,
  )
}

/** List LLM cost records (admin). */
export function listLlmCosts(db: FormaDb, limit = 100): LlmCostRecord[] {
  const safe = Math.min(Math.max(1, Math.floor(limit) || 100), 500)
  const rows = db
    .prepare(`SELECT * FROM llm_cost_records ORDER BY created_at DESC LIMIT ?`)
    .all(safe) as LlmCostRecordRow[]
  return rows.map(rowToRecord)
}

/** Aggregate LLM costs for admin analytics. */
export function llmCostSummary(db: FormaDb): {
  totalRecords: number
  totalCostUsd: number
  totalInputTokens: number
  totalOutputTokens: number
} {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS n,
              COALESCE(SUM(estimated_cost_usd), 0) AS cost,
              COALESCE(SUM(input_tokens), 0) AS input_t,
              COALESCE(SUM(output_tokens), 0) AS output_t
       FROM llm_cost_records`,
    )
    .get() as { n: number; cost: number; input_t: number; output_t: number }
  return {
    totalRecords: row.n,
    totalCostUsd: row.cost,
    totalInputTokens: row.input_t,
    totalOutputTokens: row.output_t,
  }
}
