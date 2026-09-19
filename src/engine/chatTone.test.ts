/**
 * What the customer reads, and what their words are allowed to change.
 *
 * The tone audit swept five ordinary conversations and counted two things: internal vocabulary in
 * sentences meant for a customer, and the same sentence arriving twice in one chat. The sweep also
 * surfaced four defects that are worse than either, all of them measured rather than imagined:
 *
 *   - after the first design, typing `3` under a list of eight directions picked the third
 *     *structure* instead and silently started a re-generation;
 *   - `düz` — the word the chat itself invites, "Sarımlı veya düz yazarak değiştirebilirsin" —
 *     matched no structure, so the identical offer was printed again with no acknowledgement;
 *   - any free text after a design overwrote the brand from word position: `başlat` became the
 *     brand name, and "hedef kitle 25-40 yaş" set brand **hedef** / product **kitle** on a pack
 *     branded Lumen;
 *   - `başlat` after a design fell through to "bunu bir değişiklik olarak okuyamadım" — the system
 *     refusing the exact word it tells customers to type.
 */
import { describe, expect, it } from 'vitest'
import type { AwaitingKey, DesignBrief } from '../types'
import { runConversation } from './conversation'
import { emptyConversationState, type ConversationState } from './conversationState'
import { emptyBrief } from './fields'
import { explainStudioDirection } from './studio/directionTalk'
import { studioCriticActions } from './studio/studioCritic'
import { parseIntent } from './iterate/parseIntent'
import { templateIdFromUtterance } from './catalog/structureOffer'

function replay(texts: string[]) {
  let brief: DesignBrief = emptyBrief()
  let awaiting: AwaitingKey | null = null
  let state: ConversationState = emptyConversationState()
  let hasDesign = false
  const turns: { note: string; replies: string[]; generated: boolean }[] = []
  for (const text of texts) {
    const r = runConversation({ text, attachments: [], brief, awaiting, hasDesign, state })
    brief = r.brief
    awaiting = r.awaiting
    state = r.state ?? state
    if (r.shouldGenerate) hasDesign = true
    turns.push({ note: r.note, replies: r.replies, generated: !!r.shouldGenerate })
  }
  return { brief, turns }
}

/** A honey label, past the first design: eight directions are listed and numbered. */
const HONEY = ['Aura bal kavanozu etiketi, ürün Çiçek Balı, 450 gr, toprak. Barkod örnek.', 'düz', 'başlat']
/** Earbuds in a carton, past the first design. */
const EARBUDS = ['Lumen kulaklık kutusu, ürün Studio One, antrasit. Barkod örnek.', 'şablon', 'başlat']

/** Words that exist only inside the engine and must not reach a customer. */
const JARGON = /\byüzey(i|e|de|in)?\b|\bbrief\b|\bledger\b|\block\s*-?up\b|\barketip\b|(luxury|playful|classic)\s+hale/i

describe('nothing the customer reads is written in engine vocabulary', () => {
  for (const [name, turns] of [
    ['etiket', [...HONEY, 'neden bu yön']],
    ['kutu', [...EARBUDS, 'neden bu yön']],
  ] as const) {
    it(`${name} — hiçbir cümlede iç terim yok`, () => {
      for (const turn of replay([...turns]).turns) {
        for (const reply of turn.replies) {
          expect(reply, `jargon sızdı: ${reply}`).not.toMatch(JARGON)
        }
      }
    })
  }

  it('the mood chips answer in the language they are labelled in', () => {
    // "luxury hale çekiyorum" — the chip beside the customer says **Lüks**, and nothing in the
    // interface is called `luxury`.
    expect(parseIntent('daha lüks', 'modern').note).toMatch(/Lüks/)
    expect(parseIntent('daha lüks', 'modern').note).not.toMatch(/luxury/i)
    expect(parseIntent('daha eğlenceli', 'modern').note).not.toMatch(/playful/i)
  })

  it('the critic says what is wrong, not which structure noticed', () => {
    const [action] = studioCriticActions({ collisions: ['a', 'b'], outOfBounds: [], temperament: 'vivid-mono' })
    expect(action?.reason).toBeTruthy()
    expect(action?.reason, 'iç veri yapısının adı söylendi').not.toMatch(/ledger/i)
    // A raw count is meaningless without the total the customer was never shown.
    expect(action?.reason, 'çıplak sayı söylendi').not.toMatch(/\(\d+\)/)
  })

  it('the reason for a direction never names another company’s pack', () => {
    /*
     * The sector rationales used to quote the reference plates this engine was built from —
     * "Parfüm — Guess / Rebull koyu lüks manzara", "Elektronik — Capelli diyagonal metalik".
     * Those are private notes about other companies' work, and saying them to a customer
     * misdescribes their design as a copy of a named brand.
     */
    const brands = /guess|rebull|capelli|woo\.originals|elite brew|dna pharma|azzurra|diako/i
    for (const brief of [
      { ...emptyBrief(), brandName: 'Noctis', sector: 'parfüm', packagingMode: 'label' as const },
      { ...emptyBrief(), brandName: 'Lumen', sector: 'elektronik', packagingMode: 'box' as const },
      { ...emptyBrief(), brandName: 'Verda', sector: 'krem', packagingMode: 'label' as const },
    ]) {
      expect(explainStudioDirection(brief).text, 'referans marka adı sızdı').not.toMatch(brands)
    }
  })
})

