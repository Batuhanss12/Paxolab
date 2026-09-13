import type { DesignBrief, StyleType } from '../../types'
import type { DecorFamily, Density, SectorId } from '../designSystem/types'
import { lastFamilies, lastForStyle } from './DesignMemory'
import { pickAllowed, studioRecipe } from './VariationRecipes'
import type { VocabularyRow } from './SectorVisualVocabulary'
import { styleForbiddenPatterns, vocabHeroRequired } from './SectorVisualVocabulary'
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
  forceHero?: HeroFamily
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

function styleHeroes(style: StyleType, sector: SectorId): HeroFamily[] {
  if (style === 'minimal') return ['none']
  if (sector === 'perfume') {
    if (style === 'luxury') return ['crest', 'seal']
    if (style === 'classic') return ['seal', 'crest']
    if (style === 'eco') return ['botanical', 'monstera']
    if (style === 'playful') return ['emblem', 'seal']
    return ['none']
  }
  if (sector === 'cream') {
    if (style === 'eco') return ['botanical', 'monstera', 'palm']
    if (style === 'playful') return ['emblem', 'oval']
    if (style === 'classic') return ['oval', 'seal']
    if (style === 'modern') return ['oval', 'emblem']
    return ['oval', 'botanical']
  }
  if (sector === 'serum') {
    if (style === 'eco') return ['botanical', 'monstera', 'palm']
    if (style === 'playful') return ['emblem', 'oval']
    if (style === 'modern') return ['oval', 'emblem']
    return ['botanical', 'oval']
  }
  if (sector === 'food') return ['harvest', 'botanical', 'seal']
  if (sector === 'electronics') return ['tech', 'none']
  if (style === 'playful') return ['emblem', 'oval']
  if (style === 'eco') return ['botanical', 'monstera', 'palm']
  if (style === 'classic') return ['seal', 'crest']
  if (style === 'luxury') return ['crest', 'seal']
  if (style === 'modern') return ['oval', 'none']
  return ['none']
}

export function allowedHeroes(style: StyleType, sector: SectorId, vocab?: VocabularyRow): HeroFamily[] {
  if (style === 'minimal') return ['none']
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
            ? ['capsule', 'wave', 'none']
            : style === 'classic'
              ? ['ornament', 'contour']
              : ['none']
  const merged = [...new Set([...styleList, ...sectorBoost])]
  const styleSafe = merged.filter((p) => !leak.includes(p))
  if (vocab) {
    const safe = vocab.patternFamilies.filter((p) => !vocab.forbiddenPatterns.includes(p) && !leak.includes(p))
    const head = styleSafe.filter((p) => safe.includes(p))
    if (head.length) return [...head, ...safe.filter((p) => !head.includes(p))]
    if (styleSafe.length) return styleSafe
    if (safe.length) return safe
  }
  return styleSafe.length ? styleSafe : ['none']
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

function pickHero(ctx: ArtCtx): HeroFamily {
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

function pickPattern(ctx: ArtCtx): PatternFamily {
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
  if (index <= 0) return safePreferred
  const recipe = studioRecipe(index)
  if (recipe) return pickAllowed(allowed, recipe.pattern, index)
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
