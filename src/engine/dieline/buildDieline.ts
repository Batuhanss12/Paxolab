import type { DesignBrief, DielineModel, DimensionsMm, Panel, Point, StructureId } from '../../types'

function rect(id: string, role: Panel['role'], x: number, y: number, w: number, h: number): Panel {
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

function outline(panels: Panel[]): Point[] {
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

function creaseBetween(a: Panel, b: Panel): [Point, Point] | null {
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

function bounds(panels: Panel[]): { width: number; height: number } {
  return {
    width: Math.max(...panels.map((p) => p.x + p.w)),
    height: Math.max(...panels.map((p) => p.y + p.h)),
  }
}

function tuckEnd(d: DimensionsMm): DielineModel {
  const L = d.L
  const W = d.W
  const H = d.H
  const G = Math.min(18, Math.max(10, W * 0.42))
  const T = Math.min(20, Math.max(12, W * 0.5))
  const dust = Math.min(16, Math.max(8, W * 0.4))
  const top = T + W

  const glue = rect('glue', 'glue', 0, top, G, H)
  const left = rect('left', 'body', G, top, W, H)
  const front = rect('front', 'body', G + W, top, L, H)
  const right = rect('right', 'body', G + W + L, top, W, H)
  const back = rect('back', 'body', G + W + L + W, top, L, H)
  const topPanel = rect('top', 'flap', G + W, T, L, W)
  const topTuck = rect('topTuck', 'tuck', G + W, 0, L, T)
  const bottom = rect('bottom', 'flap', G + W, top + H, L, W)
  const bottomTuck = rect('bottomTuck', 'tuck', G + W, top + H + W, L, T)
  const leftDustT = rect('leftDustTop', 'flap', G, top - dust, W, dust)
  const rightDustT = rect('rightDustTop', 'flap', G + W + L, top - dust, W, dust)
  const leftDustB = rect('leftDustBottom', 'flap', G, top + H, W, dust)
  const rightDustB = rect('rightDustBottom', 'flap', G + W + L, top + H, W, dust)

  const panels = [
    glue, left, front, right, back,
    topPanel, topTuck, bottom, bottomTuck,
    leftDustT, rightDustT, leftDustB, rightDustB,
  ]

  const pairs: [Panel, Panel][] = [
    [glue, left], [left, front], [front, right], [right, back],
    [topTuck, topPanel], [topPanel, front], [front, bottom], [bottom, bottomTuck],
    [leftDustT, left], [rightDustT, right], [left, leftDustB], [right, rightDustB],
  ]
  const crease = pairs.map(([a, b]) => creaseBetween(a, b)).filter((x): x is [Point, Point] => !!x)

  const issues: string[] = []
  if (Math.abs(front.w - back.w) > 0.01) issues.push('Front/back width mismatch')
  if (Math.abs(left.w - right.w) > 0.01) issues.push('Left/right width mismatch')
  if (Math.abs(front.h - left.h) > 0.01) issues.push('Body height mismatch')
  if (Math.abs(topPanel.w - L) > 0.01 || Math.abs(topPanel.h - W) > 0.01) issues.push('Top panel not L×W')
  if (Math.abs(bottom.w - L) > 0.01 || Math.abs(bottom.h - W) > 0.01) issues.push('Bottom panel not L×W')

  const { width, height } = bounds(panels)
  return {
    structureId: 'tuck-end-box',
    unit: 'mm',
    width,
    height,
    dimensions: d,
    panels,
    cut: [outline(panels)],
    crease,
    glueIds: ['glue'],
    consistent: issues.length === 0,
    issues,
  }
}

function simpleTray(d: DimensionsMm): DielineModel {
  const { L, W, H } = d
  const back = rect('trayBack', 'body', H, 0, L, H)
  const left = rect('trayLeft', 'body', 0, H, H, W)
  const bottom = rect('trayBottom', 'body', H, H, L, W)
  const right = rect('trayRight', 'body', H + L, H, H, W)
  const front = rect('trayFront', 'body', H, H + W, L, H)
  const panels = [back, left, bottom, right, front]
  const crease = [
    creaseBetween(back, bottom),
    creaseBetween(left, bottom),
    creaseBetween(bottom, right),
    creaseBetween(bottom, front),
  ].filter((x): x is [Point, Point] => !!x)
  const { width, height } = bounds(panels)
  return {
    structureId: 'simple-tray',
    unit: 'mm',
    width,
    height,
    dimensions: d,
    panels,
    cut: [outline(panels)],
    crease,
    glueIds: [],
    consistent: true,
    issues: [],
  }
}

function labelBack(x: number, y: number, w: number, h: number): Panel {
  return rect('labelBack', 'body', x, y, w, h)
}

function flatLabel(d: DimensionsMm): DielineModel {
  const w = d.L || 70
  const h = d.H || 90
  const gap = 8
  const panel = rect('label', 'body', 0, 0, w, h)
  const back = labelBack(w + gap, 0, w, h)
  return {
    structureId: 'flat-label',
    unit: 'mm',
    width: back.x + back.w,
    height: h,
    dimensions: { L: w, W: 0, H: h },
    panels: [panel, back],
    cut: [panel.polygon, back.polygon],
    crease: [],
    glueIds: [],
    consistent: true,
    issues: [],
  }
}

function wrapLabel(d: DimensionsMm): DielineModel {
  const w = d.L || 90
  const h = d.H || 70
  const overlap = Math.min(12, w * 0.12)
  const gap = 8
  const face = rect('label', 'body', 0, 0, w, h)
  const glue = rect('overlap', 'glue', w, 0, overlap, h)
  const crease = creaseBetween(face, glue)
  const back = labelBack(w + overlap + gap, 0, w, h)
  return {
    structureId: 'wrap-label',
    unit: 'mm',
    width: back.x + back.w,
    height: h,
    dimensions: { L: w, W: 0, H: h },
    panels: [face, glue, back],
    cut: [outline([face, glue]), back.polygon],
    crease: crease ? [crease] : [],
    glueIds: ['overlap'],
    consistent: true,
    issues: [],
  }
}

export function resolveDimensions(brief: DesignBrief): DimensionsMm {
  const d = brief.dimensionsMm
  const L = d.L > 0 ? d.L : 80
  const W = brief.packagingMode === 'label' ? 0 : d.W > 0 ? d.W : 40
  const H = d.H > 0 ? d.H : brief.packagingMode === 'label' ? 90 : 120
  return { L, W, H }
}

export function buildDieline(structureId: StructureId, brief: DesignBrief): DielineModel {
  const d = resolveDimensions(brief)
  if (structureId === 'simple-tray') return simpleTray(d)
  if (structureId === 'flat-label') return flatLabel(d)
  if (structureId === 'wrap-label') return wrapLabel(d)
  return tuckEnd(d)
}

export function frontPanelId(structureId: StructureId): string {
  if (structureId === 'simple-tray') return 'trayFront'
  if (structureId === 'flat-label' || structureId === 'wrap-label') return 'label'
  return 'front'
}
