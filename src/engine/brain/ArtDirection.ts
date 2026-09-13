import type { DesignBrief, StyleType } from '../../types'
import type { DecorFamily, Density, SectorId } from '../designSystem/types'
import { lastFamilies } from './DesignMemory'
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
}

const OVERLOAD_PRIMS: PrimitiveId[] = ['leaf', 'grain', 'diamond', 'wave', 'arc', 'dot', 'tick']

export function seedFrom(brief: DesignBrief, style: StyleType, templateId?: string): number {
  const raw = `${brief.brandName}|${brief.productName}|${style}|${templateId ?? brief.templateId}|${brief.packagingMode}`
  let h = 2166136261
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function allowedHeroes(style: StyleType, sector: SectorId): HeroFamily[] {
  if (style === 'minimal') return ['none']
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

function pickHero(style: StyleType, sector: SectorId, cue: DirectorCue, prev?: DesignPlan): HeroFamily {
  const allowed = allowedHeroes(style, sector)
  const keepCue =
    cue === 'luxury-tighten' || cue === 'luxury-arrive' || cue === 'open-air' || cue === 'warm-natural'
  if (keepCue && prev?.heroGraphic.family && allowed.includes(prev.heroGraphic.family)) {
    return prev.heroGraphic.family
  }
  const preferred = allowed[0] ?? 'none'
  if (cue === 'force-overload') return preferred
  const forbid = lastFamilies()
  if (prev && cue === 'none' && prev.heroGraphic.family !== 'none') {
    const next = allowed.find((family) => family !== prev.heroGraphic.family)
    return next ?? preferred
  }
  if (!prev && cue === 'none' && preferred !== 'none' && forbid.includes(preferred)) {
    return allowed.find((family) => family !== preferred && !forbid.includes(family)) ?? preferred
  }
  return preferred
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
  const seed = seedFrom(ctx.brief, ctx.style, ctx.templateId)
  const family = pickHero(ctx.style, ctx.sector, ctx.cue, ctx.prev)
  const pattern = ctx.prev && ctx.cue !== 'force-overload' ? ctx.prev.patternSystem.family : defaultPattern(ctx.style)
  const sideIntentional = ctx.surface === 'box' && (ctx.style === 'luxury' || ctx.style === 'modern' || ctx.style === 'eco')
  const primitives: PrimitiveId[] = ctx.cue === 'force-overload' ? [...OVERLOAD_PRIMS] : []
  const density: Density = ctx.cue === 'force-overload' ? 'dense' : ctx.density
  const cropOpen = ctx.restrainExtras || density === 'sparse'

  return {
    artDirection: {
      vocabulary: `${ctx.sector}/${ctx.style}`,
      crop: cropOpen ? 'open' : 'tight',
      antiRepetition: { seed, forbidLastFamilies: lastFamilies() },
    },
    visualConcept: visualConceptFor(ctx.style, ctx.sector, family),
    heroGraphic: {
      family,
      placement: family === 'none' ? 'none' : 'above-lockup',
      scale: cropOpen ? 0.92 : 1,
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
    backgroundTreatment: defaultBackground(ctx.style),
    density: {
      overall: density,
      front: density,
      side: ctx.style === 'luxury' || ctx.style === 'modern' ? 'balanced' : 'sparse',
      back: 'sparse',
    },
    crop: {
      heroCrop: cropOpen ? 0.9 : 1,
      safeInsets: cropOpen ? 3.1 : 2.2,
    },
  }
}
