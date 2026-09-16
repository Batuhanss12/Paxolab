/**
 * Export manifest — JSON metadata builder for export bundles.
 * Extracted from exportDoc.ts to isolate manifest generation from download logic.
 */
import type { DesignSpec } from '../../types'
import { pressBleedMm, pressSafeMm } from './pressBoxes'

/** Build a JSON manifest with project metadata for export bundles. */
export function buildManifest(spec: DesignSpec): string {
  const slug = (spec.copy.brand || 'forma').replace(/\s+/g, '-').toLowerCase()
  const manifest = {
    schema: 'forma-export/v1',
    generatedAt: new Date().toISOString(),
    project: {
      id: spec.id,
      brand: spec.copy.brand,
      product: spec.copy.product,
      volume: spec.copy.volume,
      sector: spec.brief.sector,
      subProduct: spec.brief.subProduct,
      styleType: spec.brief.styleType,
      packagingMode: spec.brief.packagingMode,
      copyLocale: spec.copyLocale ?? spec.brief.copyLocale ?? 'tr',
    },
    dimensions: {
      widthMm: spec.layout.widthMm,
      depthMm: spec.layout.depthMm,
      heightMm: spec.layout.heightMm,
      unit: 'mm',
    },
    dieline: {
      structureId: spec.dieline.structureId,
      width: spec.dieline.width,
      height: spec.dieline.height,
      panelCount: spec.dieline.panels.length,
      cutCount: spec.dieline.cut.length,
      creaseCount: spec.dieline.crease.length,
      consistent: spec.dieline.consistent,
    },
    pdf: {
      profile: 'PDF/X-4',
      outputIntent: 'sRGB IEC61966-2.1',
      bleedMm: pressBleedMm(spec.dieline),
      safeMm: pressSafeMm(spec.dieline),
      trapped: false,
    },
    preflight: {
      exportOk: spec.preflight.exportOk,
      blocking: spec.preflight.blocking,
      collisions: spec.preflight.collisions,
      itemSummary: spec.preflight.items.map((i) => ({ id: i.id, status: i.status })),
    },
    copy: {
      tagline: spec.copy.tagline,
      ingredients: spec.copy.ingredients,
      warnings: spec.copy.warnings,
      barcode: spec.copy.barcode,
      manufacturer: spec.copy.manufacturer,
    },
    files: [
      { name: `${slug}-knife.svg`, type: 'knife' },
      { name: `${slug}-knife.dxf`, type: 'dxf' },
      { name: `${slug}-dieline.svg`, type: 'dieline' },
      { name: `${slug}-dieline.pdf`, type: 'dieline-pdf' },
      { name: `${slug}-artwork.svg`, type: 'artwork' },
      { name: `${slug}-combined.svg`, type: 'combined' },
      { name: 'OKU.txt', type: 'readme' },
    ],
  }
  return JSON.stringify(manifest, null, 2)
}
