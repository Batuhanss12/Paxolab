/**
 * The first message is a brief, even when it names a direction.
 *
 * A regression that 761 tests did not catch, found by typing into the running app. The
 * direction-talk branch runs before brief extraction, and when no design exists it used to
 * *return* — so "Verda krem etiketi, botanik olsun" answered "botanik kilitleyerek yeniden
 * çiziyorum" and kept no brand, no sector, no size. There was nothing to re-draw; the customer
 * had to type their brief a second time. Measured on four ordinary first messages, three were
 * swallowed.
 *
 * Two causes, both fixed: `PIN_FAMILY` had been widened (F-5) with an `(ekle|olsun|yap|çiz)$`
 * alternative that matched almost any Turkish imperative sentence, and the branch itself threw
 * the turn away instead of carrying the family forward.
 *
 * What is pinned here is the invariant, not either fix: a first turn keeps everything the
 * sentence says — the family *and* the brief.
 */
import { describe, expect, it } from 'vitest'
import { runConversation } from './conversation'
import { emptyConversationState } from './conversationState'
import { emptyBrief } from './fields'
import { familyCommandIn } from './studio/family'
import { parseDirectionTalk } from './studio/directionTalk'

function firstTurn(text: string) {
  return runConversation({
    text,
    attachments: [],
    brief: emptyBrief(),
    awaiting: null,
    hasDesign: false,
    state: emptyConversationState(),
  })
}

describe('first turn — a brief that also names a direction', () => {
  const CASES: { text: string; brand: string; family: string }[] = [
    { text: 'Verda krem etiketi, botanik olsun', brand: 'Verda', family: 'botanical' },
    { text: 'Azzurra parfüm etiketi, arma ekle', brand: 'Azzurra', family: 'crest' },
    { text: 'Diako parfüm etiketi, krem ve altın, atölye plakası gibi olsun, 70x90 mm', brand: 'Diako', family: 'atelier' },
    { text: 'Elite Brew kahve kutusu, mermer yap', brand: 'Elite Brew', family: 'marble' },
  ]

  for (const row of CASES) {
    it(`keeps both the brief and the family: "${row.text.slice(0, 34)}…"`, () => {
      const result = firstTurn(row.text)
      // The brief survived — this is what the early return used to destroy.
      expect(result.brief.brandName, 'brand lost').toBe(row.brand)
      expect(result.brief.sector, 'sector lost').toBeTruthy()
      // …and the direction the same sentence named was kept.
      expect(result.brief.studioFamily, 'family lost').toBe(row.family)
      // The turn continues collecting instead of claiming a redraw that cannot happen.
      expect(result.shouldGenerate).toBe(false)
      expect(result.replies.join(' ')).not.toMatch(/yeniden çiziyorum/)
      expect(result.replies.length).toBeGreaterThan(1)
    })
  }

  it('keeps a size the same sentence gave', () => {
    const result = firstTurn('Diako parfüm etiketi, krem ve altın, atölye plakası gibi olsun, 70x90 mm')
    expect(result.brief.dimensionsMm).toMatchObject({ L: 70, H: 90 })
  })

  it('a plain brief with no direction word is untouched', () => {
    const result = firstTurn('Luma parfüm kutusu siyah altın 70x35x140')
    expect(result.brief.brandName).toBe('Luma')
    expect(result.brief.studioFamily).toBeUndefined()
    expect(result.brief.dimensionsMm).toMatchObject({ L: 70, W: 35, H: 140 })
  })
})

describe('family command — the verb has to be next to the family name', () => {
  it('reads a direct request', () => {
    expect(familyCommandIn('botanik olsun')).toBe('botanical')
    expect(familyCommandIn('arma ekle')).toBe('crest')
    expect(familyCommandIn('atölye plakası gibi olsun')).toBe('atelier')
    expect(familyCommandIn('mermer yap')).toBe('marble')
  })

  it('does not read a family word that merely appears in the sentence', () => {
    /*
     * The shape that broke the first turn: a family noun used as *subject matter*, with an
     * unrelated imperative at the end. "Marble countertop — make a box for it" is not a request
     * for the marble archetype.
     */
    expect(familyCommandIn('mermer tezgah için bir kutu yap')).toBeNull()
    expect(familyCommandIn('dalga desenli bir ürünüm var, etiket tasarla')).toBeNull()
    expect(familyCommandIn('Luma parfüm kutusu 70x35x140')).toBeNull()
  })

  it('a bare brief never reaches the direction-talk parser', () => {
    expect(parseDirectionTalk('Luma parfüm kutusu siyah altın 70x35x140')).toBeNull()
    expect(parseDirectionTalk('Elite Brew kahve kutusu 80x50x180')).toBeNull()
  })
})
