/**
 * The offer does not move under the cursor.
 *
 * Two separate faults produced the same symptom, which the owner reported as "tıklandıkça sıralama
 * değişiyor". Both came from the offer being built out of the live ranking:
 *
 *   - the ranking is sorted best-fit-first, and picking a design pins its family, which re-ranks it
 *     to the front — so the card you just clicked jumped to position 1 and the rest slid along;
 *   - the same pin boosts that family's score, which could push whichever family sat on the cut
 *     line out of the set entirely. Measured on a honey carton: choosing `marble` or `crest`
 *     replaced `ink` with `dark-luxe`, so two cards the customer had been looking at vanished.
 *
 * A picker whose contents rearrange as you use it is not a picker, and "3. yön" in the chat has to
 * still mean card 3 a moment later. So the offer is ordered by the family table and ranked as if
 * nothing were picked; the recommendation is carried by which candidate arrives `selected`.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import type { StudioFamily } from './types'

function honey(extra: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Yayla',
    productName: 'Çiçek Balı',
    sector: 'gıda',
    subProduct: 'bal',
    packagingMode: 'box',
    templateId: 'fm-food-tuck-honey',
    styleType: 'eco',
    colors: 'kraft · altın',
    volume: '250 g',
    barcode: '8690000000024',
    dimensionsMm: { L: 70, W: 70, H: 120 },
    ...extra,
  }
}

function offer(brief: DesignBrief) {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } })
  return spec.studio!.offer!.candidates
}

describe('direction offer — stable under selection', () => {
  const first = offer(honey())
  const order = first.map((row) => row.family)

  it('offers a spread and marks exactly one as the painted face', () => {
    expect(order.length).toBeGreaterThanOrEqual(4)
    expect(new Set(order).size).toBe(order.length)
    expect(first.filter((row) => row.selected)).toHaveLength(1)
  })

  it('picking any candidate leaves every card where it was', () => {
    for (const family of order) {
      const rows = offer(honey({ studioFamily: family as StudioFamily, studioFamilyLocked: true }))
      expect(rows.map((row) => row.family), `${family} seçilince sıra oynadı`).toEqual(order)
      // …and the only thing that changed is which one is badged.
      const selected = rows.find((row) => row.selected)
      expect(selected?.family, `${family} seçildi ama ekranda o yok`).toBe(family)
      expect(selected?.index).toBe(order.indexOf(family) + 1)
    }
  })

  it('index is position, so “3. yön” keeps meaning card 3', () => {
    for (const rows of [first, offer(honey({ studioFamily: 'crest', studioFamilyLocked: true }))]) {
      rows.forEach((row, i) => expect(row.index).toBe(i + 1))
    }
  })
})
