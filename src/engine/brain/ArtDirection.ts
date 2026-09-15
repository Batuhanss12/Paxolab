/**
 * ArtDirection — facade re-exporting the decomposed art-direction modules.
 * Allowed lists live in artDirectionAllowed.ts.
 * Pickers live in artDirectionPickers.ts.
 * This file preserves the public API: ArtCtx, seedFrom, attachArtDirection.
 */
import type { DesignBrief, StyleType } from '../../types'
import type { Density, SectorId } from '../designSystem/types'
import { lastFamilies } from './DesignMemory'
import { studioRecipe } from './VariationRecipes'
import type { VocabularyRow } from './SectorVisualVocabulary'
import { chromeForConcept } from '../designSystem/conceptKitAlignment'
import { languagesFromConcept, visualLanguageFor } from '../artwork/visualLanguage'
import { visualConceptFor } from './VisualConcept'
import { defaultBackground } from './artDirectionAllowed'
import { pickHero, pickPattern, pickPrimitives, patternOpacity } from './artDirectionPickers'
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
  PrimitiveId,
  DesignIntentBlock,
  ConceptLanguageId,
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
  designIntent?: DesignIntentBlock
  visualLanguage?: ConceptLanguageId[]
}

export { allowedHeroes, allowedPatterns, defaultPattern, defaultBackground, heroFromDecor, heroFitsLanguage, patternFitsLanguage } from './artDirectionAllowed'
export { pickPrimitives } from './artDirectionPickers'

export function seedFrom(brief: DesignBrief, style: StyleType, templateId?: string): number {
  const raw = `${brief.brandName}|${brief.productName}|${style}|${templateId ?? brief.templateId}|${brief.packagingMode}`
  let h = 2166136261
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function attachArtDirection(ctx: ArtCtx): {
  artDirection: ArtDirectionBlock
  visualConcept: ReturnType<typeof visualConceptFor>
  visualLanguage: ConceptLanguageId[]
  heroGraphic: HeroGraphicBlock
  illustrationSystem: IllustrationBlock
  patternSystem: PatternBlock
  backgroundTreatment: BackgroundTreatment
  density: DensityMap
  crop: CropBlock
} {
  const seed = seedFrom(ctx.brief, ctx.style, ctx.templateId) + (ctx.variationIndex ?? 0) * 17
  const langs = ctx.designIntent
    ? visualLanguageFor(ctx.designIntent, ctx.sector, ctx.brief.subProduct)
    : ctx.visualLanguage
  const directed: ArtCtx = { ...ctx, visualLanguage: langs }
  const family = pickHero(directed)
  const pattern = pickPattern(directed)
  const sideIntentional = ctx.surface === 'box' && (ctx.style === 'luxury' || ctx.style === 'modern' || ctx.style === 'eco')
  const primitives: PrimitiveId[] = pickPrimitives(directed)
  const density: Density = ctx.cue === 'force-overload' ? 'dense' : ctx.density
  const recipe = !ctx.restrainExtras ? studioRecipe(ctx.variationIndex ?? 0) : null
  const cropOpen = ctx.restrainExtras || density === 'sparse' || recipe?.crop === 'open'
  const picked = visualConceptFor(ctx.style, ctx.sector, family, ctx.brief.subProduct, ctx.designIntent)
  const visualLanguage = langs ?? languagesFromConcept({ visualConcept: picked })
  const extraAvoid = (ctx.brief.avoidMotifs ?? []).map((token) => token.trim()).filter(Boolean)
  const visualConcept = {
    ...picked,
    languages: visualLanguage,
    avoid: extraAvoid.length ? [...new Set([...(picked.avoid ?? []), ...extraAvoid])] : picked.avoid,
  }

  return {
    artDirection: {
      vocabulary: visualConcept.id,
      crop: cropOpen ? 'open' : 'tight',
      chrome: chromeForConcept(visualConcept, recipe?.chrome ?? 'full', visualLanguage),
      antiRepetition: { seed, forbidLastFamilies: lastFamilies() },
    },
    visualConcept,
    visualLanguage,
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
