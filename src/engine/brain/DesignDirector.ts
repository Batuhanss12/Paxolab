import type { DesignBrief, FormaTemplate, StyleType } from '../../types'
import { resolveSector, sectorBlob } from '../designSystem/sector'
import { resolveMarkRecipe } from '../marks/MarkMatrix'
import { attachArtDirection } from './ArtDirection'
import { composeGrammar } from './CompositionGrammar'
import { rememberArt } from './DesignMemory'
import { allowedDecorFor, sectorRisks, styleRule } from './DesignRules'
import { buildDesignGraph, type DesignGraph } from './DesignGraph'
import { principlesFor } from './DesignKnowledge'
import type { DesignPlan, DirectorCue, NegativeSpace, BackgroundTreatment } from './DesignPlan'
import { planSummaryTr } from './DesignPlan'
import { studioRecipe } from './VariationRecipes'
import { lookupVocabulary, resolveSubProduct } from './SectorVisualVocabulary'

export type DirectorInput = {
  brief: DesignBrief
  template?: Pick<FormaTemplate, 'id' | 'packagingMode' | 'structureId'>
  style: StyleType
  prev?: DesignPlan
  cue?: DirectorCue | string
  variationIndex?: number
  forceHero?: import('./DesignPlan').HeroFamily
  blankCanvas?: boolean
  backgroundTreatment?: BackgroundTreatment
}

function asCue(raw?: string): DirectorCue {
  if (!raw) return 'none'
  if (raw === 'luxury-tighten' || /daha\s*(lüks|premium)|tighten/i.test(raw)) return 'luxury-tighten'
  if (raw === 'luxury-arrive') return 'luxury-arrive'
  if (raw === 'open-air' || /daha\s*(sade|minimal)/i.test(raw)) return 'open-air'
  if (raw === 'warm-natural' || /daha\s*eco/i.test(raw)) return 'warm-natural'
  if (raw === 'graphic-push' || /daha\s*(modern|eğlenc)/i.test(raw)) return 'graphic-push'
  if (raw === 'force-overload') return 'force-overload'
  return raw === 'none' ? 'none' : 'none'
}

function tightenSpace(space: NegativeSpace): NegativeSpace {
  if (space === 'low') return 'med'
  return 'high'
}

