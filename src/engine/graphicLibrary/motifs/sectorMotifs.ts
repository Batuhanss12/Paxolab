/**
 * Sector-specific motifs — 6 new real SVG motif painters.
 * foil-stripe: luxury perfume foil stripe
 * perfume-bottle: perfume bottle silhouette
 * wheat-sheaf: food wheat stalk
 * honeycomb: food honeycomb hexagon
 * circuit: electronics circuit traces
 * chip: electronics chip outline
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

/** Foil stripe — luxury perfume diagonal foil stripe. */
export function paintFoilStripe(ctx: PaintCtx): string {
  const { panel, palette, safe } = ctx
  const { x, y, w, h } = panel
  if (hitsSafe(x + w * 0.5, y + h * 0.16, safe, 3)) return ''
  // Diagonal foil stripe from top-left to bottom-right
  const x1 = x + w * 0.1
  const y1 = y + h * 0.08
  const x2 = x + w * 0.9
  const y2 = y + h * 0.24
  return `<g data-art="motif" data-motif="foil-stripe">
    <line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${palette.accent}" stroke-width="0.32" />
    <line x1="${x1.toFixed(2)}" y1="${(y1 + 0.8).toFixed(2)}" x2="${x2.toFixed(2)}" y2="${(y2 + 0.8).toFixed(2)}" stroke="${palette.accent}" stroke-opacity="0.5" stroke-width="0.16" />
  </g>`
}

/** Perfume bottle — perfume bottle silhouette. */
export function paintPerfumeBottle(ctx: PaintCtx): string {
  const { palette, safe } = ctx
  const { cx, cy, r } = center(ctx)
  if (hitsSafe(cx, cy, safe, r + 1)) return ''
  const bw = r * 1.2
  const bh = r * 1.8
  const neckW = r * 0.4
  const neckH = r * 0.4
  return `<g data-art="motif" data-motif="perfume-bottle">
    <rect x="${(cx - bw / 2).toFixed(2)}" y="${(cy - bh / 2 + neckH).toFixed(2)}" width="${bw.toFixed(2)}" height="${(bh - neckH).toFixed(2)}" rx="${(r * 0.15).toFixed(2)}" fill="none" stroke="${palette.accent}" stroke-width="0.24" />
    <rect x="${(cx - neckW / 2).toFixed(2)}" y="${(cy - bh / 2).toFixed(2)}" width="${neckW.toFixed(2)}" height="${neckH.toFixed(2)}" fill="none" stroke="${palette.accent}" stroke-width="0.2" />
    <line x1="${(cx - neckW / 2).toFixed(2)}" y1="${(cy - bh / 2 + neckH / 2).toFixed(2)}" x2="${(cx + neckW / 2).toFixed(2)}" y2="${(cy - bh / 2 + neckH / 2).toFixed(2)}" stroke="${palette.accent}" stroke-opacity="0.4" stroke-width="0.12" />
  </g>`
}

/** Wheat sheaf — food wheat stalk. */
export function paintWheatSheaf(ctx: PaintCtx): string {
  const { palette, safe } = ctx
  const { cx, cy, r } = center(ctx)
  if (hitsSafe(cx, cy, safe, r + 1)) return ''
  let out = ''
  // Central stalk
  out += `<line x1="${cx.toFixed(2)}" y1="${(cy - r).toFixed(2)}" x2="${cx.toFixed(2)}" y2="${(cy + r).toFixed(2)}" stroke="${palette.accent}" stroke-width="0.2" />`
  // Grain pairs along the stalk
  const grains = 5
  for (let i = 0; i < grains; i++) {
    const t = (i + 0.5) / grains
    const gy = cy - r + t * r * 1.6
    const gx1 = cx - r * 0.3
    const gx2 = cx + r * 0.3
    out += `<ellipse cx="${gx1.toFixed(2)}" cy="${gy.toFixed(2)}" rx="${(r * 0.15).toFixed(2)}" ry="${(r * 0.08).toFixed(2)}" fill="none" stroke="${palette.accent}" stroke-width="0.16" transform="rotate(-30 ${gx1.toFixed(2)} ${gy.toFixed(2)})" />`
    out += `<ellipse cx="${gx2.toFixed(2)}" cy="${gy.toFixed(2)}" rx="${(r * 0.15).toFixed(2)}" ry="${(r * 0.08).toFixed(2)}" fill="none" stroke="${palette.accent}" stroke-width="0.16" transform="rotate(30 ${gx2.toFixed(2)} ${gy.toFixed(2)})" />`
  }
  return `<g data-art="motif" data-motif="wheat-sheaf">${out}</g>`
}

/** Honeycomb — food honeycomb hexagon pattern. */
export function paintHoneycomb(ctx: PaintCtx): string {
  const { palette, safe } = ctx
  const { cx, cy, r } = center(ctx)
  if (hitsSafe(cx, cy, safe, r + 1)) return ''
  let out = ''
  const hexR = r * 0.5
  // Central hexagon + 6 surrounding hexagons
  const hexagons = [[0, 0]]
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    hexagons.push([Math.cos(a) * hexR * 1.6, Math.sin(a) * hexR * 1.6])
  }
  for (const [dx, dy] of hexagons) {
    const hx = cx + dx
    const hy = cy + dy
    let points = ''
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      points += `${(hx + Math.cos(a) * hexR).toFixed(2)},${(hy + Math.sin(a) * hexR).toFixed(2)} `
    }
    out += `<polygon points="${points}" fill="none" stroke="${palette.accent}" stroke-width="0.18" />`
  }
  return `<g data-art="motif" data-motif="honeycomb">${out}</g>`
}

