/**
 * Dieline structures — tuck-end box, simple tray, flat label, wrap label.
 * Extracted from buildDieline.ts to isolate structure definitions from geometry.
 */
import type { DielineModel, DimensionsMm, Panel, Point } from '../../types'
import { bounds, creaseBetween, outlineUnion, rect } from './dielineGeometry'

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
    cut: [outlineUnion(panels)],
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
    cut: [outlineUnion(panels)],
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
    cut: [outlineUnion([face, glue]), back.polygon],
    crease: crease ? [crease] : [],
    glueIds: ['overlap'],
    consistent: true,
    issues: [],
  }
}

export { tuckEnd, simpleTray, flatLabel, wrapLabel }
