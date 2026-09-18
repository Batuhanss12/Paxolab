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
  const slug = spec.copy.brand || 'grapxor'
  return {
    dieline: renderStructureDoc(spec.dieline, slug),
    knife: renderKnifeDoc(spec.dieline, slug),
    artwork: renderArtworkDoc(spec.dieline, artworkFromDocument(spec.document), slug, { withCut: spec.kind === 'label' }),
    combined,
    dxf: buildDielineDxf(spec.dieline),
  }
}

export function buildZipReadme(spec: DesignSpec): string {
  const d = spec.dieline.dimensions
  const bleed = pressBleedMm(spec.dieline)
  const safe = pressSafeMm(spec.dieline)
  if (spec.kind === 'label') {
    return [
      'Grapxor teslim paketi',
      '',
      'TASARIM',
      '  *-tasarim.svg   baskı yüzü, vektör. Yazılar outline — hiçbir font kurulu olmak zorunda değil.',
      '                  İçinde iki katman var: ARTWORK (baskı) ve CUT (kesim hattı).',
      '',
      `Etiket ${d.L} × ${d.H} mm. CUT trim'de. ${bleed} mm taşma payı ve ${safe} mm güvenli alan kılavuzdur; bıçağa işlenmez.`,
      'Trap yok. FOGRA değil. Motor yeşili ≠ sacda oturur.',
      '',
    ].join('\n')
  }
  return [
    /*
     * One name on the one file the customer forwards to a printer.
     *
     * This bundle used to introduce itself as "FORXA teslim ZIP", arrive as `<brand>-forma.zip`,
     * carry `forma-export/v1` in its manifest and `Grapxor` in its SVG comments. Four names, three
     * of which the customer has never seen, inside the artefact they pay for and hand to a
     * supplier. Whatever the repository is called, the product is Grapxor.
     */
    'Grapxor teslim paketi',
    '',
    'KESİM İÇİN KULLAN',
    '  *-knife.svg   CUT / CREASE / PERF katmanları, mm',
    '  *-knife.dxf   aynı geometri, CUT ACI 1 kırmızı · CREASE ACI 5 mavi · PERF ACI 6 magenta',
    '  *-dieline.pdf PDF/X-4 sRGB · CUT kırmızı · CREASE mavi · PERF magenta',
    '  *-dieline.svg yapı neti (panel etiketli)',
    '',
    'KESİM İÇİN KULLANMA',
    '  *-combined.svg  stüdyo prova — 3 mm güvenli + bleed kılavuz dikdörtgen',
    '  *-tasarim.svg   baskı yüzü, bıçak değil. Yazılar outline.',
    '',
    `Kapalı kutu ${d.L} × ${d.W || '—'} × ${d.H} mm. CUT trim’de. ${bleed} mm bleed ve ${safe} mm güvenli kılavuzdur; bıçağa işlenmez.`,
    'Trap yok. FOGRA değil. Motor yeşili ≠ sacda oturur.',
    '',
  ].join('\n')
}

export type UserExportFile = { name: string; data: string | Uint8Array }

/**
 * What goes in the bundle, which is not the same question for a label and a carton.
 *
 * A carton is folded from a flat sheet, so its delivery is a knife file, a dieline and a DXF, and
 * the artwork is one of six panels on that sheet. A label is not folded: it is one printed face,
 * and the owner's point was that shipping it with a four-file dieline set is noise — the design in
 * vector form is the deliverable.
 *
 * Nothing is actually lost. `renderArtworkDoc` writes the knife contour into the label's own file
 * as a `CUT` layer, which is what a label press expects anyway, and a die-cut disc or oval still
 * reaches the printer with its contour.
 */
export function buildUserExportFiles(spec: DesignSpec): UserExportFile[] | null {
  const bundle = buildExportBundle(spec)
  if (!bundle) return null
  const slug = (spec.copy.brand || 'grapxor').replace(/\s+/g, '-').toLowerCase()
  const shared: UserExportFile[] = [
    { name: `${slug}-tasarim.svg`, data: bundle.artwork },
    { name: 'shop.json', data: buildManifest(spec) },
    { name: 'OKU.txt', data: buildZipReadme(spec) },
  ]
  if (spec.kind === 'label') return shared
  return [
    { name: `${slug}-knife.svg`, data: bundle.knife },
    { name: `${slug}-knife.dxf`, data: bundle.dxf },
    { name: `${slug}-dieline.svg`, data: bundle.dieline },
    { name: `${slug}-dieline.pdf`, data: encodePdfBytes(buildDielinePdf(spec.dieline, slug)) },
    { name: `${slug}-combined.svg`, data: bundle.combined },
    ...shared,
  ]
}

/**
 * Delivery files with every glyph converted to a path.
 *
 * The printed faces must not depend on fonts installed where the file is opened — `local()`
 * declarations silently fall back and shift every fitted line. The dieline/knife files carry no
 * studio type, so they pass through untouched.
 */
/** The files that carry the printed face, and therefore must have their glyphs outlined. */
const PRINTED_FACE = /-(tasarim|artwork|combined)\.svg$/

export async function buildOutlinedExportFiles(spec: DesignSpec): Promise<UserExportFile[] | null> {
  const files = buildUserExportFiles(spec)
  if (!files) return null
  const { outlineSvgText } = await import('../studio/outlineText')
  return Promise.all(
    files.map(async (file) => {
      // Matched by *what the file is*, not by a name. Renaming the label's artwork to `-tasarim.svg`
      // slipped past an `(artwork|combined)` pattern and shipped a label whose type still depended
      // on installed fonts — the exact failure outlining exists to prevent.
      if (!PRINTED_FACE.test(file.name) || typeof file.data !== 'string') return file
      const { markup } = await outlineSvgText(file.data)
      return { ...file, data: markup }
    }),
  )
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
  triggerDownload(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${spec.copy.brand || 'grapxor'}-combined.svg`)
  noteDownload(spec.id)
  return true
}

export function downloadDxf(spec: DesignSpec): boolean {
  if (!spec.preflight.exportOk) return false
  const slug = (spec.copy.brand || 'grapxor').replace(/\s+/g, '-').toLowerCase()
  triggerDownload(new Blob([buildDielineDxf(spec.dieline)], { type: 'application/dxf;charset=utf-8' }), `${slug}-dieline.dxf`)
  noteDownload(spec.id)
  return true
}

export async function downloadZip(spec: DesignSpec): Promise<boolean> {
  const files = await buildOutlinedExportFiles(spec)
  if (!files) return false
  const slug = (spec.copy.brand || 'grapxor').replace(/\s+/g, '-').toLowerCase()
  triggerDownload(zipStore(files), `${slug}-grapxor.zip`)
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
