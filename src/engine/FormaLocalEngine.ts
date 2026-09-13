import type { DesignKind, DesignOverrides, DesignSpec } from '../types'
import { pickTemplate } from './catalog/catalog'
import { buildDieline, resolveDimensions } from './dieline/buildDieline'
import { composeArtwork } from './artwork/composeArtwork'
import { paletteFor } from './artwork/languages'
import { resolveProductLine, sampleCopy } from './artwork/copy'
import { resolveDesignSystem } from './designSystem'
import { runPreflight } from './production/preflight'
import { formaSampleEan, normalizeEan13 } from './barcode'
import { uid } from './fields'
import type { EnginePort, GenerateInput } from './EnginePort'

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
    const copy = {
      brand: input.copyPatch?.brand || brief.brandName || input.prev?.copy.brand || 'FORMA',
      product: resolveProductLine(
        brief,
        input.copyPatch?.product || brief.productName || input.prev?.copy.product || '',
      ),
      tagline: overrides.customTagline || input.copyPatch?.tagline || sample.tagline,
      volume: input.copyPatch?.volume || brief.volume || sample.volume,
      ingredients: input.copyPatch?.ingredients || sample.ingredients,
      warnings: input.copyPatch?.warnings || sample.warnings,
      barcode: brief.barcode,
      manufacturer: brief.manufacturerName,
      address: brief.manufacturerAddress,
      cta: input.copyPatch?.cta || sample.cta,
    }
    overrides.barcodeVisible = true

    const system = resolveDesignSystem(brief, template.structureId)
    const palette = paletteFor(brief, brief.styleType || 'classic', overrides.premium)
    const artwork = composeArtwork(brief, dieline, copy, palette, overrides, input.logoHref, system)
    const layout = {
      widthMm: dieline.dimensions.L,
      depthMm: dieline.dimensions.W,
      heightMm: dieline.dimensions.H,
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
    }
    const preflight = runPreflight(draft, system)

    return {
      id: input.prev?.id ?? uid(),
      kind,
      brief,
      palette,
      layout,
      copy,
      overrides,
      generatedAt: Date.now(),
      revision: (input.prev?.revision ?? 0) + 1,
      templateId: template.id,
      structureId: template.structureId,
      dieline,
      artwork,
      preflight,
    }
  }
}
