import type { DesignKind, DesignOverrides, DesignSpec } from '../types'
import {
  applyKnowledgeToBrief,
  applyPlanToSystem,
  captureGenerateDecision,
  createPlan,
  critiquePlan,
  observeFeedback,
  repairPlan,
  scoreDesign,
} from './brain'
import { pickTemplate } from './catalog/catalog'
import { buildDieline, resolveDimensions } from './dieline/buildDieline'
import { findHeroPanel } from './dieline/panelKind'
import { composeArtwork } from './artwork/composeArtwork'
import { paletteFor, varyPalette } from './artwork/languages'
import { paletteFromBrief, ensureAccentContrast } from './artwork/briefPalette'
import { composeBlankFace } from './artwork/composeBlankFace'
import { defaultIngredientClaims, resolveProductLine, sampleCopy } from './artwork/copy'
import { resolveDesignSystem, resolveSector } from './designSystem'
import { runPreflight } from './production/preflight'
import { formaSampleEan, normalizeEan13 } from './barcode'
import { resolveCopyLocale } from './copyLocale'
import { uid } from './fields'
import type { EnginePort, GenerateInput } from './EnginePort'
import { artworkFromDocument, documentFromArtwork, validateDesignDocument } from './document'
import { applyStudioPreflight, composeStudioArtwork, familyOf, hintsFromBrief, hintsFromFamily, resolveDirection, type StudioReport } from './studio'
import { studioHintsFromKnowledge } from './brain/studioKnowledge'

const DEFAULT_OVERRIDES: DesignOverrides = {
  logoScale: 1,
  titleScale: 1,
  premium: false,
  printReady: false,
  paletteShift: 'default',
  barcodeVisible: true,
  customTagline: '',
}

export function defaultOverrides(): DesignOverrides {
  return { ...DEFAULT_OVERRIDES }
}

