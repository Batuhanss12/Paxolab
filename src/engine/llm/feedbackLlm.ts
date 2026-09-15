/**
 * Feedback interpretation — natural revision talk → StructuredFeedback.
 * Heuristic parser is the source of truth; the LLM only adds classifications it
 * can express in the same closed vocabulary. Nothing here touches the plan or SVG.
 */
import type { FeedbackStrength, FeedbackType, StructuredFeedback } from '../brain/DesignDecisionLog'
import { parseFeedback } from '../iterate/feedbackParser'
import { getLlmProvider } from './provider'

const TYPES: FeedbackType[] = [
  'composition',
  'visual_language',
  'typography',
  'color',
  'motif',
  'hierarchy',
  'density',
  'whitespace',
  'brand_fit',
  'sector_fit',
  'technical',
  'concept',
]

const STRENGTHS: FeedbackStrength[] = ['low', 'medium', 'high']

const SYSTEM_PROMPT = `You classify packaging-design revision requests for Paxolab.
Return JSON: { "feedback": [ { "type", "target", "direction", "strength" } ] }.
type must be one of: ${TYPES.join(', ')}.
strength must be one of: low, medium, high.
target: short snake_case noun (brand_lockup, density, dialect, palette, product_name, decor, air).
direction: short snake_case verb (move_up, increase, decrease, modernize, classicize, avoid, darken, warm, change, fix, strengthen).
Only classify what the user actually criticised. Do not invent geometry, colours or assets. Empty array when there is no design criticism.`

type LlmFeedbackResponse = { feedback?: Partial<StructuredFeedback>[] }

function sanitize(rows: Partial<StructuredFeedback>[] | undefined, raw: string): StructuredFeedback[] {
  const out: StructuredFeedback[] = []
  for (const row of rows ?? []) {
    if (!row || !TYPES.includes(row.type as FeedbackType)) continue
    const target = String(row.target ?? '').trim().toLowerCase().replace(/[^a-z_]/g, '_').slice(0, 32)
    const direction = String(row.direction ?? '').trim().toLowerCase().replace(/[^a-z_]/g, '_').slice(0, 32)
    if (!target || !direction) continue
    const strength = STRENGTHS.includes(row.strength as FeedbackStrength) ? (row.strength as FeedbackStrength) : 'medium'
    if (out.some((r) => r.type === row.type && r.target === target && r.direction === direction)) continue
    out.push({ type: row.type as FeedbackType, target, direction, strength, raw })
  }
  return out
}

/** LLM classification only; null when disabled or invalid. */
export async function interpretFeedbackWithLlm(text: string): Promise<StructuredFeedback[] | null> {
  const provider = getLlmProvider()
  if (!provider.enabled() || !text.trim()) return null
  const parsed = await provider.generateStructured<LlmFeedbackResponse>({
    task: 'feedback-interpret',
    system: SYSTEM_PROMPT,
    user: text.trim(),
    timeoutMs: 6000,
  })
  if (!parsed) return null
  return sanitize(parsed.feedback, text.trim())
}

/** Heuristics first; LLM rows are appended only when they add a new (type,target,direction). */
export async function interpretFeedback(text: string): Promise<{ feedback: StructuredFeedback[]; llmUsed: boolean }> {
  const heuristic = parseFeedback(text)
  const llm = await interpretFeedbackWithLlm(text).catch(() => null)
  if (!llm) return { feedback: heuristic, llmUsed: false }
  const merged = [...heuristic]
  for (const row of llm) {
    if (!merged.some((r) => r.type === row.type && r.target === row.target && r.direction === row.direction)) merged.push(row)
  }
  return { feedback: merged, llmUsed: true }
}
