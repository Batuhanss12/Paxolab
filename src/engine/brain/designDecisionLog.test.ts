import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { JOBS, briefFrom } from '../../../scripts/catalog-jobs'
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
  lastDecisionLog,
  resetDecisionLogs,
} from './DesignDecisionLog'
import { resetArtMemory } from './DesignMemory'
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

  it('records a kit path with one measurable candidate and no brand PII', () => {
    const spec = new FormaLocalEngine().generate({ brief: perfumeBrief() })
    const log = decisionLogFor(spec.id)
    expect(log).toBeDefined()
    expect(log?.path).toBe('kit')
    expect(log?.candidates).toHaveLength(1)
    expect(log?.candidates[0].decision).toBe('ONLY')
    expect(log?.candidates[0].reasons.length).toBeGreaterThan(0)
    expect(log?.candidates[0].reasons.every((row) => typeof row.score === 'number')).toBe(true)
    expect(log?.winner?.why.sectorCompatibility).toBeGreaterThanOrEqual(0)
    expect(log?.winner?.why.sectorCompatibility).toBeLessThanOrEqual(1)
    expect(JSON.stringify(log)).not.toMatch(/Aurelia/)
    expect(log?.brainVersion).toBe(DESIGN_BRAIN_VERSION)
    expect(log?.selectedLanguage.length).toBeGreaterThan(0)
    expect(log?.selectedConcept.id).toBe(spec.designPlan?.visualConcept.id)
  })

  it('records overlay candidates with existing scores for playful', () => {
    const job = JOBS.find((row) => row.slug === '09-cikolata-tray-playful')
    expect(job).toBeDefined()
    const spec = new FormaLocalEngine().generate({ brief: briefFrom(job!) })
    const log = lastDecisionLog()
    expect(log?.designId).toBe(spec.id)
    expect(log?.path).toBe('overlay')
    expect(log?.candidates.length).toBeGreaterThanOrEqual(1)
    for (const row of log?.candidates ?? []) {
      expect(typeof row.score).toBe('number')
      expect(row.reasons.length).toBeGreaterThan(0)
      expect(row.reasons.every((reason) => typeof reason.score === 'number')).toBe(true)
    }
    expect(log?.winner).toBeDefined()
    expect(log?.winner?.why.compositionFit).toBeGreaterThanOrEqual(0)
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
