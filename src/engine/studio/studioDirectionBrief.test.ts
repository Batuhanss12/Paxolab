import { beforeEach, describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { resetDecisionLogs } from '../brain/DesignDecisionLog'
import { resetDesignKnowledge } from '../brain/DesignKnowledgeStore'
import { resetLearning } from '../brain/LearningEngine'
import { hashStudioFace } from './studioGolden'

function brief(extra: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Nova',
    packagingMode: 'box',
    dimensionsMm: { L: 80, W: 50, H: 180 },
    ...extra,
  }
}

function generate(b: DesignBrief) {
  return new FormaLocalEngine().generate({ brief: b, overridePatch: { studio: true } })
}

function archetypeOf(b: DesignBrief): string {
  return generate(b).studio?.direction.archetype ?? ''
}

function faceHash(b: DesignBrief): string {
  const spec = generate(b)
  const layer = spec.artwork.layers.find((row) => row.panelId === spec.artwork.frontPanelId)?.markup ?? ''
  return hashStudioFace(layer)
}

describe('R4 — the brief steers the direction, the sector is only a prior', () => {
  beforeEach(() => {
    resetArtMemory()
    resetDecisionLogs()
    resetDesignKnowledge()
    resetLearning()
  })

  it('same sector, different visual brief → different archetype', () => {
    const marble = archetypeOf(brief({ sector: 'elektronik', subProduct: 'kulaklık', colors: 'mermer · altın' }))
    const plain = archetypeOf(brief({ sector: 'elektronik', subProduct: 'kulaklık' }))
    expect(plain).not.toBe('')
    expect(marble).not.toBe(plain)
  })

  it('"elektronik kutu ama mermer ve altın" lands on marble, not the electronics pin', () => {
    const spec = generate(brief({ sector: 'elektronik', subProduct: 'kulaklık', colors: 'mermer ve altın' }))
    expect(spec.studio?.direction.archetype).toBe('marble-frame')
  })

  it('a different visual word moves the same sector somewhere else again', () => {
    const botanical = archetypeOf(brief({ sector: 'elektronik', subProduct: 'kulaklık', colors: 'botanik yaprak' }))
    expect(['botanical-card', 'card-on-art']).toContain(botanical)
  })

  it('brief-driven direction changes the painted face, not just the label', () => {
    const a = faceHash(brief({ sector: 'elektronik', subProduct: 'kulaklık', colors: 'mermer · altın' }))
    const b = faceHash(brief({ sector: 'elektronik', subProduct: 'kulaklık' }))
    expect(a).not.toBe(b)
  })

  it('without a visual cue the sector prior still decides — pins are not random', () => {
    const first = archetypeOf(brief({ sector: 'elektronik', subProduct: 'kulaklık' }))
    resetArtMemory()
    resetDecisionLogs()
    const second = archetypeOf(brief({ sector: 'elektronik', subProduct: 'kulaklık' }))
    expect(first).toBe(second)
  })
})
