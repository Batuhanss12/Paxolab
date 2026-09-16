import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { runConversation } from '../conversation'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { critiqueAsFeedback } from '../brain/DesignCritic'
import { decisionLogFor, resetDecisionLogs } from '../brain/DesignDecisionLog'
import { listObservations, resetLearning } from '../brain/LearningEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { resetDesignKnowledge } from '../brain/DesignKnowledgeStore'
import { studioCriticActions, talkForCritic } from './studioCritic'
import { hashStudioFace } from './studioGolden'

function coffee() {
  return {
    ...emptyBrief(),
    brandName: 'Elite Brew',
    productName: 'Mocha',
    sector: 'gıda',
    subProduct: 'kahve',
    packagingMode: 'box' as const,
    templateId: 'coffee-box',
    dimensionsMm: { L: 80, W: 50, H: 180 },
    styleType: 'luxury' as const,
    colors: 'siyah · altın',
    volume: '250 g',
  }
}

function generate(brief = coffee()) {
  return new FormaLocalEngine().generate({ brief, overridePatch: { studio: true } })
}

describe('D2 studio critic — ledger to C6 buttons', () => {
  beforeEach(() => {
    resetArtMemory()
    resetDecisionLogs()
    resetDesignKnowledge()
    resetLearning()
  })
  afterEach(() => {
    resetDecisionLogs()
    resetDesignKnowledge()
    resetLearning()
  })

  it('maps crowding to quieter and overflow-only to vary', () => {
    expect(
      studioCriticActions({ collisions: ['front:a×b'], outOfBounds: [], temperament: 'dark-luxe' }),
    ).toEqual([expect.objectContaining({ kind: 'quieter', utterance: 'daha sakin olsun' })])
    expect(
      studioCriticActions({ collisions: ['front:a×b'], outOfBounds: [], temperament: 'light-luxe' }),
    ).toEqual([expect.objectContaining({ kind: 'vary', utterance: 'farklılaştır' })])
    expect(
      studioCriticActions({ collisions: [], outOfBounds: ['front:legal'], temperament: 'dark-luxe' }),
    ).toEqual([expect.objectContaining({ kind: 'vary' })])
    expect(studioCriticActions({ collisions: [], outOfBounds: [], temperament: 'dark-luxe' })).toEqual([])
    expect(talkForCritic('quieter').quieter).toBe(true)
    expect(talkForCritic('vary').kind).toBe('vary')
  })

  it('does not rewrite SVG, force repair, or pick a winner', () => {
    const spec = generate()
    const hash = hashStudioFace(spec.artwork.layers.find((row) => row.panelId === spec.artwork.frontPanelId)?.markup ?? '')
    expect(spec.critique?.needsRepair).toBe(false)
    expect(spec.studio?.critic).toEqual(spec.studio?.collisions.length || spec.studio?.outOfBounds.length ? expect.any(Array) : [])
    const again = generate()
    expect(hashStudioFace(again.artwork.layers.find((row) => row.panelId === again.artwork.frontPanelId)?.markup ?? '')).toBe(hash)
    expect(spec.designCritique?.some((row) => row.evidence.source === 'critiquePlan')).toBe(false)
  })

  it('wires C6 critic feedback onto generate as critic observations without avoiding the family', () => {
    const spec = generate()
    const fb = critiqueAsFeedback(spec.designCritique ?? []).filter((row) => row.raw?.includes('studioLedger'))
    const rows = listObservations().filter((row) => row.signal === 'critic')
    if (spec.studio?.critic.length) {
      expect(fb.length).toBeGreaterThan(0)
      expect(rows.length).toBeGreaterThan(0)
      expect(rows.every((row) => row.signal === 'critic')).toBe(true)
      expect(rows.some((row) => row.recommendation?.kind === 'studio-archetype')).toBe(false)
    } else {
      expect(fb).toEqual([])
      expect(rows).toEqual([])
    }
  })

  it('applies the critic C6 offer through conversation without a new brain', () => {
    const idle = runConversation({
      text: 'önerini uygula',
      attachments: [],
      brief: coffee(),
      awaiting: null,
      hasDesign: true,
      studioCritic: [],
    })
    expect(idle.shouldGenerate).toBe(false)
    expect(idle.replies.join(' ')).toMatch(/temiz/i)

    const apply = runConversation({
      text: 'önerini uygula',
      attachments: [],
      brief: { ...coffee(), studioFamily: 'marble' },
      awaiting: null,
      hasDesign: true,
      studioCritic: [{ kind: 'quieter', utterance: 'daha sakin olsun', reason: 'Ledger çarpışma (1)' }],
    })
    expect(apply.shouldGenerate).toBe(true)
    expect(apply.note).toBe('critic-apply')
    expect(apply.overridePatch.direction?.temperament).toBe('light-luxe')
    expect(apply.overridePatch.directorCue).toBe('luxury-tighten')
    expect(apply.feedback).toEqual([expect.objectContaining({ type: 'brand_fit', direction: 'strengthen', raw: 'critic-apply:quieter' })])
  })

  it('keeps the decision log critiques in sync with the spec', () => {
    const spec = generate()
    expect(decisionLogFor(spec.id)?.critiques).toEqual(spec.designCritique)
  })
})
