/**
 * A family pin the engine does not recognise must fail safe, not quietly bend the design.
 *
 * The reachable case is a brief restored from an older session: `studioFamily` is typed, so no
 * live caller can set a bad value, but storage is JSON and a key that has since been renamed comes
 * back as a string nothing matches.
 *
 * Measured: an unknown pin behaves exactly like no pin — `hintsFromFamily` rejects it, the brief is
 * re-stamped with the family the design actually landed on, and the face is clean and deliverable.
 * That is the right behaviour and this holds it there. What it deliberately does *not* assert is
 * that the customer is told; they are not, and that is written up as a known gap rather than
 * guarded as if it were fine.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { resetArtMemory } from '../brain/DesignMemory'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { hintsFromFamily, isStudioFamily, STUDIO_FAMILIES } from './family'
import type { StudioFamily } from './types'

function briefWith(family: string | undefined): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Vera',
    productName: 'Noir',
    sector: 'parfüm',
    subProduct: 'eau de parfum',
    packagingMode: 'box',
    templateId: 'parfum-tuck-end',
    styleType: 'luxury',
    volume: '50 ml',
    dimensionsMm: { L: 70, W: 35, H: 140 },
    barcode: '8690000000017',
    ...(family === undefined ? {} : { studioFamily: family as StudioFamily, studioFamilyLocked: true }),
  }
}

function generate(brief: DesignBrief) {
  resetArtMemory()
  return new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } })
}

describe('an unrecognised family pin fails safe', () => {
  it('rejects a string that is not a family, at the one place that reads one', () => {
    // An archetype id is the most likely near-miss: `arch-crown` is real, but it is not a family.
    for (const near of ['arch-crown', 'collage-plate', 'kemer-tac', '', 'MARBLE']) {
      expect(isStudioFamily(near), near).toBe(false)
      expect(hintsFromFamily(near, 'box'), near).toBeNull()
    }
    for (const family of Object.keys(STUDIO_FAMILIES) as StudioFamily[]) {
      expect(isStudioFamily(family), family).toBe(true)
      expect(hintsFromFamily(family, 'box'), family).not.toBeNull()
    }
  })

  it('an unknown pin behaves as no pin, and the brief comes back re-stamped with the real family', () => {
    const known = generate(briefWith('marble'))
    expect(known.studio?.direction.archetype, 'bilinen pin tutulmuyor').toBe(STUDIO_FAMILIES.marble.box)
    expect(known.brief.studioFamily).toBe('marble')

    const loose = generate(briefWith(undefined))
    for (const bad of ['arch-crown', 'kemer-tac']) {
      const spec = generate(briefWith(bad))
      // Same design as no pin at all: the bad value steers nothing.
      expect(spec.studio?.direction.archetype, `${bad} tasarımı büküyor`).toBe(loose.studio?.direction.archetype)
      // And it does not survive: the next save carries the family the design really is.
      const stamped = spec.brief.studioFamily
      expect(stamped, `${bad} damgalanmadı`).toBeTruthy()
      expect(isStudioFamily(stamped), `${bad} → ${stamped} geçerli aile değil`).toBe(true)
      expect(spec.studio?.collisions, `${bad} çarpışma`).toEqual([])
      expect(spec.preflight.exportOk, `${bad} export`).toBe(true)
    }
  })
})