/** Circuit — electronics circuit traces. */
export function paintCircuit(ctx: PaintCtx): string {
  const { panel, palette, safe } = ctx
  const { x, y, w, h } = panel
  if (hitsSafe(x + w * 0.5, y + h * 0.16, safe, 3)) return ''
  let out = ''
  // Circuit traces — orthogonal lines with pads
  const traces = [
    [x + w * 0.1, y + h * 0.1, x + w * 0.4, y + h * 0.1],
    [x + w * 0.4, y + h * 0.1, x + w * 0.4, y + h * 0.2],
    [x + w * 0.6, y + h * 0.12, x + w * 0.9, y + h * 0.12],
    [x + w * 0.6, y + h * 0.12, x + w * 0.6, y + h * 0.22],
    [x + w * 0.2, y + h * 0.22, x + w * 0.5, y + h * 0.22],
  ]
  for (const [x1, y1, x2, y2] of traces) {
    out += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${palette.accent}" stroke-opacity="0.5" stroke-width="0.16" />`
  }
  // Pads at trace endpoints
  const pads = [
    [x + w * 0.1, y + h * 0.1],
    [x + w * 0.9, y + h * 0.12],
    [x + w * 0.2, y + h * 0.22],
    [x + w * 0.5, y + h * 0.22],
  ]
  for (const [px, py] of pads) {
    out += `<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="0.32" fill="${palette.accent}" fill-opacity="0.6" />`
  }
  return `<g data-art="motif" data-motif="circuit">${out}</g>`
}

/** Chip — electronics chip outline. */
export function paintChip(ctx: PaintCtx): string {
  const { palette, safe } = ctx
  const { cx, cy, r } = center(ctx)
  if (hitsSafe(cx, cy, safe, r + 1)) return ''
  let out = ''
  // Chip body
  const cw = r * 1.4
  const ch = r * 1.4
  out += `<rect x="${(cx - cw / 2).toFixed(2)}" y="${(cy - ch / 2).toFixed(2)}" width="${cw.toFixed(2)}" height="${ch.toFixed(2)}" fill="none" stroke="${palette.accent}" stroke-width="0.24" />`
  // Pins on all 4 sides
  const pins = 4
  for (let i = 0; i < pins; i++) {
    const t = (i + 0.5) / pins
    // Top + bottom pins
    out += `<line x1="${(cx - cw / 2 + t * cw).toFixed(2)}" y1="${(cy - ch / 2).toFixed(2)}" x2="${(cx - cw / 2 + t * cw).toFixed(2)}" y2="${(cy - ch / 2 - r * 0.25).toFixed(2)}" stroke="${palette.accent}" stroke-width="0.14" />`
    out += `<line x1="${(cx - cw / 2 + t * cw).toFixed(2)}" y1="${(cy + ch / 2).toFixed(2)}" x2="${(cx - cw / 2 + t * cw).toFixed(2)}" y2="${(cy + ch / 2 + r * 0.25).toFixed(2)}" stroke="${palette.accent}" stroke-width="0.14" />`
    // Left + right pins
    out += `<line x1="${(cx - cw / 2).toFixed(2)}" y1="${(cy - ch / 2 + t * ch).toFixed(2)}" x2="${(cx - cw / 2 - r * 0.25).toFixed(2)}" y2="${(cy - ch / 2 + t * ch).toFixed(2)}" stroke="${palette.accent}" stroke-width="0.14" />`
    out += `<line x1="${(cx + cw / 2).toFixed(2)}" y1="${(cy - ch / 2 + t * ch).toFixed(2)}" x2="${(cx + cw / 2 + r * 0.25).toFixed(2)}" y2="${(cy - ch / 2 + t * ch).toFixed(2)}" stroke="${palette.accent}" stroke-width="0.14" />`
  }
  // Pin 1 dot
  out += `<circle cx="${(cx - cw / 2 + r * 0.2).toFixed(2)}" cy="${(cy - ch / 2 + r * 0.2).toFixed(2)}" r="0.18" fill="${palette.accent}" fill-opacity="0.7" />`
  return `<g data-art="motif" data-motif="chip">${out}</g>`
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

export const sectorMotifEntries: GraphicEntry[] = [
  entry('foil-stripe', 'Foil stripe', ['luxury'], ['perfume'], 'sparse', 0.6, paintFoilStripe),
  entry('perfume-bottle', 'Perfume bottle', ['luxury', 'classic'], ['perfume'], 'balanced', 0.6, paintPerfumeBottle),
  entry('wheat-sheaf', 'Wheat sheaf', ['eco', 'classic'], ['food', 'beverage'], 'balanced', 0.6, paintWheatSheaf),
  entry('honeycomb', 'Honeycomb', ['eco', 'classic'], ['food', 'beverage'], 'balanced', 0.6, paintHoneycomb),
  entry('circuit', 'Circuit traces', ['modern'], ['electronics'], 'balanced', 0.5, paintCircuit),
  entry('chip', 'Chip outline', ['modern'], ['electronics'], 'balanced', 0.6, paintChip),
]

registerGraphics(sectorMotifEntries)
