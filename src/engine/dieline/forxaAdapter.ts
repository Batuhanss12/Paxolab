import type { DielineModel, DimensionsMm, Panel, PanelKind, PanelRole, Point, StructureId } from '../../types'
import type { DielineResult, Panel as MxPanel, Path } from './forxa/types'

/**
 * A panel's own frame when its cut is a rectangle that happens to be rotated on the sheet.
 *
 * A polygon prism's wall is exactly that: `polygonBox` builds it as `[P0, P1, P1+n·h, P0+n·h]` with
 * `n` perpendicular to `P0→P1`, so the shape is a true rectangle at whatever heading that wall sits
 * at. Describing it by its axis-aligned bounding box tells the painter it has a 148.92 × 137.94
 * canvas when the wall is 90 × 120 — measured on the triangular gift box, 53% of the box the
 * painter fills is outside the cut, and the clip silently eats whatever lands there: 23 of 51
 * placed elements, the worst 34.45 mm past the knife.
 *
 * Returns null for anything that is not a rotated rectangle, so discs, trapezoids and glue tabs
 * keep the bounding box they have always had.
 */
export function rotatedRectFrame(polygon: Point[]): { x: number; y: number; w: number; h: number; deg: number } | null {
  const pts = polygon.length === 5 ? polygon.slice(0, 4) : polygon
  if (pts.length !== 4) return null
  const edge = (i: number) => {
    const a = pts[i]!
    const b = pts[(i + 1) % 4]!
    return { dx: b.x - a.x, dy: b.y - a.y, len: Math.hypot(b.x - a.x, b.y - a.y) }
  }
  const e = [0, 1, 2, 3].map(edge)
  if (e.some((s) => s.len < 1e-6)) return null
  // Every corner square, opposite sides equal — the definition, checked rather than assumed.
  for (let i = 0; i < 4; i++) {
    const a = e[i]!
    const b = e[(i + 1) % 4]!
    const dot = (a.dx * b.dx + a.dy * b.dy) / (a.len * b.len)
    if (Math.abs(dot) > 1e-6) return null
  }
  /*
   * Which corner is the origin is not free. `rotate(θ)` sends local +y to `(-sinθ, cosθ)`, so the
   * origin must be the corner whose height edge runs that way; start from the other one and the
   * face lands on the far side of the crease, mirrored.
   *
   * Of the two corners that satisfy it, the one whose width edge matches the polygon's first edge
   * is preferred — `polygonBox` writes that edge as the base crease, so a wall is painted
   * `side × height` and not turned on its side.
   */
  const R90 = (v: { dx: number; dy: number }) => ({ dx: -v.dy, dy: v.dx })
  const frames: { x: number; y: number; w: number; h: number; deg: number }[] = []
  for (let i = 0; i < 4; i++) {
    const o = pts[i]!
    for (const [ai, bi] of [
      [(i + 1) % 4, (i + 3) % 4],
      [(i + 3) % 4, (i + 1) % 4],
    ] as const) {
      const u = { dx: pts[ai]!.x - o.x, dy: pts[ai]!.y - o.y }
      const v = { dx: pts[bi]!.x - o.x, dy: pts[bi]!.y - o.y }
      const ulen = Math.hypot(u.dx, u.dy)
      const vlen = Math.hypot(v.dx, v.dy)
      const want = R90({ dx: (u.dx / ulen) * vlen, dy: (u.dy / ulen) * vlen })
      if (Math.hypot(v.dx - want.dx, v.dy - want.dy) > vlen * 1e-6 + 1e-9) continue
      frames.push({ x: o.x, y: o.y, w: ulen, h: vlen, deg: (Math.atan2(u.dy, u.dx) * 180) / Math.PI })
    }
  }
  if (!frames.length) return null
  const base = e[0]!.len
  const pick = frames.find((fr) => Math.abs(fr.w - base) < 1e-6) ?? frames[0]!
  // Axis-aligned already: the bounding box is the frame, so nothing needs to change.
  if (Math.abs(pick.deg) < 1e-6) return null
  return pick
}

