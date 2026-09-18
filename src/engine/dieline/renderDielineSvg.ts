import type { DielineModel, Point } from '../../types'

const CUT = '#111111'
const CREASE = '#cc3333'
const PERF = '#b03ab0'
const GLUE = 'rgba(201, 168, 108, 0.32)'
const PANEL = 'rgba(255,255,255,0.035)'
const SAFE = 'rgba(90, 180, 120, 0.32)'
const BLEED = 'rgba(200, 120, 80, 0.28)'

export type DielineRenderMode = 'structure' | 'combined'

function ringD(ring: Point[], pad: number): string {
  const d = ring.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x + pad} ${p.y + pad}`).join(' ')
  return ring.length >= 3 ? `${d} Z` : d
}

export function dielineTechMarkup(
  model: DielineModel,
  pad: number,
  mode: 'preview' | 'doc',
): { cut: string; crease: string; perf: string } {
  const cutStroke = mode === 'preview' ? CUT : '#000'
  const creaseStroke = mode === 'preview' ? CREASE : '#c00'
  const perfStroke = mode === 'preview' ? PERF : '#909'
  const cutW = mode === 'preview' ? '0.55' : '0.5'
  const creaseW = mode === 'preview' ? '0.42' : '0.35'
  const creaseDash = mode === 'preview' ? '2 1.15' : '2 1.1'
  const cut = model.cut
    .map(
      (ring) =>
        `<path d="${ringD(ring, pad)}" fill="none" stroke="${cutStroke}" stroke-width="${cutW}" stroke-linejoin="miter" data-type="cut" />`,
    )
    .join('')
  const crease = model.crease
    .map(
      ([a, b]) =>
        `<line x1="${a.x + pad}" y1="${a.y + pad}" x2="${b.x + pad}" y2="${b.y + pad}" stroke="${creaseStroke}" stroke-width="${creaseW}" stroke-dasharray="${creaseDash}" data-type="crease" />`,
    )
    .join('')
  const perf = (model.perf ?? [])
    .filter((ring) => ring.length >= 2)
    .map(
      (ring) =>
        `<path d="${ringD(ring, pad)}" fill="none" stroke="${perfStroke}" stroke-width="0.35" stroke-dasharray="1 0.9" data-type="perf" />`,
    )
    .join('')
  return {
    cut: `<g id="CUT" data-layer="CUT">${cut}</g>`,
    crease: `<g id="CREASE" data-layer="CREASE">${crease}</g>`,
    perf: `<g id="PERF" data-layer="PERF">${perf}</g>`,
  }
}

/** Plotter / CAD knife SVG — cut / crease / perf only, millimetre units, named layers. */
export function renderKnifeDoc(model: DielineModel, title: string): string {
  const pad = 8
  const w = model.width + pad * 2
  const h = model.height + pad * 2
  const { cut, crease, perf } = dielineTechMarkup(model, pad, 'doc')
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm">
  <title>${title} — Grapxor knife CUT/CREASE/PERF</title>
  ${perf}
  ${crease}
  ${cut}
</svg>`
}

