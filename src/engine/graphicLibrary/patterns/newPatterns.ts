/**
 * New patterns — 5 new real SVG pattern painters.
 * marble: flowing organic veining for luxury perfume
 * organic: soft organic blobs for eco/cream
 * luxuryLine: thin gold hairlines for luxury classic
 * botanical: dense botanical silhouette field for eco food
 * technical: technical schematic grid for electronics
 */
import type { GraphicEntry, GraphicMeta, PaintCtx, SafeRect } from '../types'
import { registerGraphics } from '../registry'
import type { StyleType } from '../../../types'
import type { SectorId } from '../../designSystem/types'

/** Deterministic pseudo-random from seed — stable across runs. */
function rng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

function hitsSafe(x: number, y: number, safe?: SafeRect, pad = 1.2): boolean {
  if (!safe) return false
  return x > safe.x - pad && x < safe.x + safe.w + pad && y > safe.y - pad && y < safe.y + safe.h + pad
}

/**
 * Marble — flowing organic veining. Luxury perfume alternative to contour gold.
 * Multiple thin bezier veins with slight opacity variation, never crossing the lockup.
 */
export function paintMarble(ctx: PaintCtx): string {
  const { panel, palette, opacity, safe, seed } = ctx
  const { x, y, w, h } = panel
  const op = Math.min(opacity, 0.2)
  const rand = rng(seed || 7)
  let out = ''
  const veins = 5
  for (let i = 0; i < veins; i++) {
    const y0 = y + h * (0.1 + (i + 0.5) / veins * 0.8)
    const amp = h * (0.04 + rand() * 0.04)
    const c1x = x + w * (0.18 + rand() * 0.1)
    const c2x = x + w * (0.55 + rand() * 0.15)
    const c3x = x + w * (0.82 - rand() * 0.08)
    if (hitsSafe(x + w * 0.5, y0, safe, amp + 1.5)) continue
    const sw = 0.14 + (i % 2) * 0.05
    const veinOp = op * (0.7 + rand() * 0.3)
    out += `<path d="M${x + 1} ${y0} C${c1x} ${y0 + amp} ${c2x} ${y0 - amp} ${c3x} ${y0 + amp * 0.4} S${x + w - 1} ${y0} ${x + w - 1} ${y0}" fill="none" stroke="${palette.accent}" stroke-opacity="${veinOp}" stroke-width="${sw}" />`
  }
  return `<g data-art="pattern" data-pattern="marble">${out}</g>`
}

/**
 * Organic — soft organic blob shapes scattered, never overlapping lockup.
 * Eco/cream alternative to leaf stamps — softer, more atmospheric.
 */
export function paintOrganic(ctx: PaintCtx): string {
  const { panel, palette, opacity, safe, seed } = ctx
  const { x, y, w, h } = panel
  const op = Math.min(opacity, 0.16)
  const rand = rng((seed || 11) * 3)
  let out = ''
  const blobs = 6
  for (let i = 0; i < blobs; i++) {
    const fx = 0.1 + rand() * 0.8
    const fy = 0.08 + rand() * 0.84
    const cx = x + w * fx
    const cy = y + h * fy
    if (hitsSafe(cx, cy, safe, 3)) continue
    const rx = 2.4 + rand() * 2.2
    const ry = rx * (0.7 + rand() * 0.4)
    const rot = rand() * 60 - 30
    out += `<ellipse cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" rx="${rx.toFixed(2)}" ry="${ry.toFixed(2)}" fill="none" stroke="${palette.accent}" stroke-opacity="${op}" stroke-width="0.2" transform="rotate(${rot.toFixed(1)} ${cx.toFixed(2)} ${cy.toFixed(2)})" />`
  }
  return `<g data-art="pattern" data-pattern="organic">${out}</g>`
}

/**
 * Luxury line — thin gold hairlines forming a refined grid frame.
 * Luxury/classic alternative to ornamental rail — more architectural, less ornate.
 */
