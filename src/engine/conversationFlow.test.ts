import { describe, expect, it } from 'vitest'
import type { AwaitingKey, DesignBrief, EngineResult } from '../types'
import { runConversation } from './conversation'
import { emptyConversationState, type ConversationState } from './conversationState'
import { fuzzySectorNoun, normaliseSectorTypos } from './extractRules'
import { emptyBrief } from './fields'
import { activeTemplates, pickTemplate } from './catalog/catalog'

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

  it('asks product name then barcode before the structure picker', () => {
    const turns = replay(['Luma parfüm kutusu siyah altın'])
    const last = turns.at(-1)!.result
    expect(last.shouldGenerate).toBe(false)
    expect(last.awaiting).toBe('productName')
    expect(last.showTemplates).toBe(false)
  })

  it('opens the structure picker after product + barcode, without generating', () => {
    const turns = replay(['Luma parfüm kutusu siyah altın', 'Noir', 'örnek'])
    const last = turns.at(-1)!.result
    expect(last.shouldGenerate).toBe(false)
    expect(last.showTemplates).toBe(true)
    expect(last.awaiting).toBe('templateId')
    expect(last.brief.templateId).toBe('')
    expect(last.brief.productName).toBe('Noir')
    expect(last.brief.barcodeDefaulted).toBe(true)
    expect(last.replies.join(' ')).toMatch(/tuck|Yapı/i)
    expect(last.structureOffer?.candidates.length).toBeGreaterThan(0)
  })

  it('selects a structure without generating, then starts on başlat', () => {
    const selected = replay(['Luma parfüm kutusu siyah altın', 'Noir', 'örnek', '1. yapı'])
    expect(selected.at(-1)!.result.shouldGenerate).toBe(false)
    expect(selected.at(-1)!.result.showTemplates).toBe(true)
    expect(selected.at(-1)!.result.brief.templateId.length).toBeGreaterThan(0)
    expect(selected.at(-1)!.result.brief.dimensionsMm.L).toBeGreaterThan(0)
    const started = replay(['Luma parfüm kutusu siyah altın', 'Noir', 'örnek', '1. yapı', 'başlat'])
    const last = started.at(-1)!.result
    expect(last.shouldGenerate).toBe(true)
    expect(last.showTemplates).toBe(false)
    expect(last.brief.templateId.length).toBeGreaterThan(0)
  })

  it('names mailer as a selection, then generates on başlat', () => {
    const named = replay(['Luma parfüm kutusu siyah altın', 'Noir', 'örnek', 'mailer'])
    expect(named.at(-1)!.result.shouldGenerate).toBe(false)
    expect(named.at(-1)!.result.brief.templateId).toMatch(/mailer/)
    const last = replay(['Luma parfüm kutusu siyah altın', 'Noir', 'örnek', 'mailer', 'başlat']).at(-1)!.result
    expect(last.shouldGenerate).toBe(true)
    expect(last.brief.templateId).toMatch(/mailer/)
    expect(last.replies.join(' ')).toMatch(/mailer|Yapı/i)
  })

  it('asks product name before the optional direction question', () => {
    const turns = replay(['Luma parfüm kutusu'])
    const last = turns.at(-1)!.result
    expect(last.shouldGenerate).toBe(false)
    expect(last.awaiting).toBe('productName')
  })

  it('opens the structure picker after product, barcode skip, and direction skip', () => {
    const turns = replay(['Luma parfüm kutusu', 'Noir', 'örnek', 'örnek'])
    const last = turns.at(-1)!.result
    expect(last.shouldGenerate).toBe(false)
    expect(last.showTemplates).toBe(true)
    expect(last.awaiting).toBe('templateId')
    expect(last.brief.directionDefaulted).toBe(true)
    expect(last.replies.join(' ')).toMatch(/Yapı|tuck/i)
  })

  it('a rich paragraph still asks for the product name before the picker', () => {
    const last = replay(['Luma parfüm kutusu siyah altın editorial'])[0].result
    expect(last.shouldGenerate).toBe(false)
    expect(last.awaiting).toBe('productName')
    expect(last.brief.colors).toMatch(/siyah|altın/i)
    expect(last.brief.styleType).toBe('modern')
  })

  it('keeps marble as a colour token so direction can override the sector pin', () => {
    const last = replay(['Nox kulaklık kutusu mermer altın'])[0].result
    expect(last.shouldGenerate).toBe(false)
    expect(last.awaiting).toBe('barcode')
    expect(last.brief.colors).toMatch(/mermer/i)
    expect(last.brief.sector).toMatch(/elektronik/i)
  })

  it('does not treat L×W×H as a product name in the director ack', () => {
    const last = replay(['Luma parfüm kutusu 70x35x140'])[0].result
    expect(last.brief.productName).toBe('')
    expect(last.brief.brandName).toBe('Luma')
    expect(last.replies.join(' ')).not.toMatch(/70x35x140/)
  })

  it('etiket-only brief opens a format picker, not carton structures', () => {
    const last = replay(['Luma parfüm etiketi siyah altın', 'Noir', 'örnek']).at(-1)!.result
    expect(last.shouldGenerate).toBe(false)
    expect(last.showTemplates).toBe(true)
    expect(last.brief.packagingMode).toBe('label')
    expect(last.awaiting).toBe('templateId')
    expect(last.replies.join(' ')).toMatch(/sarımlı|format|etiket/i)
    expect(last.replies.join(' ')).not.toMatch(/tuck|mailer/i)
    // What this guards is that a label brief is offered *label* formats, which the carton
    // assertion above still pins. The set is read off the live catalog: a hand list here went
    // stale twice (the disc, then the oval) for enumerating formats by name.
    const labelFormats = new Set(activeTemplates(true).filter((t) => t.packagingMode === 'label').map((t) => t.structureId))
    expect(last.structureOffer?.candidates.every((row) => labelFormats.has(row.structureId))).toBe(true)
  })

  it('after a box, etiketi de üret opens the label format picker without replacing the carton path', () => {
    const last = replay(['Luma parfüm kutusu siyah altın', 'Noir', 'örnek', 'başlat', 'etiketi de üret']).at(-1)!.result
    expect(last.shouldGenerate).toBe(false)
    expect(last.showTemplates).toBe(true)
    expect(last.brief.packagingMode).toBe('label')
    expect(last.brief.deliverables).toEqual(['box', 'label'])
    expect(last.replies.join(' ')).toMatch(/sarımlı|format/i)
    expect(last.replies.join(' ')).not.toMatch(/tuck|mailer/i)
  })

  it('first generate is one designer line, not a command wall', () => {
    const last = replay(['Luma parfüm kutusu siyah altın', 'Noir', 'örnek', '1. yapı', 'başlat']).at(-1)!.result
    expect(last.shouldGenerate).toBe(true)
    expect(last.replies).toHaveLength(1)
    expect(last.replies[0]).not.toMatch(/İterasyon:|critic seçmez|TASARIM REF|Yön adayları|Motor/)
  })

  it('idle after a design does not dump the iteration menu', () => {
    const last = replay(['Luma parfüm kutusu siyah altın', 'Noir', 'örnek', 'başlat', 'hmm']).at(-1)!.result
    expect(last.replies).toHaveLength(1)
    expect(last.replies[0]).not.toMatch(/İterasyon:|Yön adayları|critic seçmez|luxury yap|baskıya hazırla/)
  })
})
