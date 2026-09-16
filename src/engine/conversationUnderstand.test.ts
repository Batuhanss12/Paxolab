import { describe, expect, it } from 'vitest'
import { extractFields } from './extract'
import { nextMissing, runConversation } from './conversation'
import { motifAvoidTokens, understandUtterance } from './conversationUnderstand'
import { emptyBrief, mergeBrief } from './fields'
import { createPlan, resetArtMemory } from './brain'
import { assetLanguageFor } from './artwork/assetLanguage'

const LUMA =
  'Yeni çıkardığım doğal içerikli yüz serumum için premium bir kutu ve şişe etiketi istiyorum. Marka adı Luma olsun. Çok klasik görünmesin ama ucuz da durmasın. Bej ve koyu yeşil tonlarında, biraz editorial bir şey istiyorum.'

const NOMA = 'Noma special series kahve kutusu istiyorum, contemporary editorial, earth tones.'

describe('CHAT-1 conversation understanding', () => {
  it('maps the Luma serum paragraph onto brief + restrained cue, and asks dimensions not barcode', () => {
    const extracted = extractFields(LUMA, [])
    expect(extracted.brandName).toBe('Luma')
    expect(extracted.sector).toBe('kozmetik')
    expect(extracted.subProduct).toBe('serum')
    expect(extracted.packagingMode).toBe('box')
    expect(extracted.styleType).toBe('luxury')
    expect(extracted.styleType).not.toBe('classic')
    expect(extracted.colors).toMatch(/bej/i)
    expect(extracted.colors).toMatch(/yeşil/i)
    expect(extracted.dimensionsMm).toBeUndefined()

    const understood = understandUtterance(LUMA, emptyBrief())
    expect(understood.deliverables).toEqual(['box', 'label'])
    expect(understood.avoided).toEqual(expect.arrayContaining(['classic', 'cheap']))
    expect(understood.patch.avoidMotifs).toEqual(
      expect.arrayContaining(['generic-corners', 'heavy-frame', 'generic-ticks', 'dense-pattern']),
    )
    expect(motifAvoidTokens(['classic', 'cheap'])).toEqual(['generic-corners', 'heavy-frame', 'generic-ticks', 'dense-pattern'])
    expect(understood.directorCue).toBe('luxury-tighten')
    expect(understood.confidence.brandName).toBe('high')
    expect(understood.missingCritical).toEqual(['dimensionsMm'])

    const turned = runConversation({
      text: LUMA,
      attachments: [],
      brief: emptyBrief(),
      awaiting: null,
      hasDesign: false,
    })
    expect(turned.brief.brandName).toBe('Luma')
    expect(turned.brief.directorCue).toBe('luxury-tighten')
    expect(turned.brief.avoidMotifs).toEqual(
      expect.arrayContaining(['generic-corners', 'heavy-frame', 'generic-ticks', 'dense-pattern']),
    )
    expect(turned.shouldGenerate).toBe(false)
    expect(turned.awaiting).toBe('dimensionsMm')
    expect(turned.replies.join(' ')).toMatch(/ölçü|şablon|serum/i)
    expect(turned.awaiting).not.toBe('barcode')
    expect(turned.awaiting).not.toBe('manufacturerName')
    expect(nextMissing(turned.brief)).toBe('dimensionsMm')
  })

  it('understands Noma coffee special series as editorial food packaging', () => {
    const extracted = extractFields(NOMA, [])
    expect(extracted.brandName).toBe('Noma')
    expect(extracted.productName).toMatch(/special series/i)
    expect(extracted.sector).toBe('gıda')
    expect(extracted.subProduct).toBe('kahve')
    expect(extracted.packagingMode).toBe('box')
    expect(extracted.styleType).toBe('modern')
    expect(extracted.colors).toMatch(/toprak/i)

    const understood = understandUtterance(NOMA, emptyBrief())
    expect(understood.directorCue).toBe('luxury-tighten')
    expect(understood.missingCritical).toEqual(['dimensionsMm'])

    const turned = runConversation({
      text: NOMA,
      attachments: [],
      brief: emptyBrief(),
      awaiting: null,
      hasDesign: false,
    })
    expect(turned.brief.brandName).toBe('Noma')
    expect(turned.shouldGenerate).toBe(false)
    expect(turned.awaiting).toBe('dimensionsMm')
    expect(turned.replies.join(' ')).not.toMatch(/barkod/i)
  })

  it('keeps chips optional: Kutu sets surface, free text still starts a brief', () => {
    const chip = runConversation({
      text: 'Kutu',
      attachments: [],
      brief: emptyBrief(),
      awaiting: null,
      hasDesign: false,
    })
    expect(chip.brief.packagingMode).toBe('box')
    expect(chip.shouldGenerate).toBe(false)
    expect(chip.awaiting === 'sector' || chip.awaiting === 'brandName').toBe(true)

    const both = runConversation({
      text: 'Kutu + Etiket',
      attachments: [],
      brief: emptyBrief(),
      awaiting: null,
      hasDesign: false,
    })
    expect(both.brief.packagingMode).toBe('box')
    expect(understandUtterance('Kutu + Etiket', emptyBrief()).deliverables).toEqual(['box', 'label'])

    const typed = runConversation({
      text: 'Bir parfüm kutusu yapmak istiyorum. Marka adı Luma olsun.',
      attachments: [],
      brief: emptyBrief(),
      awaiting: null,
      hasDesign: false,
    })
    expect(typed.brief.packagingMode).toBe('box')
    expect(typed.brief.brandName).toBe('Luma')
    expect(typed.brief.sector).toMatch(/kozmetik|parfüm/)
    expect(typed.shouldGenerate).toBe(false)
    expect(typed.awaiting).not.toBe('barcode')
  })

  it('defaults dimensions then opens the structure picker, without a barcode gauntlet', () => {
    const first = runConversation({
      text: LUMA,
      attachments: [],
      brief: emptyBrief(),
      awaiting: null,
      hasDesign: false,
    })
    const second = runConversation({
      text: 'şablon',
      attachments: [],
      brief: first.brief,
      awaiting: first.awaiting,
      hasDesign: false,
    })
    expect(second.shouldGenerate).toBe(false)
    expect(second.showTemplates).toBe(true)
    expect(second.awaiting).toBe('templateId')
    expect(second.brief.templateId).toBe('')
    expect(second.structureOffer?.candidates.length).toBeGreaterThan(0)
    expect(second.brief.deliverables).toEqual(['box', 'label'])
    expect(second.replies.join(' ')).toMatch(/Luma/i)
    expect(second.replies.join(' ')).toMatch(/premium|editorial/i)
    expect(second.replies.join(' ')).toMatch(/etiketi de üret/i)
    expect(second.replies.join(' ')).toMatch(/Yapı|tuck/i)
    expect(second.overridePatch.directorCue).toBe('luxury-tighten')
    expect(second.overridePatch.studio).toBe(true)
    expect(second.brief.avoidMotifs).toEqual(
      expect.arrayContaining(['generic-corners', 'heavy-frame', 'generic-ticks', 'dense-pattern']),
    )
    resetArtMemory()
    const plan = createPlan({
      brief: second.brief,
      style: 'luxury',
      blankCanvas: false,
      variationIndex: 0,
    })
    expect(plan.visualConcept.avoid).toEqual(
      expect.arrayContaining(['heavy-frame', 'generic-corners', 'generic-ticks', 'dense-pattern']),
    )
    expect(assetLanguageFor(plan).forbidden.avoid).toEqual(
      expect.arrayContaining(['heavy-frame', 'generic-corners', 'generic-ticks', 'dense-pattern']),
    )
  })

  it('does not copy brand into product on a labeled brand-only turn', () => {
    const brandOnly = runConversation({
      text: 'Aurelia',
      attachments: [],
      brief: mergeBrief(emptyBrief(), { packagingMode: 'box', sector: 'kozmetik' }),
      awaiting: 'brandName',
      hasDesign: false,
    })
    expect(brandOnly.brief.brandName).toBe('Aurelia')
    expect(brandOnly.brief.productName).toBe('')
    expect(brandOnly.awaiting).toBe('dimensionsMm')
  })

  it('after a box, “etiketi de üret” switches to a label surface', () => {
    const first = runConversation({
      text: LUMA,
      attachments: [],
      brief: emptyBrief(),
      awaiting: null,
      hasDesign: false,
    })
    const ready = runConversation({
      text: 'şablon',
      attachments: [],
      brief: first.brief,
      awaiting: first.awaiting,
      hasDesign: false,
    })
    const label = runConversation({
      text: 'etiketi de üret',
      attachments: [],
      brief: ready.brief,
      awaiting: null,
      hasDesign: true,
    })
    expect(label.shouldGenerate).toBe(true)
    expect(label.brief.packagingMode).toBe('label')
    expect(label.brief.templateId.length).toBeGreaterThan(0)
    expect(label.replies.join(' ')).toMatch(/etiket/i)
  })

  it('“etiketi de üret” carries the box studio family onto the label generate', () => {
    const label = runConversation({
      text: 'etiketi de üret',
      attachments: [],
      brief: mergeBrief(emptyBrief(), {
        brandName: 'Elite Brew',
        sector: 'gıda',
        subProduct: 'kahve',
        packagingMode: 'box',
        studioFamily: 'marble',
      }),
      awaiting: null,
      hasDesign: true,
    })
    expect(label.shouldGenerate).toBe(true)
    expect(label.brief.packagingMode).toBe('label')
    expect(label.brief.studioFamily).toBe('marble')
    expect(label.overridePatch.direction?.archetype).toBe('marble-frame')
    expect(label.overridePatch.direction?.source).toBe('family')
  })

  it('classifies revision talk as structured feedback without dropping parseIntent overrides', () => {
    const turned = runConversation({
      text: 'Logo çok aşağıda.',
      attachments: [],
      brief: { ...emptyBrief(), brandName: 'Luma', styleType: 'luxury' },
      awaiting: null,
      hasDesign: true,
    })
    expect(turned.shouldGenerate).toBe(true)
    expect(turned.overridePatch.logoScale).toBeUndefined()
    expect(turned.feedback).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'hierarchy', target: 'brand_lockup', direction: 'move_up' }),
      ]),
    )
  })
})