export function paintLuxuryLine(ctx: PaintCtx): string {
  const { panel, palette, opacity, safe } = ctx
  const { x, y, w, h } = panel
  const op = Math.min(opacity, 0.22)
  const inset = 3.2
  let out = ''
  // Outer thin frame
  out += `<rect x="${x + inset}" y="${y + inset}" width="${w - inset * 2}" height="${h - inset * 2}" fill="none" stroke="${palette.accent}" stroke-opacity="${op * 0.7}" stroke-width="0.14" />`
  // Inner hairline frame
  out += `<rect x="${x + inset + 1.8}" y="${y + inset + 1.8}" width="${w - inset * 2 - 3.6}" height="${h - inset * 2 - 3.6}" fill="none" stroke="${palette.accent}" stroke-opacity="${op * 0.4}" stroke-width="0.1" />`
  // Corner accents — small crosses at each corner
  const corners = [
    [x + inset, y + inset],
    [x + w - inset, y + inset],
    [x + inset, y + h - inset],
    [x + w - inset, y + h - inset],
  ]
  for (const [cx, cy] of corners) {
    if (hitsSafe(cx, cy, safe, 2)) continue
    out += `<line x1="${cx - 1.4}" y1="${cy}" x2="${cx + 1.4}" y2="${cy}" stroke="${palette.accent}" stroke-opacity="${op}" stroke-width="0.16" />`
    out += `<line x1="${cx}" y1="${cy - 1.4}" x2="${cx}" y2="${cy + 1.4}" stroke="${palette.accent}" stroke-opacity="${op}" stroke-width="0.16" />`
  }
  return `<g data-art="pattern" data-pattern="luxury-line">${out}</g>`
}

/**
 * Botanical — dense botanical silhouette field (leaves + stems).
 * Eco/food alternative to leaf stamps — richer, more layered.
 */
export function paintBotanical(ctx: PaintCtx): string {
  const { panel, palette, opacity, safe, seed } = ctx
  const { x, y, w, h } = panel
  const op = Math.min(opacity, 0.18)
  const rand = rng((seed || 19) * 5)
  let out = ''
  const stems = 7
  for (let i = 0; i < stems; i++) {
    const fx = 0.08 + rand() * 0.84
    const fy = 0.1 + rand() * 0.8
    const cx = x + w * fx
    const cy = y + h * fy
    if (hitsSafe(cx, cy, safe, 2.5)) continue
    const angle = rand() * 360
    const len = 3 + rand() * 2.5
    const rad = (angle * Math.PI) / 180
    const ex = cx + Math.cos(rad) * len
    const ey = cy + Math.sin(rad) * len
    // Stem
    out += `<line x1="${cx.toFixed(2)}" y1="${cy.toFixed(2)}" x2="${ex.toFixed(2)}" y2="${ey.toFixed(2)}" stroke="${palette.accent}" stroke-opacity="${op}" stroke-width="0.16" />`
    // Leaf pair at end
    const lrx = 1.4 + rand() * 0.6
    const lry = 0.6 + rand() * 0.3
    const perpRad = rad + Math.PI / 2
    const lx1 = ex + Math.cos(perpRad) * lrx
    const ly1 = ey + Math.sin(perpRad) * lry
    const lx2 = ex - Math.cos(perpRad) * lrx
    const ly2 = ey - Math.sin(perpRad) * lry
    out += `<path d="M${ex.toFixed(2)} ${ey.toFixed(2)} Q${lx1.toFixed(2)} ${ly1.toFixed(2)} ${ex.toFixed(2)} ${ey.toFixed(2)}" fill="none" stroke="${palette.accent}" stroke-opacity="${op * 0.8}" stroke-width="0.14" />`
    out += `<path d="M${ex.toFixed(2)} ${ey.toFixed(2)} Q${lx2.toFixed(2)} ${ly2.toFixed(2)} ${ex.toFixed(2)} ${ey.toFixed(2)}" fill="none" stroke="${palette.accent}" stroke-opacity="${op * 0.8}" stroke-width="0.14" />`
  }
  return `<g data-art="pattern" data-pattern="botanical">${out}</g>`
}

