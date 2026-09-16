import { describe, expect, it } from 'vitest'
import { classifyBriefFields } from './briefProvenance'
import { runConversation } from './conversation'
import { MAX_ASK, emptyConversationState } from './conversationState'
import { emptyBrief } from './fields'

const LUMA_EN =
  'I need a premium serum box and label for a brand called Luma. Modern, calm, editorial, cream and dark green. Not too classical.'

describe('TEST A — conversational input becomes a sourced brief', () => {
  it('reads brand, product, deliverables, positioning, character, colours and avoid from one English sentence', () => {
    const turn = runConversation({ text: LUMA_EN, attachments: [], brief: emptyBrief(), awaiting: null, hasDesign: false })
    const brief = turn.brief
    expect(brief.brandName).toBe('Luma')
    expect(brief.sector).toBe('kozmetik')
    expect(brief.subProduct).toBe('serum')
    expect(brief.deliverables).toEqual(expect.arrayContaining(['box', 'label']))
    expect(brief.packagingMode).toBe('box')
    expect(brief.styleType).toBe('luxury')
    expect(brief.directorCue).toBe('luxury-tighten')
    expect(brief.colors).toContain('Krem')
    expect(brief.colors).toContain('Koyu yeşil')
    expect(brief.avoidMotifs).toEqual(expect.arrayContaining(['heavy-frame', 'generic-corners']))

    expect(brief.provenance?.brandName?.source).toBe('USER_EXPLICIT')
    expect(brief.provenance?.colors?.source).toBe('USER_EXPLICIT')
    expect(brief.provenance?.directorCue?.source).toBe('HEURISTIC_INFERRED')
    expect(brief.provenance?.avoidMotifs?.source).toBe('HEURISTIC_INFERRED')

    const classes = classifyBriefFields(brief)
    expect(classes.known).toEqual(expect.arrayContaining(['brandName', 'sector', 'packagingMode', 'colors']))
    expect(classes.blocking).toEqual(['dimensionsMm'])
  })
})

describe('TEST B — missing information and the asked/answered ledger', () => {
  it('asks for dimensions once when they block the dieline and records the ask', () => {
    const turn = runConversation({
      text: LUMA_EN,
      attachments: [],
      brief: emptyBrief(),
      awaiting: null,
      hasDesign: false,
      state: emptyConversationState(),
    })
    expect(turn.shouldGenerate).toBe(false)
    expect(turn.awaiting).toBe('dimensionsMm')
    expect(turn.replies.join(' ')).toMatch(/ölçü|L×W×H/i)
    expect(turn.state?.asked.dimensionsMm).toBe(1)
    expect(turn.state?.turns).toBe(1)
  })

  it('does not ask a defaultable question more than MAX_ASK times — it accepts the system default and moves on', () => {
    let turn = runConversation({
      text: LUMA_EN,
      attachments: [],
      brief: emptyBrief(),
      awaiting: null,
      hasDesign: false,
      state: emptyConversationState(),
    })
    for (let i = 1; i < MAX_ASK; i++) {
      turn = runConversation({
        text: 'Marka Luma, kozmetik serum.',
        attachments: [],
        brief: turn.brief,
        awaiting: turn.awaiting,
        hasDesign: false,
        state: turn.state,
      })
      expect(turn.awaiting).toBe('dimensionsMm')
    }
    expect(turn.state?.asked.dimensionsMm).toBe(MAX_ASK)

    const settled = runConversation({
      text: 'Marka Luma, kozmetik serum.',
      attachments: [],
      brief: turn.brief,
      awaiting: turn.awaiting,
      hasDesign: false,
      state: turn.state,
    })
    expect(settled.shouldGenerate).toBe(false)
    expect(settled.showTemplates).toBe(true)
    expect(settled.awaiting).toBe('templateId')
    expect(settled.brief.dimsDefaulted).toBe(true)
    expect(settled.brief.provenance?.dimensionsMm?.source).toBe('SYSTEM_DEFAULT')
    expect(settled.state?.asked.dimensionsMm).toBe(MAX_ASK)
  })

  it('marks an answered question and never re-asks it', () => {
    const asked = runConversation({
      text: LUMA_EN,
      attachments: [],
      brief: emptyBrief(),
      awaiting: null,
      hasDesign: false,
      state: emptyConversationState(),
    })
    const answered = runConversation({
      text: '60 x 40 x 120',
      attachments: [],
      brief: asked.brief,
      awaiting: asked.awaiting,
      hasDesign: false,
      state: asked.state,
    })
    expect(answered.shouldGenerate).toBe(false)
    expect(answered.showTemplates).toBe(true)
    expect(answered.awaiting).toBe('templateId')
    expect(answered.brief.dimensionsMm).toEqual({ L: 60, W: 40, H: 120 })
    expect(answered.state?.answered).toContain('dimensionsMm')
    expect(answered.state?.asked.dimensionsMm).toBe(1)
  })

  it('brand has no safe default, so it stays a question', () => {
    let turn = runConversation({
      text: 'Kozmetik serum kutusu, 60x40x120',
      attachments: [],
      brief: emptyBrief(),
      awaiting: null,
      hasDesign: false,
      state: emptyConversationState(),
    })
    expect(turn.awaiting).toBe('brandName')
    for (let i = 0; i < MAX_ASK + 1; i++) {
      turn = runConversation({ text: '???', attachments: [], brief: turn.brief, awaiting: turn.awaiting, hasDesign: false, state: turn.state })
    }
    expect(turn.shouldGenerate).toBe(false)
    expect(turn.awaiting).toBe('brandName')
  })
})
