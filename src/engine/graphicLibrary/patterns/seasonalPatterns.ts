/**
 * Seasonal patterns — 2 new real SVG pattern painters.
 * snowflake: winter snowflake scatter
 * blossom: spring blossom scatter
 */
import type { GraphicEntry, GraphicMeta, PaintCtx, SafeRect } from '../types'
import { registerGraphics } from '../registry'
import type { StyleType } from '../../../types'
import type { SectorId } from '../../designSystem/types'

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

/** Snowflake — winter snowflake scatter. 6-point snowflakes at random positions. */
export function paintSnowflake(ctx: PaintCtx): string {
  const { panel, palette, opacity, safe, seed } = ctx
  const { x, y, w, h } = panel
  const op = Math.min(opacity, 0.18)
  const rand = rng((seed || 23) * 7)
  let out = ''
  const flakes = 5
  for (let i = 0; i < flakes; i++) {
    const fx = 0.1 + rand() * 0.8
    const fy = 0.08 + rand() * 0.84
    const cx = x + w * fx
    const cy = y + h * fy
    if (hitsSafe(cx, cy, safe, 2.5)) continue
    const r = 1.4 + rand() * 1.2
    // 6-point snowflake — 3 lines through center at 60° intervals
    for (let j = 0; j < 3; j++) {
      const a = (j / 3) * Math.PI
      const x1 = cx + Math.cos(a) * r
      const y1 = cy + Math.sin(a) * r
      const x2 = cx - Math.cos(a) * r
      const y2 = cy - Math.sin(a) * r
      out += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${palette.accent}" stroke-opacity="${op}" stroke-width="0.16" />`
    }
    // Small dots at tips
    for (let j = 0; j < 6; j++) {
      const a = (j / 6) * Math.PI * 2
      out += `<circle cx="${(cx + Math.cos(a) * r).toFixed(2)}" cy="${(cy + Math.sin(a) * r).toFixed(2)}" r="0.16" fill="${palette.accent}" fill-opacity="${op * 1.5}" />`
    }
  }
  return `<g data-art="pattern" data-pattern="snowflake">${out}</g>`
}

/** Blossom — spring blossom scatter. 5-petal blossoms at random positions. */
export function paintBlossom(ctx: PaintCtx): string {
  const { panel, palette, opacity, safe, seed } = ctx
  const { x, y, w, h } = panel
  const op = Math.min(opacity, 0.16)
  const rand = rng((seed || 29) * 11)
  let out = ''
  const blossoms = 5
  for (let i = 0; i < blossoms; i++) {
    const fx = 0.1 + rand() * 0.8
    const fy = 0.08 + rand() * 0.84
    const cx = x + w * fx
    const cy = y + h * fy
    if (hitsSafe(cx, cy, safe, 2.5)) continue
    const r = 1.6 + rand() * 1.4
    // 5 petals
    for (let j = 0; j < 5; j++) {
      const a = (j / 5) * Math.PI * 2
      const px = cx + Math.cos(a) * r * 0.6
      const py = cy + Math.sin(a) * r * 0.6
      out += `<ellipse cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" rx="${(r * 0.35).toFixed(2)}" ry="${(r * 0.2).toFixed(2)}" fill="none" stroke="${palette.accent}" stroke-opacity="${op}" stroke-width="0.14" transform="rotate(${(a * 180 / Math.PI + 90).toFixed(1)} ${px.toFixed(2)} ${py.toFixed(2)})" />`
    }
    // Center dot
    out += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="0.24" fill="${palette.accent}" fill-opacity="${op * 1.8}" />`
  }
  return `<g data-art="pattern" data-pattern="blossom">${out}</g>`
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

export const seasonalPatternEntries: GraphicEntry[] = [
  entry('snowflake', 'Snowflake scatter', ['luxury', 'classic', 'minimal'], ['food', 'beverage'], 'sparse', 0.18, paintSnowflake),
  entry('blossom', 'Blossom scatter', ['eco', 'playful'], ['food', 'beverage', 'cream', 'serum'], 'sparse', 0.16, paintBlossom),
]

registerGraphics(seasonalPatternEntries)
