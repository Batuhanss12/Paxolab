/**
 * R7 — proves the Asset Language role axis is live.
 *
 * ASSET_LANGUAGE_AUDIT (15 Eyl) concluded "rol skorda 0" and "organic/geometric roles boş".
 * Both statements are out of date; these tests measure the current behaviour so a regression
 * back to an inert role axis fails loudly.
 */
import { describe, expect, it } from 'vitest'
import type { MotifMetaHost, MotifRole } from './artMotifMeta'
import { assetCompatibilityOf, roleFitOf } from './assetLanguage'
import { preferredRolesForLanguage, preferredRolesForLanguages } from './visualLanguage'
import { COMPOSITION_SCORE_WEIGHTS } from './compositionStrategy'

function atom(role: MotifRole, id = 'atom'): MotifMetaHost & { id?: string } {
  return {
    id,
    roleGuess: role,
    complexity: 0.4,
    tags: [],
    sourceName: id,
    bbox: { x: 0, y: 0, w: 10, h: 10 },
  }
}

const ASSETS = {
  conceptId: 'capsule-field',
  languages: [],
  lexicon: [],
  avoid: [],
  roles: ['stamp', 'ornament'] as MotifRole[],
  family: undefined,
  supportFamily: undefined,
  heroFamily: 'none',
  patternFamily: 'none',
  chrome: 'full',
  preferred: { roles: ['stamp', 'ornament'] as MotifRole[], lexicon: [] },
  allowed: { families: [], languages: [] },
  forbidden: { avoid: [], strategies: [] },
} as unknown as Parameters<typeof assetCompatibilityOf>[1]

describe('R7 — preferred roles actually rank candidates', () => {
  it('every language token carries a role preference, including organic and geometric', () => {
    expect(preferredRolesForLanguage('organic')).not.toHaveLength(0)
    expect(preferredRolesForLanguage('geometric')).not.toHaveLength(0)
    // The catalog's only overlay style (playful) is organic + geometric — it must not be inert.
    expect(preferredRolesForLanguages(['organic', 'geometric'])).not.toHaveLength(0)
  })

  it('roleFit rewards slots that match the preferred role', () => {
    const right = roleFitOf([{ atom: atom('stamp') }, { atom: atom('ornament') }], ['stamp', 'ornament'])
    const wrong = roleFitOf([{ atom: atom('band') }, { atom: atom('divider') }], ['stamp', 'ornament'])
    expect(right).toBe(100)
    expect(wrong).toBe(0)
  })

  it('an empty preference stays neutral instead of punishing everything', () => {
    expect(roleFitOf([{ atom: atom('band') }], [])).toBe(50)
  })

  it('role fit moves the assetCompatibility axis, so ranking can feel it', () => {
    const right = assetCompatibilityOf([{ atom: atom('stamp') }], ASSETS, ['stamp', 'ornament'])
    const wrong = assetCompatibilityOf([{ atom: atom('band') }], ASSETS, ['stamp', 'ornament'])
    expect(right).toBeGreaterThan(wrong)
  })

  it('the axis has real weight — a full role miss can flip a tie', () => {
    const weight = COMPOSITION_SCORE_WEIGHTS.assetCompatibility
    const right = assetCompatibilityOf([{ atom: atom('stamp') }], ASSETS, ['stamp', 'ornament'])
    const wrong = assetCompatibilityOf([{ atom: atom('band') }], ASSETS, ['stamp', 'ornament'])
    // chooseCompositionWinner needs a 0.8 total gap; a role miss must be able to reach it.
    expect((right - wrong) * weight).toBeGreaterThan(0.8)
  })
})
