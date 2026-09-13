/**
 * New primitives — 4 new real SVG primitive painters.
 * bezier: smooth bezier curve
 * spiral: logarithmic spiral
 * blob: organic blob shape
 * grid: small grid cluster
 */
import type { GraphicEntry, GraphicMeta, PaintCtx, SafeRect } from '../types'
import { registerGraphics } from '../registry'
import type { StyleType } from '../../../types'
import type { SectorId } from '../../designSystem/types'

function hitsSafe(x: number, y: number, safe?: SafeRect, pad = 1.2): boolean {
  if (!safe) return false
  return x > safe.x - pad && x < safe.x + safe.w + pad && y > safe.y - pad && y < safe.y + safe.h + pad
}

function center(ctx: PaintCtx): { cx: number; cy: number } {
  const { panel } = ctx
  return { cx: panel.x + panel.w * 0.5, cy: panel.y + panel.h * 0.5 }
}

/** Bezier — smooth S-curve. Modern/organic accent. */
export function paintBezier(ctx: PaintCtx): string {
  const { panel, palette, safe } = ctx
  const cx = panel.x + panel.w * 0.5
  const cy = panel.y + panel.h * 0.5
  if (hitsSafe(cx, cy, safe, 3.5)) return ''
  const x0 = cx - 3.4
  const x1 = cx + 3.4
  const c1x = cx - 1.6
  const c1y = cy - 1.2
  const c2x = cx + 1.6
  const c2y = cy + 1.2
  return `<g data-art="primitive" data-prim="bezier"><path d="M${x0.toFixed(2)} ${cy.toFixed(2)} C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${x1.toFixed(2)} ${cy.toFixed(2)}" fill="none" stroke="${palette.accent}" stroke-width="0.22" /></g>`
}

/** Spiral — logarithmic spiral. Eco/organic accent. */
export function paintSpiral(ctx: PaintCtx): string {
  const { palette, safe } = ctx
  const { cx, cy } = center(ctx)
  if (hitsSafe(cx, cy, safe, 3)) return ''
  const turns = 2.2
  const steps = 28
  let d = `M${cx.toFixed(2)} ${cy.toFixed(2)} `
  for (let i = 1; i <= steps; i++) {
    const t = (i / steps) * turns * Math.PI * 2
    const r = 0.2 + (i / steps) * 2.6
    const px = cx + Math.cos(t) * r
    const py = cy + Math.sin(t) * r
    d += `L${px.toFixed(2)} ${py.toFixed(2)} `
  }
  return `<g data-art="primitive" data-prim="spiral"><path d="${d}" fill="none" stroke="${palette.accent}" stroke-width="0.18" /></g>`
}

/** Blob — organic closed blob shape. Eco/playful accent. */
export function paintBlob(ctx: PaintCtx): string {
  const { palette, safe } = ctx
  const { cx, cy } = center(ctx)
  if (hitsSafe(cx, cy, safe, 3)) return ''
  const points = 8
  const baseR = 2.4
  let d = ''
  for (let i = 0; i < points; i++) {
    const t = (i / points) * Math.PI * 2
    const r = baseR * (0.85 + ((i % 3) * 0.1))
    const px = cx + Math.cos(t) * r
    const py = cy + Math.sin(t) * r
    const nextT = ((i + 1) / points) * Math.PI * 2
    const nextR = baseR * (0.85 + (((i + 1) % 3) * 0.1))
    const npx = cx + Math.cos(nextT) * nextR
    const npy = cy + Math.sin(nextT) * nextR
    const cpx = (px + npx) / 2
    const cpy = (py + npy) / 2
    d += `${i === 0 ? 'M' : 'Q'}${px.toFixed(2)} ${py.toFixed(2)} ${cpx.toFixed(2)} ${cpy.toFixed(2)} `
  }
  d += 'Z'
  return `<g data-art="primitive" data-prim="blob"><path d="${d}" fill="none" stroke="${palette.accent}" stroke-width="0.2" /></g>`
}

/** Grid — small 3×3 grid cluster. Modern/technical accent. */
export function paintGrid(ctx: PaintCtx): string {
  const { palette, safe } = ctx
  const { cx, cy } = center(ctx)
  if (hitsSafe(cx, cy, safe, 3)) return ''
  let out = ''
  const step = 1.4
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const px = cx + i * step
      const py = cy + j * step
      out += `<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="0.32" fill="${palette.accent}" fill-opacity="0.5" />`
    }
  }
  return `<g data-art="primitive" data-prim="grid">${out}</g>`
}

function entry(
  id: string,
  label: string,
  styles: StyleType[],
  sectors: SectorId[],
  density: 'sparse' | 'balanced' | 'dense',
): GraphicEntry {
  const meta: GraphicMeta = { id, category: 'primitive', label, styles, sectors, density, opacityCap: 0.55 }
  return { meta, paint: { bezier: paintBezier, spiral: paintSpiral, blob: paintBlob, grid: paintGrid }[id]! }
}

export const newPrimitiveEntries: GraphicEntry[] = [
  entry('bezier', 'Bezier curve', ['modern', 'eco'], [], 'sparse'),
  entry('spiral', 'Spiral', ['eco', 'playful'], ['food', 'beverage'], 'sparse'),
  entry('blob', 'Organic blob', ['eco', 'playful'], ['cream', 'serum'], 'sparse'),
  entry('grid', 'Grid cluster', ['modern'], ['electronics'], 'sparse'),
]

registerGraphics(newPrimitiveEntries)
