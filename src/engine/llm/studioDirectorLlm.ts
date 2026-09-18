/**
 * LLM art director — closed-vocabulary DirectionHints only.
 * Never returns coordinates, stroke widths, SVG, or asset filenames.
 * Heuristic hintsFromBrief remain the authority when the provider is off or invalid.
 *
 * The contract covers six decisions, not three. Until F-4 the model was asked for archetype,
 * background and temperament and nothing else — so on the three axes the direction had just
 * learned to decide (type pairing, frame, ornament) the LLM had no voice at all, and an art
 * director that cannot say "quiet, no frame, light sans" is not directing. Each new key goes
 * through the same gate as the old ones: unknown enum values are dropped, never coerced.
 */
import {
  ALL_ARCHETYPES,
  ALL_BACKGROUNDS,
  ALL_FRAMES,
  ALL_ORNAMENTS,
  ALL_TEMPERAMENTS,
  ALL_TYPE_PAIRINGS,
  isArchetype,
  isBackground,
  isFrame,
  isOrnament,
  isTemperament,
  isTypePairing,
} from '../studio/referenceDna'
import type { DirectionHints } from '../studio/types'
import { getLlmProvider } from './provider'

const SYSTEM_PROMPT = `You are the art director for Paxolab, a packaging studio.
Return JSON only: { "archetype", "background", "temperament", "typePairing", "frame", "ornament", "rationale" }.
archetype must be one of: ${ALL_ARCHETYPES.join(', ')}.
background must be one of: ${ALL_BACKGROUNDS.join(', ')}.
temperament must be one of: ${ALL_TEMPERAMENTS.join(', ')}.
typePairing must be one of: ${ALL_TYPE_PAIRINGS.join(', ')}.
frame must be one of: ${ALL_FRAMES.join(', ')}.
ornament must be one of: ${ALL_ORNAMENTS.join(', ')} (quiet = a supermarket cream, rich = a boutique one; the skeleton does not change).
rationale: 1 short Turkish sentence, no JSON.
Match TASARIM REF systems: coffee → marble-frame, honey / food with a drawn subject → specimen-hero, cosmetics care (cream/shampoo) → card-on-art / botanical-card, serum / baby / health → line-scene, cleaning → wave-panel, perfume → noir-stack / ink-panel / atelier-plate / crest-panel, electronics → diagonal-tech.
Any key you are unsure about may be omitted. Do not invent geometry, colours as hex, or file names. Unknown enum values are dropped.`

const GEOMETRY = /svg|viewBox|stroke-width|path\s|d="|#[0-9a-fA-F]{3,8}\b|\b\d+(\.\d+)?mm\b|\.svg\b|filename/i

export type LlmDirection = {
  archetype?: string
  background?: string
  temperament?: string
  typePairing?: string
  frame?: string
  ornament?: string
  rationale?: string
}

/** Closed-vocabulary gate. Invalid enums / geometry / hex never become hints. */
export function sanitizeStudioDirection(parsed: LlmDirection | null | undefined): DirectionHints | null {
  if (!parsed || typeof parsed !== 'object') return null
  const hints: DirectionHints = { source: 'llm', rationale: [] }
  if (typeof parsed.archetype === 'string' && isArchetype(parsed.archetype)) hints.archetype = parsed.archetype
  if (typeof parsed.background === 'string' && isBackground(parsed.background)) hints.background = parsed.background
  if (typeof parsed.temperament === 'string' && isTemperament(parsed.temperament)) hints.temperament = parsed.temperament
  if (typeof parsed.typePairing === 'string' && isTypePairing(parsed.typePairing)) hints.typePairing = parsed.typePairing
  if (typeof parsed.frame === 'string' && isFrame(parsed.frame)) hints.frame = parsed.frame
  if (typeof parsed.ornament === 'string' && isOrnament(parsed.ornament)) hints.ornament = parsed.ornament
  const rationale = typeof parsed.rationale === 'string' ? parsed.rationale.trim().slice(0, 160) : ''
  if (rationale && !GEOMETRY.test(rationale)) hints.rationale = [rationale]
  const said = hints.archetype || hints.background || hints.temperament || hints.typePairing || hints.frame || hints.ornament
  if (!said) return null
  return hints
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
  /** Free text the customer gave about audience, feeling or references — the director's brief. */
  story?: string
}): Promise<DirectionHints | null> {
  const provider = getLlmProvider()
  if (!provider.enabled()) return null
  const user = [
    `Brand: ${input.brand || '(none)'}`,
    `Product: ${input.product || input.subProduct || '(none)'}`,
    `Sector: ${input.sector}; surface: ${input.surface}; style: ${input.style || '(none)'}`,
    `Colors: ${input.colors || '(none)'}`,
    `Brief: ${(input.story ?? '').trim().slice(0, 400) || '(none)'}`,
    `Avoid: ${(input.avoid ?? []).join(', ') || '(none)'}`,
  ].join('\n')
  try {
    const parsed = await provider.generateStructured<LlmDirection>({
      task: 'studio-direct',
      system: SYSTEM_PROMPT,
      user,
      timeoutMs: 7000,
    })
    return sanitizeStudioDirection(parsed)
  } catch {
    return null
  }
}
