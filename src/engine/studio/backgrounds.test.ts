import { describe, expect, it } from 'vitest'
import { botanical, gradientWash, marble, paintBackground } from './backgrounds'
import { mix } from './color'
import { ALL_BACKGROUNDS } from './referenceDna'
import type { StudioPalette } from './types'

const pal: StudioPalette = {
  ground: '#1b2a4a',
  ink: '#f6f0e4',
  accent: '#c9a45c',
  accent2: '#7a5a2b',
  deep: '#101a2e',
  card: '#fbf6ea',
  cardInk: '#1b2a4a',
  muted: '#8d7b58',
}

const cream: StudioPalette = {
  ground: '#3d6b2a',
  ink: '#ffffff',
  accent: '#ffffff',
  accent2: '#2a4d1c',
  deep: '#2a4d1c',
  card: '#ffffff',
  cardInk: '#1a3d12',
  muted: '#d7e8c8',
}

describe('studio backgrounds — S5 density + seed', () => {
  it('same seed paints identical marble, botanical, and gilded-field paths', () => {
    const a = marble(80, 180, pal, 42, { uid: 'm', intensity: 0.8 })
    const b = marble(80, 180, pal, 42, { uid: 'm', intensity: 0.8 })
    expect(a).toBe(b)
    expect(botanical(90, 140, cream, 7, { uid: 'b', intensity: 0.85 })).toBe(botanical(90, 140, cream, 7, { uid: 'b', intensity: 0.85 }))
    expect(gradientWash(70, 140, pal, 11, { uid: 'gw' })).toBe(gradientWash(70, 140, pal, 11, { uid: 'gw' }))
  })

  it('a different seed changes the path data', () => {
    expect(marble(80, 180, pal, 1, { uid: 'm' })).not.toBe(marble(80, 180, pal, 2, { uid: 'm' }))
    expect(botanical(90, 140, cream, 1, { uid: 'b' })).not.toBe(botanical(90, 140, cream, 2, { uid: 'b' }))
    expect(gradientWash(70, 140, pal, 1, { uid: 'gw' })).not.toBe(gradientWash(70, 140, pal, 2, { uid: 'gw' }))
  })

  /**
   * This used to demand ≥18 paths and ≥40 flecks, which pinned the defect rather than the
   * feature: at that density the slab drew ~27 veins, all of them in the accent colour and all of
   * them one stroke wide. Zoomed to print size it read as a gold road map, not as stone.
   *
   * What actually makes marble is the opposite of density — few veins, tapered, mostly the colour
   * of the stone, with gold as the rare thread. So those are the properties pinned now.
   */
  it('marble draws few tapered veins in stone, not a grid of accent strokes', () => {
    const stone: StudioPalette = { ...pal, ground: '#f2efe9', ink: '#141414', accent: '#c9a227', accent2: '#7a5a2b' }
    const svg = marble(80, 180, stone, 42, { uid: 'm', intensity: 0.8 })
    expect(svg).toMatch(/data-bg="marble"/)
    expect(svg).toMatch(/data-texture="veins"/)
    expect(svg).toMatch(/data-texture="dust"/)

    const veins = svg.match(/data-texture="veins">(.*?)<\/g>/s)?.[1] ?? ''
    const paths = veins.match(/<path /g) ?? []
    expect(paths.length, 'vein count').toBeGreaterThanOrEqual(4)
    expect(paths.length, 'vein count').toBeLessThanOrEqual(20)

    // A vein is a filled ribbon whose width varies along its length. A stroke cannot taper, so a
    // stroked vein is by definition the old uniform hairline.
    expect(veins, 'veins must be filled ribbons, not strokes').not.toMatch(/stroke=/)
    expect((veins.match(/Z"/g) ?? []).length, 'closed ribbons').toBe(paths.length)

    // Gold is the rare thread. The regression was every vein taking the accent.
    const gold = mix(stone.accent, stone.accent2, 0.25)
    const goldVeins = (veins.match(new RegExp(`fill="${gold}"`, 'g')) ?? []).length
    expect(goldVeins, 'gold veins').toBeLessThanOrEqual(2)
    expect(goldVeins / paths.length, 'gold share of veining').toBeLessThan(0.34)
  })

  it('botanical punches evenodd cutouts through layered leaves', () => {
    const svg = botanical(90, 140, cream, 7, { uid: 'b', intensity: 0.85 })
    expect(svg).toMatch(/data-bg="botanical"/)
    expect(svg).toMatch(/data-texture="cutouts"/)
    expect(svg).toMatch(/fill-rule="evenodd"/)
    expect((svg.match(/fill-rule="evenodd"/g) ?? []).length).toBeGreaterThanOrEqual(4)
  })

  /**
   * F-13: the owner asked for the landscape out of the system — "peyzajı tamamen kaldır". Two
   * scenic grounds existed, the meadow behind the honey carton and the moonlit lake behind the
   * perfume one, and the second survived a first pass because the family wearing it is called
   * "karanlık lüks" in the UI rather than "peyzaj". It still drew mountain ridges, pines and a
   * reflected moon, so it went too. This asserts on the painted output, not on the name: a scene
   * reintroduced under any label fails here.
   */
  /**
   * `line-scene` was a hard-coded seaside — sun, sea, three sailboats, clouds, two palms, a
   * parasol — painted identically for a jar of honey, a detergent and a baby shampoo. It survived
   * the landscape sweep because nothing in it was *called* a landscape, and it survived every
   * sector test because it never read the sector to begin with.
   *
   * The contract that catches it is not a list of banned words but this: a background that draws a
   * subject must answer to the brief. Two species, two drawings.
   */
  it('a background that draws a subject draws the brief’s own subject', () => {
    const honey = paintBackground('line-scene', 70, 120, pal, 5, { uid: 'ls', species: 'blossom' })
    const citrus = paintBackground('line-scene', 70, 120, pal, 5, { uid: 'ls', species: 'citrus' })
    expect(honey).not.toBe(citrus)
    // And it is a drawing, not an empty field.
    expect(honey.length).toBeGreaterThan(400)
  })

  it('no background paints a scene — the landscape is gone, not merely renamed', () => {
    expect(ALL_BACKGROUNDS).not.toContain('landscape-moon')
    expect(ALL_BACKGROUNDS).not.toContain('landscape-meadow')
    for (const family of ALL_BACKGROUNDS) {
      const svg = paintBackground(family, 70, 140, pal, 11, { uid: `bg-${family}` })
      expect(svg, `${family} names a landscape`).not.toMatch(/landscape|meadow|horizon/i)
      expect(svg, `${family} paints a moon reflection`).not.toMatch(/data-texture="(reflection|ripples)"/)
    }
  })
})
