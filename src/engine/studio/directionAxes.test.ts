/**
 * Type pairing, frame and ornament are decisions, not properties of the archetype.
 *
 * Until Phase 1 of the studio roadmap each DNA row carried one `typePairing`, one `frame`, and no
 * ornament axis at all; a marble face wore one pairing and one edge for its whole life, whatever
 * the brief, the brain or the customer said, and the front painters called `thinDoubleFrame` by
 * name so a hint could not have changed the edge even if one had arrived. Now each row lists what
 * it *allows*, the variation walks that list, a hint wins when the archetype permits it, and the
 * painters draw whatever the direction decided.
 *
 * Variation 0 takes the first entry of every list. That is what keeps the 18 golden faces where
 * they are — measured: DNA 0 / hash 0 across the table after the change — so the first entry of
 * each list is the old fixed value by construction, and this file pins that convention.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { paletteFor } from '../artwork/languages'
import { resolveDirection } from './direction'
import { BOX_DNA, LABEL_DNA, isFrame, isOrnament, isTypePairing } from './referenceDna'
import type { DirectionHints, LabelArchetype } from './types'

const BRIEF: DesignBrief = {
  ...emptyBrief(),
  brandName: 'Odette',
  productName: 'Fleur de Nuit',
  sector: 'kozmetik',
  subProduct: 'parfüm',
  packagingMode: 'label',
  styleType: 'luxury',
  colors: 'siyah · altın',
  volume: '50 ml',
  barcode: '8690000000017',
  dimensionsMm: { L: 70, W: 45, H: 120 },
}

function resolve(hints: DirectionHints, variationIndex = 0) {
  const palette = paletteFor(BRIEF, 'luxury', true)
  return resolveDirection({
    brief: BRIEF,
    sector: 'perfume',
    style: 'luxury',
    surface: 'label',
    faceW: 70,
    faceH: 45,
    palette,
    locale: 'tr',
    variationIndex,
    copy: { brand: 'Odette', product: 'Fleur de Nuit', tagline: '', volume: '50 ml' },
    hints: [hints],
  })
}

function frontMarkup(direction: DirectionHints, variationIndex = 0): string {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({ brief: BRIEF, overridePatch: { studio: true, variationIndex, direction } })
  return String(spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)?.markup ?? '')
}

describe('direction axes', () => {
  it('every DNA row lists at least one legal value per axis', () => {
    for (const dna of [...Object.values(LABEL_DNA), ...Object.values(BOX_DNA)]) {
      expect(dna.typePairings.length, `${dna.id} typePairings`).toBeGreaterThan(0)
      expect(dna.frames.length, `${dna.id} frames`).toBeGreaterThan(0)
      expect(dna.ornaments.length, `${dna.id} ornaments`).toBeGreaterThan(0)
      for (const v of dna.typePairings) expect(isTypePairing(v), `${dna.id}: ${v}`).toBe(true)
      for (const v of dna.frames) expect(isFrame(v), `${dna.id}: ${v}`).toBe(true)
      for (const v of dna.ornaments) expect(isOrnament(v), `${dna.id}: ${v}`).toBe(true)
      // `measured` is the identity gain; a row that cannot be measured has no neutral face.
      expect(dna.ornaments[0], `${dna.id} must open on the neutral ornament level`).toBe('measured')
    }
  })

  it('variation 0 takes the first entry of each list — the golden invariant', () => {
    for (const dna of Object.values(LABEL_DNA)) {
      const d = resolve({ archetype: dna.id })
      expect(d.archetype).toBe(dna.id)
      expect(d.typePairing).toBe(dna.typePairings[0])
      expect(d.frame).toBe(dna.frames[0])
      expect(d.ornament).toBe(dna.ornaments[0])
    }
  })

  it('the variation walks each preference list independently', () => {
    const dna = LABEL_DNA['specimen-hero' as LabelArchetype]
    expect(dna.frames.length, 'needs a list worth walking').toBeGreaterThan(2)
    const frames = new Set<string>()
    const ornaments = new Set<string>()
    for (let v = 0; v < 12; v += 1) {
      // A user pin holds the archetype across variations; an engine guess would let the mood walk.
      const d = resolve({ archetype: 'specimen-hero', source: 'user', pinSource: 'user' }, v)
      expect(d.archetype).toBe('specimen-hero')
      frames.add(d.frame)
      ornaments.add(d.ornament)
    }
    expect([...frames].sort()).toEqual([...dna.frames].sort())
    expect([...ornaments].sort()).toEqual([...dna.ornaments].sort())
  })

  it('a hint wins when the archetype allows it and is ignored when it does not', () => {
    expect(resolve({ archetype: 'ink-panel', frame: 'fleuron-crown' }).frame).toBe('fleuron-crown')
    expect(resolve({ archetype: 'ink-panel', ornament: 'quiet' }).ornament).toBe('quiet')
    expect(resolve({ archetype: 'ink-panel', typePairing: 'serif-display/sans-meta' }).typePairing).toBe('serif-display/sans-meta')
    // A bezel has nothing to sit on inside an ink panel; the row does not list it and the hint is dropped.
    expect(resolve({ archetype: 'ink-panel', frame: 'bezel' }).frame).toBe(LABEL_DNA['ink-panel' as LabelArchetype].frames[0])
  })

  it('the painters draw the frame the direction chose', () => {
    // Before Phase 1 the ink panel called `thinDoubleFrame` by name; this hint would have been decided and then ignored.
    const band = frontMarkup({ archetype: 'ink-panel', frame: 'band-hairline' })
    expect(band).toContain('data-frame="band-hairline"')
    expect(band).not.toContain('data-frame="thin-double"')
    const crown = frontMarkup({ archetype: 'ink-panel', frame: 'fleuron-crown' })
    expect(crown).toContain('data-frame="fleuron-crown"')
  })

  it('the ornament level changes the face and the hierarchy does not move', () => {
    /*
     * Ornament is a gain on the background, never on the type: quiet and rich must differ in
     * markup, and both must keep the brand above the product. The owner's rule — "hiyerarşi
     * kuralı gevşemesin" — is what this second half pins.
     */
    const quiet = frontMarkup({ archetype: 'ink-panel', ornament: 'quiet' })
    const rich = frontMarkup({ archetype: 'ink-panel', ornament: 'rich' })
    expect(quiet).not.toBe(rich)
    // `data-edit` sits on the wrapping <g>; the first <text> inside carries the size.
    const sizeOf = (markup: string, edit: string): number => {
      const m = markup.match(new RegExp(`data-edit="${edit}"[\\s\\S]{0,600}?font-size="([\\d.]+)"`))
      return m ? Number(m[1]) : 0
    }
    for (const markup of [quiet, rich]) {
      const brand = sizeOf(markup, 'brand')
      const product = sizeOf(markup, 'product')
      expect(brand, 'brand drawn').toBeGreaterThan(0)
      expect(product, 'product drawn').toBeGreaterThan(0)
      expect(brand).toBeGreaterThan(product)
    }
  })
})
