import type { DesignBrief, FormaTemplate, StyleType } from '../../types'
import { resolveSector } from '../designSystem/sector'
import { resolveMarkRecipe } from '../marks/MarkMatrix'
import { attachArtDirection } from './ArtDirection'
import { composeGrammar } from './CompositionGrammar'
import { rememberArt } from './DesignMemory'
import { allowedDecorFor, sectorRisks, styleRule } from './DesignRules'
import { buildDesignGraph, type DesignGraph } from './DesignGraph'
import { principlesFor } from './DesignKnowledge'
import { planSummaryTr, type DesignPlan, type DirectorCue, type NegativeSpace } from './DesignPlan'

export type DirectorInput = {
  brief: DesignBrief
  template?: Pick<FormaTemplate, 'id' | 'packagingMode' | 'structureId'>
  style: StyleType
  prev?: DesignPlan
  cue?: DirectorCue | string
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

  const allowed = allowedDecorFor(style, sector)
  const recipe = resolveMarkRecipe(sector, surface, input.brief)
  const label = surface === 'label'

  const plan: DesignPlan = {
    sector,
    subProduct: input.brief.subProduct,
    surface,
    style,
    cue,
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
  plan.summaryTr = planSummaryTr(plan)
  rememberArt({ hero: plan.heroGraphic.family, pattern: plan.patternSystem.family })
  void principlesFor(style, surface)
  return plan
}

export function planGraph(plan: DesignPlan): DesignGraph {
  return buildDesignGraph(plan)
}

export function advisePlan(plan: DesignPlan): DesignPlan {
  return plan
}
