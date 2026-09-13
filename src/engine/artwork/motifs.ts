import type { Palette, Panel } from '../../types'

export type SafeRect = { x: number; y: number; w: number; h: number }

function hitsSafe(y0: number, amp: number, safe?: SafeRect): boolean {
  if (!safe) return false
  return y0 + amp > safe.y && y0 - amp < safe.y + safe.h
}

/** Elite Brew marble → flowing gold contour / topo field. Vector only. */
export function contourGoldField(panel: Panel, color: string, opacity = 0.16, safe?: SafeRect): string {
  const { x, y, w, h } = panel
  const bands = 7
  let d = ''
  for (let i = 0; i < bands; i++) {
    const t = (i + 0.6) / (bands + 1)
    const y0 = y + h * (0.08 + t * 0.84)
    const amp = h * (0.035 + (i % 3) * 0.012)
    if (hitsSafe(y0, amp + 1.2, safe)) continue
    const c1x = x + w * 0.22
    const c2x = x + w * 0.58
    const c3x = x + w * 0.82
    const flip = i % 2 === 0 ? 1 : -1
    d += `<path d="M${x + 1.2} ${y0} C${c1x} ${y0 + amp * flip} ${c2x} ${y0 - amp * flip} ${c3x} ${y0 + amp * 0.45 * flip} S${x + w - 1.2} ${y0} ${x + w - 1.2} ${y0}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="${0.18 + (i % 2) * 0.06}" />`
  }
  return d
}

/** Modern geometric lattice (stripes + 45° ticks). */
export function geoLattice(panel: Panel, color: string, opacity = 0.1, safe?: SafeRect): string {
  const { x, y, w, h } = panel
  let out = ''
  const step = 5.6
  for (let gx = x + 5; gx < x + w - 2; gx += step) {
    if (safe) {
      out += `<line x1="${gx}" y1="${y + 2.4}" x2="${gx}" y2="${Math.max(y + 2.4, safe.y - 0.8)}" stroke="${color}" stroke-opacity="${opacity}" stroke-width="0.14" />`
      out += `<line x1="${gx}" y1="${Math.min(y + h - 2.4, safe.y + safe.h + 0.8)}" x2="${gx}" y2="${y + h - 2.4}" stroke="${color}" stroke-opacity="${opacity}" stroke-width="0.14" />`
    } else {
      out += `<line x1="${gx}" y1="${y + 2.4}" x2="${gx}" y2="${y + h - 2.4}" stroke="${color}" stroke-opacity="${opacity}" stroke-width="0.14" />`
    }
  }
  for (let i = 0; i < 5; i++) {
    const yy = y + h * (0.18 + i * 0.16)
    if (safe && yy > safe.y - 2 && yy < safe.y + safe.h + 2) continue
    out += `<line x1="${x + 4}" y1="${yy}" x2="${x + 9}" y2="${yy + 4}" stroke="${color}" stroke-opacity="${opacity + 0.04}" stroke-width="0.16" />`
  }
  return out
}

/** CF-style diagonal foil plane — lockup stays clear. */
export function diagonalFoil(panel: Panel, color: string): string {
  const { x, y, w, h } = panel
  return `<polygon points="${x + w * 0.42},${y} ${x + w},${y} ${x + w},${y + h * 0.38} ${x + w * 0.72},${y}" fill="${color}" opacity="0.1" />`
}

