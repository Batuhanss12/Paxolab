import type { DielineModel, Panel, Point } from '../../../types'
import type { GlueArea, PanelEdge, StructuralFlap, StructuralPanel } from './types'

function almost(a: number, b: number, eps = 0.35): boolean {
  return Math.abs(a - b) <= eps
}

function pointOnSegment(p: Point, a: Point, b: Point, eps = 0.35): boolean {
  const minX = Math.min(a.x, b.x) - eps
  const maxX = Math.max(a.x, b.x) + eps
  const minY = Math.min(a.y, b.y) - eps
  const maxY = Math.max(a.y, b.y) + eps
  if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) return false
  const cross = (p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x)
  return Math.abs(cross) <= eps * (Math.hypot(b.x - a.x, b.y - a.y) + 1)
}

function segmentTouchesPanel(a: Point, b: Point, panel: Panel): boolean {
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  const onBox =
    almost(mid.x, panel.x) ||
    almost(mid.x, panel.x + panel.w) ||
    almost(mid.y, panel.y) ||
    almost(mid.y, panel.y + panel.h)
  if (!onBox) return false
  return (
    mid.x >= panel.x - 0.4 &&
    mid.x <= panel.x + panel.w + 0.4 &&
    mid.y >= panel.y - 0.4 &&
    mid.y <= panel.y + panel.h + 0.4
  )
}

function panelType(panel: Panel): StructuralPanel['type'] {
  const id = panel.id.toLowerCase()
  if (panel.kind === 'glue' || id.includes('glue')) return 'glue'
  if (id.includes('front') || panel.kind === 'hero-front') return 'front'
  if (id.includes('back') || panel.kind === 'legal-back') return 'back'
  if (id.includes('left') || id.includes('right') || id.includes('side')) return 'side'
  if (id.includes('lid')) return 'lid'
  if (id.includes('top')) return 'top'
  if (id.includes('bottom')) return 'bottom'
  return 'other'
}

export function structuralPanelsFromModel(model: DielineModel): StructuralPanel[] {
  return model.panels.map((panel) => ({
    id: panel.id,
    type: panelType(panel),
    width: panel.w,
    height: panel.h,
    origin: { x: panel.x, y: panel.y },
    polygon: panel.polygon.length ? panel.polygon : [
      { x: panel.x, y: panel.y },
      { x: panel.x + panel.w, y: panel.y },
      { x: panel.x + panel.w, y: panel.y + panel.h },
      { x: panel.x, y: panel.y + panel.h },
    ],
  }))
}

export function buildPanelEdges(model: DielineModel): PanelEdge[] {
  const edges: PanelEdge[] = []
  const used = new Set<string>()
  for (const [a, b] of model.crease) {
    const hits = model.panels.filter((p) => segmentTouchesPanel(a, b, p))
    for (let i = 0; i < hits.length; i++) {
      for (let j = i + 1; j < hits.length; j++) {
        const left = hits[i]!
        const right = hits[j]!
        const key = [left.id, right.id].sort().join('>')
        if (used.has(key)) continue
        used.add(key)
        edges.push({ from: left.id, to: right.id, type: 'crease', angle: 90 })
      }
    }
  }
  return edges
}

export function graphConnected(edges: PanelEdge[], panelIds: string[]): boolean {
  const bodies = panelIds.filter((id) => !/glue|aux-|dust|tuck|lock|cell-/i.test(id))
  if (bodies.length <= 1) return true
  const adj = new Map<string, string[]>()
  for (const id of panelIds) adj.set(id, [])
  for (const e of edges) {
    adj.get(e.from)?.push(e.to)
    adj.get(e.to)?.push(e.from)
  }
  const start = bodies[0]!
  const seen = new Set<string>([start])
  const q = [start]
  while (q.length) {
    const id = q.pop()!
    for (const n of adj.get(id) ?? []) {
      if (seen.has(n)) continue
      seen.add(n)
      q.push(n)
    }
  }
  return bodies.every((id) => seen.has(id))
}

function flapType(panel: Panel): StructuralFlap['type'] | null {
  const id = panel.id.toLowerCase()
  if (id.includes('auto-bottom') || id.includes('lock-bottom')) return 'auto-bottom'
  if (id.includes('dust')) return 'dust'
  if (id.includes('tuck')) return 'tuck'
  if (id.includes('major')) return 'major'
  if (id.includes('minor')) return 'minor'
  if (id.includes('lid')) return 'lid'
  if (panel.role === 'tuck' || panel.kind === 'tuck-flap') return 'tuck'
  if (panel.role === 'flap') return 'locking'
  return null
}

export function solveFlaps(model: DielineModel): StructuralFlap[] {
  const flaps: StructuralFlap[] = []
  for (const panel of model.panels) {
    const type = flapType(panel)
    if (!type) continue
    const parent =
      model.panels.find(
        (p) =>
          p.id !== panel.id &&
          (p.role === 'body' || p.kind === 'hero-front' || p.kind === 'legal-back' || p.kind === 'side-spine') &&
          (almost(p.x + p.w, panel.x) ||
            almost(p.x, panel.x + panel.w) ||
            almost(p.y + p.h, panel.y) ||
            almost(p.y, panel.y + panel.h)),
      )?.id ?? ''
    flaps.push({
      id: panel.id,
      parentPanel: parent,
      type,
      width: panel.w,
      length: panel.h,
      angle: 90,
      clearance: 0,
      polygon: panel.polygon.length ? panel.polygon : [
        { x: panel.x, y: panel.y },
        { x: panel.x + panel.w, y: panel.y },
        { x: panel.x + panel.w, y: panel.y + panel.h },
        { x: panel.x, y: panel.y + panel.h },
      ],
    })
  }
  return flaps
}

export function glueAreasFromModel(model: DielineModel): GlueArea[] {
  return model.panels
    .filter((p) => p.kind === 'glue' || model.glueIds.includes(p.id))
    .map((p) => ({
      panelId: p.id,
      width: p.w,
      height: p.h,
      polygon: p.polygon.length ? p.polygon : [
        { x: p.x, y: p.y },
        { x: p.x + p.w, y: p.y },
        { x: p.x + p.w, y: p.y + p.h },
        { x: p.x, y: p.y + p.h },
      ],
    }))
}

export function segmentOnAnyPanelEdge(a: Point, b: Point, panels: Panel[]): boolean {
  return panels.some((p) => pointOnSegment(a, { x: p.x, y: p.y }, { x: p.x + p.w, y: p.y }) ||
    pointOnSegment(a, { x: p.x + p.w, y: p.y }, { x: p.x + p.w, y: p.y + p.h }) ||
    pointOnSegment(b, { x: p.x, y: p.y }, { x: p.x + p.w, y: p.y }))
}