/**
 * Technical — technical schematic grid with registration marks.
 * Electronics alternative to dotgrid — more engineered, with crosshairs.
 */
export function paintTechnical(ctx: PaintCtx): string {
  const { panel, palette, opacity, safe } = ctx
  const { x, y, w, h } = panel
  const op = Math.min(opacity, 0.14)
  let out = ''
  const step = 6.8
  // Faint grid
  for (let gx = x + 4; gx < x + w - 2; gx += step) {
    if (safe && gx > safe.x - 1 && gx < safe.x + safe.w + 1) {
      out += `<line x1="${gx}" y1="${y + 2}" x2="${gx}" y2="${Math.max(y + 2, safe.y - 0.5)}" stroke="${palette.accent}" stroke-opacity="${op}" stroke-width="0.1" />`
      out += `<line x1="${gx}" y1="${Math.min(y + h - 2, safe.y + safe.h + 0.5)}" x2="${gx}" y2="${y + h - 2}" stroke="${palette.accent}" stroke-opacity="${op}" stroke-width="0.1" />`
    } else {
      out += `<line x1="${gx}" y1="${y + 2}" x2="${gx}" y2="${y + h - 2}" stroke="${palette.accent}" stroke-opacity="${op}" stroke-width="0.1" />`
    }
  }
  for (let gy = y + 4; gy < y + h - 2; gy += step) {
    if (safe && gy > safe.y - 1 && gy < safe.y + safe.h + 1) continue
    out += `<line x1="${x + 2}" y1="${gy}" x2="${x + w - 2}" y2="${gy}" stroke="${palette.accent}" stroke-opacity="${op}" stroke-width="0.1" />`
  }
  // Crosshair registration marks at corners
  const marks = [
    [x + 4, y + 4],
    [x + w - 4, y + 4],
    [x + 4, y + h - 4],
    [x + w - 4, y + h - 4],
  ]
  for (const [mx, my] of marks) {
    if (hitsSafe(mx, my, safe, 2)) continue
    out += `<line x1="${mx - 1.6}" y1="${my}" x2="${mx + 1.6}" y2="${my}" stroke="${palette.accent}" stroke-opacity="${op * 1.8}" stroke-width="0.18" />`
    out += `<line x1="${mx}" y1="${my - 1.6}" x2="${mx}" y2="${my + 1.6}" stroke="${palette.accent}" stroke-opacity="${op * 1.8}" stroke-width="0.18" />`
    out += `<circle cx="${mx}" cy="${my}" r="0.28" fill="none" stroke="${palette.accent}" stroke-opacity="${op * 1.5}" stroke-width="0.12" />`
  }
  return `<g data-art="pattern" data-pattern="technical">${out}</g>`
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
  const meta: GraphicMeta = { id, category: 'pattern', label, styles, sectors, density, opacityCap }
  return { meta, paint }
}

export const newPatternEntries: GraphicEntry[] = [
  entry('marble', 'Marble veining', ['luxury'], ['perfume'], 'balanced', 0.2, paintMarble),
  entry('organic-blob', 'Organic blobs', ['eco', 'playful'], ['cream', 'serum'], 'balanced', 0.16, paintOrganic),
  entry('luxury-line', 'Luxury hairline frame', ['luxury', 'classic'], [], 'sparse', 0.22, paintLuxuryLine),
  entry('botanical', 'Botanical silhouette field', ['eco'], ['food', 'beverage'], 'balanced', 0.18, paintBotanical),
  entry('technical', 'Technical schematic grid', ['modern'], ['electronics'], 'sparse', 0.14, paintTechnical),
]

registerGraphics(newPatternEntries)
