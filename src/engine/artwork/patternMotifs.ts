/**
 * Pattern motifs — panel-scale background patterns (contour, lattice, leaf, wave, spine).
 * Extracted from motifs.ts to isolate background patterns from structural decor.
 */
import type { Panel } from '../../types'

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

/** Dynoclean / wrap register wave — vector only, never a photo paste. */
export function waveRibbon(panel: Panel, color: string, y0 = panel.y + 5.4, opacity = 0.5, weight = 0.72): string {
  const { x, w } = panel
  return `<path d="M${x} ${y0} C${x + w * 0.28} ${y0 - 3.2} ${x + w * 0.55} ${y0 + 3.6} ${x + w} ${y0}" fill="none" stroke="${color}" stroke-width="${weight}" stroke-opacity="${opacity}" />`
}

/** Wrap continuity: layered wave field with accent dots that run to the SEAM edge. */
export function wrapContinuity(panel: Panel, color: string): string {
  const { x, y, w, h } = panel
  // Layered top waves — three strokes with varying weight/opacity for depth
  const topA = waveRibbon(panel, color, y + 5.4, 0.38, 0.48)
  const topB = waveRibbon(panel, color, y + 6.8, 0.22, 0.28)
  const topC = waveRibbon(panel, color, y + 8.1, 0.14, 0.18)
  // Foot wave with echo
  const foot = waveRibbon(panel, color, y + h - 5.8, 0.32, 0.4)
  const footEcho = waveRibbon(panel, color, y + h - 4.4, 0.16, 0.2)
  // Accent dots at wave peaks — registration marks
  const dots: string[] = []
  for (let i = 0; i < 4; i++) {
    const dx = x + w * (0.15 + i * 0.24)
    const dy = y + 5.4 + Math.sin(i * 1.2) * 1.8
    dots.push(`<circle cx="${dx.toFixed(2)}" cy="${dy.toFixed(2)}" r="0.18" fill="${color}" fill-opacity="0.3" />`)
  }
  return `<g data-art="wrap-continuity">${topA}${topB}${topC}${foot}${footEcho}${dots.join('')}</g>`
}

export function contourBand(x: number, y: number, w: number, h: number, color: string, opacity: number, bands: number): string {
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

/**
 * Luxury spine: foil rail + head/foot contour only.
 * Mid band stays clear for the brand line — not leftover front contour.
 */
export function spineLuxuryField(panel: Panel, color: string, _safe?: SafeRect, _series = '01'): string {
  const { x, y, w, h } = panel
  const railX = x + 1.4
  const cap = Math.min(w - 2.2, 7.2)
  return `<line x1="${railX}" y1="${y + 3.1}" x2="${railX}" y2="${y + h - 3.1}" stroke="${color}" stroke-width="0.22" />
    <line x1="${railX}" y1="${y + 3.1}" x2="${railX + cap}" y2="${y + 3.1}" stroke="${color}" stroke-opacity="0.4" stroke-width="0.14" />
    <line x1="${railX}" y1="${y + h - 3.1}" x2="${railX + cap}" y2="${y + h - 3.1}" stroke="${color}" stroke-opacity="0.4" stroke-width="0.14" />`
}
