/**
 * A face must not carry a motif its product category forbids — read from the table, not from memory.
 *
 * `detectCrossSectorBleed` checked three sectors with four hand-written string tests while the row
 * it was already holding listed the forbidden motifs for all sixteen. One of those branches was
 * simply wrong: `sector !== 'food'` flagged every beverage face for carrying its own nutrition
 * declaration — 24 false positives measured across the sweep, on faces the table gives a nutrition
 * kit to.
 *
 * Measured before the change: 0 real violations on 599 studio faces, 24 false ones. After: 0 and 0.
 * The check earns nothing today; it is here so the next painter that puts a PAO symbol on a food
 * back is caught by the product's own list rather than by whichever sector somebody remembered.
 */
import { describe, expect, it } from 'vitest'
import { detectCrossSectorBleed } from './SectorVisualVocabulary'
import { VOCAB } from './vocabularyTable'
import type { SectorId } from '../designSystem/types'
import type { BackgroundTreatment, HeroFamily, PatternFamily } from './DesignPlan'

const row = (sector: string, sub: string) => VOCAB.find((r) => r.sectorId === sector && r.subProductId === sub)!
const clean = (sector: string, sub: string, markup: string) => {
  const v = row(sector, sub)
  return detectCrossSectorBleed(
    v,
    v.heroFamilies[0] as HeroFamily,
    v.patternFamilies[0] as PatternFamily,
    v.backgroundTreatments[0] as BackgroundTreatment,
    sector as SectorId,
    markup,
  ).filter((f) => f.code === 'CROSS_SECTOR_BLEED')
}

describe('the product list decides, not a remembered sector', () => {
  it('a beverage carries its own nutrition declaration without complaint', () => {
    /*
     * The bug this replaced: beverage is not `food`, so the old branch read its declaration as
     * food copy bleeding onto a non-food face. Every beverage face in the sweep was flagged.
     */
    expect(row('beverage', 'beverage').legalKitId).toBe('nutrition')
    expect(row('beverage', 'beverage').forbiddenMotifs).not.toContain('nutrition-table')
    expect(clean('beverage', 'beverage', '<text>Besin Değerleri (100 ml için)</text>')).toEqual([])
  })

  it('but a perfume carrying one is caught', () => {
    expect(row('perfume', 'parfum').forbiddenMotifs).toContain('nutrition-table')
    const faults = clean('perfume', 'parfum', '<text>Besin Değerleri (100 g için)</text>')
    expect(faults).toHaveLength(1)
    expect(faults[0]!.detail).toMatch(/nutrition-table/)
  })

  it('and a food back carrying a perfume flammable pictogram is caught', () => {
    expect(row('food', 'honey').forbiddenMotifs).toContain('flammable')
    expect(clean('food', 'honey', '<g data-picto="flammable" />')).toHaveLength(1)
  })

  it('a cosmetic keeps its own PAO symbol', () => {
    // `pao` is forbidden on food, not on the categories that actually date-mark after opening.
    expect(row('cream', 'cream').forbiddenMotifs).not.toContain('pao')
    expect(clean('cream', 'cream', '<g data-picto="pao" /><text>12M</text>')).toEqual([])
  })
})

describe('evidence is the marker, not a number that happens to match', () => {
  it('a shared pictogram artboard is not a perfume asset', () => {
    /*
     * The replaced code matched the viewBox numbers of perfume assets. Measured: `986.01` is the
     * artboard of a pictogram every cosmetic face carries, so treating it as evidence flagged 78
     * clean cream, serum and baby faces the moment the rule was applied to all sixteen rows.
     */
    const markup = '<svg viewBox="0 0 986.01 1175.01"><defs /></svg>'
    for (const [sector, sub] of [['cream', 'cream'], ['serum', 'serum'], ['baby', 'baby'], ['food', 'honey']] as const) {
      expect(clean(sector, sub, markup), `${sector}:${sub}`).toEqual([])
    }
  })

  it('an unmarked species is not guessed at', () => {
    // `data-species` is on 0 of 599 faces, so `bee` and `mountain` cannot be checked from markup.
    expect(row('perfume', 'parfum').forbiddenMotifs).toContain('bee')
    expect(clean('perfume', 'parfum', '<text>bee mountain meadow</text>')).toEqual([])
  })
})
