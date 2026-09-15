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
import { withoutSeal } from './DesignPlan'

function dropRetiredHeroes(list: HeroFamily[]): HeroFamily[] {
  const next = list.filter((h) => h !== 'oval' && h !== 'organic-wave')
  return next.length ? next : ['none']
}

function hasLang(langs: readonly string[], ...ids: string[]): boolean {
  return ids.some((id) => langs.includes(id))
}

/** Conservative dialect fit. Empty allow-list is a no-op. Unknown heroes stay allowed. */
export function heroFitsLanguage(hero: HeroFamily, langs?: readonly string[]): boolean {
  if (!langs?.length) return true
  if (hero === 'none' || hero === 'line-scene') return true
  if (hero === 'crest') return hasLang(langs, 'heraldic', 'art-deco')
  if (hero === 'tech') return hasLang(langs, 'linear', 'geometric')
  if (hero === 'harvest') return hasLang(langs, 'botanical', 'organic', 'heraldic', 'art-deco', 'geometric')
  if (hero === 'botanical' || hero === 'monstera' || hero === 'palm') {
    return hasLang(langs, 'botanical', 'organic', 'oval', 'quiet-line')
  }
  if (hero === 'emblem') return hasLang(langs, 'organic', 'geometric', 'linear', 'oval', 'heraldic')
  if (hero === 'oval') return hasLang(langs, 'oval', 'quiet-line')
  return true
}

function intersectLanguage(list: HeroFamily[], langs?: readonly string[]): HeroFamily[] {
  if (!langs?.length) return list
  const fitted = list.filter((hero) => heroFitsLanguage(hero, langs))
  return fitted.length ? fitted : list
}

/** Conservative dialect fit. Empty allow-list is a no-op. Unknown patterns stay allowed. */
export function patternFitsLanguage(pattern: PatternFamily, langs?: readonly string[]): boolean {
  if (!langs?.length) return true
  if (pattern === 'none') return true
  if (pattern === 'stripe') return hasLang(langs, 'linear', 'geometric', 'quiet-line', 'heraldic', 'art-deco', 'oval')
  if (pattern === 'lattice') return hasLang(langs, 'linear', 'geometric', 'oval')
  if (pattern === 'dotgrid') return hasLang(langs, 'linear', 'geometric')
  if (pattern === 'hexagon') return hasLang(langs, 'linear', 'geometric', 'quiet-line')
  if (pattern === 'contour') return hasLang(langs, 'heraldic', 'art-deco', 'oval', 'botanical', 'organic', 'geometric')
  if (pattern === 'ornament') return hasLang(langs, 'heraldic', 'art-deco', 'botanical', 'organic')
  if (pattern === 'grain') {
    return hasLang(langs, 'botanical', 'organic', 'oval', 'quiet-line', 'heraldic', 'art-deco', 'geometric', 'linear')
  }
  if (pattern === 'weave') return hasLang(langs, 'botanical', 'organic', 'heraldic', 'art-deco')
  if (pattern === 'capsule') return hasLang(langs, 'organic', 'geometric')
  if (pattern === 'wave') return hasLang(langs, 'organic', 'geometric', 'quiet-line')
  return true
}

function intersectPatternLanguage(list: PatternFamily[], langs?: readonly string[]): PatternFamily[] {
  if (!langs?.length) return list
  const fitted = list.filter((pattern) => patternFitsLanguage(pattern, langs))
  return fitted.length ? fitted : list
}

export function allowedHeroes(
  style: StyleType,
  sector: SectorId,
  vocab?: VocabularyRow,
  langs?: readonly string[],
): HeroFamily[] {
  // P2-A: minimal unlocks ONE quiet hero per sector (not luxury crests, just micro signals).
  if (style === 'minimal') {
    if (sector === 'cream' || sector === 'serum' || sector === 'baby') {
      return intersectLanguage(dropRetiredHeroes(['line-scene', 'oval']), langs)
    }
    if (sector === 'electronics') {
      return intersectLanguage(dropRetiredHeroes(withoutSeal(['none', 'tech'], sector)), langs)
    }
    return intersectLanguage(['none'], langs)
  }
  const preferred = styleHeroes(style, sector)
  if (vocab) {
    const safe = vocab.heroFamilies.filter((h) => !vocab.forbiddenHeroes.includes(h) && h !== 'seal')
    if (safe.length) {
      const head = preferred.filter((h) => h !== 'none' && h !== 'seal' && safe.includes(h))
      const tail = safe.filter((h) => !head.includes(h))
      return intersectLanguage(dropRetiredHeroes(withoutSeal(head.length ? [...head, ...tail] : safe, sector)), langs)
    }
  }
  return intersectLanguage(dropRetiredHeroes(withoutSeal(preferred, sector)), langs)
}

export function allowedPatterns(
  style: StyleType,
  vocab?: VocabularyRow,
  sector?: SectorId,
  langs?: readonly string[],
): PatternFamily[] {
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
      return intersectPatternLanguage(fillRequired(style, sector, mergedSafe), langs)
    }
    if (styleSafe.length) return intersectPatternLanguage(fillRequired(style, sector, styleSafe), langs)
    if (safe.length) return intersectPatternLanguage(fillRequired(style, sector, safe), langs)
  }
  return intersectPatternLanguage(fillRequired(style, sector, styleSafe), langs)
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
  if (decor === 'cartouche') return 'crest'
  if (decor === 'leaf' || decor === 'drop') return 'botanical'
  if (decor === 'badge') return 'emblem'
  if (decor === 'olive' || decor === 'harvest') return 'harvest'
  if (decor === 'oval') return 'oval'
  if (decor === 'grid' || decor === 'plaque') return 'tech'
  return 'none'
}
