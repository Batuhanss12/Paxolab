import type { DielineModel } from '../../types'

const CUT = '#1a1a1a'
const CREASE = '#c44'
const GLUE = 'rgba(201, 168, 108, 0.28)'
const PANEL = 'rgba(255,255,255,0.04)'
const SAFE = 'rgba(90, 180, 120, 0.35)'

export function renderDielineSvg(model: DielineModel, opts?: { showArtwork?: boolean; artworkMarkup?: string }): string {
  const pad = 8
  const w = model.width + pad * 2
  const h = model.height + pad * 2
  const cut = model.cut
    .map((ring) => {
      const d = ring.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x + pad} ${p.y + pad}`).join(' ') + ' Z'
      return `<path d="${d}" fill="none" stroke="${CUT}" stroke-width="0.45" />`
    })
    .join('')
  const crease = model.crease
    .map(
      ([a, b]) =>
        `<line x1="${a.x + pad}" y1="${a.y + pad}" x2="${b.x + pad}" y2="${b.y + pad}" stroke="${CREASE}" stroke-width="0.35" stroke-dasharray="2 1.2" />`,
    )
    .join('')
  const panels = model.panels
    .map((p) => {
      const isGlue = model.glueIds.includes(p.id)
      return `<g>
        <rect x="${p.x + pad}" y="${p.y + pad}" width="${p.w}" height="${p.h}" fill="${isGlue ? GLUE : PANEL}" stroke="rgba(255,255,255,0.08)" stroke-width="0.2" />
        <text x="${p.x + pad + p.w / 2}" y="${p.y + pad + p.h / 2}" text-anchor="middle" fill="#888" font-size="3.2" font-family="Inter, sans-serif">${p.id}</text>
        <rect x="${p.x + pad + 2}" y="${p.y + pad + 2}" width="${Math.max(0, p.w - 4)}" height="${Math.max(0, p.h - 4)}" fill="none" stroke="${SAFE}" stroke-width="0.15" stroke-dasharray="1 0.8" />
      </g>`
    })
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 3}" height="${h * 3}">
    <rect width="${w}" height="${h}" fill="#0b0b0b" />
    <g>${panels}</g>
    ${opts?.showArtwork ? `<g transform="translate(${pad} ${pad})">${opts.artworkMarkup ?? ''}</g>` : ''}
    <g>${crease}</g>
    <g>${cut}</g>
  </svg>`
}
