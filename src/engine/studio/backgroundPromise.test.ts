/**
 * An archetype must paint the background it reports.
 *
 * The `backgrounds` list on a DNA row is not documentation: `varyFace` cycles it, so it decides
 * what the customer gets when they press "variation", and `direction.background` — the value the
 * offer strip shows and the golden table freezes — comes straight off it. A row that lists a
 * family its painter never draws therefore produces a face that *says* one thing and *shows*
 * another, in three places at once, silently.
 *
 * This was measured rather than assumed, and the measurement corrected an earlier, wider claim.
 * Grep says 15 of 18 `paintBackground` call sites name a family literally, which sounds like the
 * DNA is decorative everywhere. It is not: most of those literals sit on single-entry DNA rows,
 * where hardcoding the one family is simply the archetype being itself. Of the eight archetypes
 * that list more than one background, exactly two were lying —
 *
 *   - `noir-stack` listed `marble` and always drew moonlight. Fixed by reading the direction;
 *     black marble on that carton turned out to be a good face and is now reachable.
 *   - `line-scene` (carton) listed `paper` and always drew its scene. Here the painter was right
 *     and the DNA was wrong: the face paints scenery *after* the type, because a line scene
 *     occupies only the lower span — fed `paper` it filled the panel and erased the brand, the
 *     title and the caption. `paper` came off the list.
 *
 * The rule this pins is the invariant, not either fix: whatever a row promises has to appear.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief, PackagingMode } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { STUDIO_FAMILIES } from './family'
import { BOX_DNA, LABEL_DNA } from './referenceDna'
import type { StudioFamily } from './types'

function familyOfArchetype(id: string): StudioFamily {
  const hit = Object.entries(STUDIO_FAMILIES).find(([, pair]) => pair.box === id || pair.label === id)
  return (hit?.[0] ?? 'botanical') as StudioFamily
}

function sweep(id: string, surface: 'box' | 'label') {
  const drawn = new Set<string>()
  const reported = new Set<string>()
  for (let variationIndex = 0; variationIndex < 6; variationIndex += 1) {
    resetArtMemory()
    const brief: DesignBrief = {
      ...emptyBrief(),
      brandName: 'Test',
      productName: 'Örnek',
      sector: 'gıda',
      subProduct: 'bal',
      packagingMode: surface as PackagingMode,
      styleType: 'classic',
      colors: 'altın · krem',
      volume: '250 ml',
      barcode: '8690000000017',
      dimensionsMm: { L: 70, W: 45, H: 150 },
      studioFamily: familyOfArchetype(id),
      studioFamilyLocked: true,
    }
    const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex } })
    if (spec.studio!.direction.archetype !== id) continue
    reported.add(spec.studio!.direction.background)
    const markup = String(spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)?.markup ?? '')
    for (const hit of markup.matchAll(/data-bg="([\w-]+)"/g)) drawn.add(hit[1])
  }
  return { drawn, reported }
}

describe('background promise', () => {
  const multi = [
    ...Object.values(LABEL_DNA).map((d) => ({ dna: d, surface: 'label' as const })),
    ...Object.values(BOX_DNA).map((d) => ({ dna: d, surface: 'box' as const })),
  ].filter((row) => row.dna.backgrounds.length > 1)

  it('has archetypes worth checking', () => {
    // Guard against the sweep below quietly becoming a no-op if the DNA is ever flattened.
    expect(multi.length).toBeGreaterThan(3)
  })

  for (const { dna, surface } of multi) {
    it(`${dna.id} (${surface}) paints every background it reports`, () => {
      const { drawn, reported } = sweep(dna.id, surface)
      expect(reported.size, `${dna.id} was never reached by the sweep`).toBeGreaterThan(0)
      for (const bg of reported) {
        expect(drawn.has(bg), `${dna.id} reported ${bg} and drew ${[...drawn].join(', ') || 'nothing'}`).toBe(true)
      }
    })
  }
})
