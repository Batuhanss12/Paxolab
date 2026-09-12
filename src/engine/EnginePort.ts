import type { DesignBrief, DesignOverrides, DesignSpec } from '../types'
import { FormaLocalEngine } from './FormaLocalEngine'
import { FormaMockEngine } from './FormaMockEngine'

export type GenerateInput = {
  brief: DesignBrief
  prev?: DesignSpec | null
  overridePatch?: Partial<DesignOverrides>
  copyPatch?: Partial<DesignSpec['copy']>
  logoHref?: string
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
