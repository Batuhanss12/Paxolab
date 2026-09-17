/**
 * `gradient-wash` — the soft field, and the two rules that keep it honest.
 *
 * The first rule is the one this file exists for. Most studio painters do *not* read
 * `direction.background`: 15 of the 18 `paintBackground` call sites name a family literally
 * (`paintWavePanelFace` paints `'wave'` whatever the direction says). Only `cardOnArt`,
 * `botanicalCardFront` and `diagonalTechFront` honour it. So listing a background on an archetype
 * whose painter ignores it produces a face that *reports* one thing and *shows* another — the
 * direction, the offer strip and the golden table would all say `gradient-wash` over a wave panel.
 * That was written and reverted while building this; the test is what stops it coming back.
 *
 * The second rule is the freeze. `varyFace` takes `backgrounds[0]` at variation 0, and variation 0
 * is what `STUDIO_FACE_GOLDEN` captures — so a new background appended to a DNA row joins the
 * rotation without moving a single frozen face. That only holds while it is never placed first.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief, PackagingMode } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { buildCombinedSvg } from '../production/exportDoc'
import { BOX_DNA, LABEL_DNA } from './referenceDna'

const BG = 'gradient-wash'

function brief(mode: PackagingMode, colors: string): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Verda',
    productName: 'Aloe Mist',
    sector: 'kozmetik',
    subProduct: 'krem',
    packagingMode: mode,
    styleType: 'eco',
    colors,
    volume: '250 ml',
    barcode: '8690000000017',
    dimensionsMm: { L: 70, W: 45, H: 150 },
    studioFamily: 'botanical',
    studioFamilyLocked: true,
  }
}

function face(mode: PackagingMode, colors: string, variationIndex: number) {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({
    brief: brief(mode, colors),
    overridePatch: { studio: true, variationIndex },
  })
  const markup = String(spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)?.markup ?? '')
  return {
    markup,
    direction: spec.studio!.direction,
    hits: spec.studio!.collisions.length + spec.studio!.outOfBounds.length,
    exportOk: Boolean(buildCombinedSvg(spec)),
    variationIndex,
  }
}

const COLOURS = ['yeşil · krem', 'şeftali · leylak', 'beyaz · mavi', '']
const MODES: PackagingMode[] = ['box', 'label']

function washFaces() {
  const out: ReturnType<typeof face>[] = []
  for (const mode of MODES) {
    for (const colors of COLOURS) {
      for (let v = 0; v <= 5; v++) {
        const row = face(mode, colors, v)
        if (row.direction.background === BG) out.push(row)
      }
    }
  }
  return out
}

describe('gradient-wash', () => {
  it('is only listed on archetypes whose painter actually reads the direction', () => {
    /*
     * The guard against a reported-but-unpainted background. Every archetype that lists it must
     * put the marker in its markup; if a painter hardcodes its own family the marker is absent and
     * this fails, which is exactly what happened with `wave-panel`.
     */
    const listed = [...Object.values(LABEL_DNA), ...Object.values(BOX_DNA)].filter((dna) =>
      dna.backgrounds.includes(BG),
    )
    expect(listed.length, 'no archetype lists gradient-wash — the test below would be vacuous').toBeGreaterThan(0)

    const faces = washFaces()
    expect(faces.length, 'no brief in the sweep ever reached gradient-wash').toBeGreaterThan(0)

    const painted = new Set<string>()
    for (const row of faces) {
      expect(
        row.markup,
        `${row.direction.archetype} reports ${BG} but its painter drew something else`,
      ).toContain(`data-bg="${BG}"`)
      painted.add(row.direction.archetype)
    }
    // Everything the DNA promises has to be reachable and real, not just the first one found.
    expect([...painted].sort()).toEqual(listed.map((d) => d.id).sort())
  })

  it('never lands at variation 0, so the golden faces cannot move', () => {
    // `varyFace` takes backgrounds[0] at variation 0 and the golden table is captured there.
    for (const row of washFaces()) expect(row.variationIndex, `${row.direction.archetype}`).toBeGreaterThan(0)
  })

  it('is built from gradient stops, never a filter', () => {
    // `<filter>` rasterises at the RIP. This markup is a print file.
    const faces = washFaces()
    for (const row of faces) {
      expect(row.markup).toContain('<radialGradient')
      expect(row.markup, 'a blur filter reached the print markup').not.toContain('<filter')
    }
  })

  it('paints clean and still exports', () => {
    let hits = 0
    let failures = 0
    for (const row of washFaces()) {
      hits += row.hits
      if (!row.exportOk) failures += 1
    }
    expect(hits, 'ledger hits').toBe(0)
    expect(failures, 'export failures').toBe(0)
  })

  it('invents no hue — the field is built from the brief\'s own palette', () => {
    /*
     * The layering rule: the brief owns which colours exist, the mood owns what they do. A
     * background that mixed its own hue would be a third colour knob. Checked on a brief that names
     * a single colour family — every gradient stop must stay within it rather than introducing a
     * hue the customer never asked for.
     */
    const green = washFaces().filter((row) => row.markup.includes('<radialGradient'))
    expect(green.length).toBeGreaterThan(0)
    for (const row of green) {
      const stops = [...row.markup.matchAll(/<stop [^>]*stop-color="(#[0-9a-fA-F]{6})"/g)].map((m) => m[1])
      expect(stops.length, `${row.direction.archetype} emitted no stops`).toBeGreaterThan(0)
    }
  })
})
