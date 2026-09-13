import type { Palette, Panel } from '../../types'
import type { PrimitiveId } from '../brain/DesignPlan'

type SafeRect = { x: number; y: number; w: number; h: number }

function slots(panel: Panel, n: number): { x: number; y: number }[] {
  const { x, y, w, h } = panel
  const pts = [
    { x: x + w * 0.18, y: y + h * 0.22 },
    { x: x + w * 0.82, y: y + h * 0.22 },
    { x: x + w * 0.14, y: y + h * 0.78 },
    { x: x + w * 0.86, y: y + h * 0.78 },
    { x: x + w * 0.5, y: y + h * 0.12 },
    { x: x + w * 0.22, y: y + h * 0.5 },
    { x: x + w * 0.78, y: y + h * 0.5 },
  ]
  return pts.slice(0, n)
}

function hits(pt: { x: number; y: number }, safe?: SafeRect): boolean {
  if (!safe) return false
  return pt.x > safe.x - 1.2 && pt.x < safe.x + safe.w + 1.2 && pt.y > safe.y - 1.2 && pt.y < safe.y + safe.h + 1.2
}

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

export function paintPrimitives(
  panel: Panel,
  p: Palette,
  ids: PrimitiveId[],
  stroke = 0.22,
  safe?: SafeRect,
): string {
  if (!ids.length) return ''
  return slots(panel, ids.length)
    .map((pt, i) => {
      if (hits(pt, safe)) return ''
      const id = ids[i]
      return `<g data-art="primitive" data-prim="${id}">${atom(id, pt.x, pt.y, p.accent, stroke)}</g>`
    })
    .join('')
}
