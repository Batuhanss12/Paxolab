/**
 * exportDoc — SVG builders + download adapters for browser export.
 * ZIP format implementation extracted to zipStore.ts.
 * Manifest generation extracted to exportManifest.ts.
 */
import type { DesignSpec } from '../../types'
import { artworkMarkup, clipDefs, renderArtworkDoc } from '../artwork/composeArtwork'
import { isFormaSampleEan, isInventedRegisteredGtin } from '../barcode'
import { renderStructureDoc } from '../dieline/renderDielineSvg'
import { buildDielinePdf, encodePdfBytes } from '../dieline/structure/pdfDieline'
import { buildDielineDxf } from './dxf'
import { artworkFromDocument } from '../document'
import { pressBleedMm, pressProofSvgComment, pressSafeMm } from './pressBoxes'
import { zipStore } from './zipStore'

function escapeXml(value: string): string {
  return value.replace(/&/g, '&').replace(/</g, '<')
}

export function buildCombinedSvg(spec: DesignSpec): string | null {
  if (spec.preflight.collisions || !spec.dieline.consistent) return null
  if (isInventedRegisteredGtin(spec.copy.barcode, spec.brief.barcodeDefaulted)) return null
  const artwork = artworkFromDocument(spec.document)
  const pad = 8
  const w = spec.dieline.width + pad * 2
  const h = spec.dieline.height + pad * 2
  const cut = spec.dieline.cut
    .map((ring, index) => {
      const d = ring.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x + pad} ${p.y + pad}`).join(' ') + ' Z'
      return `<path d="${d}" fill="none" stroke="#000" stroke-width="0.5" stroke-linejoin="miter" data-type="cut" data-id="cut-${index}" />`
    })
    .join('')
  const crease = spec.dieline.crease
    .map(
      ([a, b], index) =>
        `<line x1="${a.x + pad}" y1="${a.y + pad}" x2="${b.x + pad}" y2="${b.y + pad}" stroke="#c00" stroke-width="0.35" stroke-dasharray="2 1.1" data-type="crease" data-id="crease-${index}" />`,
    )
    .join('')
  const perf = (spec.dieline.perf ?? [])
    .map((ring, index) => {
      const d = ring.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x + pad} ${p.y + pad}`).join(' ')
      return `<path d="${d}" fill="none" stroke="#c000c0" stroke-width="0.35" stroke-dasharray="1.1 0.7" data-type="perf" data-id="perf-${index}" />`
    })
    .join('')
  const sampleNote = isFormaSampleEan(spec.copy.barcode)
    ? '\n  <!-- FORMA: sample barcode 200… is not a GS1 GTIN. Replace before production. -->'
    : ''
  const safeMm = pressSafeMm(spec.dieline)
  const bleedMm = pressBleedMm(spec.dieline)
  const proofNote = `\n  <!-- ${pressProofSvgComment(spec.dieline)} -->`
  const proofPanels = spec.overrides.printReady
    ? spec.dieline.panels.filter((p) => !spec.dieline.glueIds.includes(p.id))
    : []
  const safe = proofPanels
    .map((p) => {
      return `<rect x="${p.x + pad + safeMm}" y="${p.y + pad + safeMm}" width="${Math.max(0, p.w - safeMm * 2)}" height="${Math.max(0, p.h - safeMm * 2)}" fill="none" stroke="rgba(90,180,120,0.32)" stroke-width="0.15" stroke-dasharray="1 0.8" data-proof="safe" />`
    })
    .join('')
  const bleed = proofPanels
    .map((p) => {
      return `<rect x="${p.x + pad - bleedMm}" y="${p.y + pad - bleedMm}" width="${p.w + bleedMm * 2}" height="${p.h + bleedMm * 2}" fill="none" stroke="rgba(200,120,80,0.28)" stroke-width="0.15" stroke-dasharray="1.2 0.9" data-proof="bleed" />`
    })
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm">${sampleNote}${proofNote}
  <title>${escapeXml(spec.copy.brand)} — FORMA combined</title>
  <defs>${clipDefs(spec.dieline)}</defs>
  <g transform="translate(${pad} ${pad})">${artworkMarkup(artwork)}</g>
  ${bleed ? `<g data-proof="bleed-set">${bleed}</g>` : ''}
  ${safe ? `<g data-proof="safe-set">${safe}</g>` : ''}
  ${crease}
  ${perf}
  ${cut}