/** Elite Brew L-brackets — open corners, not a full box. */
export function lBrackets(panel: Panel, color: string): string {
  const { x, y, w, h } = panel
  const L = 7.2
  const o = 3.4
  const sw = 0.28
  const segs: [number, number, number, number][] = [
    [x + o, y + o + L, x + o, y + o],
    [x + o, y + o, x + o + L, y + o],
    [x + w - o - L, y + o, x + w - o, y + o],
    [x + w - o, y + o, x + w - o, y + o + L],
    [x + o, y + h - o - L, x + o, y + h - o],
    [x + o, y + h - o, x + o + L, y + h - o],
    [x + w - o - L, y + h - o, x + w - o, y + h - o],
    [x + w - o, y + h - o, x + w - o, y + h - o - L],
  ]
  return segs
    .map(([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${sw}" />`)
    .join('')
}

/** Woo / eco botanical silhouettes — stamps, not photos. */
export function leafStampField(panel: Panel, color: string): string {
  const { x, y, w, h } = panel
  const spots = [
    [0.12, 0.22],
    [0.86, 0.18],
    [0.18, 0.78],
    [0.82, 0.74],
  ]
  return spots
    .map(([fx, fy]) => {
      const cx = x + w * fx
      const cy = y + h * fy
      return `<g opacity="0.14">
        <path d="M${cx} ${cy - 3.4} C${cx + 2.4} ${cy - 0.6} ${cx + 2.2} ${cy + 2.4} ${cx} ${cy + 3.8} C${cx - 2.2} ${cy + 2.4} ${cx - 2.4} ${cy - 0.6} ${cx} ${cy - 3.4}" fill="none" stroke="${color}" stroke-width="0.28" />
        <line x1="${cx}" y1="${cy - 3}" x2="${cx}" y2="${cy + 3.2}" stroke="${color}" stroke-width="0.16" />
      </g>`
    })
    .join('')
}

/** Classic ornamental double-line + small ticks. */
export function ornamentalRail(panel: Panel, color: string): string {
  const { x, y, w, h } = panel
  const inset = 3.8
  return `
    <rect x="${x + inset}" y="${y + inset}" width="${w - inset * 2}" height="${h - inset * 2}" fill="none" stroke="${color}" stroke-opacity="0.55" stroke-width="0.32" />
    <rect x="${x + inset + 1.15}" y="${y + inset + 1.15}" width="${w - inset * 2 - 2.3}" height="${h - inset * 2 - 2.3}" fill="none" stroke="${color}" stroke-opacity="0.28" stroke-width="0.14" />
  `
}

/** Todbie / playful claim capsules. */
export function claimCapsules(panel: Panel, p: Palette): string {
  const { x, y, w } = panel
  const items = [
    { t: '01', dx: 0.22 },
    { t: '02', dx: 0.5 },
    { t: '03', dx: 0.78 },
  ]
  return items
    .map(({ t, dx }) => {
      const cx = x + w * dx
      const cy = y + 8.2
      return `<rect x="${cx - 4.2}" y="${cy - 2.4}" width="8.4" height="4.8" rx="2.4" fill="${p.accent}" opacity="0.22" />
        <text x="${cx}" y="${cy + 1.05}" text-anchor="middle" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-size="2.05" letter-spacing="0.4">${t}</text>`
    })
    .join('')
}

/** Dynoclean / wrap register wave — vector only, never a photo paste. */
export function waveRibbon(panel: Panel, color: string, y0 = panel.y + 5.4, opacity = 0.5, weight = 0.72): string {
  const { x, w } = panel
  return `<path d="M${x} ${y0} C${x + w * 0.28} ${y0 - 3.2} ${x + w * 0.55} ${y0 + 3.6} ${x + w} ${y0}" fill="none" stroke="${color}" stroke-width="${weight}" stroke-opacity="${opacity}" />`
}

/** Wrap continuity: parallel waves + hairline that run to the SEAM edge. */
export function wrapContinuity(panel: Panel, color: string): string {
  const { x, y, w, h } = panel
  return [
    waveRibbon(panel, color, y + Math.min(6.2, h * 0.08), 0.42, 0.7),
    waveRibbon(panel, color, y + Math.min(8.4, h * 0.11), 0.22, 0.4),
    `<line x1="${x + 2}" y1="${y + Math.min(9.6, h * 0.125)}" x2="${x + w - 1.2}" y2="${y + Math.min(9.6, h * 0.125)}" stroke="${color}" stroke-opacity="0.28" stroke-width="0.14" />`,
    waveRibbon(panel, color, y + h - Math.min(7.2, h * 0.1), 0.38, 0.62),
  ].join('')
}

/** CF-style edition index — Nº 01, not a second billboard. */
export function seriesMark(x: number, y: number, series: string, color: string, anchor: 'start' | 'middle' | 'end' = 'end'): string {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-family="Inter, Arial, sans-serif" font-size="2.05" letter-spacing="0.55">Nº ${series}</text>`
}

/** Thin plate around the reserved lockup — frames type, does not score it. */
export function lockupWindow(safe: SafeRect, color: string): string {
  const o = 1.35
  return `<rect x="${safe.x - o}" y="${safe.y - o}" width="${safe.w + o * 2}" height="${safe.h + o * 2}" fill="none" stroke="${color}" stroke-opacity="0.38" stroke-width="0.16" />`
}

function contourBand(x: number, y: number, w: number, h: number, color: string, opacity: number, bands: number): string {
  let d = ''
  for (let i = 0; i < bands; i++) {
    const t = (i + 0.55) / (bands + 0.4)
    const y0 = y + h * t
    const amp = h * (0.18 + (i % 2) * 0.08)
    const flip = i % 2 === 0 ? 1 : -1
    d += `<path d="M${x + 1.1} ${y0} C${x + w * 0.3} ${y0 + amp * flip} ${x + w * 0.68} ${y0 - amp * flip} ${x + w - 1.1} ${y0}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="${0.16 + (i % 2) * 0.05}" />`
  }
  return d
}

function diamondAt(cx: number, cy: number, color: string, r = 0.7): string {
  return `<path d="M${cx} ${cy - r} L${cx + r} ${cy} L${cx} ${cy + r} L${cx - r} ${cy} Z" fill="${color}" fill-opacity="0.85" />`
}

/**
 * Luxury spine: foil rail + head/foot contour only.
 * Mid band stays clear for the brand line — not leftover front contour.
 */
export function spineLuxuryField(panel: Panel, color: string, safe?: SafeRect, series = '01'): string {
  const { x, y, w, h } = panel
  const railX = x + 1.4
  const headH = Math.min(h * 0.16, safe ? Math.max(8, safe.y - y - 1.2) : h * 0.16)
  const footTop = safe ? safe.y + safe.h + 1.2 : y + h * 0.84
  const footH = Math.max(8, y + h - footTop - 1.5)
  return `
    <line x1="${railX}" y1="${y + 3.1}" x2="${railX}" y2="${y + h - 3.1}" stroke="${color}" stroke-width="0.22" />
    ${diamondAt(railX, y + 3.2, color)}
    ${diamondAt(railX, y + h - 3.2, color)}
    ${contourBand(x, y + 2.2, w, headH, color, 0.2, 3)}
    ${footH > 6 ? contourBand(x, footTop, w, footH, color, 0.16, 3) : ''}
    ${seriesMark(x + w / 2, y + 6.4, series, color, 'middle')}
  `
}

/** Glisso-style legal column: index plate + baseline ticks. */
export function legalColumnChrome(
  x: number,
  y: number,
  w: number,
  h: number,
  index: string,
  color: string,
  lineYs: number[],
): string {
  const plate = `
    <rect x="${x + 1.15}" y="${y + 1.05}" width="5.4" height="4.2" fill="none" stroke="${color}" stroke-width="0.2" />
    <text x="${x + 3.85}" y="${y + 3.95}" text-anchor="middle" fill="${color}" font-family="Inter, Arial, sans-serif" font-size="1.8" letter-spacing="0.3">${index}</text>`
  const ticks = lineYs
    .map((yy) => `<line x1="${x + 0.85}" y1="${yy}" x2="${x + 1.75}" y2="${yy}" stroke="${color}" stroke-opacity="0.4" stroke-width="0.14" />`)
    .join('')
  const floor = `<line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y + h}" stroke="${color}" stroke-opacity="0.18" stroke-width="0.12" />`
  return plate + ticks + floor
}
