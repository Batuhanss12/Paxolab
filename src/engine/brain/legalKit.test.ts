/**
 * Which required-information set a product needs has one home now.
 *
 * It is a fact about the product, not a design decision, and until Phase 2G-D nothing owned it:
 * three studio back painters and the craft detector each re-derived it as
 * `sector === 'food' || sector === 'beverage'`, written out by hand. `vocabularyTable.ts` had said
 * it all along — `nutrition` on the food rows and beverage, `inci` on cream and serum, `spec` on
 * the device rows, `composition` on perfume, `directions` on health, baby and cleaning.
 *
 * The move was safe because it was measured first: across 581 faces the table and the inline
 * condition disagreed zero times. These tests keep it that way, and keep the renderer and the
 * detector reading the same answer — the drift that hand-written conditions invite.
 */
import { describe, expect, it } from 'vitest'
import { legalKitFor, backRoleFor } from './vocabularyRules'
import { VOCAB } from './vocabularyTable'
import type { SectorId } from '../designSystem/types'

describe('the table answers, not a sector check', () => {
  it('nutrition is exactly food and beverage', () => {
    /*
     * The invariant the refactor rests on. If someone gives another sector a nutrition kit — or
     * takes it off food — the painters and the detector both change with it, which is the point;
     * this test is here so that change is deliberate rather than a surprise.
     */
    const sectors = [...new Set(VOCAB.map((row) => row.sectorId))]
    for (const sector of sectors) {
      const wantsNutrition = legalKitFor(sector) === 'nutrition'
      expect(wantsNutrition, sector).toBe(sector === 'food' || sector === 'beverage')
    }
  })

  it('every sector in the table has a kit and a back role', () => {
    for (const row of VOCAB) {
      expect(legalKitFor(row.sectorId, row.subProductId), row.id).toBeTruthy()
      expect(backRoleFor(row.sectorId, row.subProductId), row.id).toBeTruthy()
    }
  })

  it('and the kits that are not nutrition are the ones the table names', () => {
    expect(legalKitFor('cream' as SectorId)).toBe('inci')
    expect(legalKitFor('serum' as SectorId)).toBe('inci')
    expect(legalKitFor('perfume' as SectorId)).toBe('composition')
    expect(legalKitFor('electronics' as SectorId)).toBe('spec')
    expect(legalKitFor('health' as SectorId)).toBe('directions')
    expect(backRoleFor('food' as SectorId)).toBe('nutrition-table')
    expect(backRoleFor('electronics' as SectorId)).toBe('spec-compliance')
  })

  it('an unknown sector falls back rather than throwing', () => {
    // `lookupVocabulary` keeps its existing fallback; nothing here may make a brief unpaintable.
    expect(legalKitFor('bilinmeyen' as SectorId)).toBeTruthy()
  })
})

describe('a beverage carton is a nutrition back, like food', () => {
  it('draws its declaration', async () => {
    /*
     * Beverage is the sector most easily lost when the condition is written by hand — it is the one
     * that does not have "food" in its name. The table has always given it a nutrition kit.
     */
    const { FormaLocalEngine } = await import('../FormaLocalEngine')
    const { emptyBrief } = await import('../fields')
    const { resetArtMemory } = await import('./DesignMemory')
    resetArtMemory()
    const spec = new FormaLocalEngine().generate({
      brief: {
        ...emptyBrief(),
        brandName: 'Elite Brew', productName: 'Filtre Kahve', sector: 'içecek', subProduct: 'filtre kahve',
        packagingMode: 'box', templateId: 'parfum-tuck-end', styleType: 'classic',
        volume: '250 gr', dimensionsMm: { L: 70, W: 45, H: 150 }, barcode: '8690000000017',
      },
      overridePatch: { studio: true, variationIndex: 0 },
    })
    expect(spec.designPlan!.sector).toBe('beverage')
    const placed = spec.studio!.panels.flatMap((p) => p.placed).map((b) => b.id.split('#')[0] ?? b.id)
    const skipped = spec.studio!.panels.flatMap((p) => p.skipped ?? []).map((x) => x.id)
    expect(placed.includes('nutrition-table') || skipped.includes('nutrition-table'), 'beyan ne çizildi ne kaydedildi').toBe(true)
    expect(placed, 'içecek kartonu beyanını taşımalı').toContain('nutrition-table')
  })
})

describe('the detector reads the same answer as the painters', () => {
  it('nutritionState is not required wherever the kit is not nutrition', async () => {
    /*
     * Both sides call `legalKitFor` now. Before, each spelled the condition out, so a change to one
     * could leave the other asking for a declaration the renderer was never going to draw.
     */
    const craft = await import('./studioCraft')
    const notFood = ['cream', 'perfume', 'electronics', 'health', 'baby', 'cleaning'] as SectorId[]
    for (const sector of notFood) {
      const ctx = { plan: { sector, subProduct: '' }, report: { panels: [] } } as unknown as Parameters<typeof craft.nutritionState>[0]
      expect(craft.nutritionState(ctx), sector).toBe('NOT_REQUIRED')
    }
  })

  it('and it is required on food and beverage', async () => {
    const craft = await import('./studioCraft')
    for (const sector of ['food', 'beverage'] as SectorId[]) {
      const ctx = { plan: { sector, subProduct: '' }, report: { panels: [] } } as unknown as Parameters<typeof craft.nutritionState>[0]
      // No panels, so nothing drawn and nothing recorded — the renderer-failure state.
      expect(craft.nutritionState(ctx), sector).toBe('REQUIRED_BUT_NOT_RENDERED')
    }
  })
})
