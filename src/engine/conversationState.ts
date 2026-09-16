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

export function noteDecision(state: ConversationState, summary: string): ConversationState {
  if (!summary.trim()) return state
  return { ...state, decisions: [...state.decisions, summary.trim()].slice(-20) }
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
  if (key === 'templateId') return brief
  return brief
}

export function canDefault(key: AwaitingKey): boolean {
  return key === 'dimensionsMm' || key === 'templateId' || key === 'colors' || key === 'styleType'
}
