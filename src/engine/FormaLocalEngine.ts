import type { DesignKind, DesignOverrides, DesignSpec } from '../types'
import { applyPlanToSystem, createPlan, critiquePlan, repairPlan, scoreDesign } from './brain'
import { pickTemplate } from './catalog/catalog'
import { buildDieline, resolveDimensions } from './dieline/buildDieline'
import { composeArtwork } from './artwork/composeArtwork'
import { paletteFor, varyPalette } from './artwork/languages'
import { defaultIngredientClaims, resolveProductLine, sampleCopy } from './artwork/copy'
import { resolveDesignSystem } from './designSystem'
import { runPreflight } from './production/preflight'
import { formaSampleEan, normalizeEan13 } from './barcode'
import { resolveCopyLocale } from './copyLocale'
import { uid } from './fields'
import type { EnginePort, GenerateInput } from './EnginePort'
import { artworkFromDocument, documentFromArtwork, validateDesignDocument } from './document'

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
    const designPlan = createPlan({
      brief,
      template,
      style,
      prev: styleChanged ? undefined : input.prev?.designPlan,
      cue: overrides.directorCue,
      variationIndex,
      forceHero: overrides.heroFamily,
    })
    if (designPlan.cue === 'luxury-tighten' && (overrides.titleScale || 1) === 1) {
      overrides.titleScale = 1.1
    }

    const palette = varyPalette(
      paletteFor(brief, brief.styleType || 'classic', overrides.premium),
      variationIndex,
    )
    const layout = {
      widthMm: dieline.dimensions.L,
      depthMm: dieline.dimensions.W,
      heightMm: dieline.dimensions.H,
    }

    const paint = (plan: typeof designPlan) => {
      const system = applyPlanToSystem(resolveDesignSystem(brief, template.structureId), plan)
      const artwork = composeArtwork(brief, dieline, copy, palette, overrides, input.logoHref, system, plan)
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
      const preflight = runPreflight(draft, system)
      const faceLayer = artwork.layers.find((l: { panelId: string }) => l.panelId === 'front' || l.panelId === 'label' || l.panelId === 'trayFront')
      const critique = critiquePlan(plan, scoreDesign({ artwork, preflight, copy, kind }, plan), faceLayer?.markup)
      return { artwork, preflight, critique, plan }
    }

    let pack = paint(designPlan)
    if (pack.critique.needsRepair) {
      pack = paint(repairPlan(pack.plan, pack.critique))
      pack.critique = { ...pack.critique, repaired: true, needsRepair: false }
    }
    if (overrides.heroFamily && pack.plan.heroGraphic.family !== overrides.heroFamily) {
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

    return {
      id,
      kind,
      brief,
      palette,
      layout,
      copy,
      overrides,
      generatedAt,
      revision: (input.prev?.revision ?? 0) + 1,
      templateId: template.id,
      structureId: template.structureId,
      dieline,
      document,
      artwork,
      preflight: pack.preflight,
      designPlan: pack.plan,
      critique: pack.critique,
      copyLocale: brief.copyLocale,
    }
  }
}
