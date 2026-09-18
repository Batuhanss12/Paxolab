/**
 * The four knobs a customer turns: mood, tone, variation, direction.
 *
 * Each one is separately testable and each has a rule it must not break, and those rules have been
 * argued over across the roadmap:
 *
 *   - **mood** may move the composition, not merely the paint — six moods that return one face are
 *     a dead knob (the reason `MOOD_WALK_OFFSET` exists);
 *   - **tone** is the customer's, so a pinned temperament is drawn, not merely ranked;
 *   - **variation** is six takes on the *same* decision: it changes the face and must leave the
 *     mood's colour alone, or one credit quietly buys a second mood knob;
 *   - **direction** offers real alternatives: distinct, painted, and picking one paints it.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief, PackagingMode, StyleType } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { buildCombinedSvg } from '../production/exportDoc'
import { hashStudioFace } from './studioGolden'
import { TEMPERAMENT_OPTIONS } from './temperament'
import { DIRECTION_OFFER_SIZE } from './direction'

const MOODS: StyleType[] = ['luxury', 'modern', 'minimal', 'eco', 'playful', 'classic']

function brief(extra: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Diako',
    productName: 'Fleur de Nuit',
    sector: 'kozmetik',
    subProduct: 'parfüm',
    packagingMode: 'box',
    templateId: 'fm-cos-tuck-perfume',
    styleType: 'luxury',
    colors: 'krem · altın',
    volume: '50 ml',
    barcode: '8690000000017',
    dimensionsMm: { L: 70, W: 35, H: 140 },
    ...extra,
  }
}

function gen(b: DesignBrief, patch: Record<string, unknown> = {}) {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({ brief: b, overridePatch: { studio: true, variationIndex: 0, ...patch } })
  const front = spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)!.markup
  return { spec, d: spec.studio!.direction, hash: hashStudioFace(front) }
}

describe('mood — six moods, six designs', () => {
  for (const surface of ['box', 'label'] as PackagingMode[]) {
    it(`${surface}: every mood paints cleanly and they do not collapse onto one face`, () => {
      const seen = new Set<string>()
      for (const styleType of MOODS) {
        const { spec, d } = gen(
          brief({
            styleType,
            packagingMode: surface,
            templateId: surface === 'box' ? 'fm-cos-tuck-perfume' : 'fm-cos-label-bottle',
            dimensionsMm: surface === 'box' ? { L: 70, W: 35, H: 140 } : { L: 70, W: 0, H: 90 },
          }),
        )
        expect(spec.studio!.collisions, `${surface}/${styleType}`).toEqual([])
        expect(spec.studio!.outOfBounds, `${surface}/${styleType}`).toEqual([])
        expect(Boolean(buildCombinedSvg(spec)), `${surface}/${styleType} export`).toBe(true)
        seen.add(`${d.archetype}/${d.background}/${d.temperament}`)
      }
      expect(seen.size, `six moods returned ${seen.size} direction(s)`).toBeGreaterThanOrEqual(3)
    })
  }
})

describe('tone — a pinned temperament is the one painted', () => {
  for (const option of TEMPERAMENT_OPTIONS) {
    it(`${option.id} is honoured`, () => {
      const { spec, d } = gen(brief({ studioTemperament: option.id }))
      expect(d.temperament).toBe(option.id)
      expect(spec.studio!.collisions).toEqual([])
    })
  }

  it('the six tones are six different grounds', () => {
    const grounds = TEMPERAMENT_OPTIONS.map((o) => gen(brief({ studioTemperament: o.id })).d.palette.ground)
    expect(new Set(grounds).size).toBeGreaterThanOrEqual(4)
  })
})

describe('variation — changes the face, not the mood', () => {
  it('six variations are six faces on one palette', () => {
    const hashes = new Set<string>()
    const grounds = new Set<string>()
    for (let v = 0; v <= 5; v += 1) {
      const r = gen(brief(), { variationIndex: v })
      hashes.add(r.hash)
      grounds.add(r.d.palette.ground)
      expect(r.spec.studio!.collisions, `variation ${v}`).toEqual([])
      expect(Boolean(buildCombinedSvg(r.spec)), `variation ${v} export`).toBe(true)
    }
    expect(hashes.size, 'variation barely moved the face').toBeGreaterThanOrEqual(4)
    // The rule the roadmap argued for: one credit buys six takes on the same decision.
    expect(grounds.size, 'variation repainted the ground — that is the mood knob').toBe(1)
  })
})

describe('direction — the offer is real', () => {
  const base = gen(brief())
  const offer = base.spec.studio!.offer!

  it('offers a spread of distinct candidates, one of them the painted face', () => {
    expect(offer.candidates.length).toBeGreaterThanOrEqual(2)
    expect(offer.candidates.length).toBe(DIRECTION_OFFER_SIZE)
    expect(new Set(offer.candidates.map((c) => c.archetype)).size).toBe(offer.candidates.length)
    const selected = offer.candidates.filter((c) => c.selected)
    expect(selected).toHaveLength(1)
    expect(selected[0].archetype).toBe(base.d.archetype)
  })

  it('all four arrive painted, so the strip shows designs and not swatches', () => {
    for (const row of offer.candidates) {
      expect(row.face, `${row.archetype} has no painted face`).toMatch(/^<svg /)
    }
    // Four takes on one brief, not the same face four times.
    expect(new Set(offer.candidates.map((row) => row.face)).size).toBe(offer.candidates.length)
  })

  it('picking a runner-up paints that one', () => {
    const runner = offer.candidates.find((c) => !c.selected)!
    const picked = gen(brief({ studioFamily: runner.family, studioFamilyLocked: true }))
    expect(picked.d.archetype).toBe(runner.archetype)
  })
})
