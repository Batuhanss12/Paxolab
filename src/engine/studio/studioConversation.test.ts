import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { runConversation } from '../conversation'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { explainStudioDirection, inspectStudioDirection, parseDirectionTalk } from './directionTalk'
import { familyOf } from './family'
import { hashStudioFace } from './studioGolden'

function coffee(extra: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Elite Brew',
    productName: 'Mocha',
    sector: 'gıda',
    subProduct: 'kahve',
    packagingMode: 'box',
    templateId: 'coffee-box',
    dimensionsMm: { L: 80, W: 50, H: 180 },
    styleType: 'luxury',
    colors: 'siyah · altın',
    volume: '250 g',
    ...extra,
  }
}

function noxMarble(extra: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Nox',
    productName: 'Pulse',
    sector: 'elektronik',
    subProduct: 'kulaklık',
    packagingMode: 'box',
    templateId: 'fm-box-tuck-universal',
    dimensionsMm: { L: 90, W: 50, H: 160 },
    styleType: 'luxury',
    colors: 'mermer · altın',
    volume: '1 adet',
    ...extra,
  }
}

function generate(brief: DesignBrief, overridePatch: Record<string, unknown> = {}) {
  return new FormaLocalEngine().generate({
    brief,
    overridePatch: { studio: true, ...overridePatch },
  })
}

function faceHash(spec: ReturnType<FormaLocalEngine['generate']>): string {
  const layer = spec.artwork.layers.find((row) => row.panelId === spec.artwork.frontPanelId)?.markup ?? ''
  return hashStudioFace(layer)
}

describe('C6 direction talk parser — phrase families, not one hardcoded line', () => {
  it('classifies why / veto / vary / replace without a single-string switch', () => {
    expect(parseDirectionTalk('Neden bunu seçtin?')?.kind).toBe('why')
    expect(parseDirectionTalk('Neden bu yönü seçtin?')?.kind).toBe('why')
    expect(parseDirectionTalk('Neden?')?.kind).toBe('why')
    expect(parseDirectionTalk('Bu yönü istemiyorum.', 'marble')?.kind).toBe('veto')
    expect(parseDirectionTalk('Marble istemiyorum.')?.vetoFamilies).toEqual(['marble'])
    expect(parseDirectionTalk("I don't want marble")?.vetoFamilies).toEqual(['marble'])
    expect(parseDirectionTalk('Başka bir şey deneyelim.', 'marble')?.vetoFamilies).toContain('marble')
    expect(parseDirectionTalk('Bu iyi ama daha sakin olsun.', 'marble')?.kind).toBe('vary')
    expect(parseDirectionTalk('Marble kalsın ama daha az yoğun olsun.', 'marble')?.kind).toBe('vary')
    expect(parseDirectionTalk('Botanik yönünü seç.')?.kind).toBe('pin')
    expect(parseDirectionTalk('Botanik yönünü seç.')?.pinFamily).toBe('botanical')
    expect(parseDirectionTalk('Vazgeçtim, daha teknik olsun.', 'marble')).toMatchObject({
      kind: 'veto',
      vetoFamilies: ['marble'],
      pinFamily: 'tech',
    })
    expect(parseDirectionTalk('etiket tasarımında ink tasarımından daha teknik bir tasarım yap', 'ink')).toMatchObject({
      kind: 'veto',
      vetoFamilies: ['ink'],
      pinFamily: 'tech',
    })
  })
})

describe('C6 TEST 1 — why is brief-grounded', () => {
  it('explains the current marble direction from real brief signals', () => {
    const brief = { ...noxMarble(), studioFamily: 'marble' as const }
    const why = runConversation({
      text: 'Neden bunu seçtin?',
      attachments: [],
      brief,
      awaiting: null,
      hasDesign: true,
    })
    expect(why.shouldGenerate).toBe(false)
    expect(why.brief.studioFamily).toBe('marble')
    expect(why.replies[0]).toMatch(/marble|mermer/i)
    expect(why.replies[0]).not.toMatch(/modern ve şık/i)
    const explained = explainStudioDirection(brief)
    expect(explained.decision.direction.archetype).toBe('marble-frame')
    expect(explained.claims.length).toBeGreaterThan(0)
    expect(explained.claims.every((c) => c.authority === 'REAL')).toBe(true)
    expect(explained.claims.some((c) => c.key === 'visualOverride' || c.key === 'userPin')).toBe(true)
  })
})

