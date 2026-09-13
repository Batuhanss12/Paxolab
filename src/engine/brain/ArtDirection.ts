import type { DesignBrief, StyleType } from '../../types'
import type { DecorFamily, Density, SectorId } from '../designSystem/types'
import { lastFamilies, lastForStyle } from './DesignMemory'
import { pickAllowed, studioRecipe } from './VariationRecipes'
import type { VocabularyRow } from './SectorVisualVocabulary'
import { visualConceptFor } from './VisualConcept'
import type {
  ArtDirectionBlock,
  BackgroundTreatment,
  CropBlock,
  DensityMap,
  DesignPlan,
  DirectorCue,
  HeroFamily,
  HeroGraphicBlock,
  IllustrationBlock,
  PatternBlock,
  PatternFamily,
  PrimitiveId,
} from './DesignPlan'

export type ArtCtx = {
  brief: DesignBrief
  style: StyleType
  sector: SectorId
  surface: 'box' | 'label'
  templateId?: string
  cue: DirectorCue
  density: Density
  restrainExtras: boolean
  prev?: DesignPlan
  variationIndex?: number
  vocab?: VocabularyRow
}

const OVERLOAD_PRIMS: PrimitiveId[] = ['leaf', 'grain', 'diamond', 'wave', 'arc', 'dot', 'tick']

