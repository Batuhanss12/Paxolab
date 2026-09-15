import type { DesignBrief, DesignOverrides, DesignSpec } from '../types'
import type { StructuredFeedback } from './brain/DesignDecisionLog'
import { FormaLocalEngine } from './FormaLocalEngine'
import { FormaMockEngine } from './FormaMockEngine'
import type { LlmCopy } from './llm/copyLlm'

export type GenerateInput = {
  brief: DesignBrief
  prev?: DesignSpec | null
  overridePatch?: Partial<DesignOverrides>
  copyPatch?: Partial<DesignSpec['copy']>
  /** LLM-generated copy — used when copyPatch doesn't override a field. */
  llmCopy?: LlmCopy | null
  logoHref?: string
  /** FAZ 5 — classified revision talk. Does not select art. */
  feedback?: StructuredFeedback[]
}

export interface EnginePort {
  generate(input: GenerateInput): DesignSpec
}

let cached: EnginePort | null = null

export function getEngine(): EnginePort {
  if (cached) return cached
  cached = import.meta.env.VITE_ENGINE === 'mock' ? new FormaMockEngine() : new FormaLocalEngine()
  return cached
}
