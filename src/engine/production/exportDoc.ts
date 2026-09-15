import type { DesignSpec } from '../../types'
import { artworkMarkup, clipDefs, renderArtworkDoc } from '../artwork/composeArtwork'
import { isFormaSampleEan, isInventedRegisteredGtin } from '../barcode'
import { noteDownload, noteExport } from '../brain/OutcomeTracker'
import { renderStructureDoc } from '../dieline/renderDielineSvg'
import { buildDielineDxf } from './dxf'
import { artworkFromDocument } from '../document'

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;')
}

export function buildCombinedSvg(spec: DesignSpec): string | null {
  if (spec.preflight.collisions || !spec.dieline.consistent) return null
  if (isInventedRegisteredGtin(spec.copy.barcode, spec.brief.barcodeDefaulted)) return null
  const artwork = artworkFromDocument(spec.document)
  const pad = 8
  const w = spec.dieline.width + pad * 2
  const h = spec.dieline.height + pad * 2
  const cut = spec.dieline.cut
    .map((ring) => {
      const d = ring.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x + pad} ${p.y + pad}`).join(' ') + ' Z'
      return `<path d="${d}" fill="none" stroke="#000" stroke-width="0.5" stroke-linejoin="miter" />`
    })
    .join('')
  const crease = spec.dieline.crease
    .map(
      ([a, b]) =>
        `<line x1="${a.x + pad}" y1="${a.y + pad}" x2="${b.x + pad}" y2="${b.y + pad}" stroke="#c00" stroke-width="0.35" stroke-dasharray="2 1.1" />`,
    )
    .join('')
  const sampleNote = isFormaSampleEan(spec.copy.barcode)
    ? '\n  <!-- Grapxor: sample barcode 200… is not a GS1 GTIN. Replace before production. -->'
    : ''
  // Proof overlays only: 2 mm safe (inward) + 2 mm bleed guide (outward). Not press bleed / not PDF/X.
  const proofNote = '\n  <!-- Grapxor proof: 2 mm safe inset · 2 mm bleed guide (overlay only) · not PDF/X. -->'
  const proofPanels = spec.overrides.printReady
    ? spec.dieline.panels.filter((p) => !spec.dieline.glueIds.includes(p.id))
    : []
  const safe = proofPanels
    .map((p) => {
      const inset = 2
      return `<rect x="${p.x + pad + inset}" y="${p.y + pad + inset}" width="${Math.max(0, p.w - inset * 2)}" height="${Math.max(0, p.h - inset * 2)}" fill="none" stroke="rgba(90,180,120,0.32)" stroke-width="0.15" stroke-dasharray="1 0.8" data-proof="safe" />`
    })
    .join('')
  const bleed = proofPanels
    .map((p) => {
      const out = 2
      return `<rect x="${p.x + pad - out}" y="${p.y + pad - out}" width="${p.w + out * 2}" height="${p.h + out * 2}" fill="none" stroke="rgba(200,120,80,0.28)" stroke-width="0.15" stroke-dasharray="1.2 0.9" data-proof="bleed" />`
    })
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm">${sampleNote}${proofNote}
  <title>${escapeXml(spec.copy.brand)} — Grapxor combined</title>
  <defs>${clipDefs(spec.dieline)}</defs>
  <g transform="translate(${pad} ${pad})">${artworkMarkup(artwork)}</g>
  ${bleed ? `<g data-proof="bleed-set">${bleed}</g>` : ''}
  ${safe ? `<g data-proof="safe-set">${safe}</g>` : ''}
  ${crease}
  ${cut}
</svg>`
}

export function buildExportSvg(spec: DesignSpec): string | null {
  return buildCombinedSvg(spec)
}

export function buildExportBundle(
  spec: DesignSpec,
): { dieline: string; artwork: string; combined: string; dxf: string } | null {
  const combined = buildCombinedSvg(spec)
  if (!combined) return null
  const slug = spec.copy.brand || 'forma'
  return {
    dieline: renderStructureDoc(spec.dieline, slug),
    artwork: renderArtworkDoc(spec.dieline, artworkFromDocument(spec.document), slug),
    combined,
    dxf: buildDielineDxf(spec.dieline),
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
  const bundle = buildExportBundle(spec)
  if (!bundle) return false
  const slug = (spec.copy.brand || 'forma').replace(/\s+/g, '-').toLowerCase()
  const blob = zipStore([
    { name: `${slug}-dieline.svg`, data: bundle.dieline },
    { name: `${slug}-artwork.svg`, data: bundle.artwork },
    { name: `${slug}-combined.svg`, data: bundle.combined },
    { name: `${slug}-dieline.dxf`, data: bundle.dxf },
  ])
  triggerDownload(blob, `${slug}-forma.zip`)
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

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(data: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function u16(n: number): Uint8Array {
  const b = new Uint8Array(2)
  b[0] = n & 0xff
  b[1] = (n >>> 8) & 0xff
  return b
}

function u32(n: number): Uint8Array {
  const b = new Uint8Array(4)
  b[0] = n & 0xff
  b[1] = (n >>> 8) & 0xff
  b[2] = (n >>> 16) & 0xff
  b[3] = (n >>> 24) & 0xff
  return b
}

function concat(parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((a, p) => a + p.length, 0)
  const out = new Uint8Array(len)
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

function zipStore(files: { name: string; data: string }[]): Blob {
  const enc = new TextEncoder()
  const now = new Date()
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()
  const locals: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0
  for (const f of files) {
    const name = enc.encode(f.name)
    const data = enc.encode(f.data)
    const crc = crc32(data)
    const local = concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(time),
      u16(date),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
      data,
    ])
    const central = concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(time),
      u16(date),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      name,
    ])
    locals.push(local)
    centrals.push(central)
    offset += local.length
  }
  const centralDir = concat(centrals)
  const eocd = concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDir.length),
    u32(offset),
    u16(0),
  ])
  const archive = concat([...locals, centralDir, eocd])
  return new Blob([archive.buffer.slice(archive.byteOffset, archive.byteOffset + archive.byteLength) as ArrayBuffer], {
    type: 'application/zip',
  })
}
