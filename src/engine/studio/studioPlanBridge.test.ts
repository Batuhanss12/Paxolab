/**
 * Design Brain → studio direction: the bridge, its reach, and its place in the order.
 *
 * Before this existed the plan was computed on every generate and read by nobody on the studio
 * path — measured in the Phase 0 audit, and the reason the same archetype wore the same pairing,
 * frame and ornament for every mood. What is pinned here:
 *
 *   - the mapping itself, on the plan the style rules actually produce (not a synthetic plan);
 *   - that the bridge speaks only to the three axes — never archetype, background or temperament;
 *   - that a customer's override outranks it, and that an archetype that does not allow the
 *     brain's choice simply keeps its own;
 *   - that the ranking's intent term orders the pool without outvoting the sector.
 *
 * The golden table moved for this — eleven hashes and one archetype — and that move is recorded
 * in `studioGolden.ts` rather than here.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief, StyleType } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { createPlan } from '../brain/DesignDirector'
import { getTemplate } from '../catalog/catalog'
import { paletteFor } from '../artwork/languages'
import { resolveDirection } from './direction'
import { LABEL_DNA } from './referenceDna'
import { frameFromPlan, hintsFromPlan, intentFromPlan, ornamentFromPlan, typePairingFromPlan } from './studioPlanBridge'
import type { LabelArchetype } from './types'

function brief(style: StyleType, extra: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Odette',
    productName: 'Fleur',
    sector: 'kozmetik',
    subProduct: 'parfüm',
    packagingMode: 'label',
    templateId: 'fm-cos-label-bottle',
    styleType: style,
    colors: 'krem · altın',
    volume: '50 ml',
    barcode: '8690000000017',
    dimensionsMm: { L: 70, W: 0, H: 90 },
    ...extra,
  }
}

function planFor(style: StyleType, extra: Partial<DesignBrief> = {}) {
  const b = brief(style, extra)
  return createPlan({ brief: b, template: getTemplate(b.templateId)!, style, variationIndex: 0 })
}

function generate(style: StyleType, extra: Partial<DesignBrief> = {}, direction?: Record<string, unknown>) {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({ brief: brief(style, extra), overridePatch: { studio: true, variationIndex: 0, direction } })
  return spec.studio!.direction
}

describe('studio plan bridge — mapping on real plans', () => {
  it('reads the style rules the way an art director would', () => {
    // luxury: display serif, wide tracking, foil → tracked serif + the plate edge
    const luxury = planFor('luxury')
    expect(typePairingFromPlan(luxury)).toBe('spaced-serif/spaced-sans')
    expect(frameFromPlan(luxury)).toBe('band-hairline')
    // minimal: quiet authority, air → light sans, no edge, quiet ornament
    const minimal = planFor('minimal')
    expect(typePairingFromPlan(minimal)).toBe('sans-light/sans-heavy')
    expect(frameFromPlan(minimal)).toBe('none')
    expect(ornamentFromPlan(minimal)).toBe('quiet')
    // playful: graphic, no edge
    expect(frameFromPlan(planFor('playful'))).toBe('none')
    // eco: balanced serif → serif display over sans meta, and nothing said about the frame
    const eco = planFor('eco')
    expect(typePairingFromPlan(eco)).toBe('serif-display/sans-meta')
    expect(frameFromPlan(eco)).toBeUndefined()
  })

  it('says nothing where the plan has no strong signal', () => {
    // modern: balanced authority on a sans face speaks to type only; the frame is left alone.
    const modern = planFor('modern')
    const intent = intentFromPlan(modern)
    expect(intent.frame).toBeUndefined()
    // `hintsFromPlan` is null only when every axis is silent — build such a plan by hand.
    const silent = { ...modern, typography: { ...modern.typography, authority: 'display' as const, displayFace: 'sans' as const }, positioning: 'premium' as const, visualIntent: 'elegant' as const, composition: { ...modern.composition, negativeSpace: 'med' as const }, visualConcept: { ...modern.visualConcept, decorationBudget: 0.3 }, density: { ...modern.density, front: 'balanced' as const } }
    expect(intentFromPlan(silent)).toEqual({})
    expect(hintsFromPlan(silent)).toBeNull()
  })

  it('speaks only to the three axes', () => {
    for (const style of ['luxury', 'minimal', 'modern', 'eco', 'classic', 'playful'] as StyleType[]) {
      const hint = hintsFromPlan(planFor(style))
      if (!hint) continue
      const keys = Object.keys(hint).sort()
      for (const k of keys) expect(['typePairing', 'frame', 'ornament', 'rationale', 'axisSource'], `${style}: bridge spoke to ${k}`).toContain(k)
      expect(hint.rationale?.[0]).toMatch(/^Tasarım beyni/)
    }
  })
})

describe('studio plan bridge — in the engine', () => {
  it('moves the axes the archetype allows and leaves the rest', () => {
    /*
     * Minimal asks for `quiet`, `none` and the light sans pair. Whichever archetype the mood walk
     * lands on (measured: marble-frame at step 2 on this brief), each axis follows the brain only
     * where that archetype's own list allows it, and otherwise keeps the archetype's first choice.
     */
    const d = generate('minimal')
    const dna = LABEL_DNA[d.archetype as LabelArchetype]
    expect(d.ornament).toBe(dna.ornaments.includes('quiet') ? 'quiet' : dna.ornaments[0])
    expect(d.frame).toBe(dna.frames.includes('none') ? 'none' : dna.frames[0])
    expect(d.typePairing).toBe(dna.typePairings.includes('sans-light/sans-heavy') ? 'sans-light/sans-heavy' : dna.typePairings[0])
    expect(d.rationale.some((r) => r.startsWith('Tasarım beyni'))).toBe(true)
    // And at least one of the three actually moved off the archetype's default, or the bridge is decorative.
    const moved = [d.ornament !== dna.ornaments[0], d.frame !== dna.frames[0], d.typePairing !== dna.typePairings[0]]
    expect(moved.some(Boolean)).toBe(true)
  })

  it('is outranked by what the customer said', () => {
    const d = generate('minimal', {}, { ornament: 'rich', source: 'user' })
    expect(d.ornament).toBe('rich')
  })

  it('does not touch archetype, background or temperament', () => {
    const luxury = generate('luxury')
    const hint = hintsFromPlan(planFor('luxury'))!
    expect(hint.archetype).toBeUndefined()
    expect(hint.background).toBeUndefined()
    expect(hint.temperament).toBeUndefined()
    expect(luxury.archetype).toBe('ink-panel')
  })
})

describe('studio plan bridge — the ranking term', () => {
  it('orders the pool without outvoting the sector', () => {
    const b = brief('minimal', { sector: 'sağlık', subProduct: 'merhem', colors: 'beyaz · mavi' })
    const palette = paletteFor(b, 'minimal', false)
    const base = {
      brief: b,
      sector: 'health' as const,
      style: 'minimal' as const,
      surface: 'label' as const,
      faceW: 70,
      faceH: 90,
      palette,
      locale: 'tr' as const,
      variationIndex: 0,
      copy: { brand: 'Odette', product: 'Merhem', tagline: '', volume: '50 ml' },
      hints: [],
    }
    const without = resolveDirection(base)
    const withIntent = resolveDirection({ ...base, intent: { typePairing: 'sans-light/sans-heavy', frame: 'none', ornament: 'quiet' } })
    // Same sector, same mood: the intent may reorder faces the sector likes equally, never leave the sector's own set.
    const sectorOk = (id: string) => Object.values(LABEL_DNA).some((dna) => dna.id === id && (dna.sectors.health ?? 0) >= 0.3)
    expect(sectorOk(without.archetype)).toBe(true)
    expect(sectorOk(withIntent.archetype)).toBe(true)
  })
})
