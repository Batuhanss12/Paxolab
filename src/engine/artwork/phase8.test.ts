import { beforeEach, describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { resetArtMemory } from '../brain'
import { scoreVisualCraft } from '../brain/DesignScore'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import { JOBS, briefFrom } from '../../../scripts/catalog-jobs'
import type { HeroFamily } from '../brain/DesignPlan'

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

  it('P8-B eco monstera sets keep a pattern slot and craft ≥77', () => {
    const sets = [0, 1, 2].map((setIdx) =>
      generate(
        {
          sector: 'kozmetik',
          subProduct: 'krem',
          styleType: 'eco',
          templateId: 'fm-cos-tuck-cream',
          volume: '50 ml',
          productName: 'Leaf',
        },
        setIdx,
        'monstera',
      ),
    )
    for (const spec of sets) {
      expect(spec.designPlan?.patternSystem.family).not.toBe('none')
      expect(face(spec)).toMatch(/data-art="pattern"|data-bg="eco-grain"/)
      expect(face(spec)).toContain('data-art="title-card"')
      expect(scoreVisualCraft(spec, spec.designPlan!).visualCraft).toBeGreaterThanOrEqual(77)
      expect(spec.preflight.exportOk).toBe(true)
    }
  })

  it('P8-C catalog hair wrap paints step-pill and bilingual line', () => {
    const job = JOBS.find((j) => j.slug === '29-sampuan-wrap-modern')
    expect(job).toBeTruthy()
    const spec = new FormaLocalEngine().generate({ brief: briefFrom(job!) })
    expect(face(spec)).toContain('data-art="step-pill"')
    expect(face(spec)).toMatch(/UYGULA|APPLY/)
    expect(face(spec)).toContain('KERATIN REPAIR')
    expect(face(spec)).toMatch(/Onarıcı bakım/)
    expect(spec.preflight.exportOk).toBe(true)
  })

  it('P8-D minimal serum set0 paints a line-scene and scores ≥77', () => {
    const spec = generate({
      brandName: 'CLARA',
      sector: 'kozmetik',
      subProduct: 'serum',
      styleType: 'minimal',
      templateId: 'fm-cos-tuck-serum',
      volume: '30 ml',
      productName: 'Concentrate',
    })
    expect(spec.designPlan?.heroGraphic.family).toBe('line-scene')
    expect(face(spec)).toContain('data-hero="line-scene"')
    expect(face(spec)).toContain('data-bg="line-horizon"')
    expect(scoreVisualCraft(spec, spec.designPlan!).visualCraft).toBeGreaterThanOrEqual(77)
    expect(spec.preflight.exportOk).toBe(true)
  })
})
