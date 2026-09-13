/**
 * Geometry-aware design metrics — measures real SVG element positions/sizes
 * instead of just counting regex matches. Complements the existing regex-based
 * scoring in DesignScore.ts with actual spatial analysis.
 *
 * Uses parseSvgElements from the document module to extract element bounds,
 * then computes composition, density, balance, and hierarchy metrics from
 * the actual geometry.
 */
import { elementBounds, parseSvgElements } from '../document/svgParser'
import type { NodeBounds } from '../document/types'

export type GeometryMetrics = {
  /** Number of top-level elements on the face. */
  elementCount: number
  /** Total area covered by elements (mm²). */
  totalArea: number
  /** Fraction of panel area covered (0–1). */
  coverage: number
  /** Vertical center of mass (0–1, 0=top, 1=bottom). */
  verticalCentroid: number
  /** Horizontal center of mass (0–1, 0=left, 1=right). */
  horizontalCentroid: number
  /** Balance: 1 = perfectly centered, 0 = edge. */
  balance: number
  /** Vertical spread (0 = all at same Y, 1 = full height). */
  verticalSpread: number
  /** Horizontal spread (0 = all at same X, 1 = full width). */
  horizontalSpread: number
  /** Largest element area / panel area (0–1). */
  dominantElementRatio: number
  /** Text element count. */
  textCount: number
  /** Shape/path element count. */
  shapeCount: number
  /** Image element count. */
  imageCount: number
  /** Average text font size (mm, 0 if no text). */
  averageFontSize: number
  /** Font size contrast (max - min, 0 if <2 text elements). */
  fontContrast: number
}

const EMPTY: GeometryMetrics = {
  elementCount: 0,
  totalArea: 0,
  coverage: 0,
  verticalCentroid: 0.5,
  horizontalCentroid: 0.5,
  balance: 0.5,
  verticalSpread: 0,
  horizontalSpread: 0,
  dominantElementRatio: 0,
  textCount: 0,
  shapeCount: 0,
  imageCount: 0,
  averageFontSize: 0,
  fontContrast: 0,
}

function num(attrs: Record<string, string>, key: string, fallback = 0): number {
  const v = parseFloat(attrs[key] ?? '')
  return Number.isFinite(v) ? v : fallback
}

/** Compute geometry metrics from a face's SVG markup + panel bounds. */
export function computeGeometryMetrics(markup: string, panel: NodeBounds): GeometryMetrics {
  const elements = parseSvgElements(markup)
  if (elements.length === 0 || panel.w <= 0 || panel.h <= 0) return { ...EMPTY }

  const panelArea = panel.w * panel.h
  let totalArea = 0
  let maxArea = 0
  let sumCx = 0
  let sumCy = 0
  let weightedSumCx = 0
  let weightedSumCy = 0
  let minY = Infinity
  let maxY = -Infinity
  let minX = Infinity
  let maxX = -Infinity
  let textCount = 0
  let shapeCount = 0
  let imageCount = 0
  const fontSizes: number[] = []

  for (const el of elements) {
    const bounds = elementBounds(el)
    const area = Math.max(0, bounds.w * bounds.h)
    totalArea += area
    if (area > maxArea) maxArea = area

    const cx = bounds.x + bounds.w / 2
    const cy = bounds.y + bounds.h / 2
    sumCx += cx
    sumCy += cy
    weightedSumCx += cx * area
    weightedSumCy += cy * area

    minY = Math.min(minY, bounds.y)
    maxY = Math.max(maxY, bounds.y + bounds.h)
    minX = Math.min(minX, bounds.x)
    maxX = Math.max(maxX, bounds.x + bounds.w)

    if (el.tag === 'text') {
      textCount++
      fontSizes.push(num(el.attrs, 'font-size', 3))
    } else if (el.tag === 'image') {
      imageCount++
    } else {
      shapeCount++
    }
  }

  const count = elements.length
  const avgCx = sumCx / count
  const avgCy = sumCy / count
  // Normalize to panel-relative 0–1
  const panelCenterX = panel.x + panel.w / 2
  const panelCenterY = panel.y + panel.h / 2
  const horizontalCentroid = (avgCx - panel.x) / panel.w
  const verticalCentroid = (avgCy - panel.y) / panel.h
  // Balance: how close centroid is to panel center (1 = perfect, 0 = edge)
  const dx = Math.abs(avgCx - panelCenterX) / (panel.w / 2)
  const dy = Math.abs(avgCy - panelCenterY) / (panel.h / 2)
  const balance = Math.max(0, 1 - (dx + dy) / 2)
  // Spread: how much of the panel is used
  const verticalSpread = Math.min(1, (maxY - minY) / panel.h)
  const horizontalSpread = Math.min(1, (maxX - minX) / panel.w)
  const coverage = Math.min(1, totalArea / panelArea)
  const dominantElementRatio = maxArea / panelArea

  // Font metrics
  const averageFontSize = fontSizes.length
    ? fontSizes.reduce((a, b) => a + b, 0) / fontSizes.length
    : 0
  const fontContrast =
    fontSizes.length >= 2 ? Math.max(...fontSizes) - Math.min(...fontSizes) : 0

  return {
    elementCount: count,
    totalArea,
    coverage,
    verticalCentroid,
    horizontalCentroid,
    balance,
    verticalSpread,
    horizontalSpread,
    dominantElementRatio,
    textCount,
    shapeCount,
    imageCount,
    averageFontSize,
    fontContrast,
  }
}

/** Composition bonus from geometry: centered + spread = good composition. */
export function compositionBonus(metrics: GeometryMetrics): number {
  let bonus = 0
  // Balanced composition (centroid near center) is generally good.
  if (metrics.balance > 0.7) bonus += 6
  else if (metrics.balance > 0.5) bonus += 3
  // Good vertical spread uses the panel height intentionally.
  if (metrics.verticalSpread > 0.6 && metrics.verticalSpread < 0.95) bonus += 4
  // Coverage between 20% and 70% is sweet spot — not empty, not cluttered.
  if (metrics.coverage > 0.2 && metrics.coverage < 0.7) bonus += 4
  // Dominant element shouldn't overwhelm.
  if (metrics.dominantElementRatio > 0.5) bonus -= 4
  return bonus
}

/** Hierarchy bonus from font contrast: varied font sizes show hierarchy. */
export function hierarchyBonus(metrics: GeometryMetrics): number {
  let bonus = 0
  if (metrics.fontContrast > 4) bonus += 6
  else if (metrics.fontContrast > 2) bonus += 3
  if (metrics.textCount >= 3 && metrics.textCount <= 8) bonus += 3
  if (metrics.textCount > 12) bonus -= 4 // clutter
  return bonus
}

/** Density penalty from geometry: too many elements = clutter. */
export function densityPenalty(metrics: GeometryMetrics): number {
  let penalty = 0
  if (metrics.elementCount > 25) penalty -= 8
  if (metrics.coverage > 0.85) penalty -= 6
  if (metrics.dominantElementRatio > 0.6) penalty -= 4
  return penalty
}
