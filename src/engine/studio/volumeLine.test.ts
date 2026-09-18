/**
 * Net quantity — the one line on the front that is a legal statement rather than a design choice.
 *
 * It is printed, so a wrong unit is not a typo the customer can shrug at. The gallery's wireless
 * earbuds carton carried brief volume "1 adet" and painted "1 kapsül", because `adet`, `kapsül`
 * and `capsule` shared a single branch that answered "kapsül" for all three. Nothing caught it:
 * the ledger saw a well-placed line of the right size, the gates saw a net quantity present, and
 * the golden hash saw the same markup it had frozen. Only reading the face found it.
 *
 * So these assert the unit survives the round trip, in both locales, for every unit the parser
 * claims to know.
 */
import { describe, expect, it } from 'vitest'
import { volumeLine } from './copyBank'

describe('volumeLine — the unit the customer typed is the unit that prints', () => {
  it('a count of pieces stays pieces and does not become capsules', () => {
    expect(volumeLine('1 adet', 'tr')).toBe('1 adet')
    expect(volumeLine('2 adet', 'tr')).toBe('2 adet')
    expect(volumeLine('1 adet', 'en')).toBe('1 pc')
    expect(volumeLine('4 adet', 'en')).toBe('4 pcs')
  })

  it('a count of capsules stays capsules, and one capsule is singular', () => {
    expect(volumeLine('60 kapsül', 'tr')).toBe('60 kapsül')
    expect(volumeLine('60 kapsül', 'en')).toBe('60 capsules')
    expect(volumeLine('1 kapsül', 'en')).toBe('1 capsule')
  })

  it('measured units keep their dual-unit form', () => {
    expect(volumeLine('250 ml', 'tr')).toMatch(/^250 ml ℮ · 8\.45 fl\.oz$/)
    expect(volumeLine('200 g', 'tr')).toMatch(/^200 g ℮ · 7\.05 oz$/)
    expect(volumeLine('1 L', 'tr')).toMatch(/^1 L ℮ · 33\.8 fl\.oz$/)
    expect(volumeLine('2 kg', 'tr')).toMatch(/^2 kg ℮ · 4\.41 lb$/)
  })

  it('an empty or unreadable volume does not invent one', () => {
    expect(volumeLine('', 'tr')).toBe('')
    expect(volumeLine('   ', 'tr')).toBe('')
  })
})
