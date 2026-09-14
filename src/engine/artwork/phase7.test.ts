import { beforeEach, describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { resetArtMemory } from '../brain'
import { scoreVisualCraft } from '../brain/DesignScore'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import { perfumeNotesHidden, resolvePerfumeNotes, resolvePerfumeStory } from './perfumeStory'
import { sideFill } from './sideFill'
import { resolveDesignSystem } from '../designSystem/resolve'

function brief(patch: Partial<DesignBrief>): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'AURELIA',
    packagingMode: 'box',
    ...patch,
  }
}

function generate(patch: Partial<DesignBrief>) {
  return new FormaLocalEngine().generate({ brief: brief(patch) })
}

function face(spec: { artwork: { layers: { panelId: string; markup: string }[] } }) {
  return spec.artwork.layers.find((l) => l.panelId === 'front' || l.panelId === 'label' || l.panelId === 'trayFront')?.markup ?? ''
}

function back(spec: { artwork: { layers: { panelId: string; markup: string }[] } }) {
  return spec.artwork.layers.find((l) => l.panelId === 'back' || l.panelId === 'trayBack')?.markup ?? ''
}

function side(spec: { artwork: { layers: { panelId: string; markup: string }[] } }) {
  return spec.artwork.layers.find((l) => l.panelId === 'left' || l.panelId === 'right')?.markup ?? ''
}

describe('Phase 7 reference gaps', () => {
  beforeEach(() => resetArtMemory())

  it('G1 paints perfume story + ÜST/KALP/TABAN and honors notes:none', () => {
    expect(resolvePerfumeStory(brief({ sector: 'parfüm', subProduct: 'eau de parfum' }), 'tr')).toMatch(/Tenle|\./)
    expect(resolvePerfumeNotes(brief({ sector: 'parfüm', subProduct: 'eau de parfum' }), 'tr')?.heart).toMatch(/Gül|Yasemin/)
    expect(perfumeNotesHidden(brief({ scentNotes: 'none' }))).toBe(true)

    const full = generate({
      sector: 'parfüm',
      subProduct: 'eau de parfum',
      styleType: 'luxury',
      templateId: 'fm-cos-tuck-perfume',
      volume: '50 ml',
      productName: 'Noir',
    })
    const svg = back(full)
    expect(svg).toContain('data-art="perfume-story"')
    expect(svg).toContain('data-art="perfume-notes"')
    expect(svg).toMatch(/ÜST/)
    expect(svg).toMatch(/KALP/)
    expect(svg).toMatch(/TABAN/)
    expect(svg).toMatch(/TOP/)
    expect(svg).toMatch(/HEART/)
    expect(svg).toMatch(/BASE/)
    expect(svg).toMatch(/Tenle|iz/)
    expect(full.copy.tagline).toMatch(/yoğunluk/i)
    expect(full.preflight.exportOk).toBe(true)

    const skipped = generate({
      sector: 'parfüm',
      subProduct: 'eau de parfum',
      styleType: 'luxury',
      templateId: 'fm-cos-tuck-perfume',
      volume: '50 ml',
      productName: 'Noir',
      scentNotes: 'none',
    })
    expect(back(skipped)).toContain('data-art="perfume-story"')
    expect(back(skipped)).not.toContain('data-art="perfume-notes"')
  })

  it('G2 side panels carry manifesto keywords beyond brand and volume', () => {
    const perfume = generate({
      sector: 'parfüm',
      subProduct: 'eau de parfum',
      styleType: 'luxury',
      templateId: 'fm-cos-tuck-perfume',
      volume: '50 ml',
      productName: 'Noir',
    })
    const food = generate({
      brandName: 'FORMA',
      sector: 'gıda',
      subProduct: 'genel',
      styleType: 'classic',
      templateId: 'fm-box-tuck-universal',
      volume: '250 g',
      productName: 'Pantry',
    })
    expect(side(perfume)).toContain('data-art="side-fill"')
    expect(side(perfume)).toMatch(/Tenle|Odada|iz/)
    expect(side(perfume)).toContain('data-art="side-script"')
    expect(side(food)).toContain('data-art="side-fill"')
    expect(side(food)).toMatch(/YEREL|SOFRA|SAF/)
    const sys = resolveDesignSystem(brief({ sector: 'kozmetik', subProduct: 'krem', styleType: 'modern' }), 'wrap-label')
    expect(sideFill(sys, 'tr')?.lines.join(' ')).toMatch(/ONARIR/)
  })

  it('G3 food tuck paints landscape band and richer claims; honey label stays label-flat', () => {
    const tuck = generate({
      brandName: 'FORMA',
      sector: 'gıda',
      subProduct: 'genel',
      styleType: 'classic',
      templateId: 'fm-box-tuck-universal',
      volume: '250 g',
      productName: 'Pantry',
    })
    const label = generate({
      brandName: 'YAYLA',
      sector: 'gıda',
      subProduct: 'bal',
      styleType: 'classic',
      packagingMode: 'label',
      templateId: 'fm-food-label-jar',
      volume: '340 g',
      productName: 'Çiçek Balı',
    })
    expect(face(tuck)).toContain('data-art="landscape-band"')
    expect(face(tuck)).toMatch(/SOFRA|YEREL|SADIK/)
    expect(face(label)).not.toContain('data-art="landscape-band"')
    expect(face(label)).toMatch(/YAYLA|DAĞ ÇİÇEĞİ|SAF DAMLA|ÇİÇEK/)
    expect(tuck.preflight.exportOk).toBe(true)
    expect(scoreVisualCraft(tuck, tuck.designPlan!).visualCraft).toBeGreaterThanOrEqual(70)
  })

  it('G4 eco cream lockup sits on a title card', () => {
    const eco = generate({
      brandName: 'LUMINA',
      sector: 'kozmetik',
      subProduct: 'krem',
      styleType: 'eco',
      templateId: 'fm-cos-tuck-cream',
      volume: '50 ml',
      productName: 'Leaf',
    })
    expect(face(eco)).toContain('data-art="title-card"')
    expect(eco.preflight.items.find((i) => i.id === 'collision')?.status).toBe('pass')
    expect(eco.preflight.exportOk).toBe(true)
    expect(scoreVisualCraft(eco, eco.designPlan!).visualCraft).toBeGreaterThanOrEqual(75)
  })

  it('G5 hair wrap paints step pill and bilingual product without a catalog SKU', () => {
    const wrap = generate({
      brandName: 'CAPA',
      sector: 'kozmetik',
      subProduct: 'şampuan',
      styleType: 'modern',
      packagingMode: 'label',
      templateId: 'fm-cos-label-bottle',
      volume: '250 ml',
      productName: 'Keratin Repair',
    })
    expect(wrap.copy.product).toMatch(/Keratin Onarım|Keratin Repair/)
    expect(face(wrap)).toContain('data-art="step-pill"')
    expect(face(wrap)).toMatch(/UYGULA|APPLY/)
    expect(face(wrap)).toContain('KERATIN REPAIR')
    expect(face(wrap)).toMatch(/Onarıcı bakım/)
    expect(wrap.preflight.exportOk).toBe(true)
  })
})
