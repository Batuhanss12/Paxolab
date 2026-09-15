/**
 * LLM art director — closed-vocabulary DirectionHints only.
 * Never returns coordinates, stroke widths, SVG, or asset filenames.
 * Heuristic hintsFromBrief remain the authority when the provider is off or invalid.
 */
import { ALL_ARCHETYPES, ALL_BACKGROUNDS, ALL_TEMPERAMENTS, isArchetype, isBackground, isTemperament } from '../studio/referenceDna'
import type { DirectionHints } from '../studio/types'
import { getLlmProvider } from './provider'

const SYSTEM_PROMPT = `You are the art director for Paxolab, a packaging studio.
Return JSON only: { "archetype", "background", "temperament", "rationale" }.
archetype must be one of: ${ALL_ARCHETYPES.join(', ')}.
background must be one of: ${ALL_BACKGROUNDS.join(', ')}.
temperament must be one of: ${ALL_TEMPERAMENTS.join(', ')}.
rationale: 1 short Turkish sentence, no JSON.
Match TASARIM REF systems: coffee → marble-frame, honey/food landscape → landscape-window, cosmetics care (cream/shampoo) → card-on-art / botanical-card, serum / baby / health → line-scene, cleaning → wave-panel, perfume → dark-landscape / ink-panel, electronics → diagonal-tech.
Do not invent geometry, colours as hex, or file names.`

type LlmDirection = {
  archetype?: string
  background?: string
  temperament?: string
  rationale?: string
}

export async function studioDirectionWithLlm(input: {
  brand: string
  product: string
  sector: string
  subProduct?: string
  style?: string
  surface: 'box' | 'label'
  colors?: string
  avoid?: string[]
}): Promise<DirectionHints | null> {
  const provider = getLlmProvider()
  if (!provider.enabled()) return null
  const user = [
    `Brand: ${input.brand || '(none)'}`,
    `Product: ${input.product || input.subProduct || '(none)'}`,
    `Sector: ${input.sector}; surface: ${input.surface}; style: ${input.style || '(none)'}`,
    `Colors: ${input.colors || '(none)'}`,
    `Avoid: ${(input.avoid ?? []).join(', ') || '(none)'}`,
  ].join('\n')
  const parsed = await provider.generateStructured<LlmDirection>({
    task: 'studio-direct',
    system: SYSTEM_PROMPT,
    user,
    timeoutMs: 7000,
  })
  if (!parsed) return null
  const hints: DirectionHints = { source: 'llm', rationale: [] }
  if (parsed.archetype && isArchetype(parsed.archetype)) hints.archetype = parsed.archetype
  if (parsed.background && isBackground(parsed.background)) hints.background = parsed.background
  if (parsed.temperament && isTemperament(parsed.temperament)) hints.temperament = parsed.temperament
  if (parsed.rationale?.trim()) hints.rationale = [parsed.rationale.trim().slice(0, 160)]
  if (!hints.archetype && !hints.background && !hints.temperament) return null
  return hints
}