describe('a bare number belongs to the list the chat printed last', () => {
  it('after a design, a number picks a direction rather than re-running generation', () => {
    const { turns } = replay([...HONEY, '3'])
    const last = turns[turns.length - 1]!
    expect(last.note, 'sayı yapı seçimi olarak okundu').toBe('direction-pick')
    expect(last.replies[0]).toMatch(/3\.\s*yön/)
  })

  it('before a design, a number still picks a structure', () => {
    const { turns } = replay(['Aura bal kavanozu etiketi, ürün Çiçek Balı, 450 gr, toprak. Barkod örnek.', '2'])
    expect(turns[turns.length - 1]!.note).toBe('select')
  })

  it('a structure can still be changed by name once a design exists', () => {
    const { turns } = replay([...HONEY, 'sarımlı'])
    expect(turns[turns.length - 1]!.note, 'isimle yapı değişimi kayboldu').toBe('generate')
  })
})

describe('the chat accepts the words it asks for', () => {
  it('“düz” selects the flat label, because the offer invites exactly that word', () => {
    const { turns } = replay(['Aura bal kavanozu etiketi, ürün Çiçek Balı, 450 gr, toprak. Barkod örnek.', 'düz'])
    const pick = turns[turns.length - 1]!
    expect(pick.note, 'sohbetin davet ettiği kelime seçim yapmadı').toBe('select')
    expect(pick.replies[0]).toMatch(/düz etiket seçildi/i)
  })

  it('“düz” on a carton means the flat tuck-end, not a label', () => {
    // `düz` is also the first word of `düz tuck-end`; the surface decides which one is meant.
    expect(templateIdFromUtterance('düz', 'label')).toBeTruthy()
    expect(templateIdFromUtterance('düz', 'box')).toBeTruthy()
    expect(templateIdFromUtterance('düz', 'box')).not.toBe(templateIdFromUtterance('düz', 'label'))
  })

  it('“başlat” still starts a design after the first one', () => {
    const { turns } = replay([...EARBUDS, 'başlat'])
    const last = turns[turns.length - 1]!
    expect(last.generated, 'sistem kendi başlatma kelimesini reddetti').toBe(true)
    expect(last.replies[0]).not.toMatch(/okuyamadım/i)
  })
})

describe('the conversation remembers what was decided', () => {
  /*
   * `decisions` on the state and `noteDecision` to append to it were both written, and nothing
   * wrote and nothing read: six turns into a design the customer had no way to see what they had
   * chosen short of scrolling. Both ends are connected now.
   */
  it('names the structure, the direction and the mood that were settled', () => {
    const { turns } = replay([...HONEY, '3', 'daha lüks', 'özet'])
    const summary = turns[turns.length - 1]!
    expect(summary.note).toBe('summary')
    expect(summary.generated, 'özet istemek üretim başlattı').toBe(false)
    const line = summary.replies[0] ?? ''
    expect(line, 'seçilen format özette yok').toMatch(/düz etiket/)
    expect(line, 'seçilen yön özette yok').toMatch(/mürekkep/)
    expect(line, 'seçilen ruh hali özette yok').toMatch(/Lüks/)
  })

  it('a later choice replaces an earlier one rather than stacking', () => {
    // Picking 3, then 5, then 3 should leave one direction, not a history of clicks.
    const { turns } = replay([...HONEY, '3', '5', '3', 'özet'])
    const line = turns[turns.length - 1]!.replies[0] ?? ''
    expect((line.match(/Yön:/g) ?? []).length, 'her tıklama ayrı satır oldu').toBe(1)
  })

  it('asking before anything is chosen says so instead of inventing a summary', () => {
    const { turns } = replay(['özet'])
    expect(turns[0]!.replies[0]).toMatch(/henüz/i)
  })
})

describe('a guess may fill a name, never replace one', () => {
  it('the start word does not become the brand', () => {
    const { brief } = replay([...EARBUDS, 'başlat'])
    expect(brief.brandName, 'başlatma kelimesi marka oldu').toBe('Lumen')
  })

  it('describing the buyer does not rename the brand', () => {
    const { brief } = replay([...EARBUDS, 'hedef kitle 25-40 yaş, teknoloji meraklısı, online satılacak'])
    expect(brief.brandName, 'hedef kitle cümlesi markayı ezdi').toBe('Lumen')
    expect(brief.productName, 'hedef kitle cümlesi ürün adını ezdi').toBe('Studio One')
  })

  it('but a deliberate rename still lands after a design exists', () => {
    const { brief } = replay([...EARBUDS, 'aslında marka adı Lumina olsun'])
    expect(brief.brandName, 'açık düzeltme yok sayıldı').toBe('Lumina')
  })

  it('a two-word brand does not leave its second word as the product', () => {
    // Answering "Elite Brew" to the brand question used to set the product to **Brew**, and the
    // product question was then skipped as already answered.
    const { brief } = replay(['kahve kutusu', 'Elite Brew'])
    expect(brief.brandName).toBe('Elite Brew')
    expect(brief.productName, 'markanın ikinci kelimesi ürün adı oldu').toBe('')
  })
})