export function polygonAabb(polygon: Point[]): { x: number; y: number; w: number; h: number } {
  if (polygon.length === 0) return { x: 0, y: 0, w: 0, h: 0 }
  const xs = polygon.map((p) => p.x)
  const ys = polygon.map((p) => p.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  return {
    x: minX,
    y: minY,
    w: Math.max(0, Math.max(...xs) - minX),
    h: Math.max(0, Math.max(...ys) - minY),
  }
}

export function kindFromForxaPanel(panel: MxPanel): PanelKind {
  const id = panel.id.toLowerCase()
  const face = (panel.face || '').toLowerCase()
  if (face === 'cell' || id.startsWith('cell-')) return 'product-window'
  if (id.startsWith('aux-') || face === 'device') return 'device-overlay'
  if (face === 'glue' || id.includes('glue')) return 'glue'
  if (
    id.includes('tuck') ||
    id.includes('dust') ||
    id.includes('auto-bottom') ||
    id.includes('major-') ||
    id.includes('minor-') ||
    (id.includes('lock') && !id.includes('glue')) ||
    face === 'lid-tuck'
  ) {
    return 'tuck-flap'
  }
  if (face === 'front' || id === 'front' || id === 'base-front') return 'hero-front'
  if (face === 'back' || id === 'back' || id === 'base-back') return 'legal-back'
  if (face === 'left' || face === 'right' || /(^|-)side/.test(id)) return 'side-spine'
  if (id.startsWith('wall-') && face === 'side') return 'polygon-wall'
  return 'plain'
}

function roleOf(kind: PanelKind, face: string): PanelRole {
  if (kind === 'glue') return 'glue'
  if (kind === 'tuck-flap') return 'tuck'
  if (face === 'top' || face === 'lid' || face === 'bottom') return 'flap'
  return 'body'
}

export function creaseSegments(paths: Path[]): [Point, Point][] {
  const out: [Point, Point][] = []
  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i]
      const b = path[i + 1]
      if (a && b && (a.x !== b.x || a.y !== b.y)) out.push([a, b])
    }
  }
  return out
}

const MIN_OVERLAY = 0.2

function thickenSegment(a: Point, b: Point, width: number): Point[] {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const nx = (-dy / len) * (width / 2)
  const ny = (dx / len) * (width / 2)
  return [
    { x: a.x + nx, y: a.y + ny },
    { x: b.x + nx, y: b.y + ny },
    { x: b.x - nx, y: b.y - ny },
    { x: a.x - nx, y: a.y - ny },
  ]
}

function overlayPanel(id: string, polygon: Point[]): Panel | null {
  const box = polygonAabb(polygon)
  if (box.w >= MIN_OVERLAY && box.h >= MIN_OVERLAY) {
    return {
      id,
      role: 'body',
      kind: 'device-overlay',
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      polygon: polygon.map((p) => ({ x: p.x, y: p.y })),
    }
  }
  if (polygon.length < 2) return null
  const a = polygon[0]!
  const b = polygon[polygon.length - 1]!
  if (Math.hypot(b.x - a.x, b.y - a.y) < MIN_OVERLAY) return null
  const thick = thickenSegment(a, b, 1.2)
  const tbox = polygonAabb(thick)
  if (tbox.w < MIN_OVERLAY || tbox.h < MIN_OVERLAY) return null
  return {
    id,
    role: 'body',
    kind: 'device-overlay',
    x: tbox.x,
    y: tbox.y,
    w: tbox.w,
    h: tbox.h,
    polygon: thick,
  }
}

export function toDielineModel(
  result: DielineResult,
  dimensions: DimensionsMm,
  structureId: StructureId,
  extraOverlay: { cut?: Path[]; perf?: Path[] } = {},
): DielineModel {
  const panels: Panel[] = result.panels.map((panel) => {
    // A rotated rectangle is measured by its own edges; everything else by its bounding box.
    const box = rotatedRectFrame(panel.polygon) ?? polygonAabb(panel.polygon)
    const kind = kindFromForxaPanel(panel)
    return {
      id: panel.id,
      role: roleOf(kind, panel.face),
      kind,
      face: panel.face,
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      polygon: panel.polygon.map((p) => ({ x: p.x, y: p.y })),
    }
  })

  extraOverlay.cut?.forEach((poly, i) => {
    const panel = overlayPanel(`aux-cut-${i}`, poly)
    if (panel) panels.push(panel)
  })
  extraOverlay.perf?.forEach((poly, i) => {
    const panel = overlayPanel(`aux-perf-${i}`, poly)
    if (panel) panels.push(panel)
  })

  const glueIds = panels.filter((panel) => panel.kind === 'glue').map((panel) => panel.id)
  const issues = [...result.errors]
  if (!result.success && issues.length === 0) issues.push('Forxa üretim başarısız')

  const width = result.bounds.width || Math.max(0, ...panels.map((p) => p.x + p.w))
  const height = result.bounds.height || Math.max(0, ...panels.map((p) => p.y + p.h))

  const cut = result.paths.cut.map((path) => path.map((p) => ({ x: p.x, y: p.y })))
  const perf = result.paths.perf
    .filter((path) => path.length >= 2)
    .map((path) => path.map((p) => ({ x: p.x, y: p.y })))

  return {
    structureId,
    unit: 'mm',
    width,
    height,
    dimensions,
    panels,
    cut,
    crease: creaseSegments(result.paths.crease),
    perf,
    glueIds,
    consistent: result.success && issues.length === 0 && panels.length > 0 && width > 0 && height > 0,
    issues,
  }
}