/** Set 0 stays empty. Variation / graphic-push get one quiet atom. Never leaf on eco (kit already stamps). */
function pickPrimitives(ctx: ArtCtx): PrimitiveId[] {
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

export function seedFrom(brief: DesignBrief, style: StyleType, templateId?: string): number {
  const raw = `${brief.brandName}|${brief.productName}|${style}|${templateId ?? brief.templateId}|${brief.packagingMode}`
  let h = 2166136261
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function allowedHeroes(style: StyleType, sector: SectorId, vocab?: VocabularyRow): HeroFamily[] {
  if (style === 'minimal') return ['none']
  if (vocab) {
    const safe = vocab.heroFamilies.filter((h) => !vocab.forbiddenHeroes.includes(h))
    if (safe.length) return safe
  }
  if (sector === 'perfume') {
    if (style === 'luxury') return ['crest', 'seal']
    if (style === 'classic') return ['seal', 'crest']
    if (style === 'eco') return ['botanical']
    if (style === 'playful') return ['emblem']
    return ['none']
  }
  if (sector === 'cream') {
    if (style === 'eco') return ['botanical']
    if (style === 'playful') return ['emblem']
    if (style === 'classic') return ['oval', 'seal']
    return ['oval']
  }
  if (sector === 'serum') {
    if (style === 'eco') return ['botanical']
    return ['botanical']
  }
  if (sector === 'food') return ['harvest']
  if (sector === 'electronics') return ['tech']
  if (style === 'playful') return ['emblem']
  if (style === 'eco') return ['botanical']
  if (style === 'classic') return ['seal']
  if (style === 'luxury') return ['crest']
  return ['none']
}

export function allowedPatterns(style: StyleType, vocab?: VocabularyRow): PatternFamily[] {
  if (vocab) {
    const safe = vocab.patternFamilies.filter((p) => !vocab.forbiddenPatterns.includes(p))
    if (safe.length) return safe
  }
  if (style === 'luxury') return ['contour', 'ornament']
  if (style === 'modern') return ['lattice', 'stripe']
  if (style === 'eco') return ['grain', 'ornament']
  if (style === 'playful') return ['capsule', 'none']
  if (style === 'classic') return ['ornament', 'contour']
  return ['none']
}

export function defaultPattern(style: StyleType): PatternFamily {
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

function pickFromSet<T extends string>(allowed: T[], index: number, last?: T): T {
  const preferred = allowed[0]
  if (index <= 0) return preferred
  const avoid = last && last !== preferred ? last : preferred
  return allowed.find((item) => item !== avoid) ?? allowed[index % allowed.length] ?? preferred
}

function pickHero(ctx: ArtCtx): HeroFamily {
  const allowed = allowedHeroes(ctx.style, ctx.sector, ctx.vocab)
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
  if (index <= 0) return preferred
  const recipe = studioRecipe(index)
  if (recipe) return pickAllowed(allowed, recipe.hero)
  return pickFromSet(allowed, index, lastForStyle(ctx.style)?.hero ?? ctx.prev?.heroGraphic.family)
}

function pickPattern(ctx: ArtCtx): PatternFamily {
  const allowed = allowedPatterns(ctx.style, ctx.vocab)
  const preferred = defaultPattern(ctx.style)
  const index = ctx.variationIndex ?? 0
  const indexChanged = index !== (ctx.prev?.variationIndex ?? 0)
  const keepCue =
    ctx.cue === 'luxury-tighten' ||
    ctx.cue === 'luxury-arrive' ||
    ctx.cue === 'open-air' ||
    ctx.cue === 'warm-natural'
  if (ctx.cue === 'force-overload') return preferred
  if (keepCue && !indexChanged && ctx.prev?.patternSystem.family) return ctx.prev.patternSystem.family
  if (index <= 0) return preferred
  const recipe = studioRecipe(index)
  if (recipe) return pickAllowed(allowed, recipe.pattern)
  return pickFromSet(allowed, index, lastForStyle(ctx.style)?.pattern ?? ctx.prev?.patternSystem.family)
}

function patternOpacity(style: StyleType, density: Density, restrain: boolean): number {
  if (restrain || density === 'sparse') return style === 'luxury' ? 0.12 : 0.07
  if (style === 'luxury') return 0.2
  if (style === 'modern') return 0.08
  if (style === 'playful') return 0.16
  if (style === 'eco') return 0.1
  if (style === 'classic') return 0.14
  return 0
}

export function attachArtDirection(ctx: ArtCtx): {
  artDirection: ArtDirectionBlock
  visualConcept: ReturnType<typeof visualConceptFor>
  heroGraphic: HeroGraphicBlock
  illustrationSystem: IllustrationBlock
  patternSystem: PatternBlock
  backgroundTreatment: BackgroundTreatment
  density: DensityMap
  crop: CropBlock
} {
  const seed = seedFrom(ctx.brief, ctx.style, ctx.templateId) + (ctx.variationIndex ?? 0) * 17
  const family = pickHero(ctx)
  const pattern = pickPattern(ctx)
  const sideIntentional = ctx.surface === 'box' && (ctx.style === 'luxury' || ctx.style === 'modern' || ctx.style === 'eco')
  const primitives: PrimitiveId[] = pickPrimitives(ctx)
  const density: Density = ctx.cue === 'force-overload' ? 'dense' : ctx.density
  const recipe = !ctx.restrainExtras ? studioRecipe(ctx.variationIndex ?? 0) : null
  const cropOpen = ctx.restrainExtras || density === 'sparse' || recipe?.crop === 'open'

  return {
    artDirection: {
      vocabulary: `${ctx.sector}/${ctx.style}`,
      crop: cropOpen ? 'open' : 'tight',
      chrome: recipe?.chrome ?? 'full',
      antiRepetition: { seed, forbidLastFamilies: lastFamilies() },
    },
    visualConcept: visualConceptFor(ctx.style, ctx.sector, family),
    heroGraphic: {
      family,
      placement: family === 'none' ? 'none' : 'above-lockup',
      scale: recipe?.scale ?? (cropOpen ? 0.92 : 1),
      clearance: true,
    },
    illustrationSystem: {
      primitives,
      density: ctx.cue === 'force-overload' ? 'dense' : primitives.length ? density : 'sparse',
    },
    patternSystem: {
      family: pattern,
      opacity: patternOpacity(ctx.style, density, ctx.restrainExtras),
      avoidLockup: true,
      sideIntentional,
    },
    backgroundTreatment: recipe?.background ?? (ctx.vocab ? (ctx.vocab.backgroundTreatments.includes(defaultBackground(ctx.style)) ? defaultBackground(ctx.style) : ctx.vocab.backgroundTreatments[0] ?? 'quiet-paper') : defaultBackground(ctx.style)),
    density: {
      overall: density,
      front: density,
      side: ctx.style === 'luxury' || ctx.style === 'modern' ? 'balanced' : 'sparse',
      back: 'sparse',
    },
    crop: {
      heroCrop: recipe ? (recipe.crop === 'open' ? 0.88 : 1) : cropOpen ? 0.9 : 1,
      safeInsets: cropOpen ? 3.1 : 2.2,
    },
  }
}
