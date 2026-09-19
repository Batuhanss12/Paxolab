/**
 * Conversation state — what was asked, what was answered, what the user declined.
 * Prevents asking the same question again and again; after MAX_ASK the system
 * accepts the deterministic default (SYSTEM_DEFAULT provenance) and moves on.
 */
import type { AwaitingKey, DesignBrief } from '../types'
import { mergeBrief } from './fields'

/** Ask a blocking question at most this many times before accepting a safe default. */
export const MAX_ASK = 2

export type ConversationState = {
  asked: Partial<Record<AwaitingKey, number>>
  answered: AwaitingKey[]
  declined: AwaitingKey[]
  turns: number
  /** Plan summaries per generate — "what has already been decided". */
  decisions: string[]
}

export function emptyConversationState(): ConversationState {
  return { asked: {}, answered: [], declined: [], turns: 0, decisions: [] }
}

export function timesAsked(state: ConversationState, key: AwaitingKey): number {
  return state.asked[key] ?? 0
}

export function noteAsked(state: ConversationState, key: AwaitingKey): ConversationState {
  return { ...state, asked: { ...state.asked, [key]: timesAsked(state, key) + 1 } }
}

export function noteAnswered(state: ConversationState, key: AwaitingKey): ConversationState {
  if (state.answered.includes(key)) return state
  return { ...state, answered: [...state.answered, key] }
}

export function noteDeclined(state: ConversationState, key: AwaitingKey): ConversationState {
  if (state.declined.includes(key)) return state
  return { ...state, declined: [...state.declined, key] }
}

export function noteTurn(state: ConversationState): ConversationState {
  return { ...state, turns: state.turns + 1 }
}

/**
 * Record a settled decision, once.
 *
 * `decisions` and this function were written and then never called — the conversation kept a
 * ledger of what was *asked* but not of what was *decided*, so a customer six turns into a design
 * had no way to see what they had already chosen, and the engine had no summary to give them.
 *
 * Repeats are dropped rather than appended: picking direction 3, then 5, then 3 again should leave
 * one entry saying the direction is 3, not a history of clicks. The list is keyed by the part
 * before the colon ("Yapı", "Yön", "Ruh hali"), so a later choice replaces an earlier one.
 */
export function noteDecision(state: ConversationState, summary: string): ConversationState {
  const clean = summary.trim()
  if (!clean) return state
  const topic = clean.split(':')[0]?.trim() ?? clean
  const kept = state.decisions.filter((row) => (row.split(':')[0]?.trim() ?? row) !== topic)
  if (kept.length === state.decisions.length && state.decisions.includes(clean)) return state
  return { ...state, decisions: [...kept, clean].slice(-20) }
}

/** What has been settled so far, for the summary the customer can ask for. */
export function decisionSummary(state: ConversationState): string {
  return state.decisions.join(' · ')
}

/** Ask only while under the cap and the user has not already declined the field. */
export function shouldAsk(state: ConversationState, key: AwaitingKey): boolean {
  return timesAsked(state, key) < MAX_ASK && !state.declined.includes(key)
}

/**
 * Safe defaults for fields the user would not answer. Only fields that have a
 * deterministic default in the engine; brand / sector / surface stay questions.
 */
export function acceptDefaultFor(brief: DesignBrief, key: AwaitingKey): DesignBrief {
  if (key === 'dimensionsMm') {
    return mergeBrief(brief, {
      dimsDefaulted: true,
      provenance: { dimensionsMm: { source: 'SYSTEM_DEFAULT', confidence: 1 } },
    })
  }
  if (key === 'colors' || key === 'styleType') {
    return mergeBrief(brief, {
      directionDefaulted: true,
      provenance: { colors: { source: 'SYSTEM_DEFAULT', confidence: 1 } },
    })
  }
  if (key === 'barcode') {
    return mergeBrief(brief, {
      barcodeDefaulted: true,
      provenance: { barcode: { source: 'SYSTEM_DEFAULT', confidence: 1 } },
    })
  }
  if (key === 'templateId') return brief
  return brief
}

export function canDefault(key: AwaitingKey): boolean {
  return key === 'dimensionsMm' || key === 'templateId' || key === 'colors' || key === 'styleType' || key === 'barcode'
}
