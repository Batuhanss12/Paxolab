/**
 * Phase 15-A — blank face director.
 * Brief → panel fill + lockup safe-hole + palette from colors[]. Zero styleProfile chrome.
 */
import type { DesignBrief, StyleType } from '../../types'
import type { DecorFamily, LockupId, SectorId } from '../designSystem/types'
import type { BackgroundTreatment, HeroFamily } from '../brain/DesignPlan'
import { allowGoldBar, allowHeroMark, moodPrior, type MoodId } from '../brain/moodPriors'
import { hexLuminance, paletteFromBrief, parseBriefColors } from './briefPalette'
import type { MotifRecipeId } from './artMotifCompose'

export type BlankFaceFinish = {
  goldBar: boolean
  heroFamily: HeroFamily
  decor: DecorFamily
  lockup: LockupId
  thinAccent: boolean
  backgroundTreatment: BackgroundTreatment
  recipeId?: MotifRecipeId
}

export type BlankFacePlan = {
  mood: MoodId
  palette: ReturnType<typeof paletteFromBrief>
  colors: string[]
  finish: BlankFaceFinish
}

export function blankLockup(
  mood: MoodId,
  sector: SectorId,
  grammar: 'box' | 'label',
  wrap: boolean,
): LockupId {
  if (grammar === 'label') return wrap ? 'label-wrap' : 'label-stack'
  if (mood === 'minimal') return 'air-rule'
  if (mood === 'modern') return sector === 'electronics' ? 'left-index' : 'left-index'
  if (sector === 'perfume' && (mood === 'luxury' || mood === 'classic')) return 'centered-crest'
  if ((sector === 'food' || sector === 'beverage') && (mood as MoodId) !== 'modern') return 'harvest-seal'
  if (mood === 'eco') return 'air-rule'
  if (mood === 'playful') return 'left-index'
  if (mood === 'classic') return 'serif-cartouche'
  return 'air-rule'
}

export function blankDecor(lockup: LockupId, sector: SectorId, mood: MoodId, keepHero: boolean): DecorFamily {
  if (!keepHero) return 'none'
  if (lockup === 'centered-crest') return 'crest'
  if (lockup === 'harvest-seal') return 'olive'
  if (lockup === 'serif-cartouche' && sector === 'perfume') return 'crest'
  void mood
  return 'none'
}

export function blankHeroFamily(sector: SectorId, mood: MoodId, keepHero: boolean): HeroFamily {
  if (!keepHero) return 'none'
  if (sector === 'perfume') return 'crest'
  if (sector === 'food' || sector === 'beverage') return 'harvest'
  void mood
  return 'none'
}

export function composeBlankFace(
  brief: DesignBrief,
  sector: SectorId,
  opts: {
    grammar?: 'box' | 'label'
    wrap?: boolean
    recipeId?: MotifRecipeId
    premium?: boolean
  } = {},
): BlankFacePlan {
  const mood = (brief.styleType || 'luxury') as MoodId
  const grammar = opts.grammar ?? (brief.packagingMode === 'label' ? 'label' : 'box')
  const wrap = !!opts.wrap
  const palette = paletteFromBrief(brief, mood as StyleType, !!opts.premium)
  const keepHero = allowHeroMark(sector, mood)
  const lockup = blankLockup(mood, sector, grammar, wrap)
  const goldBar = allowGoldBar(sector, mood, grammar)
  const heroFamily = blankHeroFamily(sector, mood, keepHero)
  const dark = hexLuminance(palette.bg) < 0.28
  const prior = moodPrior(mood)
  return {
    mood,
    palette,
    colors: parseBriefColors(brief.colors),
    finish: {
      goldBar,
      heroFamily,
      decor: blankDecor(lockup, sector, mood, keepHero),
      lockup,
      thinAccent: !goldBar && prior.metallic > 0.3 && grammar === 'box',
      backgroundTreatment: dark ? 'dark-field' : 'quiet-paper',
      recipeId: opts.recipeId,
    },
  }
}