export function renderDielineSvg(
  model: DielineModel,
  opts?: { showArtwork?: boolean; artworkMarkup?: string; mode?: DielineRenderMode; paper?: string; safeInsetMm?: number },
): string {
  const pad = 8
  const w = model.width + pad * 2
  const h = model.height + pad * 2
  const combined = opts?.mode === 'combined' || !!opts?.showArtwork
  const paper = opts?.paper ?? '#0b0b0b'
  const { cut, crease, perf } = dielineTechMarkup(model, pad, 'preview')

  // printReady overlay: inward safe + outward bleed. Guide only — dieline PDF is PDF/X-4 sRGB.
  const safeInset = opts?.safeInsetMm ?? 0
  const proofPanels =
    combined && safeInset > 0 ? model.panels.filter((p) => !model.glueIds.includes(p.id)) : []
  const combinedSafe = proofPanels
    .map((p) => {
      const pw = Math.max(0, p.w - safeInset * 2)
      const ph = Math.max(0, p.h - safeInset * 2)
      return `<rect x="${p.x + pad + safeInset}" y="${p.y + pad + safeInset}" width="${pw}" height="${ph}" fill="none" stroke="${SAFE}" stroke-width="0.15" stroke-dasharray="1 0.8" data-proof="safe" />`
    })
    .join('')
  const combinedBleed = proofPanels
    .map((p) => {
      return `<rect x="${p.x + pad - safeInset}" y="${p.y + pad - safeInset}" width="${p.w + safeInset * 2}" height="${p.h + safeInset * 2}" fill="none" stroke="${BLEED}" stroke-width="0.15" stroke-dasharray="1.2 0.9" data-proof="bleed" />`
    })
    .join('')

  const panels = model.panels
    .map((p) => {
      const isGlue = model.glueIds.includes(p.id)
      if (combined) {
        if (!isGlue) return ''
        /*
         * The glue allowance, named.
         *
         * It carries no artwork — adhesive does not bond over ink, and the `glue-art` preflight
         * check fails any glue face that does. Unlabelled, that reads as the design having a blank
         * strip stuck to its edge: the owner opened a wrap label's set view and asked why the front
         * had extra space on its right. Hatching plus a caption makes it production chrome rather
         * than empty design surface. The hatch is preview-only; nothing here reaches the press file.
         */
        const hatch = `glue-hatch-${p.id}`
        const caption = Math.min(p.w * 0.34, p.h * 0.1, 3)
        const label =
          p.w >= 6 && p.h >= 14
            ? `<text x="${p.x + pad + p.w / 2}" y="${p.y + pad + p.h / 2}" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="${caption.toFixed(2)}" font-family="Inter, sans-serif" transform="rotate(-90 ${p.x + pad + p.w / 2} ${p.y + pad + p.h / 2})">YAPIŞTIRMA PAYI</text>`
            : ''
        return `<g data-glue="allowance">
          <defs><pattern id="${hatch}" width="2.2" height="2.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="2.2" stroke="rgba(255,255,255,0.16)" stroke-width="0.5" /></pattern></defs>
          <rect x="${p.x + pad}" y="${p.y + pad}" width="${p.w}" height="${p.h}" fill="${GLUE}" />
          <rect x="${p.x + pad}" y="${p.y + pad}" width="${p.w}" height="${p.h}" fill="url(#${hatch})" />
          ${label}
        </g>`
      }
      return `<g>
        <rect x="${p.x + pad}" y="${p.y + pad}" width="${p.w}" height="${p.h}" fill="${isGlue ? GLUE : PANEL}" stroke="rgba(255,255,255,0.1)" stroke-width="0.2" />
        <text x="${p.x + pad + p.w / 2}" y="${p.y + pad + p.h / 2}" text-anchor="middle" fill="#8a8a8a" font-size="3.1" font-family="Inter, sans-serif">${p.id === 'label' ? 'ÖN' : p.id === 'labelBack' || p.id === 'warnLabel' ? 'ARKA' : p.id}</text>
        <rect x="${p.x + pad + 2}" y="${p.y + pad + 2}" width="${Math.max(0, p.w - 4)}" height="${Math.max(0, p.h - 4)}" fill="none" stroke="${SAFE}" stroke-width="0.15" stroke-dasharray="1 0.8" />
      </g>`
    })
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 3}" height="${h * 3}">
    <rect width="${w}" height="${h}" fill="${paper}" />
    <g>${panels}</g>
    ${combined && opts?.artworkMarkup ? `<g transform="translate(${pad} ${pad})">${opts.artworkMarkup}</g>` : ''}
    ${combinedBleed ? `<g data-proof="bleed-set">${combinedBleed}</g>` : ''}
    ${combinedSafe ? `<g data-proof="safe-set">${combinedSafe}</g>` : ''}
    <g>${perf}</g>
    <g>${crease}</g>
    <g>${cut}</g>
  </svg>`
}

export function renderStructureDoc(model: DielineModel, title: string): string {
  const pad = 8
  const w = model.width + pad * 2
  const h = model.height + pad * 2
  const { cut, crease, perf } = dielineTechMarkup(model, pad, 'doc')
  const labels = model.panels
    .map(
      (p) =>
        `<text x="${p.x + pad + p.w / 2}" y="${p.y + pad + p.h / 2}" text-anchor="middle" fill="#888" font-size="3" font-family="Inter, sans-serif">${p.id}</text>`,
    )
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm">
  <title>${title} — Grapxor dieline</title>
  ${labels}
  ${perf}
  ${crease}
  ${cut}
</svg>`
}
