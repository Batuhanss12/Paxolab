import type { DesignSpec } from '../../types'
import { artworkMarkup, clipDefs, renderArtworkDoc } from '../artwork/composeArtwork'
import { isFormaSampleEan, isInventedRegisteredGtin } from '../barcode'
import { noteDownload, noteExport } from '../brain/OutcomeTracker'
import { dielineTechMarkup, renderKnifeDoc, renderStructureDoc } from '../dieline/renderDielineSvg'
import { artworkFromDocument } from '../document'
import { STUDIO_EXPORT_FONT_COMMENT, withStudioExportFonts } from '../studio/text'
import { pressBleedMm, pressProofSvgComment, pressSafeMm } from './pressBoxes'
import { buildDielineDxf } from './dxf'
import { buildManifest } from './exportManifest'
import { buildDielinePdf, encodePdfBytes } from '../dieline/structure/pdfDieline'
import { zipStore } from './zipStore'

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;')
}

export function buildCombinedSvg(spec: DesignSpec): string | null {
  if (!spec.preflight.exportOk) return null
  if (spec.preflight.collisions || !spec.dieline.consistent) return null
  if (isInventedRegisteredGtin(spec.copy.barcode, spec.brief.barcodeDefaulted)) return null
  const artwork = artworkFromDocument(spec.document)
  const art = withStudioExportFonts(artworkMarkup(artwork))
  const pad = 8
  const w = spec.dieline.width + pad * 2
  const h = spec.dieline.height + pad * 2
  const { cut, crease, perf } = dielineTechMarkup(spec.dieline, pad, 'doc')
  const sampleNote = isFormaSampleEan(spec.copy.barcode)
    ? '\n  <!-- Grapxor: sample barcode 200… is not a GS1 GTIN. Replace before production. -->'
    : ''
  const qrNote = art.includes('data-art="qr"')
    ? '\n  <!-- Grapxor: data-art=qr is a sample placeholder, not ISO/IEC 18004. -->'
    : ''
  const fontNote = art.includes('studio-fonts-subset') ? `\n  <!-- ${STUDIO_EXPORT_FONT_COMMENT} -->` : ''
  const proofNote = spec.overrides.printReady ? `\n  <!-- ${pressProofSvgComment(spec.dieline)} -->` : ''
  const proofPanels = spec.overrides.printReady
    ? spec.dieline.panels.filter((p) => !spec.dieline.glueIds.includes(p.id))
    : []
  const inset = pressSafeMm(spec.dieline)
  const bleedMm = pressBleedMm(spec.dieline)
  const safe = proofPanels
    .map((p) => {
      return `<rect x="${p.x + pad + inset}" y="${p.y + pad + inset}" width="${Math.max(0, p.w - inset * 2)}" height="${Math.max(0, p.h - inset * 2)}" fill="none" stroke="rgba(90,180,120,0.32)" stroke-width="0.15" stroke-dasharray="1 0.8" data-proof="safe" />`
    })
    .join('')
  const bleed = proofPanels
    .map((p) => {
      return `<rect x="${p.x + pad - bleedMm}" y="${p.y + pad - bleedMm}" width="${p.w + bleedMm * 2}" height="${p.h + bleedMm * 2}" fill="none" stroke="rgba(200,120,80,0.28)" stroke-width="0.15" stroke-dasharray="1.2 0.9" data-proof="bleed" />`
    })
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm">${sampleNote}${qrNote}${fontNote}${proofNote}
  <title>${escapeXml(spec.copy.brand)} — Grapxor combined</title>
  <defs>${clipDefs(spec.dieline)}</defs>
  <g transform="translate(${pad} ${pad})">${art}</g>
  ${bleed ? `<g data-proof="bleed-set">${bleed}</g>` : ''}
  ${safe ? `<g data-proof="safe-set">${safe}</g>` : ''}
  ${perf}
  ${crease}
  ${cut}
</svg>`
}

export function buildExportSvg(spec: DesignSpec): string | null {
  return buildCombinedSvg(spec)
}

export function buildExportBundle(
  spec: DesignSpec,
): { dieline: string; knife: string; artwork: string; combined: string; dxf: string } | null {
  const combined = buildCombinedSvg(spec)
  if (!combined) return null
  const slug = spec.copy.brand || 'forma'
  return {
    dieline: renderStructureDoc(spec.dieline, slug),
    knife: renderKnifeDoc(spec.dieline, slug),
    artwork: renderArtworkDoc(spec.dieline, artworkFromDocument(spec.document), slug),
    combined,
    dxf: buildDielineDxf(spec.dieline),
  }
}

export function buildZipReadme(spec: DesignSpec): string {
  const d = spec.dieline.dimensions
  const bleed = pressBleedMm(spec.dieline)
  const safe = pressSafeMm(spec.dieline)
  return [
    'FORXA teslim ZIP',
    '',
    'KESİM İÇİN KULLAN',
    '  *-knife.svg   CUT / CREASE / PERF katmanları, mm',
    '  *-knife.dxf   aynı geometri, CUT ACI 1 kırmızı · CREASE ACI 5 mavi · PERF ACI 6 magenta',
    '  *-dieline.pdf PDF/X-4 sRGB · CUT kırmızı · CREASE mavi · PERF magenta',
    '  *-dieline.svg yapı neti (panel etiketli)',
    '',
    'KESİM İÇİN KULLANMA',
    '  *-combined.svg  stüdyo prova — 3 mm güvenli + bleed kılavuz dikdörtgen',
    '  *-artwork.svg   baskı yüzü, bıçak değil',
    '',
    `Kapalı kutu ${d.L} × ${d.W || '—'} × ${d.H} mm. CUT trim’de. ${bleed} mm bleed ve ${safe} mm güvenli kılavuzdur; bıçağa işlenmez.`,
    'Trap yok. FOGRA değil. Motor yeşili ≠ sacda oturur.',
    '',
  ].join('\n')
}

export type UserExportFile = { name: string; data: string | Uint8Array }

export function buildUserExportFiles(spec: DesignSpec): UserExportFile[] | null {
  const bundle = buildExportBundle(spec)
  if (!bundle) return null
  const slug = (spec.copy.brand || 'forma').replace(/\s+/g, '-').toLowerCase()
  return [
    { name: `${slug}-knife.svg`, data: bundle.knife },
    { name: `${slug}-knife.dxf`, data: bundle.dxf },
    { name: `${slug}-dieline.svg`, data: bundle.dieline },
    { name: `${slug}-dieline.pdf`, data: encodePdfBytes(buildDielinePdf(spec.dieline, slug)) },
    { name: `${slug}-artwork.svg`, data: bundle.artwork },
    { name: `${slug}-combined.svg`, data: bundle.combined },
    { name: 'shop.json', data: buildManifest(spec) },
    { name: 'OKU.txt', data: buildZipReadme(spec) },
  ]
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadSvg(spec: DesignSpec): boolean {
  const svg = buildCombinedSvg(spec)
  if (!svg) return false
  triggerDownload(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${spec.copy.brand || 'forma'}-combined.svg`)
  noteDownload(spec.id)
  return true
}

