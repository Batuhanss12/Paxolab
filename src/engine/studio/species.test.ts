/**
 * L2 — the picture has to be of the product.
 *
 * Measured 2026-09-17 across 28 briefs: marble and generic botany were applied as "luxury" and
 * "natural" wallpaper to unrelated categories, and every meadow grew conifers — so an olive oil
 * carton showed pine trees. The archetype still owns the composition; this owns the silhouettes.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { speciesFor, speciesLeaf, speciesTree } from './species'

function food(subProduct: string, productName = 'Ürün'): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Köyden',
    productName,
    sector: 'gıda',
    subProduct,
    packagingMode: 'box',
    styleType: 'eco',
    volume: '250 ml',
    barcode: '8690000000017',
    dimensionsMm: { L: 70, W: 45, H: 150 },
  }
}

function frontOf(brief: DesignBrief): string {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } })
  return spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)?.markup ?? ''
}

describe('L2 — species resolution', () => {
  it('reads the product, not the sector alone', () => {
    expect(speciesFor({ sector: 'gıda', subProduct: 'zeytinyağı' })).toBe('olive')
    expect(speciesFor({ sector: 'gıda', subProduct: 'kahve' })).toBe('coffee')
    expect(speciesFor({ sector: 'gıda', subProduct: 'çay' })).toBe('tea')
    expect(speciesFor({ sector: 'gıda', subProduct: 'bal' })).toBe('grain')
    expect(speciesFor({ sector: 'gıda', subProduct: 'çikolata' })).toBe('cocoa')
  })

  it('falls back to leafy botany for care products and neutral scenery otherwise', () => {
    expect(speciesFor({ sector: 'kozmetik', subProduct: 'krem' })).toBe('flora')
    expect(speciesFor({ sector: 'elektronik', subProduct: 'kulaklık' })).toBe('conifer')
  })

  it('catches the product in the name when the category is vague', () => {
    expect(speciesFor({ sector: 'gıda', subProduct: '', productName: 'Limon Soslu' })).toBe('citrus')
    expect(speciesFor({ sector: 'gıda', subProduct: '', productName: 'Sızma Zeytinyağı' })).toBe('olive')
  })

  it('draws a different silhouette per species', () => {
    const olive = speciesTree('olive', 10, 20, 8, '#000')
    const conifer = speciesTree('conifer', 10, 20, 8, '#000')
    const grain = speciesTree('grain', 10, 20, 8, '#000')
    expect(olive).not.toBe(conifer)
    expect(grain).not.toBe(conifer)
    // An orchard crown is elliptical; a conifer is a single polygon.
    expect(olive).toContain('<ellipse')
    expect(conifer).not.toContain('<ellipse')
  })

  it('olive and coffee sprigs differ from the neutral broad leaf', () => {
    const olive = speciesLeaf('olive', 5, 5, 20, 0, '#000', 1)
    const flora = speciesLeaf('flora', 5, 5, 20, 0, '#000', 1)
    expect(olive).not.toBe(flora)
    expect(olive).toContain('<ellipse')
  })
})

describe('L2 — the species reaches the painted face', () => {
  it('an olive oil carton does not grow conifers', () => {
    const olive = frontOf(food('zeytinyağı', 'Naturel'))
    const neutral = frontOf(food('kulaklık', 'Pulse'))
    expect(olive).not.toBe(neutral)
    // Orchard crowns are ellipses; the old pine path had none in the hillside row.
    expect(olive).toContain('<ellipse')
  })

  it('two different foods get different scenery', () => {
    expect(frontOf(food('zeytinyağı', 'Naturel'))).not.toBe(frontOf(food('bal', 'Çiçek')))
  })

  it('the same brief is still deterministic', () => {
    expect(frontOf(food('zeytinyağı', 'Naturel'))).toBe(frontOf(food('zeytinyağı', 'Naturel')))
  })
})
