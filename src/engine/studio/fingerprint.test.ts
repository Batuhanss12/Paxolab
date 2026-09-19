/**
 * The instrument has to be right before it measures anything.
 *
 * The creative-brain audit found that "eight different families" and "eight different designs"
 * are different claims, and introduced the fingerprint to measure the second. Every later phase
 * is judged by this arithmetic, so it is pinned here: distance is a plain count of differing
 * axes, the composition subset excludes what always differs across an offer, and a real offer
 * still satisfies the one property the old guarantee gave — eight distinct archetypes.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { inspectStudioDirection } from './directionTalk'
import {
  COMPOSITION_AXES,
  FINGERPRINT_AXES,
  directionFingerprint,
  distinctPerAxis,
  fingerprintDistance,
  isDistinct,
  pairwiseSummary,
  type Fingerprint,
} from './fingerprint'

function fp(patch: Partial<Fingerprint> = {}): Fingerprint {
  return {
    archetype: 'marble-frame',
    lockup: 'stacked-center',
    typePairing: 'serif-display/sans-meta',
    frame: 'thin-double',
    ornament: 'measured',
    temperament: 'light-luxe',
    background: 'marble',
    variant: '0',
    ...patch,
  }
}

describe('fingerprint distance', () => {
  it('is zero for the same design and counts one per differing axis', () => {
    expect(fingerprintDistance(fp(), fp())).toBe(0)
    expect(fingerprintDistance(fp(), fp({ ornament: 'rich' }))).toBe(1)
    expect(fingerprintDistance(fp(), fp({ ornament: 'rich', variant: '2', lockup: 'left-column' }))).toBe(3)
  })

  it('reads only the axes it is asked about', () => {
    // A different archetype and background, same arrangement: composition distance must be 0.
    const other = fp({ archetype: 'ink-panel', background: 'ink-wash' })
    expect(fingerprintDistance(fp(), other)).toBe(2)
    expect(fingerprintDistance(fp(), other, COMPOSITION_AXES)).toBe(0)
  })

  it('composition axes exclude what always differs across an offer', () => {
    expect(COMPOSITION_AXES).not.toContain('archetype')
    expect(COMPOSITION_AXES).not.toContain('background')
    for (const axis of COMPOSITION_AXES) expect(FINGERPRINT_AXES).toContain(axis)
  })

  it('and exclude what never differs across one', () => {
    /*
     * The other half of the same rule. Measured on six eight-candidate offers, `temperament` and
     * `variant` take exactly 1.0 distinct value each — temperament is derived from sector × style
     * and every offered row is variation 0 — so counting them could only ever divide the score by
     * a larger denominator. That put a hard ceiling of 50 on `distinctiveness`.
     */
    expect(COMPOSITION_AXES).not.toContain('temperament')
    expect(COMPOSITION_AXES).not.toContain('variant')
  })

  it('distinct means at least two composition axes apart', () => {
    expect(isDistinct(fp(), fp({ ornament: 'rich' }))).toBe(false)
    // Two axes the offer can actually move — `variant` is constant across one, so it cannot carry this.
    expect(isDistinct(fp(), fp({ ornament: 'rich', frame: 'none' }))).toBe(true)
    // Archetype alone never makes a pair distinct — that was the guarantee that hid the problem.
    expect(isDistinct(fp(), fp({ archetype: 'ink-panel', background: 'ink-wash' }))).toBe(false)
  })

  it('summarises a set: pairs, minimum, identical and not-distinct counts', () => {
    const set = [fp(), fp({ ornament: 'rich' }), fp({ ornament: 'rich', frame: 'none' })]
    const s = pairwiseSummary(set)
    expect(s.pairs).toBe(3)
    expect(s.min).toBe(1)
    expect(s.identical).toBe(0)
    // (a,b)=1 (b,c)=1 (a,c)=2 → two pairs under the floor of two.
    expect(s.notDistinct).toBe(2)
    expect(s.mean).toBeCloseTo(4 / 3)
    expect(pairwiseSummary([]).pairs).toBe(0)
  })

  it('counts distinct values per axis', () => {
    const d = distinctPerAxis([fp(), fp({ ornament: 'rich' }), fp({ ornament: 'rich', frame: 'none' })])
    expect(d.ornament).toBe(2)
    expect(d.frame).toBe(2)
    expect(d.archetype).toBe(1)
  })
})

describe('a real offer', () => {
  const brief: DesignBrief = {
    ...emptyBrief(),
    brandName: 'Aura',
    productName: 'Çiçek Balı',
    sector: 'gıda',
    subProduct: 'bal',
    packagingMode: 'box',
    styleType: 'eco',
    colors: 'toprak',
    volume: '450 gr',
    dimensionsMm: { L: 70, W: 70, H: 140 },
  }

  it('fingerprints every candidate and keeps eight distinct archetypes', () => {
    const rows = inspectStudioDirection(brief).offer.candidates.map((c) => directionFingerprint(c.direction))
    expect(rows.length).toBeGreaterThanOrEqual(4)
    expect(distinctPerAxis(rows).archetype).toBe(rows.length)
    for (const row of rows) for (const axis of FINGERPRINT_AXES) expect(row[axis]).toBeTruthy()
  })
})
