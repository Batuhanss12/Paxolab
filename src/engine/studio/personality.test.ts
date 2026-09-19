/**
 * The brand's own words become the numbers the ranking reads — and nothing else does.
 *
 * Two properties matter more than any single word. A brief that says nothing about itself is
 * neutral, and every term built on it is zero — that is what keeps the frozen faces frozen. And
 * the brand name is never read: a name is not a personality.
 */
import { describe, expect, it } from 'vitest'
import { emptyBrief } from '../fields'
import { LOCKUP_PERSONALITY, TYPE_PERSONALITY, bestByPersonality, brandPersonality, personalityFit } from './personality'

describe('brandPersonality', () => {
  it('a brief that says nothing is neutral, whatever its name', () => {
    const p = brandPersonality({ ...emptyBrief(), brandName: 'Zapp Vivid Neon' } as never)
    expect(p.strength).toBe(0)
    expect(p.evidence).toEqual([])
    expect(personalityFit(p, { energy: 1 })).toBe(0)
  })

  it('reads the feeling in the customer’s words', () => {
    const quiet = brandPersonality({ feeling: 'sakin, zarif, dingin' })
    expect(quiet.axes.restraint).toBeGreaterThan(0.5)
    expect(quiet.axes.energy).toBeLessThan(0)
    const loud = brandPersonality({ feeling: 'gösterişli, enerjik, cesur' })
    expect(loud.axes.restraint).toBeLessThan(-0.5)
    expect(loud.axes.energy).toBeGreaterThan(0.5)
  })

  it('reads the audience, the channel and the price tier', () => {
    const young = brandPersonality({ audience: '18-25 gençler', channel: 'online' })
    expect(young.axes.energy).toBeGreaterThan(0.5)
    expect(young.axes.heritage).toBeLessThan(-0.5)
    const corporate = brandPersonality({ audience: 'kurumsal yöneticiler, 40+', channel: 'butik mağaza', priceTier: 'boutique' })
    expect(corporate.axes.restraint).toBeGreaterThan(0.8)
    expect(corporate.axes.heritage).toBeGreaterThan(0.5)
    expect(corporate.evidence.map((e) => e.field)).toEqual(expect.arrayContaining(['audience', 'channel', 'priceTier']))
  })

  it('a word inside "not like this" pulls the other way', () => {
    const warm = brandPersonality({ avoidLike: 'klinik' })
    expect(warm.axes.warmth).toBeGreaterThan(0)
    expect(warm.axes.technicality).toBeLessThan(0)
    const cold = brandPersonality({ feeling: 'klinik' })
    expect(cold.axes.warmth).toBeLessThan(0)
  })

  it('clamps and reports evidence with the matched words', () => {
    const p = brandPersonality({ feeling: 'sakin sessiz dingin zarif rafine', priceTier: 'boutique' })
    expect(p.axes.restraint).toBe(1)
    expect(p.evidence.find((e) => e.field === 'feeling')?.words).toEqual(expect.arrayContaining(['sakin', 'zarif']))
  })
})

describe('fit and choice', () => {
  it('fit is normalised by the brief, in [−1, 1]', () => {
    const p = brandPersonality({ feeling: 'gösterişli, enerjik' })
    expect(personalityFit(p, { restraint: -1, energy: 1 })).toBeGreaterThan(0.9)
    expect(personalityFit(p, { restraint: 1, energy: -1 })).toBeLessThan(-0.9)
  })

  it('picks the arrangement and the pairing that answer the brand, keeping list order on a tie', () => {
    const loud = brandPersonality({ feeling: 'gösterişli, enerjik, çağdaş' })
    expect(bestByPersonality(['stacked-center', 'band-split', 'rotated-brand'], LOCKUP_PERSONALITY, loud)).toBe('rotated-brand')
    const quiet = brandPersonality({ feeling: 'sakin, zarif, köklü' })
    expect(bestByPersonality(['stacked-center', 'band-split', 'rotated-brand'], LOCKUP_PERSONALITY, quiet)).toBe('stacked-center')
    expect(bestByPersonality(['serif-display/sans-meta', 'spaced-serif/spaced-sans'], TYPE_PERSONALITY, quiet)).toBe('spaced-serif/spaced-sans')
    const neutral = brandPersonality({})
    expect(bestByPersonality(['band-split', 'stacked-center'], LOCKUP_PERSONALITY, neutral)).toBe('band-split')
  })
})
