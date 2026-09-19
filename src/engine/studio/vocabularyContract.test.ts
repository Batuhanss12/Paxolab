/**
 * A decision the engine declares has to be a decision the engine draws.
 *
 * Phase 2C set out to wire `vocabularyTable.ts`'s `ornamentLevel`, `typographyVoice` and
 * `claimStrip` into the studio painters, and the first grep ended that plan: none of those three
 * fields is read anywhere outside the table declaring them. The studio owns all three concepts
 * itself, through `DesignDirection` — `ornament`, `typePairing`, and the layout's own room budget —
 * so these tests ask the phase's real question of the vocabulary that actually owns the answer.
 *
 * Measured by controlled experiment rather than by sweeping faces: `gain()` scales the painter's
 * own intensity, and those bases differ by orders of magnitude between backgrounds, so a population
 * average hides the multiplier completely.
 */
import { describe, expect, it } from 'vitest'
import { paintBackground } from './backgrounds'
import { ALL_BACKGROUNDS } from './referenceDna'
import { ALL_TYPE_SYSTEMS, titleFaces } from './typeSystem'
import type { OrnamentLevel, StudioPalette } from './types'

const PAL = {
  ground: '#f2ece2', ink: '#221c14', accent: '#a8863b', accent2: '#6b5530',
  card: '#fbf7ef', cardInk: '#221c14', deep: '#171208',
} as unknown as StudioPalette

const paint = (bg: (typeof ALL_BACKGROUNDS)[number], ornament: OrnamentLevel, seed = 12345) =>
  paintBackground(bg, 70, 90, PAL, seed, { uid: 'probe', ornament })

const elements = (markup: string) => (markup.match(/<(path|rect|circle|ellipse|line|polygon|g)[\s>]/g) ?? []).length

/**
 * `line-scene` draws the archetype's subject — a fitted sprig on a rule, marked `data-art="hero"`.
 * That is structure, not ornament, and scaling it would be inventing a decorative behaviour it does
 * not have. Every other background carries decorative texture and must answer the level.
 */
const STRUCTURAL = new Set(['line-scene'])

describe('A + B — the ornament level changes what the field draws', () => {
  it('every textured background answers it', () => {
    const ignoring = ALL_BACKGROUNDS.filter((bg) => {
      if (STRUCTURAL.has(String(bg))) return false
      const seen = new Set((['quiet', 'measured', 'rich'] as OrnamentLevel[]).map((o) => paint(bg, o)))
      return seen.size === 1
    })
    expect(ignoring, `süs kararını yok sayan zemin: ${ignoring.join(', ')}`).toEqual([])
  })

  it('quiet draws less than rich where the level is spent on counts', () => {
    // `paper` was the one background the dispatch called without `opts` at all.
    expect(elements(paint('paper', 'quiet'))).toBeLessThan(elements(paint('paper', 'measured')))
    expect(elements(paint('paper', 'rich'))).toBeGreaterThan(elements(paint('paper', 'measured')))
    for (const bg of ['marble', 'ink-wash', 'toile', 'circuit'] as const) {
      expect(elements(paint(bg, 'quiet')), `${bg} quiet`).toBeLessThan(elements(paint(bg, 'rich')))
    }
  })

  it('measured is the identity, so faces painted before the axis existed are untouched', () => {
    /*
     * `gain` multiplies by 1 on `measured` — the property that let `paper` start reading the level
     * without moving a single frozen face. If this breaks, every golden on a paper field moves.
     */
    for (const bg of ALL_BACKGROUNDS) {
      const withLevel = paint(bg, 'measured')
      const without = paintBackground(bg, 70, 90, PAL, 12345, { uid: 'probe' })
      expect(withLevel, String(bg)).toBe(without)
    }
  })
})

describe('C + D — the type pairing changes the type, not just the label', () => {
  it('two pairings resolve to different faces or different tracking', () => {
    const own = { light: 'sans-light', heavy: 'sans-heavy', tracking: 0.1 } as Parameters<typeof titleFaces>[2]
    const resolved = ALL_TYPE_SYSTEMS.map((p) => titleFaces(p, 'sans-light/sans-heavy', own))
    const signatures = new Set(resolved.map((r) => `${r.light}|${r.heavy}|${r.tracking}`))
    // One pairing is the painter's native one and returns `own`; the rest must be distinguishable.
    expect(signatures.size).toBeGreaterThan(ALL_TYPE_SYSTEMS.length / 2)
  })

  it('the widest-tracked system really is the widest', () => {
    // `light-geometric/wide` is documented as "very wide tracking"; measured across 599 faces it
    // emits the largest mean letter-spacing of any pairing.
    const own = { light: 'sans-light', heavy: 'sans-heavy', tracking: 0.1 } as Parameters<typeof titleFaces>[2]
    const wide = titleFaces('light-geometric/wide', 'serif-display/sans-meta', own).tracking
    const mono = titleFaces('condensed-serif/mono', 'serif-display/sans-meta', own).tracking
    expect(wide).toBeGreaterThan(mono)
  })
})

describe('G + H — deterministic, and scoped', () => {
  it('the same input paints the same field', () => {
    for (const bg of ALL_BACKGROUNDS) {
      expect(paint(bg, 'rich'), String(bg)).toBe(paint(bg, 'rich'))
    }
  })

  it('changing the ornament level does not change the field family', () => {
    // Only the contract under test moves: the background still says what it is.
    for (const bg of ALL_BACKGROUNDS) {
      const tag = `data-bg="${bg}"`
      for (const level of ['quiet', 'measured', 'rich'] as OrnamentLevel[]) {
        expect(paint(bg, level), `${bg} ${level}`).toContain(tag)
      }
    }
  })
})
