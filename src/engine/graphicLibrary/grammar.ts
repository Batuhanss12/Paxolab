/**
 * Design grammar — resolve brief+style+sector+variation into concrete graphic picks.
 *
 * This is the single entry point for graphic selection. It queries the registry
 * and returns concrete picks (pattern, motif, primitive, composition, hero).
 *
 * Selection rules:
 * 1. Style drives composition intent (luxury→symmetric, modern→grid, eco→offset, etc.)
 * 2. Sector filters heroes + patterns (perfume→crest/marble, food→harvest/botanical, etc.)
 * 3. Variation rotates composition intent for variety (set 0 = base, set 1+ = variation)
 * 4. Density caps how many graphics are active (sparse = pattern OR motif, dense = pattern + motif + primitives)
 * 5. Surface (box vs label) affects density — labels are sparse
 *
 * The grammar is deterministic — same input always yields same output.
 * The motor can opt-in by calling resolveGrammar() and using the picks to drive paintGraphic().
 */
import type { GrammarInput, GrammarPicks, GraphicEntry, GraphicId } from './types'
import { listGraphics } from './registry'

/** Filter graphics by style + sector fit. Empty styles/sectors = matches all. */
function fits(entry: GraphicEntry, style: string, sector: string): boolean {
  const styleOk = entry.meta.styles.length === 0 || entry.meta.styles.includes(style as never)
  const sectorOk = entry.meta.sectors.length === 0 || entry.meta.sectors.includes(sector as never)
  return styleOk && sectorOk
}

/** Pick the best graphic from a category by style+sector fit, with variation rotation. */
function pickFromCategory(
  category: 'pattern' | 'motif' | 'primitive' | 'composition' | 'hero',
  input: GrammarInput,
  fallback: GraphicId | null,
): GraphicId | null {
  const all = listGraphics(category)
  const candidates = all.filter((e) => fits(e, input.style, input.sector))
  if (candidates.length === 0) return fallback
  // Variation rotates through candidates deterministically
  const idx = input.variationIndex % candidates.length
  return candidates[idx].meta.id
}

/** Map style → composition intent. */
function compositionForStyle(style: string, variation: number): GraphicId {
  // Set 0 = base composition; set 1+ = variation composition
  if (variation > 0) {
    if (style === 'luxury' || style === 'classic') return variation % 2 === 0 ? 'diagonal' : 'editorial'
    if (style === 'modern') return variation % 2 === 0 ? 'diagonal' : 'editorial'
    if (style === 'eco' || style === 'playful') return 'full-bleed'
    if (style === 'minimal') return 'floating'
  }
  // Base compositions
  if (style === 'modern') return 'grid'
  if (style === 'minimal') return 'centered'
  if (style === 'eco' || style === 'playful') return 'offset'
  return 'centered' // luxury, classic
}

/** Map style+sector → hero. Returns null for minimal (no hero). */
function heroForStyleSector(style: string, sector: string, variation: number): GraphicId | null {
  if (style === 'minimal') return 'none'
  // Sector-specific heroes
  if (sector === 'perfume') return variation > 0 ? 'monogram' : 'crest'
  if (sector === 'cream' || sector === 'serum') return variation % 3 === 0 ? 'oval' : variation % 3 === 1 ? 'emblem' : 'monstera'
  if (sector === 'food' || sector === 'beverage') return 'harvest'
  if (sector === 'electronics') return 'tech'
  if (sector === 'cleaning') return 'none'
  // Style fallbacks
  if (style === 'luxury' || style === 'classic') return 'crest'
  if (style === 'eco') return 'botanical'
  if (style === 'playful') return 'emblem'
  return 'crest'
}

/** Map style+sector → pattern. Returns null for minimal. */
function patternForStyleSector(style: string, sector: string, variation: number): GraphicId | null {
  if (style === 'minimal') return null
  // Sector-specific patterns
  if (sector === 'perfume') return variation > 0 ? 'marble' : 'contour'
  if (sector === 'food' || sector === 'beverage') return variation > 0 ? 'botanical' : 'weave'
  if (sector === 'electronics') return variation > 0 ? 'technical' : 'lattice'
  if (sector === 'cream' || sector === 'serum') return variation > 0 ? 'organic-blob' : 'contour'
  if (sector === 'cleaning') return 'wave'
  // Style fallbacks
  if (style === 'luxury' || style === 'classic') return variation > 0 ? 'luxury-line' : 'ornament'
  if (style === 'modern') return 'lattice'
  if (style === 'eco') return 'botanical'
  if (style === 'playful') return 'capsule'
  return null
}

/** Map style+sector → motif. Sparse density skips motif. */
function motifForStyleSector(style: string, _sector: string, variation: number): GraphicId | null {
  if (variation === 0) return null // Base set: no motif, keep it clean
  if (style === 'luxury' || style === 'classic') return 'series-mark'
  if (style === 'modern') return 'l-bracket'
  if (style === 'eco') return 'diamond'
  if (style === 'playful') return 'claim-capsules'
  return null
}

/** Map style+sector → primitive. Only for dense variation. */
function primitiveForStyleSector(style: string, _sector: string, variation: number): GraphicId | null {
  if (variation < 2) return null // Only set 2+ gets primitives
  if (style === 'eco') return 'leaf'
  if (style === 'modern') return 'grid'
  if (style === 'playful') return 'wave'
  if (style === 'luxury' || style === 'classic') return 'diamond'
  return null
}

export function resolveGrammar(input: GrammarInput): GrammarPicks {
  const composition = compositionForStyle(input.style, input.variationIndex)
  const hero = heroForStyleSector(input.style, input.sector, input.variationIndex)
  const pattern = patternForStyleSector(input.style, input.sector, input.variationIndex)
  // Labels are sparse — skip motif + primitive on labels
  const motif = input.surface === 'label' ? null : motifForStyleSector(input.style, input.sector, input.variationIndex)
  const primitive = input.surface === 'label' ? null : primitiveForStyleSector(input.style, input.sector, input.variationIndex)
  return { pattern, motif, primitive, composition, hero }
}

/**
 * Resolve picks with a fallback to the registry if the primary pick doesn't fit.
 * This is the "safe" version — always returns valid picks if any exist.
 */
export function resolveGrammarSafe(input: GrammarInput): GrammarPicks {
  const primary = resolveGrammar(input)
  // Validate each pick exists in registry; fall back to category pick if not
  const safeComposition = pickFromCategory('composition', input, primary.composition) ?? primary.composition
  const safeHero = pickFromCategory('hero', input, primary.hero) ?? primary.hero
  const safePattern = pickFromCategory('pattern', input, primary.pattern) ?? primary.pattern
  return {
    pattern: safePattern,
    motif: primary.motif,
    primitive: primary.primitive,
    composition: safeComposition,
    hero: safeHero,
  }
}
