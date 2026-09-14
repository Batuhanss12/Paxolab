/**
 * Vector background kits — one atmospheric field per style pilot.
 * Raster grounds are out of scope. Motifs stay outside the lockup safe hole.
 */
import type { Palette, Panel, StyleType } from '../../types'
import type { SectorId } from '../designSystem/types'
import type { SafeRect } from './patternMotifs'

export type BgKitId = 'botanical-field' | 'meadow-wash' | 'night-topo'

export type BgKitOpts = {
  safe?: SafeRect
  density?: 0 | 1 | 2
  opacity?: number
}

export function kitLevel(variationIndex = 0): 0 | 1 | 2 {
  return Math.max(0, Math.min(2, Math.round(variationIndex))) as 0 | 1 | 2
}

export function kitOpacity(density: 0 | 1 | 2, override?: number): number {
  if (override != null) return Math.min(0.18, Math.max(0.06, override))
  return ([0.1, 0.13, 0.16] as const)[density]
}

export function expandKitSafe(lockup?: SafeRect, pad = 2.6): SafeRect | undefined {
  if (!lockup) return undefined
  return {
    x: lockup.x - pad,
    y: lockup.y - pad,
    w: lockup.w + pad * 2,
    h: lockup.h + pad * 2,
  }
}

export function resolveBgKit(
  style: StyleType,
  sector: SectorId | string,
  grammar: 'box' | 'label' | string,
  theatre: boolean,
): BgKitId | null {
  if (theatre) return 'meadow-wash'
  if (style === 'eco' && (sector === 'cream' || sector === 'serum' || sector === 'baby')) return 'botanical-field'
  if (style === 'eco' && sector === 'food' && grammar === 'label') return 'botanical-field'
  if (style === 'luxury' && sector === 'perfume') return 'night-topo'
  return null
}

function inSafe(cx: number, cy: number, safe?: SafeRect, pad = 1.6): boolean {
  if (!safe) return false
  return cx > safe.x - pad && cx < safe.x + safe.w + pad && cy > safe.y - pad && cy < safe.y + safe.h + pad
}

function attr(mark: string, clip: string, first: { n: number }): string {
  const tagged = first.n === 0 ? ` ${mark}` : ''
  first.n += 1
  return `${tagged}${clip}`
}

function botanicalField(panel: Panel, p: Palette, op: number, density: 0 | 1 | 2, safe?: SafeRect, dy = 0, mark = '', clip = ''): string {
  const { x, y, w, h } = panel
  const slots: [number, number, number][] = [
    [0.1, 0.1, 1],
    [0.22, 0.07, 0.82],
    [0.84, 0.1, 1.05],
    [0.93, 0.2, 0.78],
    [0.07, 0.26, 0.9],
    [0.94, 0.34, 0.72],
    [0.11, 0.78, 1],
    [0.2, 0.9, 0.86],
    [0.82, 0.86, 1.08],
    [0.92, 0.74, 0.8],
    [0.08, 0.88, 0.7],
    [0.88, 0.06, 0.74],
    [0.05, 0.64, 0.68],
    [0.96, 0.6, 0.7],
  ]
  const take = 8 + density * 3
  const first = { n: 0 }
  let out = ''
  slots.slice(0, take).forEach(([fx, fy, s], i) => {
    const cx = x + w * fx
    const cy = y + h * fy + dy + (i % 2 ? 0.8 : -0.4)
    if (inSafe(cx, cy, safe, 3.2)) return
    const a = attr(mark, clip, first)
    out += `<path${a} d="M${cx} ${cy - 3.5 * s} C${cx + 2.5 * s} ${cy - 0.3 * s} ${cx + 2.2 * s} ${cy + 2.5 * s} ${cx} ${cy + 3.9 * s} C${cx - 2.2 * s} ${cy + 2.5 * s} ${cx - 2.5 * s} ${cy - 0.3 * s} ${cx} ${cy - 3.5 * s}" fill="none" stroke="${p.fg}" stroke-opacity="${op}" stroke-width="0.28" />`
    out += `<line x1="${cx}" y1="${cy - 3.1 * s}" x2="${cx}" y2="${cy + 3.3 * s}" stroke="${p.fg}" stroke-opacity="${op * 0.85}" stroke-width="0.14" />`
    if (i % 3 === 0) {
      const sx = cx + (fx < 0.5 ? 2.4 : -2.4)
      out += `<path d="M${sx} ${cy + 4.2 * s} C${sx + (fx < 0.5 ? 3.2 : -3.2)} ${cy + 0.4} ${sx + (fx < 0.5 ? 1.6 : -1.6)} ${cy - 6 * s} ${cx} ${cy - 3.8 * s}" fill="none" stroke="${p.fg}" stroke-opacity="${op * 0.7}" stroke-width="0.16" />`
    }
  })
  return out
}

