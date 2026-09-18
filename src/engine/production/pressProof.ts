/**
 * Item 5 — die-shop pack for one physical SKU.
 * Motor green ≠ board sits. This writes files a kalıphane can cut; it does not cut.
 */
import type { DesignBrief, DesignSpec, DimensionsMm, StyleType } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { isFormaSampleEan } from '../barcode'
import { buildExportBundle } from './exportDoc'
import { pressBleedMm, pressSafeMm } from './pressBoxes'
import { buildDielinePdf, encodePdfBytes } from '../dieline/structure'

export type PressProofRole = 'primary' | 'alternate'

export type PressProofSku = {
  role: PressProofRole
  templateId: string
  dims: DimensionsMm
  brand: string
  product: string
  sector: string
  subProduct: string
  styleType: StyleType
  volume: string
  why: string
}

export const PRESS_PROOF_SKUS: PressProofSku[] = [
  {
    role: 'primary',
    templateId: 'fm-cos-tuck-perfume',
    dims: { L: 70, W: 35, H: 140 },
    brand: 'Aurelia',
    product: 'Noir',
    sector: 'Parfüm',
    subProduct: 'parfüm',
    styleType: 'luxury',
    volume: '50 ml',
    why: 'Native FORMA 13-panel straight tuck. First board to cut.',
  },
  {
    role: 'alternate',
    templateId: 'fm-box-ecma-a60',
    dims: { L: 100, W: 50, H: 150 },
    brand: 'Grapxor',
    product: 'A60',
    sector: 'kozmetik',
    subProduct: 'a60',
    styleType: 'modern',
    volume: '',
    why: 'ECMA A60.20.00.03 vs owner drawing becf-11101.pdf (100×50×150). Cut only to compare that sheet.',
  },
]

export type PressProofFile = { name: string; data: string | Uint8Array }

export type PressProofPack = {
  sku: PressProofSku
  folder: string
  spec: DesignSpec
  files: PressProofFile[]
  shop: {
    netMm: DimensionsMm
    sheetMm: { width: number; height: number }
    grammar?: string
    ecmaCode?: string
    material?: string
    panels: { id: string; kind?: string; w: number; h: number }[]
    glueIds: string[]
    cut: number
    crease: number
    perf: number
    bleedMm: number
    safeMm: number
    barcode: string
    sampleBarcode: boolean
    honesty: string[]
  }
}

function briefFor(sku: PressProofSku): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: sku.brand,
    productName: sku.product,
    sector: sku.sector,
    subProduct: sku.subProduct,
    packagingMode: 'box',
    templateId: sku.templateId,
    dimensionsMm: sku.dims,
    styleType: sku.styleType,
    volume: sku.volume,
  }
}

function folderName(sku: PressProofSku): string {
  const d = sku.dims
  return `${sku.role}-${sku.templateId}-${d.L}x${d.W}x${d.H}`
}

function shopNotes(sku: PressProofSku, spec: DesignSpec): PressProofPack['shop'] {
  const bleedMm = pressBleedMm(spec.dieline)
  const safeMm = pressSafeMm(spec.dieline)
  const sampleBarcode = isFormaSampleEan(spec.copy.barcode) || !!spec.brief.barcodeDefaulted
  const material = spec.dieline.structural?.solved
    ? spec.dieline.structureId === 'tuck-top-auto-bottom'
      ? 'carton-300 0.389 mm — becf-11101.pdf only. Not a mill table for other SKUs.'
      : 'Thickness not specified. Kalıphane picks board. Motor does not invent gsm.'
    : 'Thickness not specified. Kalıphane picks board. Motor does not invent gsm.'
  return {
    netMm: { ...sku.dims },
    sheetMm: { width: spec.dieline.width, height: spec.dieline.height },
    grammar: spec.dieline.structural?.grammar,
    ecmaCode: spec.dieline.structural?.ecmaCode,
    material,
    panels: spec.dieline.panels.map((p) => ({ id: p.id, kind: p.kind, w: p.w, h: p.h })),
    glueIds: spec.dieline.glueIds,
    cut: spec.dieline.cut.length,
    crease: spec.dieline.crease.length,
    perf: spec.dieline.perf?.length ?? 0,
    bleedMm,
    safeMm,
    barcode: spec.copy.barcode,
    sampleBarcode,
    honesty: [
      'PDF/X-4 sRGB OutputIntent. Not FOGRA / GRACoL / a press CMYK condition.',
      'Trapped /False. No trap.',
      'Not veraPDF-certified in this repo.',
      `BleedBox / safe = ${bleedMm} mm / ${safeMm} mm. CUT stays on trim. Bleed is not baked into the knife.`,
      sampleBarcode
        ? `Barcode ${spec.copy.barcode} is a FORMA sample (200…). Not a GS1 GTIN.`
        : `Barcode ${spec.copy.barcode}.`,
      'Motor / preflight green ≠ the board sits. This pack is for one physical cut.',
    ],
  }
}

