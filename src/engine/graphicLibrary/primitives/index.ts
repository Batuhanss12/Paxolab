/**
 * Primitive registry — wraps existing illustrationPrimitives atoms into the GraphicLibrary.
 * Primitives are small atomic SVG marks (arc, dot, line, diamond, wave, leaf, grain, tick).
 */
import type { GraphicEntry, GraphicMeta, PaintCtx } from '../types'
import { registerGraphics } from '../registry'
import type { PrimitiveId } from '../../brain/DesignPlan'
import type { StyleType } from '../../../types'
import type { SectorId } from '../../designSystem/types'

// Inline atom painters — extracted from illustrationPrimitives.ts atom() function.
function atom(id: PrimitiveId, x: number, y: number, color: string, sw: number): string {
  if (id === 'leaf') {
    return `<path d="M${x} ${y - 2.1} C${x + 1.6} ${y - 0.4} ${x + 1.5} ${y + 1.4} ${x} ${y + 2.2} C${x - 1.5} ${y + 1.4} ${x - 1.6} ${y - 0.4} ${x} ${y - 2.1}" fill="none" stroke="${color}" stroke-width="${sw}" />`
  }
  if (id === 'grain') {
    return `<ellipse cx="${x}" cy="${y}" rx="1.35" ry="0.55" fill="none" stroke="${color}" stroke-width="${sw}" />`
  }
  if (id === 'diamond') {
    return `<path d="M${x} ${y - 1.15} L${x + 1.15} ${y} L${x} ${y + 1.15} L${x - 1.15} ${y} Z" fill="none" stroke="${color}" stroke-width="${sw}" />`
  }
  if (id === 'rule') {
    return `<line x1="${x - 3.2}" y1="${y}" x2="${x + 3.2}" y2="${y}" stroke="${color}" stroke-width="${sw}" />`
  }
  if (id === 'wave') {
    return `<path d="M${x - 3.4} ${y} C${x - 1.6} ${y - 1.2} ${x + 1.6} ${y + 1.2} ${x + 3.4} ${y}" fill="none" stroke="${color}" stroke-width="${sw}" />`
  }
  if (id === 'arc') {
    return `<path d="M${x - 2.4} ${y + 0.8} A2.6 2.6 0 0 1 ${x + 2.4} ${y + 0.8}" fill="none" stroke="${color}" stroke-width="${sw}" />`
  }
  if (id === 'dot') {
    return `<circle cx="${x}" cy="${y}" r="0.42" fill="${color}" fill-opacity="0.55" />`
  }
  return `<line x1="${x}" y1="${y - 1.6}" x2="${x}" y2="${y + 1.6}" stroke="${color}" stroke-width="${sw}" />`
}

function primitivePainter(id: PrimitiveId): (ctx: PaintCtx) => string {
  return (ctx) => {
    const { panel, palette, safe } = ctx
    const cx = panel.x + panel.w * 0.5
    const cy = panel.y + panel.h * 0.5
    if (safe && cx > safe.x - 1.2 && cx < safe.x + safe.w + 1.2 && cy > safe.y - 1.2 && cy < safe.y + safe.h + 1.2) return ''
    return `<g data-art="primitive" data-prim="${id}">${atom(id, cx, cy, palette.accent, 0.22)}</g>`
  }
}

function entry(
  id: PrimitiveId,
  label: string,
  styles: StyleType[],
  sectors: SectorId[],
  density: 'sparse' | 'balanced' | 'dense',
): GraphicEntry {
  const meta: GraphicMeta = { id, category: 'primitive', label, styles, sectors, density, opacityCap: 0.55 }
  return { meta, paint: primitivePainter(id) }
}

export const primitiveEntries: GraphicEntry[] = [
  entry('leaf', 'Leaf', ['eco'], ['food', 'beverage'], 'sparse'),
  entry('grain', 'Grain', ['eco'], ['food', 'beverage'], 'sparse'),
  entry('diamond', 'Diamond', ['luxury', 'classic'], ['perfume'], 'sparse'),
  entry('rule', 'Rule line', ['luxury', 'classic', 'modern'], [], 'sparse'),
  entry('wave', 'Wave', ['playful', 'eco'], ['cleaning'], 'sparse'),
  entry('arc', 'Arc', ['modern', 'playful'], [], 'sparse'),
  entry('dot', 'Dot', ['modern', 'playful', 'minimal'], [], 'sparse'),
  entry('tick', 'Tick', ['modern'], ['electronics'], 'sparse'),
]

registerGraphics(primitiveEntries)

// Register new primitives (bezier, spiral, blob, grid).
import './newPrimitives'
