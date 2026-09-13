/**
 * Export manifest — JSON metadata builder for export bundles.
 * Extracted from exportDoc.ts to isolate manifest generation from download logic.
 */
import type { DesignSpec } from '../../types'

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
      { name: `${slug}-dieline.svg`, type: 'dieline' },
      { name: `${slug}-artwork.svg`, type: 'artwork' },
      { name: `${slug}-combined.svg`, type: 'combined' },
      { name: `${slug}-dieline.dxf`, type: 'dxf' },
    ],
  }
  return JSON.stringify(manifest, null, 2)
}
