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
    expect(retry.replies[0]).toMatch(/ürüne oturmadı/)
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

  it('Kutu chip is surface only and asks for the product, not a brand overwrite', () => {
    const kutu = replay(['Kutu'])[0].result
    expect(kutu.brief.packagingMode).toBe('box')
    expect(kutu.brief.sector).toBe('')
    expect(kutu.brief.brandName).toBe('')
    expect(kutu.awaiting).toBe('sector')
    expect(kutu.replies.join(' ')).toMatch(/ürün/i)
    expect(kutu.replies.join(' ')).not.toMatch(/Markanın adı nedir/)
    expect(kutu.replies.join(' ')).not.toMatch(/\bbox\b/)
  })

  it('opens the structure picker after the brief is complete, without generating', () => {
    const turns = replay(['Luma parfüm kutusu 70x35x140 siyah altın'])
    const last = turns.at(-1)!.result
    expect(last.shouldGenerate).toBe(false)
    expect(last.showTemplates).toBe(true)
    expect(last.awaiting).toBe('templateId')
    expect(last.brief.templateId).toBe('')
    expect(last.replies.join(' ')).toMatch(/tuck|Yapı/i)
    expect(last.structureOffer?.candidates.length).toBeGreaterThan(0)
  })

  it('generates only after the user picks a structure from the offer', () => {
    const turns = replay(['Luma parfüm kutusu 70x35x140 siyah altın', '1. yapı'])
    expect(turns[0].result.shouldGenerate).toBe(false)
    expect(turns[0].result.showTemplates).toBe(true)
    const last = turns.at(-1)!.result
    expect(last.shouldGenerate).toBe(true)
    expect(last.showTemplates).toBe(false)
    expect(last.brief.templateId.length).toBeGreaterThan(0)
  })

  it('switches carton grammar when the user names mailer after the offer', () => {
    const turns = replay(['Luma parfüm kutusu 70x35x140 siyah altın', 'mailer'])
    const last = turns.at(-1)!.result
    expect(last.shouldGenerate).toBe(true)
    expect(last.brief.templateId).toMatch(/mailer/)
    expect(last.replies.join(' ')).toMatch(/mailer/i)
  })

  it('asks one optional direction question when colour and mood are missing', () => {
    const turns = replay(['Luma parfüm kutusu 70x35x140'])
    const last = turns.at(-1)!.result
    expect(last.shouldGenerate).toBe(false)
    expect(last.awaiting).toBe('colors')
    expect(last.replies.join(' ')).toMatch(/renk|duruş|hikâye/i)
  })

  it('opens the structure picker after the user skips the direction ask', () => {
    const turns = replay(['Luma parfüm kutusu 70x35x140', 'örnek'])
    const last = turns.at(-1)!.result
    expect(last.shouldGenerate).toBe(false)
    expect(last.showTemplates).toBe(true)
    expect(last.awaiting).toBe('templateId')
    expect(last.brief.directionDefaulted).toBe(true)
    expect(last.replies.join(' ')).toMatch(/Yapı|tuck/i)
  })

  it('a rich paragraph with colour and mood opens the structure picker in one turn', () => {
    const last = replay(['Luma parfüm kutusu 70x35x140 siyah altın editorial'])[0].result
    expect(last.shouldGenerate).toBe(false)
    expect(last.showTemplates).toBe(true)
    expect(last.awaiting).toBe('templateId')
    expect(last.brief.colors).toMatch(/siyah|altın/i)
    expect(last.brief.styleType).toBe('modern')
  })

  it('keeps marble as a colour token so direction can override the sector pin', () => {
    const last = replay(['Nox kulaklık kutusu 90x50x160 mermer altın'])[0].result
    expect(last.shouldGenerate).toBe(false)
    expect(last.showTemplates).toBe(true)
    expect(last.brief.colors).toMatch(/mermer/i)
    expect(last.brief.sector).toMatch(/elektronik/i)
  })

  it('does not treat L×W×H as a product name in the director ack', () => {
    const last = replay(['Luma parfüm kutusu 70x35x140'])[0].result
    expect(last.brief.productName).toBe('')
    expect(last.brief.brandName).toBe('Luma')
    expect(last.replies.join(' ')).not.toMatch(/70x35x140/)
  })
})
