/**
 * One carton is one design.
 *
 * The owner opened the dieline on a crest carton and found three different surfaces glued
 * together: a gold roundel on a light arabesque field in the middle, two flat dark slabs for the
 * sides, and a flat light back. Nothing in the engine was wrong by its own lights — every panel
 * was inside the cut, nothing collided, the export gate passed, the frozen hash matched. The
 * defect only exists at the level of the whole box, which is the level nothing was checking.
 *
 * The cause was that sides, lid and back chose their texture from a hand-written list of four
 * archetypes. Everything outside that list — `crest-panel`, `atelier-plate`, `specimen-hero`,
 * `card-on-art` — fell through to a flat slab of colour, and for the crest the slab was the
 * palette's darkest tone while its own face was the lightest.
 *
 * So these tests assert at the level the defect lives at: across every family, on every panel of
 * the carton, the painted field is the one the direction chose. Panels differ in anatomy — hero,
 * information, manifesto — never in visual system.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { STUDIO_FAMILIES } from './family'
import { buildCombinedSvg } from '../production/exportDoc'
import type { StudioFamily } from './types'

/** The two archetypes that wear a different field on their spines, each named in its own DNA. */
const SPINE_EXCEPTION: Record<string, string> = {
  'noir-stack': 'marble',
  'diagonal-tech': 'circuit',
}

function honeyBox(family: StudioFamily): DesignBrief {
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
    studioFamily: family,
    studioFamilyLocked: true,
  }
}

function generate(family: StudioFamily) {
  resetArtMemory()
  return new FormaLocalEngine().generate({
    brief: honeyBox(family),
    overridePatch: { studio: true, variationIndex: 0 },
  })
}

const FAMILIES = Object.keys(STUDIO_FAMILIES) as StudioFamily[]

describe('carton coherence — every panel belongs to the same design', () => {
  for (const family of FAMILIES) {
    it(`${family}: front, back, sides and lid all wear the direction's field`, () => {
      const spec = generate(family)
      const d = spec.studio!.direction
      const expected = SPINE_EXCEPTION[d.archetype] ?? d.background

      const front = spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)!
      const others = spec.artwork.layers.filter((l) => l.panelId !== front.panelId && /back|side|left|right|top|bottom|lid/i.test(l.panelId))
      expect(others.length, `${family} painted no secondary panels`).toBeGreaterThan(0)

      for (const layer of others) {
        const fields = [...layer.markup.matchAll(/data-bg="([^"]+)"/g)].map((m) => m[1])
        expect(fields.length, `${layer.panelId} is a flat slab — no field at all`).toBeGreaterThan(0)
        for (const field of fields) {
          expect(field, `${family}/${layer.panelId} wears ${field}, the design is ${expected}`).toBe(expected)
        }
      }
    })
  }

  it('no family paints a carton whose panels disagree, and all of them still export', () => {
    for (const family of FAMILIES) {
      const spec = generate(family)
      expect(spec.studio!.collisions, `${family} collisions`).toEqual([])
      expect(spec.studio!.outOfBounds, `${family} out of bounds`).toEqual([])
      expect(Boolean(buildCombinedSvg(spec)), `${family} export`).toBe(true)
    }
  })
})
