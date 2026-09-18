/**
 * An answer to a direct question outranks a scan of the same sentence.
 *
 * Found by typing a real brief into the running app, not by a test: the label came back reading
 * "DE" where the customer had answered "Fleur de Nuit".
 *
 * `applyExtraction` builds the brief from two sources — `assignAwaiting`, which takes the reply to
 * the question that was actually asked, and `extractFields`, which scans any sentence for names.
 * They merge in that order, so the scan wins. Its brand rule is `words[0]` and its product rule is
 * "the first name-like word after the first", which is reasonable for a free-form sentence and
 * badly wrong for a direct answer:
 *
 *     "Fleur de Nuit"               → product "de"
 *     "Rose de Mai"                 → product "de"
 *     "Gece Çiçeği"                 → product "Çiçeği"
 *     "Elite Brew"                  → brand "Elite"
 *     "Verda Botanicals Apothecary" → brand "Verda"
 *
 * Every multi-word name reached the artwork mangled; only single words survived. The brand is the
 * largest element on a pack, so this printed the wrong name at the largest size on the page.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../types'
import { runConversation } from './conversation'
import { emptyConversationState } from './conversationState'
import { emptyBrief } from './fields'

function answer(text: string, awaiting: 'brandName' | 'productName', brief: Partial<DesignBrief> = {}) {
  return runConversation({
    text,
    attachments: [],
    brief: { ...emptyBrief(), sector: 'kozmetik', subProduct: 'parfüm', packagingMode: 'label', ...brief },
    awaiting,
    hasDesign: false,
    state: emptyConversationState(),
  }).brief
}

describe('an answered field keeps the whole answer', () => {
  const PRODUCTS = ['Fleur de Nuit', 'Rose de Mai', 'Gece Çiçeği', 'Eau de Nuit', 'Noir']
  for (const name of PRODUCTS) {
    it(`product name "${name}" survives verbatim`, () => {
      expect(answer(name, 'productName', { brandName: 'Diako' }).productName).toBe(name)
    })
  }

  const BRANDS = ['Elite Brew', 'Maison Diako', 'Verda Botanicals Apothecary', 'Noctis']
  for (const name of BRANDS) {
    it(`brand name "${name}" survives verbatim`, () => {
      expect(answer(name, 'brandName').brandName).toBe(name)
    })
  }

  it('reaches the artwork, not just the brief', () => {
    // The defect was visible on the painted face, so the guard is asserted there too.
    const brief = answer('Fleur de Nuit', 'productName', { brandName: 'Diako' })
    expect(brief.productName).toBe('Fleur de Nuit')
    expect(brief.brandName).toBe('Diako')
  })
})

describe('the guards the answer must not trample', () => {
  it('a product answer that repeats the brand is still dropped', () => {
    expect(answer('Diako', 'productName', { brandName: 'Diako' }).productName).toBe('')
  })

  it('a skip is still a skip, not a product called "örnek"', () => {
    const brief = answer('örnek', 'productName', { brandName: 'Diako' })
    expect(brief.productName).toBe('')
    expect(brief.productSkipped).toBe(true)
  })

  it('a category answering the brand prompt is read as a sector, not a brand', () => {
    expect(answer('kahve', 'brandName').brandName).toBe('')
  })

  it('a free-form sentence still gets the heuristic — nothing here changes that path', () => {
    const brief = runConversation({
      text: 'Luma parfüm kutusu siyah altın 70x35x140',
      attachments: [],
      brief: emptyBrief(),
      awaiting: null,
      hasDesign: false,
      state: emptyConversationState(),
    }).brief
    expect(brief.brandName).toBe('Luma')
    expect(brief.dimensionsMm).toMatchObject({ L: 70, W: 35, H: 140 })
  })
})
