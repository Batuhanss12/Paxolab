/**
 * What the customer said, kept.
 *
 * The chat audit measured five to seven single-field questions before a design appeared, and — far
 * worse — found that most of what a customer volunteered was thrown away on the way. Every case
 * below is a measured failure, not a hypothetical:
 *
 *   - "Merhaba" and "Merhaba, Noctis diye bir markam var…" both printed **Merhaba** on the pack;
 *   - "Noctis markası için parfüm şişesi etiketi, ürün Gece Serisi" set the product to **şişesi**,
 *     a word from the middle of the sentence, while the answer sat two clauses later;
 *   - "Barkod örnek" in the opener was ignored, so the next turn asked for the barcode — the one
 *     question standing between that customer and their design;
 *   - answering the product question "Gece Serisi, 50 ml, siyah altın" printed all three clauses
 *     as the product name;
 *   - "aslında marka adı Noktis olsun" typed at the barcode question vanished silently;
 *   - "çok klinik durmasın" set the palette to **Klinik**, the one thing just ruled out;
 *   - and typing `2` under a numbered list matched nothing at all.
 */
import { describe, expect, it } from 'vitest'
import type { AwaitingKey, DesignBrief } from '../types'
import { runConversation } from './conversation'
import { emptyConversationState, type ConversationState } from './conversationState'
import { emptyBrief } from './fields'
import { extractFields } from './extractFields'
import { parseDirectionChoice } from './studio/directionOffer'
import { parseOfferChoice } from './catalog/structureRecommend'

/** Replay a chat the way App.tsx does: brief / awaiting / state carried between turns. */
function replay(texts: string[]) {
  let brief: DesignBrief = emptyBrief()
  let awaiting: AwaitingKey | null = null
  let state: ConversationState = emptyConversationState()
  let hasDesign = false
  const asked: (AwaitingKey | null)[] = []
  const generated: boolean[] = []
  for (const text of texts) {
    const result = runConversation({ text, attachments: [], brief, awaiting, hasDesign, state })
    brief = result.brief
    awaiting = result.awaiting
    state = result.state ?? state
    asked.push(result.awaiting)
    generated.push(!!result.shouldGenerate)
    if (result.shouldGenerate) hasDesign = true
  }
  return { brief, asked, generated, awaiting }
}

describe('a greeting is not a brand', () => {
  for (const hello of ['Merhaba', 'Selam', 'Günaydın', 'Hello']) {
    it(`"${hello}" does not end up on the pack`, () => {
      expect(replay([hello]).brief.brandName, `${hello} marka oldu`).toBe('')
    })
  }

  it('a greeting in front of a real brief does not steal the brand', () => {
    const { brief } = replay(['Merhaba, Noctis diye bir parfüm markam var, şişe etiketi istiyorum'])
    expect(brief.brandName).toBe('Noctis')
  })
})

describe('a labelled field is read wherever it sits in the sentence', () => {
  it('reads "ürün X" without any punctuation to lean on', () => {
    const { brief } = replay(['Noctis markası için parfüm şişesi etiketi, ürün Gece Serisi, 50 ml, siyah altın'])
    expect(brief.brandName).toBe('Noctis')
    expect(brief.productName, 'cümlenin ortasından bir kelime alındı').toBe('Gece Serisi')
  })

  it('reads a name that comes before its label', () => {
    expect(extractFields('Noctis diye bir markam var', []).brandName).toBe('Noctis')
    expect(extractFields('Noctis adında bir parfüm markası', []).brandName).toBe('Noctis')
  })

  it('does not mistake the connector for the name', () => {
    expect(extractFields('a brand called Luma', []).brandName).toBe('Luma')
    expect(extractFields('marka adı Noctis', []).brandName).toBe('Noctis')
  })

  it('a spoken barcode answer counts as answered', () => {
    const { brief, asked } = replay(['Noctis parfüm etiketi, ürün Gece Serisi, 50 ml, siyah altın. Barkod örnek.'])
    expect(brief.barcodeDefaulted, 'barkod cevabı görülmedi').toBe(true)
    expect(asked[0], 'zaten cevaplanan soru tekrar soruldu').not.toBe('barcode')
  })
})

describe('an answer that carried more than the answer', () => {
  it('takes the name and leaves the rest to the fields they belong to', () => {
    const { brief } = replay(['Noctis parfüm etiketi', 'Gece Serisi, 50 ml, siyah altın'])
    expect(brief.productName, 'cevabın tamamı ürün adı oldu').toBe('Gece Serisi')
    expect(brief.volume).toBe('50 ml')
    expect(brief.colors).toMatch(/Siyah/)
  })

  it('keeps what was volunteered while a different question was pending', () => {
    const { brief } = replay([
      'Noctis parfüm etiketi',
      'Ürün adı Gece Serisi olsun. Hedef kitlemiz 30 yaş üstü kadınlar, eczane rafında duracak, çok klinik durmasın.',
    ])
    expect(brief.productName).toBe('Gece Serisi')
    expect(brief.audience, 'hedef kitle atıldı').toBeTruthy()
    expect(brief.channel, 'satış kanalı atıldı').toBeTruthy()
  })

  it('a word inside a refusal is not a request', () => {
    const patch = extractFields('çok klinik durmasın, sıcak bir şey olsun', [])
    expect(patch.colors ?? '', 'reddedilen kelime palete yazıldı').not.toMatch(/Klinik/)
  })

  it('a correction lands even while another field is awaited', () => {
    const { brief } = replay(['Noctis parfüm etiketi', 'Gece Serisi', 'aslında marka adı Noktis olsun'])
    expect(brief.brandName, 'düzeltme sessizce kayboldu').toBe('Noktis')
  })
})

describe('a bare number selects from a numbered list', () => {
  it('picks a structure', () => {
    expect(parseOfferChoice('2', 3)).toBe(2)
    expect(parseOfferChoice('2.', 3)).toBe(2)
    expect(parseOfferChoice('2. yapı', 3)).toBe(2)
  })

  it('picks a direction', () => {
    expect(parseDirectionChoice('3', 8)).toBe(3)
    expect(parseDirectionChoice('3)', 8)).toBe(3)
    expect(parseDirectionChoice('3. yön', 8)).toBe(3)
  })

  it('does not read a measurement or a barcode as a choice', () => {
    expect(parseDirectionChoice('50 ml', 8)).toBeNull()
    expect(parseDirectionChoice('8690000000017', 8)).toBeNull()
    expect(parseOfferChoice('70x35x140', 3)).toBeNull()
    // Out of range stays unselected rather than clamping to something the customer did not see.
    expect(parseDirectionChoice('9', 4)).toBeNull()
  })
})

describe('a question is not a command', () => {
  it('asking something at the structure picker does not start a paid generation', () => {
    const { generated, awaiting } = replay([
      'Noctis parfüm etiketi, ürün Gece Serisi, 50 ml, siyah altın. Barkod örnek.',
      'wrap',
      'kaç mm olacak?',
    ])
    expect(generated[2], 'soru üretim başlattı').toBe(false)
    expect(awaiting).toBe('templateId')
  })

  it('but a start word still starts it', () => {
    const { generated } = replay([
      'Noctis parfüm etiketi, ürün Gece Serisi, 50 ml, siyah altın. Barkod örnek.',
      'wrap',
      'başlat',
    ])
    expect(generated[2], 'başlat üretmedi').toBe(true)
  })
})