function meadowWash(panel: Panel, p: Palette, op: number, density: 0 | 1 | 2, safe?: SafeRect, dy = 0, mark = '', clip = ''): string {
  const { x, y, w, h } = panel
  const bandH = h * 0.48
  const ridge = y + bandH * 0.62 + dy
  const first = { n: 0 }
  let out = `<defs><clipPath id="meadow-band-${panel.id}"><rect x="${x}" y="${y}" width="${w}" height="${bandH}" /></clipPath></defs>`
  out += `<rect${attr(mark, clip, first)} x="${x}" y="${y}" width="${w}" height="${bandH * 0.42}" fill="${p.accent}" fill-opacity="${op * 0.35}" />`
  const trees = (
    [
      [0.16, 1],
      [0.34, 0.78],
      [0.62, 0.92],
    ] as [number, number][]
  ).slice(0, 2 + density)
  trees.forEach(([fx, s]) => {
    const cx = x + w * fx
    const base = ridge + 1.2
    if (inSafe(cx, base - 6 * s, safe, 2.4)) return
    out += `<path${clip} d="M${cx} ${base - 11 * s} L${cx - 3.1 * s} ${base - 5.2 * s} L${cx + 3.1 * s} ${base - 5.2 * s} Z" fill="${p.fg}" fill-opacity="${op * 0.55}" />`
    out += `<path${clip} d="M${cx} ${base - 8 * s} L${cx - 3.9 * s} ${base - 1.8 * s} L${cx + 3.9 * s} ${base - 1.8 * s} Z" fill="${p.fg}" fill-opacity="${op * 0.7}" />`
    out += `<path${clip} d="M${cx} ${base - 4.2 * s} L${cx - 4.5 * s} ${base + 2.1 * s} L${cx + 4.5 * s} ${base + 2.1 * s} Z" fill="${p.fg}" fill-opacity="${op}" />`
    out += `<line${clip} x1="${cx}" y1="${base + 1.8 * s}" x2="${cx}" y2="${base + 4 * s}" stroke="${p.fg}" stroke-opacity="${op}" stroke-width="0.2" />`
  })
  const flowers = 4 + density
  for (let i = 0; i < flowers; i++) {
    const cx = x + w * (0.12 + i * (0.72 / Math.max(1, flowers - 1)))
    const cy = ridge - 3.2 + (i % 2 ? 1.6 : -1.1) + dy * 0.4
    if (inSafe(cx, cy, safe, 2)) continue
    out += `<path${clip} d="M${cx} ${cy - 1.15} L${cx} ${cy + 1.15} M${cx - 1.15} ${cy} L${cx + 1.15} ${cy}" fill="none" stroke="${p.accent}" stroke-opacity="${op + 0.04}" stroke-width="0.22" />`
    out += `<circle${clip} cx="${cx}" cy="${cy}" r="0.28" fill="${p.accent}" fill-opacity="${op + 0.06}" />`
  }
  return out
}

function nightTopo(panel: Panel, p: Palette, op: number, density: 0 | 1 | 2, safe?: SafeRect, dy = 0, mark = '', clip = ''): string {
  const { x, y, w, h } = panel
  const cx = x + w * 0.48
  const cy = y + h * 0.7 + dy
  const rings = 4 + density
  const first = { n: 0 }
  let out = ''
  for (let i = 0; i < rings; i++) {
    const rx = w * (0.16 + i * 0.09)
    const ry = h * (0.07 + i * 0.048)
    if (inSafe(cx, cy, safe, rx * 0.15)) continue
    out += `<ellipse${attr(mark, clip, first)} cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${p.accent}" stroke-opacity="${op}" stroke-width="${0.16 + (i % 2) * 0.05}" />`
  }
  const ridges = [
    y + h * 0.58 + dy,
    y + h * 0.78 + dy,
  ]
  ridges.forEach((y0, i) => {
    if (inSafe(x + w * 0.5, y0, safe, 2.2)) return
    const amp = h * (0.028 + i * 0.01)
    const flip = i % 2 === 0 ? 1 : -1
    out += `<path${clip} d="M${x + 1.4} ${y0} C${x + w * 0.28} ${y0 + amp * flip} ${x + w * 0.62} ${y0 - amp * flip} ${x + w - 1.4} ${y0}" fill="none" stroke="${p.accent}" stroke-opacity="${op}" stroke-width="0.2" />`
  })
  return out
}

export function paintBgKit(panel: Panel, kit: BgKitId, p: Palette, opts: BgKitOpts = {}): string {
  const density = opts.density ?? 0
  const night = kit === 'night-topo'
  const op = kitOpacity(density, opts.opacity ?? (night ? ([0.08, 0.11, 0.14] as const)[density] : undefined))
  const dy = density * panel.h * 0.012
  const mark = `data-art="bg-kit" data-bg-kit="${kit}"`
  const clip =
    kit === 'meadow-wash' && panel.id
      ? ` clip-path="url(#meadow-band-${panel.id})"`
      : opts.safe && panel.id
        ? ` clip-path="url(#lockout-${panel.id})"`
        : ''
  if (kit === 'botanical-field') return botanicalField(panel, p, op, density, opts.safe, dy, mark, clip)
  if (kit === 'meadow-wash') return meadowWash(panel, p, op, density, opts.safe, dy, mark, clip)
  return nightTopo(panel, p, op, density, opts.safe, dy, mark, clip)
}
