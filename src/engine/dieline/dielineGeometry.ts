/**
 * Dieline geometry — panel rectangle helpers, boolean union outline, crease detection.
 * Extracted from buildDieline.ts to isolate geometry from structure definitions.
 */
import type { Panel, Point } from '../../types'

const EPS = 1e-9

export function rect(id: string, role: Panel['role'], x: number, y: number, w: number, h: number): Panel {
  return {
    id,
    role,
    x,
    y,
    w,
    h,
    polygon: [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ],
  }
}

/** Axis-aligned bounding box of panels (4 corners). Kept for comparison / fallbacks. */
export function outline(panels: Panel[]): Point[] {
  const xs = panels.flatMap((p) => [p.x, p.x + p.w])
  const ys = panels.flatMap((p) => [p.y, p.y + p.h])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ]
}

function pointKey(x: number, y: number): string {
  return `${x},${y}`
}

/** Drop collinear intermediate vertices on an orthogonal closed ring (no duplicate close). */
function simplifyOrthogonalRing(ring: Point[]): Point[] {
  if (ring.length < 3) return ring
  const out: Point[] = []
  const n = ring.length
  for (let i = 0; i < n; i++) {
    const prev = ring[(i - 1 + n) % n]!
    const curr = ring[i]!
    const next = ring[(i + 1) % n]!
    const ax = curr.x - prev.x
    const ay = curr.y - prev.y
    const bx = next.x - curr.x
    const by = next.y - curr.y
    if (Math.abs(ax * by - ay * bx) > EPS) out.push(curr)
  }
  return out.length >= 3 ? out : ring
}

/**
 * Outer boundary of the boolean union of axis-aligned panel rectangles.
 * Shared internal edges cancel; returns a closed orthogonal ring (no repeated first/last).
 * Winding matches legacy `outline`: clockwise in Y-down screen space.
 */
export function outlineUnion(panels: Panel[]): Point[] {
  if (panels.length === 0) return []
  if (panels.length === 1) {
    const p = panels[0]!
    return [
      { x: p.x, y: p.y },
      { x: p.x + p.w, y: p.y },
      { x: p.x + p.w, y: p.y + p.h },
      { x: p.x, y: p.y + p.h },
    ]
  }

  const xs = [...new Set(panels.flatMap((p) => [p.x, p.x + p.w]))].sort((a, b) => a - b)
  const ys = [...new Set(panels.flatMap((p) => [p.y, p.y + p.h]))].sort((a, b) => a - b)
  const ni = xs.length - 1
  const nj = ys.length - 1
  if (ni <= 0 || nj <= 0) return outline(panels)

  const inside: boolean[][] = Array.from({ length: ni }, () => Array<boolean>(nj).fill(false))
  for (const p of panels) {
    for (let i = 0; i < ni; i++) {
      if (!(xs[i + 1]! > p.x + EPS && xs[i]! < p.x + p.w - EPS)) continue
      for (let j = 0; j < nj; j++) {
        if (ys[j + 1]! > p.y + EPS && ys[j]! < p.y + p.h - EPS) inside[i]![j] = true
      }
    }
  }

  type DirEdge = { ax: number; ay: number; bx: number; by: number }
  const edges: DirEdge[] = []

  // Vertical cell boundaries — CW in Y-down keeps filled on the walker's right
  for (let i = 0; i <= ni; i++) {
    for (let j = 0; j < nj; j++) {
      const leftIn = i > 0 && !!inside[i - 1]![j]
      const rightIn = i < ni && !!inside[i]![j]
      if (leftIn === rightIn) continue
      const x = xs[i]!
      if (rightIn) {
        edges.push({ ax: x, ay: ys[j + 1]!, bx: x, by: ys[j]! })
      } else {
        edges.push({ ax: x, ay: ys[j]!, bx: x, by: ys[j + 1]! })
      }
    }
  }

  // Horizontal cell boundaries
  for (let j = 0; j <= nj; j++) {
    for (let i = 0; i < ni; i++) {
      const belowIn = j < nj && !!inside[i]![j]
      const aboveIn = j > 0 && !!inside[i]![j - 1]
      if (belowIn === aboveIn) continue
      const y = ys[j]!
      if (belowIn) {
        edges.push({ ax: xs[i]!, ay: y, bx: xs[i + 1]!, by: y })
      } else {
        edges.push({ ax: xs[i + 1]!, ay: y, bx: xs[i]!, by: y })
      }
    }
  }

  if (edges.length === 0) return outline(panels)

  const adj = new Map<string, Point[]>()
  for (const e of edges) {
    const k = pointKey(e.ax, e.ay)
    let list = adj.get(k)
    if (!list) {
      list = []
      adj.set(k, list)
    }
    list.push({ x: e.bx, y: e.by })
  }

  let start: Point | null = null
  for (const e of edges) {
    const a = { x: e.ax, y: e.ay }
    if (!start || a.y < start.y - EPS || (Math.abs(a.y - start.y) <= EPS && a.x < start.x)) {
      start = a
    }
  }
  if (!start) return outline(panels)

  const ring: Point[] = []
  const visited = new Set<string>()
  let curr = start
  for (let step = 0; step < edges.length + 2; step++) {
    ring.push(curr)
    const outs = adj.get(pointKey(curr.x, curr.y)) ?? []
    let next: Point | null = null
    for (const cand of outs) {
      const ek = `${pointKey(curr.x, curr.y)}>${pointKey(cand.x, cand.y)}`
      if (visited.has(ek)) continue
      visited.add(ek)
      next = cand
      break
    }
    if (!next) break
    curr = next
    if (Math.abs(curr.x - start.x) <= EPS && Math.abs(curr.y - start.y) <= EPS) break
  }

  return simplifyOrthogonalRing(ring)
}

export function creaseBetween(a: Panel, b: Panel): [Point, Point] | null {
  const ax2 = a.x + a.w
  const ay2 = a.y + a.h
  const bx2 = b.x + b.w
  const by2 = b.y + b.h
  if (Math.abs(ax2 - b.x) < 0.01) {
    const y1 = Math.max(a.y, b.y)
    const y2 = Math.min(ay2, by2)
    if (y2 > y1) return [{ x: ax2, y: y1 }, { x: ax2, y: y2 }]
  }
  if (Math.abs(ay2 - b.y) < 0.01) {
    const x1 = Math.max(a.x, b.x)
    const x2 = Math.min(ax2, bx2)
    if (x2 > x1) return [{ x: x1, y: ay2 }, { x: x2, y: ay2 }]
  }
  return null
}

export function bounds(panels: Panel[]): { width: number; height: number } {
  return {
    width: Math.max(...panels.map((p) => p.x + p.w)),
    height: Math.max(...panels.map((p) => p.y + p.h)),
  }
}
