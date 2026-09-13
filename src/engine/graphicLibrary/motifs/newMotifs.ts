/**
 * New motifs — 5 new real SVG motif painters.
 * flower: floral bloom for eco/luxury
 * star: 5-point star for playful/classic
 * monogram: circular monogram plate for luxury
 * sun: radiating sun for food/eco
 * abstract: abstract geometric mark for modern
 */
import type { GraphicEntry, GraphicMeta, PaintCtx, SafeRect } from '../types'
import { registerGraphics } from '../registry'
import type { StyleType } from '../../../types'
import type { SectorId } from '../../designSystem/types'

function hitsSafe(x: number, y: number, safe?: SafeRect, pad = 1.2): boolean {
  if (!safe) return false
  return x > safe.x - pad && x < safe.x + safe.w + pad && y > safe.y - pad && y < safe.y + safe.h + pad
}

function center(ctx: PaintCtx): { cx: number; cy: number; r: number } {
  const { panel } = ctx
  const cx = panel.x + panel.w * 0.5
  const cy = panel.y + panel.h * 0.16
  const r = Math.min(panel.w, panel.h) * 0.05
  return { cx, cy, r }
}

/** Flower — 6-petal floral bloom. Eco/luxury alternative to botanical hero. */
export function paintFlower(ctx: PaintCtx): string {
  const { palette, safe } = ctx
  const { cx, cy, r } = center(ctx)
  if (hitsSafe(cx, cy, safe, r + 1)) return ''
  const petals = 6
  let out = ''
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2
    const px = cx + Math.cos(a) * r * 0.7
    const py = cy + Math.sin(a) * r * 0.7
    out += `<ellipse cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" rx="${(r * 0.4).toFixed(2)}" ry="${(r * 0.22).toFixed(2)}" fill="none" stroke="${palette.accent}" stroke-width="0.22" transform="rotate(${(a * 180 / Math.PI + 90).toFixed(1)} ${px.toFixed(2)} ${py.toFixed(2)})" />`
  }
  out += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${(r * 0.18).toFixed(2)}" fill="${palette.accent}" fill-opacity="0.5" />`
  return `<g data-art="motif" data-motif="flower">${out}</g>`
}

/** Star — 5-point star outline. Playful/classic accent. */
export function paintStar(ctx: PaintCtx): string {
  const { palette, safe } = ctx
  const { cx, cy, r } = center(ctx)
  if (hitsSafe(cx, cy, safe, r + 1)) return ''
  const points = 5
  let d = ''
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    const rr = i % 2 === 0 ? r : r * 0.42
    const px = cx + Math.cos(a) * rr
    const py = cy + Math.sin(a) * rr
    d += `${i === 0 ? 'M' : 'L'}${px.toFixed(2)} ${py.toFixed(2)} `
  }
  d += 'Z'
  return `<g data-art="motif" data-motif="star"><path d="${d}" fill="none" stroke="${palette.accent}" stroke-width="0.24" /></g>`
}

/** Monogram — circular monogram plate with brand initial. Luxury alternative to crest. */
export function paintMonogram(ctx: PaintCtx): string {
  const { palette, safe, panel } = ctx
  const cx = panel.x + panel.w * 0.5
  const cy = panel.y + panel.h * 0.16
  const r = Math.min(panel.w, panel.h) * 0.06
  if (hitsSafe(cx, cy, safe, r + 1)) return ''
  let out = ''
  // Outer ring
  out += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="none" stroke="${palette.accent}" stroke-width="0.28" />`
  // Inner ring
  out += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${(r * 0.82).toFixed(2)}" fill="none" stroke="${palette.accent}" stroke-opacity="0.5" stroke-width="0.14" />`
  // Initial (first letter of brand, or 'M' fallback)
  const letter = 'M'
  out += `<text x="${cx.toFixed(2)}" y="${(cy + r * 0.35).toFixed(2)}" text-anchor="middle" fill="${palette.accent}" font-family="Georgia, serif" font-size="${(r * 0.9).toFixed(2)}" font-weight="500">${letter}</text>`
  return `<g data-art="motif" data-motif="monogram">${out}</g>`
}

/** Sun — radiating sun with rays. Food/eco warmth. */
export function paintSun(ctx: PaintCtx): string {
  const { palette, safe } = ctx
  const { cx, cy, r } = center(ctx)
  if (hitsSafe(cx, cy, safe, r + 2)) return ''
  let out = ''
  // Center disc
  out += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${(r * 0.45).toFixed(2)}" fill="none" stroke="${palette.accent}" stroke-width="0.24" />`
  // Rays
  const rays = 12
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2
    const x1 = cx + Math.cos(a) * r * 0.55
    const y1 = cy + Math.sin(a) * r * 0.55
    const x2 = cx + Math.cos(a) * r
    const y2 = cy + Math.sin(a) * r
    out += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${palette.accent}" stroke-width="0.16" />`
  }
  return `<g data-art="motif" data-motif="sun">${out}</g>`
}

/** Abstract — abstract geometric mark (triangle + circle). Modern/playful. */
export function paintAbstract(ctx: PaintCtx): string {
  const { palette, safe } = ctx
  const { cx, cy, r } = center(ctx)
  if (hitsSafe(cx, cy, safe, r + 1)) return ''
  let out = ''
  // Triangle outline
  out += `<path d="M${cx} ${(cy - r).toFixed(2)} L${(cx + r * 0.866).toFixed(2)} ${(cy + r * 0.5).toFixed(2)} L${(cx - r * 0.866).toFixed(2)} ${(cy + r * 0.5).toFixed(2)} Z" fill="none" stroke="${palette.accent}" stroke-width="0.22" />`
  // Inner circle
  out += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${(r * 0.32).toFixed(2)}" fill="${palette.accent}" fill-opacity="0.3" />`
  return `<g data-art="motif" data-motif="abstract">${out}</g>`
}

function entry(
  id: string,
  label: string,
  styles: StyleType[],
  sectors: SectorId[],
  density: 'sparse' | 'balanced' | 'dense',
  opacityCap: number,
  paint: GraphicEntry['paint'],
): GraphicEntry {
  const meta: GraphicMeta = { id, category: 'motif', label, styles, sectors, density, opacityCap }
  return { meta, paint }
}

export const newMotifEntries: GraphicEntry[] = [
  entry('flower', 'Flower bloom', ['eco', 'luxury'], ['food', 'beverage'], 'balanced', 0.5, paintFlower),
  entry('star', 'Star', ['playful', 'classic'], [], 'sparse', 0.6, paintStar),
  entry('monogram', 'Monogram plate', ['luxury', 'classic'], ['perfume'], 'balanced', 1, paintMonogram),
  entry('sun', 'Radiating sun', ['eco', 'playful'], ['food', 'beverage'], 'balanced', 0.6, paintSun),
  entry('abstract', 'Abstract geometric', ['modern', 'playful'], [], 'balanced', 0.5, paintAbstract),
]

registerGraphics(newMotifEntries)