export function buildPressProofPack(sku: PressProofSku): PressProofPack {
  const spec = new FormaLocalEngine().generate({
    brief: briefFor(sku),
    overridePatch: { printReady: true },
  })
  if (!spec.dieline.consistent) {
    throw new Error(`${sku.templateId}: dieline inconsistent ${spec.dieline.issues.join(' · ')}`)
  }
  if (!spec.preflight.exportOk) {
    const fails = spec.preflight.items.filter((i) => i.status === 'fail').map((i) => i.id)
    throw new Error(`${sku.templateId}: export blocked (${fails.join(', ') || 'exportOk false'})`)
  }
  const bundle = buildExportBundle(spec)
  if (!bundle) throw new Error(`${sku.templateId}: export bundle empty`)

  const slug = (spec.copy.brand || 'grapxor').replace(/\s+/g, '-').toLowerCase()
  const shop = shopNotes(sku, spec)
  const files: PressProofFile[] = [
    { name: `${slug}-knife.svg`, data: bundle.knife },
    { name: `${slug}-knife.dxf`, data: bundle.dxf },
    { name: `${slug}-dieline.svg`, data: bundle.dieline },
    { name: `${slug}-dieline.dxf`, data: bundle.dxf },
    { name: `${slug}-dieline.pdf`, data: encodePdfBytes(buildDielinePdf(spec.dieline, slug)) },
    { name: `${slug}-artwork.svg`, data: bundle.artwork },
    { name: `${slug}-combined.svg`, data: bundle.combined },
    { name: 'shop.json', data: JSON.stringify({ sku, shop }, null, 2) },
  ]
  return { sku, folder: folderName(sku), spec, files, shop }
}

export function buildPressProofKit(): { packs: PressProofPack[]; brief: string } {
  const packs = PRESS_PROOF_SKUS.map(buildPressProofPack)
  return { packs, brief: renderShopBrief(packs) }
}

export function renderShopBrief(packs: PressProofPack[]): string {
  const primary = packs.find((p) => p.sku.role === 'primary') ?? packs[0]!
  const lines: string[] = [
    'GRAPXOR — KALIPHANE / FİZİKSEL PROVA',
    'Motor yeşili ≠ sacda oturur. Bu paket kesim içindir; kesim burada yapılmaz.',
    '',
    `BİRİNCİL SKU: ${primary.sku.templateId}  ${primary.sku.dims.L}×${primary.sku.dims.W}×${primary.sku.dims.H} mm`,
    primary.sku.why,
    `Klasör: ${primary.folder}`,
    '',
    'KESİM İÇİN KULLAN',
    '  dieline.dxf   katmanlar CUT / CREASE / PERF   birim mm ($INSUNITS 4)',
    '  dieline.pdf   PDF/X-4 sRGB   CUT kırmızı  CREASE mavi  PERF magenta',
    '  dieline.svg   yapı neti (kesim siyah, kat kırmızı)',
    '',
    'KESİM İÇİN KULLANMA',
    '  combined.svg  stüdyo prova overlay (3 mm güvenli + 3 mm bleed kılavuz)',
    '  artwork.svg   baskı yüzü — bıçak değil',
    '',
    'KAT SONRASI ÖLÇ',
    `  Kapalı kutu ${primary.sku.dims.L} × ${primary.sku.dims.W} × ${primary.sku.dims.H} mm`,
    '  Ön yüz L×H, kapak L×W, yapıştırma kulağı içte, tuck otursun, dust çarpışmasın',
    '  Toleransı kalıphane koyar. Motor ± mm uydurmaz.',
    '',
    'RENK / KATMAN',
    '  DXF: CUT ACI 1 kırmızı · CREASE ACI 5 mavi · PERF ACI 6 magenta · katman adı + renk',
    '  PDF: CUT 1 0 0 RGB · CREASE 0 0 1 RGB · PERF 0.75 0 0.75 RGB',
    '',
    'DÜRÜSTLÜK',
    ...primary.shop.honesty.map((h) => `  ${h}`),
    '',
  ]
  for (const pack of packs) {
    lines.push(`SKU ${pack.sku.role.toUpperCase()}  ${pack.sku.templateId}`)
    lines.push(`  ${pack.sku.dims.L}×${pack.sku.dims.W}×${pack.sku.dims.H} mm  yapı ${pack.spec.structureId}`)
    if (pack.shop.grammar) lines.push(`  grammar ${pack.shop.grammar}${pack.shop.ecmaCode ? `  ${pack.shop.ecmaCode}` : ''}`)
    lines.push(`  net sac ${pack.shop.sheetMm.width.toFixed(1)} × ${pack.shop.sheetMm.height.toFixed(1)} mm`)
    lines.push(`  CUT ${pack.shop.cut}  CREASE ${pack.shop.crease}  PERF ${pack.shop.perf}`)
    lines.push(`  ${pack.shop.material}`)
    lines.push(`  ${pack.sku.why}`)
    lines.push('')
  }
  lines.push('Yeniden üret: npm run cert:press')
  lines.push('')
  return lines.join('\n')
}
