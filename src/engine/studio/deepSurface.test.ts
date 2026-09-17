/**
 * The sides belong to the same box as the front.
 *
 * Reported by the owner after the mood knob was fixed: the mood governed the front face but not the
 * rest of the carton. The cause was that the layouts took the side colour from `accent2`, a texture
 * sibling that was never designed to be a surface. Measured before the fix, on one brief:
 *
 *   luxury   front #142f23 (near-black)  sides #dccbaf  — cream sides on a black box
 *   modern   front #3bb07c               sides #8fcdad  — sides lighter than the front
 *   eco      front #cad9c9 (sage)        sides #8c6a35  — brown, on a brief that asked for green
 *   minimal  front #f5f0e8 (cream)       sides #39b17e  — a vivid field on a restrained mood
 *
 * The deep surface is now a palette role derived from the ground, with the *distance* it travels
 * set by the mood. So the properties worth pinning are relational, not specific colours: the sides
 * are never lighter than the front, and they never wander off the front's hue. How far they go is
 * allowed to differ per mood — that is the mood doing its job.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief, StyleType } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { hsl } from './color'

const MOODS: StyleType[] = ['luxury', 'minimal', 'modern', 'eco', 'classic', 'playful']

type Job = { label: string; sector: string; subProduct: string; brand: string; colors: string }

/** Chosen to land on the archetypes whose fronts are a card floating on art. */
const JOBS: Job[] = [
  { label: 'botanical-card', sector: 'kozmetik', subProduct: 'krem', brand: 'Verda', colors: 'yeşil · krem' },
  { label: 'line-scene', sector: 'kozmetik', subProduct: 'serum', brand: 'Clinia', colors: 'beyaz · mavi' },
  { label: 'wave-panel', sector: 'temizlik', subProduct: 'deterjan', brand: 'Ferah', colors: 'mavi · beyaz' },
  { label: 'marble-frame', sector: 'gıda', subProduct: 'kahve', brand: 'Elite Brew', colors: 'mermer · altın' },
  { label: 'diagonal-tech', sector: 'elektronik', subProduct: 'kulaklık', brand: 'Nox', colors: 'antrasit · turuncu' },
]

function briefOf(job: Job, mood: StyleType): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: job.brand,
    productName: 'Ürün',
    sector: job.sector,
    subProduct: job.subProduct,
    packagingMode: 'box',
    styleType: mood,
    colors: job.colors,
    volume: '250 ml',
    barcode: '8690000000017',
    dimensionsMm: { L: 70, W: 45, H: 150 },
  }
}

/** The colour each panel is flooded with: the first rect a panel paints is its ground. */
function faces(job: Job, mood: StyleType) {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({ brief: briefOf(job, mood), overridePatch: { studio: true, variationIndex: 0 } })
  const fill = (markup: string) => /<rect[^>]*fill="([^"]+)"/.exec(String(markup))?.[1] ?? ''
  const frontLayer = spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)
  const sideLayer = spec.artwork.layers.find((l) => /side|left|right/.test(l.panelId))
  return {
    front: fill(frontLayer?.markup ?? ''),
    side: sideLayer ? fill(sideLayer.markup) : fill(frontLayer?.markup ?? ''),
    palette: spec.studio!.direction.palette,
    archetype: spec.studio!.direction.archetype,
  }
}

function hueGap(a: string, b: string): number {
  const d = Math.abs(hsl(a).h - hsl(b).h) % 360
  return d > 180 ? 360 - d : d
}

describe('deep surface — the sides read as the same object as the front', () => {
  for (const job of JOBS) {
    it(`${job.label}: sides are never lighter than the front, in any mood`, () => {
      for (const mood of MOODS) {
        const { front, side } = faces(job, mood)
        // A small tolerance: identical panels are fine, a *lighter* side is the inversion bug.
        expect(hsl(side).l, `${mood}: front ${front} → side ${side}`).toBeLessThanOrEqual(hsl(front).l + 0.03)
      }
    })

    it(`${job.label}: sides stay in the front's hue family`, () => {
      for (const mood of MOODS) {
        const { front, side } = faces(job, mood)
        // Only meaningful when both actually carry a hue; a neutral has no direction to agree with.
        if (hsl(front).s < 0.12 || hsl(side).s < 0.12) continue
        expect(hueGap(front, side), `${mood}: front ${front} → side ${side}`).toBeLessThan(40)
      }
    })
  }

  it('the mood decides how far the sides travel from the front', () => {
    // Restrained moods step a little and ornate ones step a lot; if every mood stepped the same
    // distance the surface would be a constant again, just a better-behaved one.
    const distance = (mood: StyleType) => {
      const { front, side } = faces(JOBS[0], mood)
      return Math.abs(hsl(front).l - hsl(side).l)
    }
    const minimal = distance('minimal')
    const classic = distance('classic')
    expect(classic, `classic ${classic} vs minimal ${minimal}`).toBeGreaterThan(minimal)
  })

  it('the deep surface is its own role, not borrowed from accent2', () => {
    // The original defect in one line: `accent2` holds a texture sibling, and reading a surface out
    // of it is what produced cream sides on a black box.
    const rows = MOODS.map((mood) => faces(JOBS[0], mood))
    const borrowed = rows.filter((r) => r.side.toLowerCase() === r.palette.accent2.toLowerCase())
    expect(borrowed.map((r) => r.side), 'sides taken straight from accent2').toEqual([])
  })

  it('a full-bleed front keeps its own ground on the sides', () => {
    // `diagonal-tech` paints a field, not a card on art, so its sides are the same surface as the
    // front. The deep surface exists for the card archetypes; it must not leak onto the others.
    for (const mood of MOODS) {
      const { front, side, archetype } = faces(JOBS[4], mood)
      if (archetype !== 'diagonal-tech') continue
      expect(side, `${mood} on ${archetype}`).toBe(front)
    }
  })
})
