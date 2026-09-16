import { describe, expect, it } from 'vitest'
import { barcodeSvg, ean13Modules, fitLabelBarcode } from './barcode'

function barExtent(svg: string) {
  let minX = Infinity
  let maxX = -Infinity
  for (const row of svg.matchAll(/<rect x="([\d.-]+)" y="([\d.-]+)" width="([\d.-]+)" height="([\d.-]+)"/g)) {
    const x = Number(row[1])
    const w = Number(row[3])
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x + w)
  }
  return { minX, maxX }
}

describe('barcodeSvg', () => {
  it('keeps EAN modules inside the slot when the width shrinks', () => {
    const x = 4
    const w = 12
    expect(ean13Modules('2000000000003').length).toBeGreaterThan(90)
    const svg = barcodeSvg('2000000000003', x, 10, w, 6, '#111')
    const { minX, maxX } = barExtent(svg)
    expect(minX).toBeGreaterThanOrEqual(x - 0.05)
    expect(maxX).toBeLessThanOrEqual(x + w + 0.05)
    expect(svg).toMatch(/data-barcode-digits="2000000000003"/)
    expect(svg).toMatch(/>2000000000003</)
  })
})

describe('fitLabelBarcode', () => {
  it('places a proportional barcode inside skinny, short, and default label backs', () => {
    const panels: Array<[number, number]> = [
      [90, 70],
      [50, 90],
      [140, 40],
      [40, 48],
    ]
    for (const [w, h] of panels) {
      const margin = Math.max(2.6, Math.min(7, Math.min(w, h) * 0.065))
      const slot = fitLabelBarcode({ w, h, margin, picCount: 3 })
      expect(slot.x).toBeGreaterThanOrEqual(margin - 0.05)
      expect(slot.x + slot.w).toBeLessThanOrEqual(w - 4.8)
      expect(w - (slot.x + slot.w)).toBeGreaterThanOrEqual(4.8)
      expect(slot.w).toBeGreaterThanOrEqual(8)
      expect(slot.y).toBeLessThan(h - margin - slot.barH + 0.05)
      expect(slot.y + slot.barsH).toBeLessThanOrEqual(h - margin + 0.05)
      expect(slot.y - 1 + slot.barsH + Math.max(4.2, slot.captionSize * 2.15)).toBeLessThanOrEqual(h - 1)
    }
  })

  it('pulls the default 90×70 barcode off the right edge and uses leftover width', () => {
    const w = 90
    const h = 70
    const margin = Math.max(2.6, Math.min(7, Math.min(w, h) * 0.065))
    const slot = fitLabelBarcode({ w, h, margin, picCount: 3 })
    expect(slot.w).toBeGreaterThan(30)
    expect(slot.x + slot.w).toBeLessThanOrEqual(w - 5)
    expect(slot.x).toBeLessThan(w - margin - 30)
    expect(slot.y).toBeLessThan(h - margin - slot.barH)
  })
})