export class FormaLocalEngine implements EnginePort {
  generate(input: GenerateInput): DesignSpec {
    const template = pickTemplate(input.brief)
    const brief = {
      ...input.brief,
      templateId: template.id,
      packagingMode: input.brief.packagingMode || template.packagingMode,
      dimensionsMm:
        input.brief.dimensionsMm.L > 0 || input.brief.dimensionsMm.H > 0
          ? resolveDimensions(input.brief)
          : { ...template.defaultsMm },
    }
    if (!brief.styleType) brief.styleType = 'luxury'
    brief.copyLocale = resolveCopyLocale(brief)

    const overrides: DesignOverrides = {
      ...(input.prev?.overrides ?? defaultOverrides()),
      ...input.overridePatch,
    }
    if (overrides.paletteShift === 'gold') overrides.premium = true

    const dieline = buildDieline(template.structureId, brief)
    const kind: DesignKind = template.packagingMode === 'label' ? 'label' : 'packaging'
    const sample = sampleCopy(brief)
    if (brief.barcode.trim()) {
      brief.barcode = normalizeEan13(brief.barcode)
    } else {
      brief.barcode = formaSampleEan(`${brief.brandName}|${brief.productName}|${brief.volume}`)
      brief.barcodeDefaulted = true
    }
    if (!brief.manufacturerName.trim()) {
      brief.manufacturerName = `${brief.brandName || 'FORMA'} Üretim A.Ş.`
      brief.manufacturerDefaulted = true
    }
    if (!brief.manufacturerAddress.trim()) {
      brief.manufacturerAddress = 'Örnek Mah. No:1, 34000 İstanbul, TR'
      brief.addressDefaulted = true
    }
    if (!brief.ingredientClaims?.trim()) {
      const autoClaims = defaultIngredientClaims(brief)
      if (autoClaims) brief.ingredientClaims = autoClaims
    }
    const copy = {
      brand: input.copyPatch?.brand || brief.brandName || input.prev?.copy.brand || 'FORMA',
      product: resolveProductLine(
        brief,
        input.copyPatch?.product || brief.productName || input.prev?.copy.product || '',
      ),
      tagline: overrides.customTagline || input.copyPatch?.tagline || input.llmCopy?.tagline || sample.tagline,
      volume: input.copyPatch?.volume || brief.volume || sample.volume,
      ingredients: input.copyPatch?.ingredients || input.llmCopy?.ingredients || sample.ingredients,
      warnings: input.copyPatch?.warnings || input.llmCopy?.warnings || sample.warnings,
      barcode: brief.barcode,
      manufacturer: brief.manufacturerName,
      address: brief.manufacturerAddress,
      cta: input.copyPatch?.cta || sample.cta,
    }
    overrides.barcodeVisible = true

    const style = brief.styleType || 'luxury'
    const styleChanged = !!input.prev?.designPlan && input.prev.designPlan.style !== style
    if (styleChanged && input.overridePatch?.directorCue == null) overrides.directorCue = undefined
    const variationIndex = Math.max(
      0,
      Math.floor(overrides.variationIndex ?? input.prev?.designPlan?.variationIndex ?? 0),
    )
    const blankCanvas = !!overrides.blankCanvas
    const wrap = /wrap/i.test(brief.templateId) || template.structureId === 'wrap-label'
    const blankFace = blankCanvas
      ? composeBlankFace(brief, resolveSector(brief), {
          grammar: brief.packagingMode === 'label' ? 'label' : 'box',
          wrap,
          recipeId: overrides.motifRecipeId,
          premium: overrides.premium,
        })
      : null
    // Active, validated knowledge → KNOWLEDGE_DERIVED brief inputs. Empty store → same brief.
    const knowledge = applyKnowledgeToBrief(brief)
    const planBrief = knowledge.brief
    const designPlan = createPlan({
      brief: planBrief,
      template,
      style,
      prev: styleChanged ? undefined : input.prev?.designPlan,
      cue: overrides.directorCue || planBrief.directorCue,
      variationIndex,
      forceHero: blankCanvas ? (overrides.heroFamily ?? blankFace?.finish.heroFamily) : overrides.heroFamily,
      blankCanvas,
      backgroundTreatment: blankFace?.finish.backgroundTreatment,
    })
    if (designPlan.cue === 'luxury-tighten' && (overrides.titleScale || 1) === 1) {
      overrides.titleScale = 1.1
    }

    const palette = ensureAccentContrast(
      varyPalette(
        blankCanvas
          ? (blankFace?.palette ?? paletteFromBrief(brief, style, overrides.premium))
          : paletteFor(brief, brief.styleType || 'classic', overrides.premium),
        variationIndex,
      ),
    )
    const layout = {
      widthMm: dieline.dimensions.L,
      depthMm: dieline.dimensions.W,
      heightMm: dieline.dimensions.H,
    }

    const studioOn = !!overrides.studio
    const hero = findHeroPanel(dieline.panels)
    const studioKnowledge = studioOn ? studioHintsFromKnowledge(brief) : null
    const paint = (plan: typeof designPlan) => {
      const system = applyPlanToSystem(
        resolveDesignSystem(brief, template.structureId, { blankCanvas }),
        plan,
      )
      let artwork
      let studio: StudioReport | undefined
      if (studioOn) {
        // Design Brain → direction (closed vocabulary) → deterministic studio painters.
        const surface = kind === 'label' ? 'label' : 'box'
        const familyHint = hintsFromFamily(planBrief.studioFamily, surface)
        const direction = resolveDirection({
          brief: planBrief,
          sector: resolveSector(brief),
          style,
          surface,
          faceW: hero?.w ?? dieline.dimensions.L,
          faceH: hero?.h ?? dieline.dimensions.H,
          palette,
          locale: brief.copyLocale ?? 'tr',
          variationIndex,
          copy: { brand: copy.brand, product: copy.product, tagline: copy.tagline, volume: copy.volume },
          hints: [
            hintsFromBrief(planBrief, resolveSector(brief), surface),
            ...(studioKnowledge?.hints ?? []),
            ...(overrides.direction ? [overrides.direction] : []),
            ...(familyHint ? [familyHint] : []),
          ],
        })
        const composed = composeStudioArtwork({ brief, dieline, copy, direction, system })
        artwork = composed.artwork
        studio = composed.report
      } else {
        artwork = composeArtwork(brief, dieline, copy, palette, overrides, input.logoHref, system, plan)
      }
      const draft = {
        brief,
        copy,
        dieline,
        layout,
        overrides,
        kind,
        structureId: template.structureId,
        palette,
        artwork,
        designPlan: plan,
      }
      const basePreflight = runPreflight(draft, system)
      const preflight = studio ? applyStudioPreflight(basePreflight, studio) : basePreflight
      const heroId = hero?.id
      const faceLayer = artwork.layers.find(
        (l: { panelId: string }) => l.panelId === heroId || l.panelId === 'front' || l.panelId === 'label' || l.panelId === 'trayFront',
      )
      const critique = studioOn
        ? { ...critiquePlan(plan, scoreDesign({ artwork, preflight, copy, kind }, plan), faceLayer?.markup), needsRepair: false }
        : critiquePlan(plan, scoreDesign({ artwork, preflight, copy, kind }, plan), faceLayer?.markup)
      return { artwork, preflight, critique, plan, studio }
    }

    let pack = paint(designPlan)
    if (!studioOn && pack.critique.needsRepair) {
      pack = paint(repairPlan(pack.plan, pack.critique))
      pack.critique = { ...pack.critique, repaired: true, needsRepair: false }
    }
    if (!studioOn && overrides.heroFamily && pack.plan.heroGraphic.family !== overrides.heroFamily) {
      pack = paint({
        ...pack.plan,
        heroGraphic: { ...pack.plan.heroGraphic, family: overrides.heroFamily },
      })
    }

    const id = input.prev?.id ?? uid()
    const generatedAt = Date.now()
    const document = documentFromArtwork(id, `${copy.brand} · ${copy.product}`, dieline, pack.artwork, generatedAt)
    const validation = validateDesignDocument(document)
    if (!validation.valid) {
      throw new Error(`Invalid design document: ${validation.issues.map((issue) => issue.code).join(', ')}`)
    }
    const artwork = artworkFromDocument(document)
    const revision = (input.prev?.revision ?? 0) + 1
    const decision = captureGenerateDecision({
      designId: id,
      revision,
      brief: planBrief,
      plan: pack.plan,
      critique: pack.critique,
      preflight: pack.preflight,
      prev: input.prev,
      overridePatch: input.overridePatch,
      copyPatch: input.copyPatch,
      feedback: input.feedback,
      knowledgeVersion: knowledge.version,
      appliedKnowledge: [...knowledge.applied, ...(studioKnowledge?.applied ?? [])],
      feedbackFromLlm: input.feedbackFromLlm,
      studio: pack.studio
        ? {
            archetype: pack.studio.direction.archetype,
            background: pack.studio.direction.background,
            temperament: pack.studio.direction.temperament,
            typePairing: pack.studio.direction.typePairing,
            source: pack.studio.direction.source,
            collisions: pack.studio.collisions.length,
            minTextMm: pack.studio.minTextMm,
          }
        : undefined,
      studioLedger: pack.studio
        ? { collisions: pack.studio.collisions, outOfBounds: pack.studio.outOfBounds, minTextMm: pack.studio.minTextMm }
        : undefined,
      directionFromLlm: pack.studio?.direction.source === 'llm',
    })
    if (decision && input.feedback?.length) {
      // Revision talk becomes learning evidence — observation only, never a rule.
      try {
        observeFeedback(decision, input.feedback)
      } catch {
        /* learning is an enhancement */
      }
    }

    const studioFamily = pack.studio ? familyOf(pack.studio.direction.archetype, brief.studioFamily) : undefined

    return {
      id,
      kind,
      brief: studioFamily ? { ...brief, studioFamily } : brief,
      palette,
      layout,
      copy,
      overrides,
      generatedAt,
      revision,
      templateId: template.id,
      structureId: template.structureId,
      dieline,
      document,
      artwork,
      preflight: pack.preflight,
      designPlan: pack.plan,
      critique: pack.critique,
      designCritique: decision?.critiques,
      appliedKnowledge: knowledge.applied.length || studioKnowledge?.applied.length ? [...knowledge.applied, ...(studioKnowledge?.applied ?? [])] : undefined,
      studio: pack.studio,
      copyLocale: brief.copyLocale,
    }
  }
}
