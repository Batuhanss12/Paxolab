import { describe, expect, it } from 'vitest'
import { botanical, landscapeMoon, marble } from './backgrounds'
import type { StudioPalette } from './types'

const pal: StudioPalette = {
  ground: '#1b2a4a',
  ink: '#f6f0e4',
  accent: '#c9a45c',
  accent2: '#7a5a2b',
  card: '#fbf6ea',
  cardInk: '#1b2a4a',
  muted: '#8d7b58',
}

const cream: StudioPalette = {
  ground: '#3d6b2a',
  ink: '#ffffff',
  accent: '#ffffff',
  accent2: '#2a4d1c',
  card: '#ffffff',
  cardInk: '#1a3d12',
  muted: '#d7e8c8',
}

describe('studio backgrounds — S5 density + seed', () => {
  it('same seed paints identical marble, botanical, and moon paths', () => {
    const a = marble(80, 180, pal, 42, { uid: 'm', intensity: 0.8 })
    const b = marble(80, 180, pal, 42, { uid: 'm', intensity: 0.8 })
    expect(a).toBe(b)
    expect(botanical(90, 140, cream, 7, { uid: 'b', intensity: 0.85 })).toBe(botanical(90, 140, cream, 7, { uid: 'b', intensity: 0.85 }))
    expect(landscapeMoon(70, 140, pal, 11, { uid: 'lm', span: 0.66 })).toBe(landscapeMoon(70, 140, pal, 11, { uid: 'lm', span: 0.66 }))
  })

  it('a different seed changes the path data', () => {
    expect(marble(80, 180, pal, 1, { uid: 'm' })).not.toBe(marble(80, 180, pal, 2, { uid: 'm' }))
    expect(botanical(90, 140, cream, 1, { uid: 'b' })).not.toBe(botanical(90, 140, cream, 2, { uid: 'b' }))
    expect(landscapeMoon(70, 140, pal, 1, { uid: 'lm' })).not.toBe(landscapeMoon(70, 140, pal, 2, { uid: 'lm' }))
  })

  it('marble keeps flowing veins and gold dust, not a sparse scribble', () => {
    const svg = marble(80, 180, pal, 42, { uid: 'm', intensity: 0.8 })
    expect(svg).toMatch(/data-bg="marble"/)
    expect(svg).toMatch(/data-texture="veins"/)
    expect(svg).toMatch(/data-texture="dust"/)
    expect((svg.match(/<path /g) ?? []).length).toBeGreaterThanOrEqual(18)
    expect((svg.match(/<circle |<ellipse /g) ?? []).length).toBeGreaterThanOrEqual(40)
  })

  it('botanical punches evenodd cutouts through layered leaves', () => {
    const svg = botanical(90, 140, cream, 7, { uid: 'b', intensity: 0.85 })
    expect(svg).toMatch(/data-bg="botanical"/)
    expect(svg).toMatch(/data-texture="cutouts"/)
    expect(svg).toMatch(/fill-rule="evenodd"/)
    expect((svg.match(/fill-rule="evenodd"/g) ?? []).length).toBeGreaterThanOrEqual(4)
  })

  it('moon landscape has a reflection column and cubic ridges', () => {
    const svg = landscapeMoon(70, 140, pal, 11, { uid: 'lm', span: 0.66 })
    expect(svg).toMatch(/data-bg="landscape-moon"/)
    expect(svg).toMatch(/data-texture="reflection"/)
    expect(svg).toMatch(/data-texture="ripples"/)
    expect(svg).toMatch(/ C/)
    expect((svg.match(/<path /g) ?? []).length).toBeGreaterThanOrEqual(4)
  })
})
