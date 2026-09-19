import { beforeEach, describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { resetArtMemory } from '../brain'
import { FormaLocalEngine } from '../FormaLocalEngine'
import type { HeroFamily } from '../brain/DesignPlan'
import { emptyBrief } from '../fields'

function brief(patch: Partial<DesignBrief>): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'LUMINA',
    packagingMode: 'box',
    ...patch,
  }
}

function generate(patch: Partial<DesignBrief>, variationIndex = 0, heroFamily?: HeroFamily) {
  return new FormaLocalEngine().generate({
    brief: brief(patch),
    overridePatch: { variationIndex, heroFamily },
  })
}

function face(spec: { artwork: { layers: { panelId: string; markup: string }[] } }) {
  return spec.artwork.layers.find((l) => l.panelId === 'front' || l.panelId === 'label' || l.panelId === 'trayFront')?.markup ?? ''
}

describe('Phase 8 claim + eco craft', () => {
  beforeEach(() => resetArtMemory())

  it('P8-A paints family-voice claims on honey labels, not generic %100/DOĞAL only', () => {
    const honey = generate({
      brandName: 'YAYLA',
      sector: 'gıda',
      subProduct: 'bal',
      styleType: 'classic',
      packagingMode: 'label',
      templateId: 'fm-food-label-jar',
      volume: '340 g',
      productName: 'Çiçek Balı',
    })
    const svg = face(honey)
    expect(svg).toMatch(/YAYLA|DAĞ ÇİÇEĞİ|SAF DAMLA|ÇİÇEK/)
    expect(svg).not.toContain('DOĞAL ÜRÜN')
    expect(honey.preflight.exportOk).toBe(true)
    expect(honey.preflight.items.find((i) => i.id === 'collision')?.status).toBe('pass')
  })

})
