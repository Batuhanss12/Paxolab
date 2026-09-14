/**
 * Art direction allowed lists — compute what heroes/patterns/backgrounds are allowed.
 * Extracted from ArtDirection.ts to isolate allowed-list logic from pickers.
 */
import type { StyleType } from '../../types'
import type { DecorFamily, SectorId } from '../designSystem/types'
import type { VocabularyRow } from './SectorVisualVocabulary'
import { styleForbiddenPatterns } from './SectorVisualVocabulary'
import { styleHeroes } from './styleHeroConfig'
import type { BackgroundTreatment, HeroFamily, PatternFamily } from './DesignPlan'

export function allowedHeroes(style: StyleType, sector: SectorId, vocab?: VocabularyRow): HeroFamily[] {
  // P2-A: minimal unlocks ONE quiet hero per sector (not luxury crests, just micro signals).
  if (style === 'minimal') {
    if (sector === 'cream' || sector === 'serum' || sector === 'baby') return ['line-scene', 'oval']
    if (sector === 'electronics') return ['none', 'tech']
    // cleaning, food, perfume, generic: stay none — rely on sector bg accent
    return ['none']
  }
  const preferred = styleHeroes(style, sector)
  if (vocab) {
    const safe = vocab.heroFamilies.filter((h) => !vocab.forbiddenHeroes.includes(h))
    if (safe.length) {
      const head = preferred.filter((h) => h !== 'none' && safe.includes(h))
      const tail = safe.filter((h) => !head.includes(h))
      return head.length ? [...head, ...tail] : safe
    }
  }
  return preferred
}

export function allowedPatterns(style: StyleType, vocab?: VocabularyRow, sector?: SectorId): PatternFamily[] {
  const leak = styleForbiddenPatterns(style, sector ?? vocab?.sectorId ?? 'generic')
  // Sector-aware pattern enrichment: technical sectors get grids, organic sectors get weaves/waves.
  const sectorBoost: PatternFamily[] =
    sector === 'electronics' ? ['hexagon', 'dotgrid'] :
    sector === 'food' || sector === 'beverage' ? ['weave'] :
    sector === 'cleaning' ? ['wave'] :
    []
  const styleList: PatternFamily[] =
    style === 'luxury'
      ? ['contour', 'ornament']
      : style === 'modern'
        ? ['lattice', 'stripe', 'dotgrid', 'hexagon']
        : style === 'eco'
          ? ['grain', 'ornament', 'weave']
          : style === 'playful'
            ? ['capsule', 'wave', 'grain']
            : style === 'classic'
              ? ['ornament', 'contour']
              : style === 'minimal'
                // P2-A: minimal unlocks ONE quiet pattern per sector
                ? sector === 'cream' || sector === 'serum'
                  ? ['none', 'stripe']
                  : sector === 'cleaning'
                    ? ['none', 'wave']
                    : sector === 'electronics'
                      ? ['none', 'hexagon', 'dotgrid']
                      : ['none']
                : ['none']
  const merged = [...new Set([...styleList, ...sectorBoost])]
  const styleSafe = merged.filter((p) => !leak.includes(p))
  if (vocab) {
    const safe = vocab.patternFamilies.filter((p) => !vocab.forbiddenPatterns.includes(p) && !leak.includes(p))
    const head = styleSafe.filter((p) => safe.includes(p))
    if (head.length) {
      const mergedSafe = [...head, ...safe.filter((p) => !head.includes(p))]
      return fillRequired(style, sector, mergedSafe)
    }
    if (styleSafe.length) return fillRequired(style, sector, styleSafe)
    if (safe.length) return fillRequired(style, sector, safe)
  }
  return fillRequired(style, sector, styleSafe)
}

function fillRequired(style: StyleType, sector: SectorId | undefined, list: PatternFamily[]): PatternFamily[] {
  if (style === 'minimal') return list.length ? list : ['none']
  const filled = list.filter((p) => p !== 'none')
  if (filled.length) return filled
  return [defaultPattern(style, sector)]
}

export function defaultPattern(style: StyleType, sector?: SectorId): PatternFamily {
  // Sector-aware defaults give each sector a distinctive surface at set 0.
  if (sector === 'electronics' && (style === 'modern' || style === 'minimal')) return 'hexagon'
  if ((sector === 'food' || sector === 'beverage') && style === 'eco') return 'weave'
  if (sector === 'cleaning') return 'wave'
  if (style === 'luxury') return 'contour'
  if (style === 'modern') return 'lattice'
  if (style === 'eco') return 'grain'
  if (style === 'playful') return 'capsule'
  if (style === 'classic') return 'ornament'
  return 'none'
}

export function defaultBackground(style: StyleType): BackgroundTreatment {
  if (style === 'luxury' || style === 'classic') return 'dark-field'
  if (style === 'eco') return 'kraft'
  if (style === 'modern') return 'quiet-paper'
  return 'quiet-paper'
}

export function heroFromDecor(decor: DecorFamily): HeroFamily {
  if (decor === 'crest') return 'crest'
  if (decor === 'cartouche') return 'seal'
  if (decor === 'leaf' || decor === 'drop') return 'botanical'
  if (decor === 'badge') return 'emblem'
  if (decor === 'olive' || decor === 'harvest') return 'harvest'
  if (decor === 'oval') return 'oval'
  if (decor === 'grid' || decor === 'plaque') return 'tech'
  return 'none'
}