export function downloadDxf(spec: DesignSpec): boolean {
  if (!spec.preflight.exportOk) return false
  const slug = (spec.copy.brand || 'forma').replace(/\s+/g, '-').toLowerCase()
  triggerDownload(new Blob([buildDielineDxf(spec.dieline)], { type: 'application/dxf;charset=utf-8' }), `${slug}-dieline.dxf`)
  noteDownload(spec.id)
  return true
}

export function downloadZip(spec: DesignSpec): boolean {
  const files = buildUserExportFiles(spec)
  if (!files) return false
  const slug = (spec.copy.brand || 'forma').replace(/\s+/g, '-').toLowerCase()
  triggerDownload(zipStore(files), `${slug}-forma.zip`)
  noteExport(spec.id)
  return true
}

export function printPdf(spec: DesignSpec): boolean {
  const svg = buildCombinedSvg(spec)
  if (!svg) return false
  const win = window.open('', '_blank', 'noopener,width=900,height=700')
  if (!win) return false
  win.document.write(`<!doctype html><html><head><title>${spec.copy.brand} Grapxor</title>
    <style>body{margin:0;background:#fff} svg{width:100%;height:auto}</style></head>
    <body>${svg}</body></html>`)
  win.document.close()
  win.focus()
  win.print()
  noteDownload(spec.id)
  return true
}
