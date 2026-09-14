/**
 * Art direction pickers — select specific hero/pattern/primitive from allowed lists.
 * Extracted from ArtDirection.ts to isolate selection logic from allowed-list computation.
 */
import type { StyleType } from '../../types'
import type { Density } from '../designSystem/types'
import { lastForStyle } from './DesignMemory'
import { pickAllowed, studioRecipe } from './VariationRecipes'
import { vocabHeroRequired } from './SectorVisualVocabulary'
import { allowedHeroes, allowedPatterns, defaultPattern } from './artDirectionAllowed'
import type { ArtCtx } from './ArtDirection'
import type { HeroFamily, PatternFamily, PrimitiveId } from './DesignPlan'

const OVERLOAD_PRIMS: PrimitiveId[] = ['leaf', 'grain', 'diamond', 'wave', 'arc', 'dot', 'tick']

/** Set 0 stays empty. Variation / graphic-push get one quiet atom. Never leaf on eco (kit already stamps). */
export function pickPrimitives(ctx: ArtCtx): PrimitiveId[] {
  if (ctx.cue === 'force-overload') return [...OVERLOAD_PRIMS]
  if (ctx.restrainExtras) return []
  const recipe = studioRecipe(ctx.variationIndex ?? 0)
  if (recipe && !recipe.primitive) return []
  const vary = (ctx.variationIndex ?? 0) > 0 || ctx.cue === 'graphic-push'
  if (!vary) return []
  if (ctx.style === 'luxury' || ctx.style === 'classic') return ['rule']
  if (ctx.style === 'modern' || ctx.style === 'playful') return ['dot']
  if (ctx.style === 'eco' || ctx.sector === 'food') return ['grain']
  return []
}

function pickFromSet<T extends string>(allowed: T[], index: number, last?: T): T {
  const preferred = allowed[0]
  if (index <= 0) return preferred
  const avoid = last && last !== preferred ? last : preferred
  return allowed.find((item) => item !== avoid) ?? allowed[index % allowed.length] ?? preferred
}

function requiredHero(ctx: ArtCtx, allowed: HeroFamily[]): HeroFamily | null {
  if (!ctx.vocab || !vocabHeroRequired(ctx.vocab, ctx.style, ctx.surface)) return null
  if (ctx.sector === 'cream' || ctx.sector === 'serum') {
    if (ctx.style === 'eco' && allowed.includes('monstera')) return 'monstera'
    if (ctx.style === 'playful' && allowed.includes('emblem')) return 'emblem'
    if (ctx.style === 'modern' && allowed.includes('oval')) return 'oval'
  }
  if (ctx.sector === 'food' && allowed.includes('harvest')) return 'harvest'
  if (ctx.sector === 'perfume') {
    if (ctx.style === 'classic' && allowed.includes('seal')) return 'seal'
    if (allowed.includes('crest')) return 'crest'
  }
  const first = allowed.find((h) => h !== 'none')
  return first ?? null
}

export function pickHero(ctx: ArtCtx): HeroFamily {
  const allowed = allowedHeroes(ctx.style, ctx.sector, ctx.vocab)
  if (ctx.forceHero && allowed.includes(ctx.forceHero)) return ctx.forceHero
  const preferred = allowed[0] ?? 'none'
  const index = ctx.variationIndex ?? 0
  const indexChanged = index !== (ctx.prev?.variationIndex ?? 0)
  const keepCue =
    ctx.cue === 'luxury-tighten' ||
    ctx.cue === 'luxury-arrive' ||
    ctx.cue === 'open-air' ||
    ctx.cue === 'warm-natural'
  if (ctx.cue === 'force-overload') return preferred
  if (keepCue && !indexChanged && ctx.prev?.heroGraphic.family && allowed.includes(ctx.prev.heroGraphic.family)) {
    return ctx.prev.heroGraphic.family
  }
  if (index <= 0) {
    const needed = requiredHero(ctx, allowed)
    return needed ?? preferred
  }
  const recipe = studioRecipe(index)
  if (recipe) return pickAllowed(allowed, recipe.hero, index)
  return pickFromSet(allowed, index, lastForStyle(ctx.style)?.hero ?? ctx.prev?.heroGraphic.family)
}

export function pickPattern(ctx: ArtCtx): PatternFamily {
  const allowed = allowedPatterns(ctx.style, ctx.vocab, ctx.sector)
  const preferred = defaultPattern(ctx.style, ctx.sector)
  const safePreferred = allowed.includes(preferred) ? preferred : (allowed[0] ?? 'none')
  const index = ctx.variationIndex ?? 0
  const indexChanged = index !== (ctx.prev?.variationIndex ?? 0)
  const keepCue =
    ctx.cue === 'luxury-tighten' ||
    ctx.cue === 'luxury-arrive' ||
    ctx.cue === 'open-air' ||
    ctx.cue === 'warm-natural'
  if (ctx.cue === 'force-overload') return safePreferred
  if (keepCue && !indexChanged && ctx.prev?.patternSystem.family && allowed.includes(ctx.prev.patternSystem.family)) {
    return ctx.prev.patternSystem.family
  }
  if (index <= 0) return coerceFilledPattern(ctx, safePreferred, allowed)
  const recipe = studioRecipe(index)
  if (recipe) return coerceFilledPattern(ctx, pickAllowed(allowed, recipe.pattern, index), allowed)
  return coerceFilledPattern(
    ctx,
    pickFromSet(allowed, index, lastForStyle(ctx.style)?.pattern ?? ctx.prev?.patternSystem.family),
    allowed,
  )
}

function coerceFilledPattern(ctx: ArtCtx, picked: PatternFamily, allowed: PatternFamily[]): PatternFamily {
  if (picked !== 'none' || ctx.style === 'minimal') return picked
  return allowed.find((p) => p !== 'none') ?? defaultPattern(ctx.style, ctx.sector)
}

export function patternOpacity(style: StyleType, density: Density, restrain: boolean): number {
  if (restrain || density === 'sparse') return style === 'luxury' ? 0.12 : 0.07
  if (style === 'luxury') return 0.2
  if (style === 'modern') return 0.14
  if (style === 'playful') return 0.16
  if (style === 'eco') return 0.1
  if (style === 'classic') return 0.14
  if (style === 'minimal') return 0.06
  return 0
}