describe('C6 TEST 2 — why is not decorative', () => {
  it('ablating the visual override changes the winner', () => {
    const explained = explainStudioDirection(noxMarble())
    const visual = explained.claims.find((c) => c.key === 'visualOverride')
    expect(visual?.authority).toBe('REAL')
    expect(explained.decision.winnerId).toBe('marble-frame')
    const after = inspectStudioDirection({ ...noxMarble(), colors: '' })
    expect(after.winnerId).not.toBe('marble-frame')
    expect(after.winnerId).toBe('diagonal-tech')
    const marbleAfter = after.scores.find((row) => row.id === 'marble-frame')
    const marbleBefore = explained.decision.scores.find((row) => row.id === 'marble-frame')
    expect(marbleAfter && marbleBefore && marbleAfter.score < marbleBefore.score).toBe(true)
  })
})

describe('C6 TEST 3–4 — veto changes direction state and generate', () => {
  it('excludes marble from the next direction and the painted face', () => {
    const start = generate(coffee({ studioFamily: 'marble' }))
    expect(start.studio?.direction.archetype).toBe('marble-frame')
    const veto = runConversation({
      text: 'Marble istemiyorum.',
      attachments: [],
      brief: start.brief,
      awaiting: null,
      hasDesign: true,
    })
    expect(veto.shouldGenerate).toBe(true)
    expect(veto.note).toBe('veto')
    expect(veto.brief.avoidStudioFamilies).toContain('marble')
    expect(veto.brief.studioFamily).not.toBe('marble')
    const inspected = inspectStudioDirection(veto.brief, veto.overridePatch.direction ? [veto.overridePatch.direction] : [])
    expect(inspected.winnerId).not.toBe('marble-frame')
    const painted = generate(veto.brief, veto.overridePatch)
    expect(painted.studio?.direction.archetype).not.toBe('marble-frame')
    expect(familyOf(painted.studio!.direction.archetype)).not.toBe('marble')
    expect(painted.artwork.layers.some((l) => /data-art="studio"/.test(l.markup))).toBe(true)
  })
})

describe('C6 TEST 5–6 — vary keeps family and changes compose/SVG', () => {
  it('applies a quieter variation without leaving marble', () => {
    const base = generate(coffee({ studioFamily: 'marble' }))
    const vary = runConversation({
      text: 'Bu yön iyi ama daha sakin yap.',
      attachments: [],
      brief: base.brief,
      awaiting: null,
      hasDesign: true,
    })
    expect(vary.shouldGenerate).toBe(true)
    expect(vary.note).toBe('vary')
    expect(vary.brief.studioFamily).toBe('marble')
    expect(vary.brief.directionVariation).toBeGreaterThan(0)
    const painted = generate(vary.brief, vary.overridePatch)
    expect(painted.studio?.direction.archetype).toBe('marble-frame')
    expect(painted.studio?.direction.temperament).toBe('light-luxe')
    expect(painted.studio?.direction.temperament).not.toBe(base.studio?.direction.temperament)
    expect(faceHash(painted)).not.toBe(faceHash(base))
  })
})

