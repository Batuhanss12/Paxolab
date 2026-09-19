/**
 * Two things the chat could not say, and one it should have said.
 *
 * The chooser's button reads "Tasarımları değiştir" and swaps the eight skeletons for eight
 * others. Typing those exact words did something else: the phrase was not an iteration, fell
 * through to the generic redraw, and answered "Bunlarla yeniden çiziyorum" — so the feature the
 * owner asked for had no path through the chat, and the button's own wording meant a different
 * thing when typed.
 *
 * And a stale family pin — the only way an unrecognised one can reach the engine, since the field
 * is typed and a saved session is JSON — was dropped correctly but silently. Drawing a different
 * family than the customer picked, without a word, reads as the engine ignoring them.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../types'
import { emptyBrief } from './fields'
import { isIteration, parseIntent } from './iterate/parseIntent'
import { runConversation } from './conversation'
import type { StudioFamily } from './studio/types'

function brief(patch: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Vera',
    productName: 'Noir',
    sector: 'parfüm',
    subProduct: 'eau de parfum',
    packagingMode: 'box',
    templateId: 'parfum-tuck-end',
    styleType: 'luxury',
    volume: '50 ml',
    dimensionsMm: { L: 70, W: 35, H: 140 },
    barcode: '8690000000017',
    ...patch,
  }
}

const say = (text: string, b: DesignBrief = brief(), hasDesign = true) =>
  runConversation({ text, attachments: [], brief: b, awaiting: null, hasDesign })

describe('the chat can ask for the other eight', () => {
  it('recognises the words the button itself uses', () => {
    for (const text of ['tasarımları değiştir', 'bambaşka tasarım göster', 'başka tasarımlar istiyorum', 'farklı tasarımlar']) {
      expect(isIteration(text), `${text} iterasyon sayılmıyor`).toBe(true)
      const parsed = parseIntent(text)
      expect(parsed.briefPatch.studioRepertoire, text).toBe('reference')
      // What belongs to the set being left behind goes with it.
      expect(parsed.briefPatch.studioFamily, `${text} aile pini kalmış`).toBeUndefined()
      expect(parsed.briefPatch.studioFamilyLocked, text).toBe(false)
      expect(parsed.briefPatch.studioPick, text).toBeUndefined()
      expect(parsed.briefPatch.directionVariation, text).toBe(0)
    }
  })

  it('goes back when asked to, and is not read as picking direction 1', () => {
    for (const text of ['ilk tasarımlara dön', 'önceki tasarımlara dön']) {
      expect(isIteration(text), text).toBe(true)
      expect(parseIntent(text).briefPatch.studioRepertoire, text).toBe('studio')
    }
    /*
     * Measured in the running app before this was guarded: the swap happened, the strip filled with
     * the studio eight, and the chat said "1. yön: kemer taç" — `parseDirectionChoice` had read
     * "**ilk**" as the number one. The strip was right and the sentence was wrong.
     */
    const back = say('ilk tasarımlara dön', brief({ studioRepertoire: 'reference' }))
    expect(back.replies.join(' '), 'yön seçimi gibi cevaplandı').not.toMatch(/\d+\.\s*yön/)
    expect(back.replies.join(' ')).toMatch(/ilk sekiz|dönüyorum/i)
  })

  it('carries the swap through a real turn, and says what it did', () => {
    const out = say('tasarımları değiştir')
    expect(out.shouldGenerate).toBe(true)
    expect(out.brief.studioRepertoire, 'repertuar dönmedi').toBe('reference')
    expect(out.replies.join(' '), 'ne yaptığını söylemiyor').toMatch(/bambaşka|yeni iskelet/i)
    // The old answer, which is what this replaces.
    expect(out.replies.join(' ')).not.toMatch(/Bunlarla yeniden çiziyorum/)

    const back = say('ilk tasarımlara dön', brief({ studioRepertoire: 'reference' }))
    expect(back.brief.studioRepertoire).toBe('studio')
  })

  it('leaves an ordinary redraw alone', () => {
    // The gate must not swallow every request that happens to contain a verb.
    for (const text of ['daha koyu olsun', 'logoyu büyüt', 'daha mermer']) {
      expect(parseIntent(text).briefPatch.studioRepertoire, text).toBeUndefined()
    }
  })
})

describe('a pin the studio cannot honour is said out loud', () => {
  it('tells the customer when a saved family no longer exists', () => {
    // `arch-crown` is an archetype id, not a family — the shape a renamed key comes back as.
    const out = say('devam', brief({ studioFamily: 'arch-crown' as StudioFamily, studioFamilyLocked: true }))
    expect(out.replies.join(' '), 'düşen pin sessiz kaldı').toMatch(/tanımadığım bir ad|ailen/i)
  })

  it('stays quiet when the pin is fine, or when there is none', () => {
    expect(say('devam', brief({ studioFamily: 'marble', studioFamilyLocked: true })).replies.join(' ')).not.toMatch(/tanımadığım bir ad/)
    expect(say('devam', brief()).replies.join(' ')).not.toMatch(/tanımadığım bir ad/)
  })
})
