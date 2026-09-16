import { describe, expect, it } from 'vitest'
import { emptyBrief } from '../fields'
import { describeStructureOffer, parseStructureUtterance, templateIdFromUtterance } from './structureOffer'

describe('structureOffer', () => {
  it('parses carton grammar from chat', () => {
    expect(parseStructureUtterance('mailer olsun')).toBe('mailer-box')
    expect(parseStructureUtterance('sleeve')).toBe('sleeve')
    expect(parseStructureUtterance('ters tuck')).toBe('reverse-tuck-end-box')
    expect(parseStructureUtterance('tuck')).toBe('tuck-end-box')
    expect(parseStructureUtterance('A60')).toBe('tuck-top-auto-bottom')
    expect(parseStructureUtterance('şablon seçildi')).toBeNull()
  })

  it('maps an utterance onto a live catalog id', () => {
    expect(templateIdFromUtterance('mailer', 'box')).toMatch(/mailer/)
    expect(templateIdFromUtterance('wrap etiket', 'label')).toMatch(/label|wrap/)
    expect(templateIdFromUtterance('şablon', 'box')).toBe('')
  })

  it('names label format without carton grammar', () => {
    const text = describeStructureOffer({ ...emptyBrief(), packagingMode: 'label', sector: 'kozmetik', subProduct: 'parfüm' })
    expect(text).toMatch(/Format:/)
    expect(text).toMatch(/sarımlı|düz|wrap|etiket/i)
    expect(text).not.toMatch(/tuck|mailer|sleeve/i)
  })
})
