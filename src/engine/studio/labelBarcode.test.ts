import { beforeEach, describe, expect, it } from 'vitest'
import type { DesignBrief, DimensionsMm } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'

function perfumeLabel(dims: DimensionsMm): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Luma',
    productName: 'Noir Eau',
    sector: 'kozmetik',
    subProduct: 'parfüm',
    packagingMode: 'label',
    templateId: 'fm-cos-label-bottle',
    dimensionsMm: dims,
    styleType: 'luxury',
    volume: '50 ml',
  }
}

function generate(dims: DimensionsMm) {
  return new FormaLocalEngine().generate({
    brief: perfumeLabel(dims),
    overridePatch: { studio: true },
  })
}

function barExtent(svg: string) {
  let maxX = -Infinity
  let maxY = -Infinity
  for (const row of svg.matchAll(/<rect x="([\d.-]+)" y="([\d.-]+)" width="([\d.-]+)" height="([\d.-]+)"/g)) {
    maxX = Math.max(maxX, Number(row[1]) + Number(row[3]))
    maxY = Math.max(maxY, Number(row[2]) + Number(row[4]))
  }
  return { maxX, maxY }
}

describe('label back barcode follows En/Boy', () => {
  beforeEach(() => resetArtMemory())

  it('keeps the back barcode inside the panel after aspect changes', () => {
    const sizes: DimensionsMm[] = [
      { L: 90, W: 0, H: 70 },
      { L: 50, W: 0, H: 90 },
      { L: 120, W: 0, H: 40 },
    ]
    for (const dims of sizes) {
      const spec = generate(dims)
      const back = spec.dieline.panels.find((p) => p.id === 'labelBack')
      expect(back).toBeTruthy()
      const markup = spec.artwork.layers.find((l) => l.panelId === 'labelBack')?.markup ?? ''
      expect(markup).toMatch(/data-mark="barcode"/)
      expect(markup).toMatch(/data-barcode-digits="\d{13}"/)
      expect(markup).toMatch(/>\d{13}</)
      const group = markup.match(/data-mark="barcode">([\s\S]*?)<\/g>/)?.[1] ?? ''
      const { maxX, maxY } = barExtent(group)
      expect(maxX).toBeLessThanOrEqual(back!.w - 4.5)
      expect(maxY).toBeLessThanOrEqual(back!.h - 0.2)
      const barcodeOob = spec.studio?.outOfBounds.filter((id) => /barcode/i.test(id)) ?? ['missing-studio']
      expect(barcodeOob).toEqual([])
      const titleOob = spec.studio?.outOfBounds.filter((id) => /back-title/i.test(id)) ?? ['missing-studio']
      expect(titleOob).toEqual([])
    }
  })
})
