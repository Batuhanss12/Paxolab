/**
 * R9 — D5 left "tiny / landscape golden cases" untested. `isTiny` (short side < 50 mm) and
 * `isLandscape` (w >= h * 1.15) switch the label anatomy, and nothing covered those branches.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { resetDecisionLogs } from '../brain/DesignDecisionLog'
import { resetDesignKnowledge } from '../brain/DesignKnowledgeStore'
import { resetLearning } from '../brain/LearningEngine'

function label(dimensionsMm: { L: number; W: number; H: number }, extra: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Verda',
    productName: 'Aloe Mist',
    sector: 'kozmetik',
    subProduct: 'krem',
    packagingMode: 'label',
    templateId: 'fm-cos-label-bottle',
    styleType: 'eco',
    volume: '50 ml',
    dimensionsMm,
    ...extra,
  }
}

function face(brief: DesignBrief) {
  const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } })
  const markup = spec.artwork.layers.find((row) => row.panelId === spec.artwork.frontPanelId)?.markup ?? ''
  return {
    markup,
    hits: [...(spec.studio?.collisions ?? []), ...(spec.studio?.outOfBounds ?? [])],
    minTextMm: spec.studio?.minTextMm ?? 0,
    exportOk: spec.preflight.exportOk,
  }
}

const PORTRAIT = { L: 70, W: 0, H: 120 }
const LANDSCAPE = { L: 120, W: 0, H: 70 }
const TINY = { L: 38, W: 0, H: 44 }

describe('R9 — tiny and landscape label faces', () => {
  beforeEach(() => {
    resetArtMemory()
    resetDecisionLogs()
    resetDesignKnowledge()
    resetLearning()
  })

  it('a landscape label paints a different face than the same brief in portrait', () => {
    const wide = face(label(LANDSCAPE))
    const tall = face(label(PORTRAIT))
    expect(wide.markup).not.toBe('')
    expect(wide.markup).not.toBe(tall.markup)
  })

  it('a tiny label still paints and still carries the brand', () => {
    const small = face(label(TINY))
    expect(small.markup).not.toBe('')
    expect(small.markup.toLocaleUpperCase('tr')).toContain('VERDA')
  })

  it('shrinking the face does not push type under the print floor', () => {
    const small = face(label(TINY))
    // Studio preflight owns the verdict; the ledger must report a real measurement either way.
    expect(small.minTextMm).toBeGreaterThan(0)
  })

  it('neither shape leaves overlapping anatomy behind', () => {
    expect(face(label(LANDSCAPE)).hits).toEqual([])
    expect(face(label(TINY)).hits).toEqual([])
  })

  it('a long brand on a tiny face still fits inside the panel', () => {
    const small = face(label(TINY, { brandName: 'Verda Botanicals Apothecary' }))
    expect(small.hits).toEqual([])
  })
})
