import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { clearCompositionSearch } from '../artwork/compositionCandidates'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import { parseFeedback } from '../iterate/feedbackParser'
import { parseIntent } from '../iterate/parseIntent'
import { noteExport, noteRating } from './OutcomeTracker'
import {
  ASSET_LANGUAGE_VERSION,
  COMPOSITION_VERSION,
  DESIGN_BRAIN_VERSION,
  VISUAL_LANGUAGE_VERSION,
  decisionLogFor,
  resetDecisionLogs,
} from './DesignDecisionLog'
import { resetArtMemory } from './DesignMemory'
import { REFERENCE_DNA_VERSION } from '../studio/referenceDna'
import type { DesignBrief } from '../../types'

function perfumeBrief(patch: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Aurelia',
    productName: 'Noir',
    sector: 'Parfüm',
    subProduct: 'Parfum',
    packagingMode: 'box',
    templateId: 'perfume-box',
    dimensionsMm: { L: 70, W: 35, H: 140 },
    styleType: 'luxury',
    volume: '50 ml',
    ...patch,
  }
}

describe('FAZ 4 design decision log', () => {
  beforeEach(() => {
    resetArtMemory()
    resetDecisionLogs()
    clearCompositionSearch()
  })
  afterEach(() => {
    resetDecisionLogs()
  })

  it('stamps brain / language / asset / composition versions', () => {
    expect(DESIGN_BRAIN_VERSION).toBe('1.0')
    expect(VISUAL_LANGUAGE_VERSION).toBe('1.0')
    expect(ASSET_LANGUAGE_VERSION).toBe('2.0')
    expect(COMPOSITION_VERSION).toBe('3.0')
  })

  it('records studio directionOffer as the candidate set, not kit ONLY', () => {
    const spec = new FormaLocalEngine().generate({
      brief: perfumeBrief(),
      overridePatch: { studio: true },
    })
    const log = decisionLogFor(spec.id)
    const offer = spec.studio?.offer
    expect(log?.path).toBe('studio')
    expect(offer?.candidates.length).toBeGreaterThanOrEqual(2)
    expect(log?.candidates.length).toBe(offer?.candidates.length)
    expect(log?.candidates.some((row) => row.decision === 'ONLY')).toBe(false)
    expect(log?.candidates.filter((row) => row.decision === 'WINNER')).toHaveLength(1)
    const painted = offer?.candidates.find((row) => row.selected)
    expect(log?.winner?.id).toBe(painted?.family)
    expect(log?.candidates.find((row) => row.decision === 'WINNER')?.id).toBe(painted?.family)
    expect(log?.selectedLanguage).toEqual([spec.studio?.direction.archetype])
    expect(JSON.stringify(log?.candidates)).not.toMatch(/"ONLY"/)
  })

  it('stamps the reference DNA version, so a face can be told from one ranked against an older repertoire', () => {
    /*
     * Brain, language, asset and composition versions were already on the log; the DNA table
     * had none, so adding a reference could not be told apart from a painter fix after the fact.
     * Phase 0 of the creative-brain plan: every later phase bumps this when the table changes.
     */
    const spec = new FormaLocalEngine().generate({ brief: perfumeBrief(), overridePatch: { studio: true } })
    const log = decisionLogFor(spec.id)
    expect(REFERENCE_DNA_VERSION).toMatch(/^\d+\.\d+$/)
    expect(log?.dnaVersion).toBe(REFERENCE_DNA_VERSION)
    // Every offer row carries a fingerprint — the offer-distance instrument reads these.
    for (const row of spec.studio?.offer?.candidates ?? []) {
      expect(row.fingerprint?.archetype).toBe(row.archetype)
      expect(row.fingerprint?.lockup).toBeTruthy()
    }
  })

  it('does not throw when generate records a log', () => {
    expect(() => new FormaLocalEngine().generate({ brief: perfumeBrief() })).not.toThrow()
  })
})

describe('FAZ 5 outcome + feedback', () => {
  beforeEach(() => {
    resetArtMemory()
    resetDecisionLogs()
    clearCompositionSearch()
  })

  it('increments regenerate/revision counters on a follow-up generate', () => {
    const engine = new FormaLocalEngine()
    const first = engine.generate({ brief: perfumeBrief() })
    const feedback = parseFeedback('çok klasik')
    const second = engine.generate({
      brief: { ...first.brief, styleType: 'modern' },
      prev: first,
      overridePatch: { directorCue: 'graphic-push' },
      feedback,
    })
    const log = decisionLogFor(second.id)
    expect(second.id).toBe(first.id)
    expect(log?.outcome.regeneratedCount).toBe(1)
    expect(log?.outcome.revisionCount).toBe(1)
    expect(log?.outcome.revisionTypes).toEqual(expect.arrayContaining(['visual_language']))
    expect(log?.feedback.some((row) => row.type === 'visual_language' && row.direction === 'modernize')).toBe(true)
  })

  it('merges export and rating into the latest outcome', () => {
    const spec = new FormaLocalEngine().generate({ brief: perfumeBrief() })
    noteExport(spec.id)
    noteRating(spec.id, 5, ['premium'])
    const log = decisionLogFor(spec.id)
    expect(log?.outcome.exported).toBe(true)
    expect(log?.outcome.downloaded).toBe(true)
    expect(log?.outcome.stars).toBe(5)
    expect(log?.outcome.tags).toEqual(['premium'])
    expect(log?.outcome.finalized).toBe(true)
    expect(log?.outcome.timeToApprovalMs).toBeGreaterThanOrEqual(0)
  })

  it('classifies criticism without changing parseIntent overrides', () => {
    const intent = parseIntent('logoyu büyüt', 'luxury')
    expect(intent.overridePatch.logoScale).toBe(1.35)
    const feedback = parseFeedback('Logo çok aşağıda.')
    expect(feedback[0]).toMatchObject({ type: 'hierarchy', target: 'brand_lockup', direction: 'move_up' })
    expect(parseFeedback('Çok boş.')[0]).toMatchObject({ type: 'composition', target: 'density', direction: 'increase' })
    expect(parseFeedback('Çok klasik.')[0]).toMatchObject({
      type: 'visual_language',
      target: 'dialect',
      direction: 'modernize',
    })
  })
})
