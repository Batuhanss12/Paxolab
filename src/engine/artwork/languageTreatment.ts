/**
 * Visual language → painter instructions.
 * Does not invent dialect tokens. quiet-line is a modifier on the base vector
 * (chrome/air), not a replacement for heraldic / botanical / linear.
 */
import type { VisualLanguage } from './visualLanguage'

export type LineWeight = 'hair' | 'regular' | 'heavy'
export type MotifScaleBias = 'small' | 'regular' | 'bold'
export type OrnamentBias = 'none' | 'restrained' | 'full'
export type FrameBias = 'none' | 'quiet' | 'full'

export type LanguageTreatment = {
  lineWeight: LineWeight
  /** Multiply hardcoded strokes. regular = 1 so catalog grid/rules stay. */
  lineScale: number
  ornament: OrnamentBias
  motifScale: MotifScaleBias
  frame: FrameBias
  chrome: 'full' | 'quiet'
  airBias: boolean
  blockCorners: boolean
  mayGrowFill: boolean
  craftFillMul: number
}

const LANGS: VisualLanguage[] = [
  'oval',
  'organic',
  'geometric',
  'linear',
  'botanical',
  'heraldic',
  'art-deco',
  'quiet-line',
]

function has(list: readonly string[], id: VisualLanguage): boolean {
  return list.includes(id)
}

/**
 * Compile a language vector into painter knobs.
 * quiet-line quiets chrome/air/line; it does not drop heraldic as the dialect.
 */
export function languageTreatmentFor(langs?: readonly string[]): LanguageTreatment {
  const list = (langs ?? []).filter((item): item is VisualLanguage => LANGS.includes(item as VisualLanguage))
  const quiet = has(list, 'quiet-line')
  const linear = has(list, 'linear')
  const heraldic = has(list, 'heraldic') || has(list, 'art-deco')
  const oval = has(list, 'oval')
  const botanical = has(list, 'botanical') || has(list, 'organic')

  const lineWeight: LineWeight = quiet && !heraldic ? 'hair' : heraldic && !quiet ? 'heavy' : 'regular'
  return {
    lineWeight,
    lineScale: lineWeight === 'hair' ? 0.75 : lineWeight === 'heavy' ? 1.15 : 1,
    ornament: quiet && !heraldic ? 'none' : heraldic && !quiet ? 'full' : 'restrained',
    motifScale: linear ? 'bold' : quiet && !heraldic ? 'small' : 'regular',
    frame: quiet || linear ? 'none' : heraldic ? 'full' : botanical || oval ? 'quiet' : 'none',
    chrome: quiet ? 'quiet' : 'full',
    airBias: quiet || oval,
    blockCorners: linear,
    mayGrowFill: linear,
    craftFillMul: linear ? 0.7 : quiet ? 0.55 : 0.62,
  }
}

export function strokeWidthForLanguage(base: number, langs?: readonly string[]): number {
  return Math.round(base * languageTreatmentFor(langs).lineScale * 1000) / 1000
}
