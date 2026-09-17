/**
 * R6 — pins the language-key authority contract.
 *
 * VL-3 ("derive the language from intent instead of style × sector") is deliberately NOT
 * implemented: VISUAL_LANGUAGE_V5_AUDIT §4 shows one character maps to three language families
 * (luxury perfume → heraldic, luxury food → botanical, luxury cream → oval), so character alone
 * cannot discriminate and sector has to stay a key. These tests keep that decision honest.
 */
import { describe, expect, it } from 'vitest'
import type { DesignIntentBlock } from '../brain/DesignPlan'
import { visualLanguageFor } from './visualLanguage'

function intent(extra: Partial<DesignIntentBlock> = {}): DesignIntentBlock {
  return {
    style: 'luxury',
    character: 'elegant',
    positioning: 'luxury',
    density: 'dense',
    negativeSpace: 'med',
    metallic: 'foil',
    restrainExtras: false,
    hierarchyPolicy: 'brand',
    sector: 'food',
    surface: 'box',
    cue: 'none',
    ...extra,
  }
}

describe('R6 — the job sector owns the language key, the intent only flavours it', () => {
  it('one character spans several language families — character cannot be the key', () => {
    const elegant = { character: 'elegant' as const }
    const perfume = visualLanguageFor(intent(elegant), 'perfume')
    const food = visualLanguageFor(intent(elegant), 'food')
    const cream = visualLanguageFor(intent(elegant), 'cream')
    expect(perfume).not.toEqual(food)
    expect(food).not.toEqual(cream)
  })

  it('a carried-over intent never drags the face into its own sector dialect', () => {
    const oilIntent = intent({ sector: 'food' })
    // Same intent object, perfume job → perfume dialect, not the intent's food dialect.
    expect(visualLanguageFor(oilIntent, 'perfume')).toContain('heraldic')
    expect(visualLanguageFor(oilIntent, 'perfume')).not.toContain('botanical')
  })

  it('intent.sector is context metadata, not an input — changing it changes nothing', () => {
    const asFood = visualLanguageFor(intent({ sector: 'food' }), 'perfume')
    const asPerfume = visualLanguageFor(intent({ sector: 'perfume' }), 'perfume')
    expect(asFood).toEqual(asPerfume)
  })

  it('character still modifies inside the sector dialect (VL-5b stays live)', () => {
    const base = visualLanguageFor(intent({ character: 'elegant' }), 'perfume')
    const airy = visualLanguageFor(intent({ character: 'air' }), 'perfume')
    expect(airy).toContain('quiet-line')
    expect(base).not.toContain('quiet-line')
  })
})
