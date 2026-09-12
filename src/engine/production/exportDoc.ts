import type { DesignSpec } from '../../types'
import { artworkMarkup, clipDefs } from '../artwork/composeArtwork'

export function buildExportSvg(spec: DesignSpec): string | null {
  if (spec.preflight.collisions || !spec.dieline.consistent) return null
  const pad = 8
  const w = spec.dieline.width + pad * 2
  const h = spec.dieline.height + pad * 2
  const cut = spec.dieline.cut
    .map((ring) => {
      const d = ring.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x + pad} ${p.y + pad}`).join(' ') + ' Z'
      return `<path d="${d}" fill="none" stroke="#000" stroke-width="0.4" />`
    })
    .join('')
  const crease = spec.dieline.crease
    .map(
      ([a, b]) =>
        `<line x1="${a.x + pad}" y1="${a.y + pad}" x2="${b.x + pad}" y2="${b.y + pad}" stroke="#c00" stroke-width="0.3" stroke-dasharray="2 1" />`,
    )
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm">
  <title>${escapeXml(spec.copy.brand)} — FORMA dieline</title>
  <defs>${clipDefs(spec.dieline)}</defs>
  <g transform="translate(${pad} ${pad})">${artworkMarkup(spec.artwork)}</g>
  ${crease}
  ${cut}
</svg>`
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;')
}

export function downloadSvg(spec: DesignSpec): boolean {
  const svg = buildExportSvg(spec)
  if (!svg) return false
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${spec.copy.brand || 'forma'}-dieline.svg`
  a.click()
  URL.revokeObjectURL(url)
  return true
}

export function printPdf(spec: DesignSpec): boolean {
  const svg = buildExportSvg(spec)
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