/** Rules + graph. No SVG. LLM is not consulted. */
export function createPlan(input: DirectorInput): DesignPlan {
  const style = input.style || (input.brief.styleType as StyleType) || 'luxury'
  const cue = asCue(input.cue)
  const sector = resolveSector(input.brief)
  const surface = input.brief.packagingMode === 'label' || input.template?.packagingMode === 'label' ? 'label' : 'box'
  const rule = styleRule(style)
  const prev = input.prev
  const base = prev && prev.style === style ? prev : null
  const variationIndex = Math.max(0, Math.floor(input.variationIndex ?? prev?.variationIndex ?? 0))

  let density = base?.decor.density ?? rule.density
  let negativeSpace = base?.composition.negativeSpace ?? rule.negativeSpace
  let visualIntent = base?.visualIntent ?? rule.visualIntent
  let metallic = base?.color.metallic ?? rule.metallic
  let restrainExtras = base?.decor.restrainExtras ?? false

  if (cue === 'luxury-tighten') {
    density = 'sparse'
    negativeSpace = tightenSpace(negativeSpace)
    visualIntent = 'restrained'
    metallic = 'restrained'
    restrainExtras = true
  } else if (cue === 'luxury-arrive') {
    density = rule.density
    negativeSpace = rule.negativeSpace
    visualIntent = rule.visualIntent
    metallic = 'foil'
    restrainExtras = false
  } else if (cue === 'open-air') {
    density = 'sparse'
    negativeSpace = 'high'
    restrainExtras = true
  } else if (cue === 'warm-natural') {
    density = 'balanced'
    visualIntent = 'warm'
  } else if (cue === 'graphic-push') {
    density = density === 'sparse' ? 'balanced' : 'dense'
    visualIntent = style === 'playful' ? 'graphic' : 'high-contrast'
  } else if (cue === 'force-overload') {
    density = 'dense'
    restrainExtras = false
    negativeSpace = 'low'
  }

  const blob = sectorBlob(input.brief)
  const subProduct = resolveSubProduct(sector, blob)
  const vocab = lookupVocabulary(sector, subProduct)

  const allowed = allowedDecorFor(style, sector)
  const recipe = resolveMarkRecipe(sector, surface, input.brief)
  const label = surface === 'label'

  const plan: DesignPlan = {
    sector,
    subProduct: input.brief.subProduct,
    vocabularyId: vocab.id,
    surface,
    style,
    cue,
    variationIndex,
    positioning: rule.positioning,
    visualIntent,
    hierarchy: {
      primary: 'brand',
      secondary: input.brief.productName.trim() ? 'product' : 'category',
      tertiary: 'volume',
      order: 'brand > product > volume/descriptor',
    },
    typography: {
      displayFace: rule.displayFace,
      productFace: rule.productFace,
      authority: rule.authority,
      trackingIntent: rule.trackingIntent,
    },
    composition: composeGrammar({
      style,
      surface,
      lockup: label && /wrap/i.test(input.template?.structureId ?? input.brief.templateId) ? 'left' : rule.lockup,
      negativeSpace,
      wrap: /wrap/i.test(input.template?.structureId ?? input.brief.templateId),
      variationIndex,
    }),
    ...attachArtDirection({
      brief: input.brief,
      style,
      sector,
      surface,
      templateId: input.template?.id ?? input.brief.templateId,
      cue,
      density,
      restrainExtras,
      prev: base ?? undefined,
      variationIndex,
      vocab,
      forceHero: input.forceHero,
    }),
    decor: {
      density,
      allowed,
      lockupClearance: true,
      restrainExtras,
    },
    color: {
      roles: { bg: 'ground', fg: 'ink', accent: 'signal' },
      metallic,
      followStyleBar: true,
    },
    marks: {
      recipeKey: recipe.key,
      frontClean: true,
    },
    dielineBehavior: {
      frontClean: true,
      spineBrandFirst: !label,
      backLegalStack: !label,
      tucksMinimal: !label,
      labelFrontDesign: label,
      labelBackUtility: label,
    },
    risks: sectorRisks(sector),
    summaryTr: '',
  }
  const studio = !input.blankCanvas && !restrainExtras ? studioRecipe(variationIndex) : null
  if (studio) {
    const lockup = surface === 'label' && /wrap/i.test(input.template?.structureId ?? input.brief.templateId)
      ? 'left'
      : studio.lockup ?? plan.composition.lockup
    plan.composition = {
      ...plan.composition,
      lockup,
      focal: lockup,
      heroZone: { y: studio.heroY, h: studio.crop === 'open' ? 0.14 : 0.15, x: plan.composition.heroZone.x },
      opticalCenter: studio.opticalCenter ?? plan.composition.opticalCenter,
    }
    plan.heroGraphic = {
      ...plan.heroGraphic,
      scale: studio.scale,
    }
  }
  if (plan.composition.intent === 'full-bleed') {
    plan.heroGraphic.scale = Math.min(plan.heroGraphic.scale, 0.9)
  }
  if (input.blankCanvas) {
    plan.patternSystem = { family: 'none', opacity: 0, avoidLockup: true, sideIntentional: false }
    plan.illustrationSystem = { primitives: [], density: plan.decor.density }
    plan.artDirection = { ...plan.artDirection, chrome: 'quiet' }
    if (input.backgroundTreatment) plan.backgroundTreatment = input.backgroundTreatment
  }
  plan.summaryTr = planSummaryTr(plan)
  rememberArt(style, { hero: plan.heroGraphic.family, pattern: plan.patternSystem.family })
  void principlesFor(style, surface)
  return plan
}

export function planGraph(plan: DesignPlan): DesignGraph {
  return buildDesignGraph(plan)
}

export function advisePlan(plan: DesignPlan): DesignPlan {
  return plan
}
