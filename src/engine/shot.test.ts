/**
 * What one credit buys, pinned.
 *
 * The policy is: a credit buys a *decision* rendered six ways. Stepping through those six is free;
 * changing the brief, the mood or the direction is a new decision and costs. The client expresses
 * that by reusing one shot id, so this file's job is to make sure the id moves exactly when money
 * should change hands and not otherwise.
 *
 * Getting this wrong is not a rendering bug, it is a billing bug in both directions: a key that
 * moves too easily charges for a click that changed nothing, and a key that moves too rarely gives
 * away designs the customer never paid for.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../types'
import { emptyBrief } from './fields'
import { shotKeyOf } from './shot'

function brief(patch: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Köyden',
    productName: 'Naturel Sızma',
    sector: 'gıda',
    subProduct: 'zeytinyağı',
    packagingMode: 'box',
    styleType: 'eco',
    colors: 'koyu yeşil · altın',
    volume: '500 ml',
    barcode: '8690000000017',
    dimensionsMm: { L: 70, W: 45, H: 150 },
    ...patch,
  }
}

describe('shot key — free to browse, pay to decide', () => {
  it('stepping through variations stays in the same shot', () => {
    const first = shotKeyOf(brief({ directionVariation: 0 }))
    for (const step of [1, 2, 3, 4, 5]) {
      expect(shotKeyOf(brief({ directionVariation: step })), `variation ${step}`).toBe(first)
    }
  })

  it('the same brief always produces the same key', () => {
    expect(shotKeyOf(brief())).toBe(shotKeyOf(brief()))
  })

  const PAID: { label: string; patch: Partial<DesignBrief> }[] = [
    { label: 'ruh hali', patch: { styleType: 'luxury' } },
    { label: 'renk', patch: { colors: 'siyah · altın' } },
    { label: 'yön (aile)', patch: { studioFamily: 'marble' } },
    { label: 'marka', patch: { brandName: 'Nexora' } },
    { label: 'ürün', patch: { productName: 'Sızma' } },
    { label: 'sektör', patch: { sector: 'kozmetik' } },
    { label: 'alt ürün', patch: { subProduct: 'krem' } },
    { label: 'ambalaj modu', patch: { packagingMode: 'label' } },
    { label: 'ölçü', patch: { dimensionsMm: { L: 80, W: 45, H: 150 } } },
    { label: 'hikâye', patch: { story: 'Tek bahçe, soğuk sıkım.' } },
    { label: 'miktar', patch: { volume: '250 ml' } },
    { label: 'vetolanan aile', patch: { avoidStudioFamilies: ['marble'] } },
  ]

  for (const row of PAID) {
    it(`${row.label} değişince yeni çekim`, () => {
      expect(shotKeyOf(brief(row.patch))).not.toBe(shotKeyOf(brief()))
    })
  }

  it('a list only reorders, so the same veto set is the same shot', () => {
    // Otherwise the order a user happened to click two vetoes in would cost them a credit.
    const a = shotKeyOf(brief({ avoidStudioFamilies: ['marble', 'botanical'] }))
    const b = shotKeyOf(brief({ avoidStudioFamilies: ['botanical', 'marble'] }))
    expect(a).toBe(b)
  })

  it('bookkeeping fields are not priced', () => {
    // Provenance is per-field source metadata the merge layer writes. It changes constantly and
    // changes nothing on the face; charging for it would bill the customer for our own housekeeping.
    const withProvenance = brief({ provenance: { brandName: { source: 'USER_EXPLICIT', confidence: 1 } } })
    expect(shotKeyOf(withProvenance)).toBe(shotKeyOf(brief()))
  })
})