describe('C6 TEST 7 — stateful why → veto/vary → generate', () => {
  it('keeps botanical through why, then applies the tech constraint on generate', () => {
    const start = generate(coffee({ studioFamily: 'botanical' }))
    expect(start.brief.studioFamily).toBe('botanical')
    const why = runConversation({
      text: 'Neden?',
      attachments: [],
      brief: start.brief,
      awaiting: null,
      hasDesign: true,
    })
    expect(why.shouldGenerate).toBe(false)
    expect(why.replies[0]).toMatch(/botanical|botanik/i)
    const veto = runConversation({
      text: 'Vazgeçtim, daha teknik olsun.',
      attachments: [],
      brief: why.brief,
      awaiting: null,
      hasDesign: true,
    })
    expect(veto.shouldGenerate).toBe(true)
    expect(veto.brief.avoidStudioFamilies).toContain('botanical')
    expect(veto.brief.studioFamily).toBe('tech')
    const painted = generate(veto.brief, veto.overridePatch)
    expect(painted.studio?.direction.archetype).toBe('diagonal-tech')
    expect(painted.studio?.direction.archetype).not.toBe('botanical-card')
  })
})

describe('C6 TEST 8 — negative control B, direction-independent fields', () => {
  it('barcode and user copy do not rerank the coffee marble direction', () => {
    const a = inspectStudioDirection(coffee())
    const b = inspectStudioDirection({ ...coffee(), barcode: '2001234567893', copyOverrides: 'Geceye özel kavrum' })
    expect(a.winnerId).toBe('marble-frame')
    expect(b.winnerId).toBe('marble-frame')
    expect(a.winnerId).toBe(b.winnerId)
  })
})

describe('C6 TEST 9 — structure isolation', () => {
  it('veto does not change C5 structure, template, or dimensions', () => {
    const before = generate(coffee({ studioFamily: 'marble' }))
    const veto = runConversation({
      text: 'Bu yönü istemiyorum.',
      attachments: [],
      brief: before.brief,
      awaiting: null,
      hasDesign: true,
    })
    const after = generate(veto.brief, veto.overridePatch)
    expect(after.templateId).toBe(before.templateId)
    expect(after.structureId).toBe(before.structureId)
    expect(after.dieline.dimensions).toEqual(before.dieline.dimensions)
    expect(after.studio?.direction.archetype).not.toBe(before.studio?.direction.archetype)
  })
})

describe('C6 TEST 10 — determinism', () => {
  it('same brief + same veto utterance yields the same direction and face hash', () => {
    const brief = coffee({ studioFamily: 'marble' })
    const a = runConversation({ text: 'Marble istemiyorum.', attachments: [], brief, awaiting: null, hasDesign: true })
    const b = runConversation({ text: 'Marble istemiyorum.', attachments: [], brief, awaiting: null, hasDesign: true })
    expect(a.brief.avoidStudioFamilies).toEqual(b.brief.avoidStudioFamilies)
    expect(inspectStudioDirection(a.brief).winnerId).toBe(inspectStudioDirection(b.brief).winnerId)
    const sa = generate(a.brief, a.overridePatch)
    const sb = generate(b.brief, b.overridePatch)
    expect(sa.studio?.direction.archetype).toBe(sb.studio?.direction.archetype)
    expect(faceHash(sa)).toBe(faceHash(sb))
  })
})

describe('C6 TEST 11 — production path', () => {
  it('why → veto → generate → compose → studio SVG → preflight', () => {
    const start = generate(coffee({ studioFamily: 'marble' }))
    const why = runConversation({
      text: 'Neden bu yönü seçtin?',
      attachments: [],
      brief: start.brief,
      awaiting: null,
      hasDesign: true,
    })
    expect(why.note).toBe('why')
    expect(why.shouldGenerate).toBe(false)
    const veto = runConversation({
      text: 'Başka bir şey deneyelim.',
      attachments: [],
      brief: why.brief,
      awaiting: null,
      hasDesign: true,
    })
    expect(veto.shouldGenerate).toBe(true)
    const spec = generate(veto.brief, veto.overridePatch)
    expect(spec.studio?.direction.archetype).not.toBe('marble-frame')
    expect(spec.artwork.layers.some((l) => /data-art="studio"/.test(l.markup))).toBe(true)
    expect(spec.preflight).toBeTruthy()
    expect(spec.preflight.blocking).toBe(false)
    expect(spec.preflight.exportOk).toBe(true)
  })
})
