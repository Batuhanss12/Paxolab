import { describe, expect, it } from 'vitest'
import type { AwaitingKey, DesignBrief, EngineResult } from '../types'
import { runConversation } from './conversation'
import { emptyConversationState, type ConversationState } from './conversationState'
import { fuzzySectorNoun, normaliseSectorTypos } from './extractRules'
import { emptyBrief } from './fields'
import { pickTemplate } from './catalog/catalog'

type Turn = { text: string; result: EngineResult }

/** Replay a chat the way App.tsx does: brief / awaiting / state carried between turns. */
function replay(texts: string[]): Turn[] {
  let brief: DesignBrief = emptyBrief()
  let awaiting: AwaitingKey | null = null
  let state: ConversationState = emptyConversationState()
  let hasDesign = false
  const turns: Turn[] = []
  for (const text of texts) {
    const result = runConversation({ text, attachments: [], brief, awaiting, hasDesign, state })
    brief = result.brief
    awaiting = result.awaiting
    state = result.state ?? state
    if (result.shouldGenerate) hasDesign = true
    turns.push({ text, result })
  }
  return turns
}

describe('typo-tolerant category nouns', () => {
  it('reads a mistyped category as the category, not a brand', () => {
    expect(fuzzySectorNoun('Elektornik')).toBe('elektronik')
    expect(fuzzySectorNoun('kozmetk')).toBe('')
    expect(fuzzySectorNoun('Kahvem')).toBe('')
    expect(fuzzySectorNoun('elektronik')).toBe('')
    expect(normaliseSectorTypos('Elektornik kutu')).toBe('elektronik kutu')
  })
})

describe('chat flow from the screenshot', () => {
  it('never takes the typo as the brand and never repeats a question verbatim', () => {
    const turns = replay(['Elektornik kutu', 'Ürün', 'Nox', 'kahve'])
    const opening = turns[0].result
    expect(opening.brief.brandName).toBe('')
    expect(opening.brief.sector).toBe('elektronik')
    expect(opening.brief.packagingMode).toBe('box')
    expect(opening.awaiting).toBe('brandName')

    // "Ürün" is not a brand → same field asked again, but rephrased.
    const second = turns[1].result
    expect(second.awaiting).toBe('brandName')
    expect(second.replies[0]).not.toBe(opening.replies[0])
    expect(second.replies[0]).toMatch(/Ürün/)

    const named = turns[2].result
    expect(named.brief.brandName).toBe('Nox')
  })

  it('acknowledges the product family the user said (kahve), not the umbrella sector', () => {
    const turns = replay(['Elite Brew kutu', 'kahve'])
    const afterProduct = turns[1].result
    expect(afterProduct.brief.subProduct).toBe('kahve')
    expect(afterProduct.replies.join(' ')).toMatch(/Elite Brew · kahve/)
  })

  it('rephrases the sector question when the answer is not a category', () => {
    const turns = replay(['Nox kutu', 'Ürün'])
    const first = turns[0].result
    expect(first.awaiting).toBe('sector')
    const retry = turns[1].result
    expect(retry.awaiting).toBe('sector')
    expect(retry.replies[0]).not.toBe(first.replies[0])
    expect(retry.replies[0]).toMatch(/kategoriye oturmadı/)
    const answered = replay(['Nox kutu', 'Ürün', 'onarıcı şampuan'])[2].result
    expect(answered.brief.sector).toBe('kozmetik')
    expect(answered.brief.subProduct).toBe('şampuan')
  })

  it('keeps the requested surface for sectors without a dedicated carton', () => {
    const baby = pickTemplate({ ...emptyBrief(), sector: 'bebek', subProduct: 'bakım', packagingMode: 'label' })
    expect(baby.packagingMode).toBe('label')
    const clean = pickTemplate({ ...emptyBrief(), sector: 'temizlik', packagingMode: 'box' })
    expect(clean.packagingMode).toBe('box')
  })

  it('Elektronik → kahve → şablon never turns the sector into a brand lockup', () => {
    const turns = replay(['Elektronik', 'kahve', 'şablon'])
    for (const turn of turns) {
      expect(turn.result.brief.brandName).not.toMatch(/elektro/i)
      expect(turn.result.brief.brandName).not.toMatch(/kahve/i)
    }
    expect(turns.some((t) => t.result.awaiting === 'brandName')).toBe(true)
    expect(turns.at(-1)?.result.shouldGenerate).toBe(false)
    expect(turns.at(-1)?.result.awaiting).toBe('brandName')
  })

  it('shortcut chips populate sector, not brand', () => {
    const kozmetik = replay(['Kozmetik kutusu'])[0].result
    expect(kozmetik.brief.brandName).toBe('')
    expect(kozmetik.brief.sector).toBe('kozmetik')
    expect(kozmetik.brief.packagingMode).toBe('box')
    expect(kozmetik.awaiting).toBe('brandName')

    const kahve = replay(['Kahve kutusu'])[0].result
    expect(kahve.brief.brandName).toBe('')
    expect(kahve.brief.subProduct).toBe('kahve')
    expect(kahve.awaiting).toBe('brandName')
  })
})
