import { describe, expect, it } from 'vitest'
import { compositionBonus, computeGeometryMetrics, densityPenalty, hierarchyBonus } from './geometryMetrics'

const PANEL = { x: 0, y: 0, w: 70, h: 90 }

describe('geometryMetrics', () => {
  it('returns empty metrics for empty markup', () => {
    const m = computeGeometryMetrics('', PANEL)
    expect(m.elementCount).toBe(0)
    expect(m.coverage).toBe(0)
  })

  it('counts elements correctly', () => {
    const markup = '<rect x="10" y="10" width="20" height="20" /><text x="5" y="5" font-size="4">Hi</text>'
    const m = computeGeometryMetrics(markup, PANEL)
    expect(m.elementCount).toBe(2)
    expect(m.textCount).toBe(1)
    expect(m.shapeCount).toBe(1)
  })

  it('computes coverage from element areas', () => {
    const markup = '<rect x="0" y="0" width="35" height="45" />' // half the panel
    const m = computeGeometryMetrics(markup, PANEL)
    expect(m.coverage).toBeCloseTo(0.25, 1) // 35*45 / (70*90) = 0.25
  })

  it('detects centered balance', () => {
    // Element at panel center
    const markup = '<rect x="30" y="40" width="10" height="10" />'
    const m = computeGeometryMetrics(markup, PANEL)
    expect(m.balance).toBeGreaterThan(0.8)
  })

  it('detects off-center balance', () => {
    // Element at top-left corner
    const markup = '<rect x="0" y="0" width="10" height="10" />'
    const m = computeGeometryMetrics(markup, PANEL)
    expect(m.balance).toBeLessThan(0.5)
  })

  it('computes font contrast from text elements', () => {
    const markup =
      '<text x="5" y="5" font-size="8">Big</text><text x="5" y="20" font-size="3">Small</text>'
    const m = computeGeometryMetrics(markup, PANEL)
    expect(m.fontContrast).toBe(5) // 8 - 3
    expect(m.averageFontSize).toBe(5.5) // (8 + 3) / 2
  })

  it('compositionBonus rewards centered + good spread', () => {
    const markup = '<rect x="25" y="20" width="20" height="50" />' // centered, good spread
    const m = computeGeometryMetrics(markup, PANEL)
    expect(compositionBonus(m)).toBeGreaterThan(0)
  })

  it('hierarchyBonus rewards font contrast', () => {
    const markup =
      '<text x="5" y="5" font-size="8">Big</text><text x="5" y="20" font-size="3">Small</text>'
    const m = computeGeometryMetrics(markup, PANEL)
    expect(hierarchyBonus(m)).toBeGreaterThan(0)
  })

  it('densityPenalty penalizes too many elements', () => {
    let markup = ''
    for (let i = 0; i < 30; i++) {
      markup += `<rect x="${i * 2}" y="${i}" width="5" height="5" />`
    }
    const m = computeGeometryMetrics(markup, PANEL)
    expect(densityPenalty(m)).toBeLessThan(0)
  })
})
