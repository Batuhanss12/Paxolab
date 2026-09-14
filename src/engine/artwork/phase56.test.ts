import { beforeEach, describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { resetArtMemory } from '../brain'
import { scoreVisualCraft } from '../brain/DesignScore'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import { defaultIngredientClaims, sampleCopy } from './copy'
import { resolveSectorCopy } from './sectorCopyConfig'

function brief(patch: Partial<DesignBrief>): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'LUMINA',
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
  return (
    spec.artwork.layers.find((l) => l.panelId === 'back' || l.panelId === 'labelBack' || l.panelId === 'trayBack')
      ?.markup ?? ''
  )
}

describe('Phase 5 style differentiation', () => {
  beforeEach(() => resetArtMemory())

  it('splits cream tagline and claims across eco / playful / modern', () => {
    const eco = sampleCopy(brief({ sector: 'kozmetik', subProduct: 'krem', styleType: 'eco' }))
    const play = sampleCopy(brief({ sector: 'kozmetik', subProduct: 'krem', styleType: 'playful' }))
    const modern = sampleCopy(brief({ sector: 'kozmetik', subProduct: 'krem', styleType: 'modern' }))
    expect(eco.tagline).toBe('Doğadan yavaş.')
    expect(play.tagline).toBe('Parla. Uyu. Tekrar.')
    expect(modern.tagline).toBe('Klinik onarım.')
    expect(defaultIngredientClaims(brief({ sector: 'kozmetik', subProduct: 'krem', styleType: 'eco' }))).toBe(
      'SHEA + CENTELLA',
    )
    expect(defaultIngredientClaims(brief({ sector: 'kozmetik', subProduct: 'krem', styleType: 'playful' }))).toBe(
      'SHEA + VITAMIN E',
    )
    expect(defaultIngredientClaims(brief({ sector: 'kozmetik', subProduct: 'krem', styleType: 'modern' }))).toBe(
      'CERAMIDE + NIACINAMIDE',
    )
  })

  it('paints eco field, playful capsules, modern rail and hides SEAM word', () => {
    const eco = generate({
      sector: 'kozmetik',
      subProduct: 'krem',
      styleType: 'eco',
      templateId: 'fm-cos-tuck-cream',
      volume: '50 ml',
      productName: 'Leaf',
    })
    const play = generate({
      sector: 'kozmetik',
      subProduct: 'krem',
      styleType: 'playful',
      templateId: 'fm-cos-tuck-cream',
      volume: '50 ml',
      productName: 'Tropic',
    })
    const wrap = generate({
      sector: 'kozmetik',
      subProduct: 'krem',
      styleType: 'modern',
      packagingMode: 'label',
      templateId: 'fm-cos-label-bottle',
      volume: '50 ml',
      productName: 'Night Cream',
    })
    const luxury = generate({
      brandName: 'AURELIA',
      sector: 'parfüm',
      subProduct: 'eau de parfum',
      styleType: 'luxury',
      templateId: 'fm-cos-tuck-perfume',
      volume: '50 ml',
      productName: 'Noir',
    })
    expect(face(eco)).toContain('data-bg="eco-grain"')
    expect(face(eco)).toMatch(/M[\d.]+ [\d.]+ C/)
    expect(face(play)).toContain('data-bg="playful-capsules"')
    expect(face(play)).toContain('data-art="capsule-volume"')
    expect(face(play)).not.toContain('data-art="gold-bar"')
    expect(play.copy.tagline).not.toBe(eco.copy.tagline)
    expect(face(wrap)).toContain('data-art="modern-rail"')
    expect(face(wrap)).toContain('data-art="modern-grid"')
    expect(face(wrap)).not.toMatch(/>SEAM</)
    expect(face(wrap)).toContain('data-art="seam"')
    expect(luxury.copy.tagline).toMatch(/yoğunluk/i)
    expect(scoreVisualCraft(eco, eco.designPlan!).visualCraft).toBeGreaterThanOrEqual(75)
    expect(scoreVisualCraft(play, play.designPlan!).visualCraft).toBeGreaterThanOrEqual(75)
    expect(scoreVisualCraft(wrap, wrap.designPlan!).visualCraft).toBeGreaterThanOrEqual(75)
    expect(scoreVisualCraft(luxury, luxury.designPlan!).visualCraft).toBeGreaterThanOrEqual(75)
  })
})

describe('Phase 6 food nutrition back', () => {
  beforeEach(() => resetArtMemory())

  it('overrides bakery voice off honey / jam / tea / chocolate', () => {
    const honey = resolveSectorCopy('food', 'bal çiçek', 'tr')
    const jam = resolveSectorCopy('food', 'reçel vişne', 'tr')
    const tea = resolveSectorCopy('food', 'çay adaçayı', 'tr')
    const choco = resolveSectorCopy('food', 'çikolata cacao', 'tr')
    const biscuit = resolveSectorCopy('food', 'kurabiye biscuit', 'tr')
    expect(honey.ingredients).not.toMatch(/Buğday unu/)
    expect(jam.ingredients).not.toMatch(/Buğday unu/)
    expect(tea.ingredients).not.toMatch(/Buğday unu/)
    expect(choco.ingredients).not.toMatch(/Buğday unu/)
    expect(honey.tagline).not.toMatch(/Fırından/)
    expect(jam.tagline).toBe('Bahçeden kavanoza.')
    expect(biscuit.ingredients).toMatch(/Buğday unu/)
  })

  it('paints family tables and food label grammar', () => {
    const oil = generate({
      brandName: 'TERRA',
      sector: 'gıda',
      subProduct: 'zeytinyağı',
      styleType: 'luxury',
      templateId: 'fm-food-tuck-oil',
      volume: '500 ml',
      productName: 'Sızma',
    })
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
    const choco = generate({
      brandName: 'NIB',
      sector: 'gıda',
      subProduct: 'çikolata',
      styleType: 'playful',
      templateId: 'fm-food-tray-snack',
      volume: '80 g',
      productName: 'Cacao',
    })
    const biscuit = generate({
      brandName: 'MILL',
      sector: 'gıda',
      subProduct: 'kurabiye',
      styleType: 'classic',
      templateId: 'fm-food-tray-snack',
      volume: '180 g',
      productName: 'Biscuit',
    })
    expect(back(oil)).toContain('data-food-family="oil"')
    expect(back(oil)).toContain('100 g')
    expect(back(oil)).toMatch(/Yağ<\/text>[\s\S]{0,220}?>100 g</)
    expect(back(honey)).toContain('İÇİNDEKİLER')
    expect(back(honey)).not.toContain('KULLANIM')
    expect(back(honey)).toContain('data-food-family="honey"')
    expect(back(honey)).not.toMatch(/Buğday unu/)
    expect(honey.copy.ingredients).not.toMatch(/Buğday unu/)
    expect(back(choco)).toContain('data-food-family="chocolate"')
    expect(back(choco)).toContain('35 g')
    expect(back(biscuit)).toContain('data-food-family="biscuit"')
    expect(back(biscuit)).toContain('22 g')
    expect(oil.preflight.items.find((i) => i.id === 'ds-food-family')?.status).toBe('pass')
    expect(honey.preflight.items.find((i) => i.id === 'ds-food-family')?.status).toBe('pass')
  })
})