</svg>`
}

export function buildExportSvg(spec: DesignSpec): string | null {
  return buildCombinedSvg(spec)
}

export function buildExportBundle(
  spec: DesignSpec,
): { dieline: string; artwork: string; combined: string; dxf: string; pdf: Uint8Array } | null {
  const combined = buildCombinedSvg(spec)
  if (!combined) return null
  const slug = spec.copy.brand || 'forma'
  return {
    dieline: renderStructureDoc(spec.dieline, slug),
    artwork: renderArtworkDoc(spec.dieline, artworkFromDocument(spec.document), slug),
    combined,
    dxf: buildDielineDxf(spec.dieline),
    pdf: encodePdfBytes(buildDielinePdf(spec.dieline, `${spec.copy.brand} FORXA`)),
  }
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
  return true
}

/** Render SVG to PNG at given scale (default 2x for retina quality). */
export async function downloadPng(spec: DesignSpec, scale = 2): Promise<boolean> {
  const svg = buildCombinedSvg(spec)
  if (!svg) return false
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('image load failed'))
      image.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth * scale
    canvas.height = img.naturalHeight * scale
    const ctx = canvas.getContext('2d')
    if (!ctx) return false
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    await new Promise<void>((resolve) => {
      canvas.toBlob((pngBlob) => {
        if (pngBlob) {
          triggerDownload(pngBlob, `${spec.copy.brand || 'forma'}-combined.png`)
        }
        resolve()
      }, 'image/png')
    })
    return true
  } catch {
    return false
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function downloadDxf(spec: DesignSpec): boolean {
  if (!spec.preflight.exportOk) return false
  const slug = (spec.copy.brand || 'forma').replace(/\s+/g, '-').toLowerCase()
  triggerDownload(new Blob([buildDielineDxf(spec.dieline)], { type: 'application/dxf;charset=utf-8' }), `${slug}-dieline.dxf`)
  return true
}

export function downloadZip(spec: DesignSpec): boolean {
  const bundle = buildExportBundle(spec)
  if (!bundle) return false
  const slug = (spec.copy.brand || 'forma').replace(/\s+/g, '-').toLowerCase()
  const blob = zipStore([
    { name: `${slug}-dieline.svg`, data: bundle.dieline },
    { name: `${slug}-artwork.svg`, data: bundle.artwork },
    { name: `${slug}-combined.svg`, data: bundle.combined },
    { name: `${slug}-dieline.dxf`, data: bundle.dxf },
    { name: `${slug}-dieline.pdf`, data: bundle.pdf },
  ])
  triggerDownload(blob, `${slug}-forma.zip`)
  return true
}

export function downloadDielinePdf(spec: DesignSpec): boolean {
  if (!spec.preflight.exportOk || !spec.dieline.consistent) return false
  const slug = (spec.copy.brand || 'forma').replace(/\s+/g, '-').toLowerCase()
  triggerDownload(
    new Blob([encodePdfBytes(buildDielinePdf(spec.dieline, `${spec.copy.brand} FORXA`))], { type: 'application/pdf' }),
    `${slug}-dieline.pdf`,
  )
  return true
}

export function printPdf(spec: DesignSpec): boolean {
  const svg = buildCombinedSvg(spec)
  if (!svg) return false
  const win = window.open('', '_blank', 'noopener,width=900,height=700')
  if (!win) return false
  win.document.write(`<!doctype html><html><head><title>${spec.copy.brand} FORMA</title>
    <style>body{margin:0;background:#fff} svg{width:100%;height:auto}</style></head>
    <body>${svg}</body></html>`)
  win.document.close()
  win.focus()
  win.print()
  return true
}
