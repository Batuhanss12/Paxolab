/**
 * Brief depth and design commands — what the chat understands beyond the five facts.
 *
 * Three things are pinned. The understanding layer records audience, channel, price tier, feeling
 * and "not like X" when they are said in passing, and asks for none of them: the critical list is
 * unchanged, so no replayed conversation gains a turn. The iteration parser answers to the
 * direction's own vocabulary — frame, ornament, pairing, lockup, copy tiers, family words — and
 * every command lands on a key the direction already honours. And the depth reaches the face:
 * a mass-market tier paints quiet, a boutique one rich, and the customer's explicit command
 * outranks both.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../types'
import { depthFieldsOf } from './briefDepth'
import { understandUtterance } from './conversationUnderstand'
import { emptyBrief } from './fields'
import { FormaLocalEngine } from './FormaLocalEngine'
import { resetArtMemory } from './brain/DesignMemory'
import { isIteration, parseIntent } from './iterate/parseIntent'
import { parseDesignCommands } from './iterate/parseDesignCommands'
import { sanitizeBriefExtract } from './nlu'
import { parseDirectionTalk } from './studio/directionTalk'
import { hintsFromBriefDepth } from './studio/studioPlanBridge'
import { LABEL_DNA } from './studio/referenceDna'
import type { LabelArchetype } from './studio/types'

describe('brief depth — heard in passing', () => {
  it('reads audience, channel, price tier, feeling and the reference to avoid', () => {
    const depth = depthFieldsOf('Genç kadınlara, e-ticarette satacağız, uygun fiyatlı ama ucuz gibi olmasın; sakin ve zarif hissettirsin, Chanel gibi olmasın')
    expect(depth.audience).toBe('genç · kadın')
    expect(depth.channel).toBe('e-ticaret')
    expect(depth.priceTier).toBe('mass')
    expect(depth.feeling).toBe('sakin · zarif')
    expect(depth.avoidLike).toMatch(/Chanel/)
  })

  it('records them on the brief without adding a question', () => {
    const before = understandUtterance('Luma parfüm kutusu', emptyBrief())
    const after = understandUtterance('Luma parfüm kutusu, butik niş parfüm, eczanede satılacak, gösterişli dursun', emptyBrief())
    expect(after.patch.priceTier).toBe('boutique')
    // "butik niş parfüm" is also a channel word; both are kept, the pharmacy among them.
    expect(after.patch.channel).toContain('eczane')
    expect(after.patch.feeling).toBe('gösterişli')
    // The critical list is untouched: same next question, whatever depth was said.
    expect(after.missingCritical).toEqual(before.missingCritical)
  })

  it('accepts the same keys from the LLM extract through the closed gate', () => {
    const clean = sanitizeBriefExtract({
      brandName: 'Luma',
      audience: 'kadın 30+',
      channel: 'butik',
      priceTier: 'boutique',
      feeling: 'zarif',
      avoidLike: 'Jo Malone',
      concentration: 'edt',
      edition: 'No. 07',
      attribution: 'by Luma Atelier',
      origin: 'İstanbul · 2019',
    })
    expect(clean).toMatchObject({ audience: 'kadın 30+', channel: 'butik', priceTier: 'boutique', feeling: 'zarif', avoidLike: 'Jo Malone', concentration: 'edt', edition: 'No. 07', attribution: 'by Luma Atelier', origin: 'İstanbul · 2019' })
    // An invented tier is dropped, not coerced; geometry in a free field is dropped.
    const dirty = sanitizeBriefExtract({ brandName: 'Luma', priceTier: 'ultra', feeling: '<svg>' })
    expect(dirty?.priceTier).toBeUndefined()
    expect(dirty?.feeling).toBeUndefined()
  })
})

describe('design commands — the direction’s vocabulary in chat', () => {
  it('maps frame, ornament, pairing and lockup words onto direction keys', () => {
    expect(parseDesignCommands('çerçeveyi kaldır').direction.frame).toBe('none')
    expect(parseDesignCommands('bant çerçeve olsun').direction.frame).toBe('band-hairline')
    expect(parseDesignCommands('köşe süsü ekle').direction.frame).toBe('fleuron-crown')
    expect(parseDesignCommands('metalik kenar').direction.frame).toBe('bezel')
    expect(parseDesignCommands('süsü azalt').direction.ornament).toBe('quiet')
    expect(parseDesignCommands('daha zengin dursun').direction.ornament).toBe('rich')
    expect(parseDesignCommands('aralıklı serif olsun').direction.typePairing).toBe('spaced-serif/spaced-sans')
    expect(parseDesignCommands('el yazısı vurgu').direction.typePairing).toBe('script-accent/sans-heavy')
    expect(parseDesignCommands('serifsiz yap').direction.typePairing).toBe('sans-light/sans-heavy')
    expect(parseDesignCommands('sola hizala').direction.lockup).toBe('left-column')
    expect(parseDesignCommands('monogram sağda dursun').direction.lockup).toBe('monogram-right')
    const cmd = parseDesignCommands('çerçeveyi kaldır, süsü azalt')
    expect(cmd.direction.source).toBe('user')
    expect(cmd.direction.rationale).toHaveLength(2)
  })

  it('reads the perfume copy tiers and the family words', () => {
    expect(parseDesignCommands('edt olsun').briefPatch.concentration).toBe('edt')
    expect(parseDesignCommands('edisyon: No. 07 olsun').briefPatch.edition).toBe('No. 07')
    expect(parseDesignCommands('imza: by Diako Atelier olsun').briefPatch.attribution).toBe('by Diako Atelier')
    // Family words belong to the direction-talk parser, which knows the new families by alias.
    expect(parseDirectionTalk('Diako gibi bir atölye plakası yap')?.pinFamily).toBe('atelier')
    expect(parseDirectionTalk('arabesk zemin, arma ekle')?.pinFamily).toBe('crest')
    // And a sentence that names the family it is leaving does not get pinned to it.
    const leaving = parseDirectionTalk('ink tasarımından daha teknik bir tasarım yap', 'ink')
    expect(leaving?.pinFamily).toBe('tech')
  })

  it('says nothing on an unrelated sentence, and is recognised as an iteration when it speaks', () => {
    const none = parseDesignCommands('Luma parfüm kutusu 70x35x140')
    expect(none.direction).toEqual({})
    expect(none.briefPatch).toEqual({})
    expect(isIteration('çerçeveyi kaldır')).toBe(true)
    expect(isIteration('süsü azalt')).toBe(true)
    expect(isIteration('bant çerçeve')).toBe(true)
  })

  it('flows through parseIntent into the override the engine reads', () => {
    const intent = parseIntent('çerçeveyi kaldır ve süsü azalt', 'luxury')
    expect(intent.overridePatch.direction).toMatchObject({ frame: 'none', ornament: 'quiet', source: 'user' })
    expect(intent.note).toMatch(/Çerçeveyi kaldırdım/)
  })
})

describe('brief depth — reaching the face', () => {
  function brief(extra: Partial<DesignBrief>): DesignBrief {
    return {
      ...emptyBrief(),
      brandName: 'Odette',
      productName: 'Fleur',
      sector: 'kozmetik',
      subProduct: 'parfüm',
      packagingMode: 'label',
      templateId: 'fm-cos-label-bottle',
      styleType: 'luxury',
      colors: 'krem · altın',
      volume: '50 ml',
      barcode: '8690000000017',
      dimensionsMm: { L: 70, W: 0, H: 90 },
      ...extra,
    }
  }
  function direction(extra: Partial<DesignBrief>, override?: Record<string, unknown>) {
    resetArtMemory()
    return new FormaLocalEngine().generate({ brief: brief(extra), overridePatch: { studio: true, variationIndex: 0, direction: override } }).studio!.direction
  }

  it('maps price tier and feeling to ornament, and nothing else', () => {
    expect(hintsFromBriefDepth({ priceTier: 'mass' })).toMatchObject({ ornament: 'quiet' })
    expect(hintsFromBriefDepth({ priceTier: 'boutique' })).toMatchObject({ ornament: 'rich' })
    expect(hintsFromBriefDepth({ feeling: 'sakin · zarif' })).toMatchObject({ ornament: 'quiet' })
    expect(hintsFromBriefDepth({ priceTier: 'mid' })).toBeNull()
    for (const h of [hintsFromBriefDepth({ priceTier: 'mass' }), hintsFromBriefDepth({ priceTier: 'boutique' })]) {
      expect(h?.archetype).toBeUndefined()
      expect(h?.temperament).toBeUndefined()
      expect(h?.typePairing).toBeUndefined()
    }
  })

  it('paints a mass tier quiet, a boutique tier rich, and lets the customer overrule both', () => {
    const mass = direction({ priceTier: 'mass' })
    const dna = LABEL_DNA[mass.archetype as LabelArchetype]
    expect(dna.ornaments).toContain('quiet')
    expect(mass.ornament).toBe('quiet')
    expect(mass.rationale.some((r) => r.startsWith('Brief derinliği'))).toBe(true)
    const boutique = direction({ priceTier: 'boutique' })
    expect(boutique.ornament).toBe('rich')
    const overruled = direction({ priceTier: 'mass' }, { ornament: 'rich', source: 'user' })
    expect(overruled.ornament).toBe('rich')
  })
})
