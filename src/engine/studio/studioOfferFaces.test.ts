/**
 * The offer strip shows the candidate, not a swatch.
 *
 * Before F-6 the two runner-up directions were a temperament swatch and a family name, and the
 * customer had to spend a credit to see what "botanik" would look like on their own brief. Now
 * each row carries its front, painted through the same painters — so what the strip shows is
 * exactly what choosing it produces. The painted design itself is untouched (the golden table
 * proves it), and painting the fronts is not a generation: no ledger, no repair, no credit.
 *
 * F-13 brought the selected row into that rule. It used to be left bare because it is the design
 * and already fills the preview, which was sound while the strip listed alternatives to the one
 * face on screen. The offer is now four finished designs shown together, so a bare row is a hole
 * in the set — and it always fell on the option the customer was being shown.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'

function coffee(extra: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Elite Brew',
    productName: 'Mocha',
    sector: 'gıda',
    subProduct: 'kahve',
    packagingMode: 'box',
    templateId: 'coffee-box',
    dimensionsMm: { L: 80, W: 50, H: 180 },
    styleType: 'luxury',
    colors: 'siyah · altın',
    volume: '250 g',
    ...extra,
  }
}

function generate(brief: DesignBrief, overridePatch: Record<string, unknown> = {}) {
  resetArtMemory()
  return new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0, ...overridePatch } })
}

describe('F-6 offer faces', () => {
  it('paints every row in the offer, the selected one included', () => {
    const spec = generate(coffee())
    const offer = spec.studio!.offer!
    expect(offer.candidates.length).toBeGreaterThanOrEqual(2)
    expect(offer.candidates.filter((row) => row.selected)).toHaveLength(1)
    for (const row of offer.candidates) {
      expect(row.face, `${row.archetype} has no face`).toBeTruthy()
      expect(row.face).toMatch(/^<svg /)
      expect(row.face).toContain(`data-archetype="${row.archetype}"`)
      // Turkish caps: "Elite" sets as "ELİTE" (dotted İ); the script pairing keeps the brand's own case.
      expect(row.face).toMatch(/el[iİ]te brew/i)
      // The front only — one studio layer, no back, no sides.
      expect(row.face!.match(/data-art="studio"/g)).toHaveLength(1)
    }
  })

  it('shows what choosing the candidate would actually produce', () => {
    /*
     * Pin the runner-up family and generate for real: the painted front must carry the same
     * archetype and the same brand block as the thumbnail did. Byte equality is not asserted —
     * the real generation goes through the repair loop and the identity scale — but the
     * archetype, background and family the thumbnail promised are the ones delivered.
     */
    const spec = generate(coffee())
    const runnerUp = spec.studio!.offer!.candidates.find((row) => !row.selected)!
    const chosen = generate({ ...coffee(), studioFamily: runnerUp.family, studioFamilyLocked: true })
    expect(chosen.studio!.direction.archetype).toBe(runnerUp.archetype)
    const front = chosen.artwork.layers.find((l) => l.panelId === chosen.artwork.frontPanelId)!.markup
    expect(front).toContain(`data-archetype="${runnerUp.archetype}"`)
    expect(runnerUp.face).toContain(`data-archetype="${runnerUp.archetype}"`)
  })

  it('works on a label too, and the thumbnail is a complete panel document', () => {
    const spec = generate(coffee({ packagingMode: 'label', templateId: 'fm-food-label-jar', dimensionsMm: { L: 70, W: 0, H: 90 } }))
    const faces = spec.studio!.offer!.candidates.filter((row) => !row.selected).map((row) => row.face!)
    expect(faces.length).toBeGreaterThan(0)
    for (const face of faces) {
      expect(face).toMatch(/viewBox="/)
      expect(face).toMatch(/<\/svg>\s*$/)
    }
  })
})
