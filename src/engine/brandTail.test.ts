/**
 * L1 — Turkish possessive tails are grammar, not brand names.
 *
 * Found in the 2026-09-17 launch walkthrough: "Nexora markası için zeytinyağı kutusu…" printed
 * NEXORA MARKASI across the front lockup. The `için` capture took everything before "için".
 */
import { describe, expect, it } from 'vitest'
import { extractFields } from './extractFields'
import { stripBrandTail } from './extractRules'

function brandOf(text: string): string {
  return extractFields(text, []).brandName ?? ''
}

describe('L1 — brand name drops the possessive tail', () => {
  it('strips the tail from a phrase', () => {
    expect(stripBrandTail('Nexora markası')).toBe('Nexora')
    expect(stripBrandTail('Elite Brew markası')).toBe('Elite Brew')
    expect(stripBrandTail('Verda firması')).toBe('Verda')
    expect(stripBrandTail('Aurelia adlı')).toBe('Aurelia')
  })

  it('never strips the name itself', () => {
    expect(stripBrandTail('Nexora')).toBe('Nexora')
    expect(stripBrandTail('Elite Brew')).toBe('Elite Brew')
    // A bare possessive is not a name at all.
    expect(stripBrandTail('markası')).toBe('')
  })

  it('the walkthrough sentence yields the bare brand', () => {
    expect(brandOf('Nexora markası için zeytinyağı kutusu tasarlamak istiyorum.')).toBe('Nexora')
  })

  it('handles a two-word brand with a tail', () => {
    expect(brandOf('Elite Brew markası için kahve kutusu istiyorum.')).toBe('Elite Brew')
  })

  it('does not regress the plain "X için" form', () => {
    expect(brandOf('Aurelia için parfüm kutusu istiyorum.')).toBe('Aurelia')
  })

  it('does not swallow a real product word as a tail', () => {
    // "Noir" is a product, not a possessive — the three-part branch must still split it.
    const patch = extractFields('Aurelia için Noir parfüm kutusu.', [])
    expect(patch.brandName).toBe('Aurelia')
  })
})
