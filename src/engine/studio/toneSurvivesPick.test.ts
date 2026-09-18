/**
 * Choosing a design must not silently change the colour.
 *
 * The owner set the tone to dark luxe, picked a different direction from the strip, and the design
 * came back light luxe. The pick handler cleared `studioTemperament`, so the next generation
 * re-guessed the tone from the new archetype — and a tool that undoes your colour when you change
 * the skeleton reads as arguing with you.
 *
 * The rule now has two halves, and both are load-bearing:
 *
 *   - a direction pick carries the tone that was on screen, so nothing the customer can see
 *     changes except the thing they asked to change;
 *   - a tone that only *travelled* is released by the next mood change, while one the customer
 *     chose from the tone control holds. Without that second half, carrying the tone would freeze
 *     it for the rest of the session and the mood knob could never move colour again.
 *
 * These test the engine contract the handlers rely on: a brief carrying `studioTemperament` paints
 * that tone whatever archetype it lands on.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { STUDIO_FAMILIES } from './family'
import { TEMPERAMENT_OPTIONS } from './temperament'
import type { StudioFamily } from './types'

function label(extra: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Noctis',
    productName: 'Eau de Parfum',
    sector: 'kozmetik',
    subProduct: 'parfüm',
    packagingMode: 'label',
    templateId: 'fm-cos-label-bottle',
    styleType: 'luxury',
    colors: 'siyah · altın',
    volume: '50 ml',
    barcode: '8690000000017',
    dimensionsMm: { L: 90, W: 0, H: 70 },
    ...extra,
  }
}

function generate(b: DesignBrief) {
  resetArtMemory()
  return new FormaLocalEngine().generate({ brief: b, overridePatch: { studio: true, variationIndex: 0 } })
}

describe('tone survives a direction pick', () => {
  it('a pinned tone holds on every family the customer can pick', () => {
    for (const option of TEMPERAMENT_OPTIONS) {
      for (const family of Object.keys(STUDIO_FAMILIES) as StudioFamily[]) {
        const spec = generate(
          label({ studioTemperament: option.id, studioFamily: family, studioFamilyLocked: true }),
        )
        expect(spec.studio!.direction.temperament, `${family} + ${option.id}`).toBe(option.id)
      }
    }
  })

  it('the tone the customer set survives, and the design still paints clean', () => {
    const dark = generate(label({ studioTemperament: 'dark-luxe' }))
    expect(dark.studio!.direction.temperament).toBe('dark-luxe')

    // …and picking another direction while holding that tone keeps it.
    const picked = generate(
      label({ studioTemperament: 'dark-luxe', studioFamily: 'wave', studioFamilyLocked: true }),
    )
    expect(picked.studio!.direction.archetype).toBe(STUDIO_FAMILIES.wave.label)
    expect(picked.studio!.direction.temperament, 'yön seçimi tonu değiştirdi').toBe('dark-luxe')
    expect(picked.studio!.collisions).toEqual([])
  })

  it('two tones on one family are two different grounds — the pin is drawn, not merely recorded', () => {
    const a = generate(label({ studioTemperament: 'dark-luxe', studioFamily: 'crest', studioFamilyLocked: true }))
    const b = generate(label({ studioTemperament: 'light-luxe', studioFamily: 'crest', studioFamilyLocked: true }))
    expect(a.studio!.direction.palette.ground).not.toBe(b.studio!.direction.palette.ground)
  })
})
