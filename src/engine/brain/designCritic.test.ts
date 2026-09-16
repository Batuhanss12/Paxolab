import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { DesignBrief, PreflightReport } from '../../types'
import { clearCompositionSearch } from '../artwork/compositionCandidates'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import type { CritiqueReport } from './CritiqueEngine'
import { critiqueAsFeedback, critiqueDesign, worstSeverity } from './DesignCritic'
import { decisionLogFor, resetDecisionLogs } from './DesignDecisionLog'
import { resetArtMemory } from './DesignMemory'

function serumBrief(): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Luma',
    productName: 'Glow',
    sector: 'kozmetik',
    subProduct: 'serum',
    packagingMode: 'box',
    templateId: 'serum-box',
    dimensionsMm: { L: 45, W: 45, H: 120 },
    styleType: 'luxury',
  }
}

const PASSING_PREFLIGHT: PreflightReport = { items: [], blocking: false, exportOk: true, collisions: false }

describe('Design Critic — structured findings, no SVG mutation', () => {
  beforeEach(() => {
    resetArtMemory()
    resetDecisionLogs()
    clearCompositionSearch()
  })
  afterEach(() => resetDecisionLogs())

  it('maps CritiqueEngine MODIFY hints and preflight failures to category/target/severity/evidence', () => {
    const spec = new FormaLocalEngine().generate({ brief: serumBrief() })
    const plan = spec.designPlan!
    const critique: CritiqueReport = {
      ...spec.critique!,
      hints: [
        { action: 'KEEP', topic: 'hierarchy', note: 'ok' },
        { action: 'MODIFY', topic: 'lockupClearance', note: 'Lockup penceresi eksik.' },
        { action: 'MODIFY', topic: 'densityFront', note: 'Dekor aşırı.' },
      ],
    }
    const preflight: PreflightReport = {
      ...PASSING_PREFLIGHT,
      items: [
        { id: 'safe-zone', label: 'Güvenli alan', detail: 'Metin 3 mm sınırını aşıyor', status: 'fail' },
        { id: 'bleed', label: 'Taşma', detail: 'ok', status: 'pass' },
      ],
    }
    const findings = critiqueDesign({ plan, critique, preflight })
    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'hierarchy',
          target: 'brand_lockup',
          severity: 'error',
          suggestedDirection: 'clear_window',
          evidence: expect.objectContaining({ source: 'critiquePlan', topic: 'lockupClearance' }),
        }),
        expect.objectContaining({ category: 'density', target: 'front_panel', severity: 'warn' }),
        expect.objectContaining({
          category: 'technical',
          target: 'safe-zone',
          severity: 'error',
          evidence: expect.objectContaining({ source: 'preflight' }),
        }),
      ]),
    )
    expect(findings.some((row) => row.evidence.topic === 'bleed')).toBe(false)
    expect(findings.some((row) => row.evidence.topic === 'hierarchy')).toBe(false)
    expect(worstSeverity(findings)).toBe('error')
    for (const row of findings) {
      expect(row.issue.length).toBeGreaterThan(0)
      expect(row.suggestedDirection.length).toBeGreaterThan(0)
    }
  })

  it('never touches the artwork and speaks to the Brain as StructuredFeedback', () => {
    const engine = new FormaLocalEngine()
    const spec = engine.generate({ brief: serumBrief() })
    const before = JSON.stringify(spec.artwork)
    const findings = critiqueDesign({
      plan: spec.designPlan!,
      critique: { ...spec.critique!, hints: [{ action: 'MODIFY', topic: 'styleLeakage', note: 'sızıntı' }] },
      preflight: spec.preflight,
    })
    expect(JSON.stringify(spec.artwork)).toBe(before)
    const feedback = critiqueAsFeedback(findings)
    expect(feedback.every((row) => row.raw?.startsWith('critic:'))).toBe(true)
    expect(feedback).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'visual_language', target: 'pattern' })]))
    expect(critiqueAsFeedback([{ category: 'motif', target: 'x', severity: 'info', issue: 'i', suggestedDirection: 'd', evidence: { source: 'critiquePlan', topic: 't' } }])).toEqual([])
  })

  it('is attached to the generated spec and the decision log', () => {
    const spec = new FormaLocalEngine().generate({ brief: serumBrief() })
    expect(Array.isArray(spec.designCritique)).toBe(true)
    const log = decisionLogFor(spec.id)
    expect(log?.critiques).toEqual(spec.designCritique)
    expect(log?.model).toBeNull()
    expect(log?.llmUsed).toEqual({ briefExtract: false, feedback: false, critique: false, direction: false })
    expect(log?.knowledgeVersion).toBe(0)
    expect(log?.appliedKnowledge).toEqual([])
  })

  it('maps studio ledger collisions and type-fit without mutating SVG or applying kit lockup hints', () => {
    const spec = new FormaLocalEngine().generate({ brief: serumBrief() })
    const before = JSON.stringify(spec.artwork)
    const findings = critiqueDesign({
      plan: spec.designPlan!,
      critique: { ...spec.critique!, hints: [{ action: 'MODIFY', topic: 'lockupClearance', note: 'kit pencere' }] },
      preflight: {
        ...PASSING_PREFLIGHT,
        items: [
          { id: 'collision', label: 'Çarpışma', detail: 'Studio ledger: brand/product', status: 'fail' },
          { id: 'safe-zone', label: 'Güvenli alan', detail: 'ok değil', status: 'fail' },
        ],
      },
      studioLedger: { collisions: ['front:brand/product'], outOfBounds: ['front:legal'], minTextMm: 0.7 },
    })
    expect(JSON.stringify(spec.artwork)).toBe(before)
    expect(findings.some((row) => row.evidence.topic === 'lockupClearance')).toBe(false)
    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'composition',
          target: 'placement',
          severity: 'error',
          evidence: expect.objectContaining({ source: 'studioLedger', topic: 'collision' }),
        }),
        expect.objectContaining({
          category: 'typography',
          target: 'fit',
          evidence: expect.objectContaining({ source: 'studioLedger', topic: 'text-overflow' }),
        }),
        expect.objectContaining({
          category: 'typography',
          target: 'type_size',
          severity: 'error',
          evidence: expect.objectContaining({ source: 'studioLedger', topic: 'type-fit' }),
        }),
        expect.objectContaining({
          category: 'technical',
          target: 'safe-zone',
          evidence: expect.objectContaining({ source: 'preflight' }),
        }),
      ]),
    )
    expect(findings.some((row) => row.target === 'collision' && row.evidence.source === 'preflight')).toBe(false)
    expect(findings.find((row) => row.evidence.topic === 'collision')?.suggestedDirection).toBe('quieter')
    expect(findings.find((row) => row.evidence.topic === 'type-fit')?.suggestedDirection).toBe('preflight')
    const feedback = critiqueAsFeedback(findings)
    expect(feedback).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'brand_fit', direction: 'strengthen', raw: expect.stringContaining('studioLedger') })]))
    expect(feedback.some((row) => row.direction === 'preflight' || row.direction === 'enlarge')).toBe(false)
  })
})
