import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { runConversation } from '../conversation'
import { emptyBrief } from '../fields'
import { getTemplate } from './catalog'
import {
  DEFAULT_STRUCTURE_WEIGHTS,
  evaluateStructures,
  parseOfferChoice,
  recommendStructures,
} from './structureRecommend'
import { STRUCTURE_IDS } from '../../types'

function perfume(dims: { L: number; W: number; H: number }, extra: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Luma',
    sector: 'parfüm',
    subProduct: 'edp',
    packagingMode: 'box',
    styleType: 'luxury',
    colors: 'siyah · altın',
    dimensionsMm: dims,
    ...extra,
  }
}

function ids(rows: { structureId: string }[]): string[] {
  return rows.map((r) => r.structureId)
}

describe('C5 structure recommendation', () => {
  it('TEST 1 — tall/narrow vs wide/low changes ranking and selected family', () => {
    const tall = recommendStructures(perfume({ L: 70, W: 35, H: 140 }))
    const wide = recommendStructures(perfume({ L: 180, W: 120, H: 60 }))
    expect(tall.hasPhysics).toBe(true)
    expect(wide.hasPhysics).toBe(true)
    expect(tall.candidates[0]?.structureId).toBe('tuck-end-box')
    expect(wide.candidates[0]?.structureId).not.toBe(tall.candidates[0]?.structureId)
    expect(ids(wide.candidates)).not.toEqual(ids(tall.candidates))
    expect(wide.selectedTemplateId).not.toBe(tall.selectedTemplateId)

    const tallGen = runConversation({
      text: 'Luma parfüm kutusu 70x35x140 siyah altın',
      attachments: [],
      brief: emptyBrief(),
      awaiting: null,
      hasDesign: false,
    })
    const wideGen = runConversation({
      text: 'Luma parfüm kutusu 180x120x60 siyah altın',
      attachments: [],
      brief: emptyBrief(),
      awaiting: null,
      hasDesign: false,
    })
    expect(tallGen.shouldGenerate).toBe(false)
    expect(wideGen.shouldGenerate).toBe(false)
    expect(tallGen.showTemplates).toBe(true)
    expect(wideGen.showTemplates).toBe(true)
    expect(tallGen.structureOffer?.candidates[0]?.structureId).toBe('tuck-end-box')
    expect(wideGen.structureOffer?.candidates[0]?.structureId).not.toBe('tuck-end-box')
  })

  it('TEST 2 — top candidates are distinct live catalog families', () => {
    const rec = recommendStructures(perfume({ L: 70, W: 35, H: 140 }))
    expect(rec.candidates.length).toBeGreaterThan(1)
    expect(rec.candidates.length).toBeLessThanOrEqual(3)
    const structs = ids(rec.candidates)
    expect(new Set(structs).size).toBe(structs.length)
    for (const row of rec.candidates) {
      expect(STRUCTURE_IDS).toContain(row.structureId)
      expect(getTemplate(row.templateId)?.structureId).toBe(row.structureId)
      expect(row.eligible).toBe(true)
    }
    const labels = recommendStructures({
      ...emptyBrief(),
      packagingMode: 'label',
      sector: 'parfüm',
      dimensionsMm: { L: 90, W: 0, H: 70 },
    })
    expect(labels.candidates.length).toBe(2)
    expect(labels.candidates.every((row) => row.structureId === 'wrap-label' || row.structureId === 'flat-label')).toBe(true)
  })

  it('TEST 3 — reasons cite real L×W×H, not a generic slogan', () => {
    const rec = recommendStructures(perfume({ L: 70, W: 35, H: 140 }))
    for (const row of rec.candidates) {
      expect(row.reason).toMatch(/70|140|35|mm/)
      expect(row.reason).not.toMatch(/bu yapı ürününüz için uygundur/i)
    }
    const chat = runConversation({
      text: 'Luma parfüm kutusu 70x35x140 siyah altın',
      attachments: [],
      brief: emptyBrief(),
      awaiting: null,
      hasDesign: false,
    })
    expect(chat.replies.join(' ')).toMatch(/140/)
    expect(chat.replies.join(' ')).toMatch(/Yapı:/)
  })

  it('TEST 4 — ranking follows physical / product weights', () => {
    const brief = perfume({ L: 180, W: 120, H: 60 })
    const scored = evaluateStructures(brief)
    const mailer = scored.find((row) => row.structureId === 'mailer-box')
    const sleeve = scored.find((row) => row.structureId === 'sleeve')
    const tuck = scored.find((row) => row.structureId === 'tuck-end-box')
    expect(mailer && sleeve && tuck).toBeTruthy()
    expect(mailer!.physicalFit).toBeGreaterThan(sleeve!.physicalFit)
    expect(mailer!.score).toBeGreaterThan(sleeve!.score)

    const physical = recommendStructures(brief, { physical: 1, aspect: 0, product: 0 })
    const product = recommendStructures(brief, { physical: 0, aspect: 0, product: 1 })
    expect(physical.candidates[0]?.structureId).not.toBe('tuck-end-box')
    expect(product.candidates[0]?.structureId).toBe('tuck-end-box')
    expect(physical.candidates.map((r) => r.structureId)).not.toEqual(product.candidates.map((r) => r.structureId))
    expect(DEFAULT_STRUCTURE_WEIGHTS.physical).toBeGreaterThan(DEFAULT_STRUCTURE_WEIGHTS.product)
  })

  it('TEST 5 — opposite-surface structures stay gated even with high product fit', () => {
    const box = evaluateStructures(perfume({ L: 70, W: 35, H: 140 }))
    const wrap = box.find((row) => row.structureId === 'wrap-label')
    const flat = box.find((row) => row.structureId === 'flat-label')
    expect(wrap?.eligible).toBe(false)
    expect(flat?.eligible).toBe(false)
    expect(wrap?.score).toBe(-1)
    expect(box.filter((row) => row.eligible).every((row) => !row.structureId.includes('label'))).toBe(true)

    const label = evaluateStructures({
      ...emptyBrief(),
      packagingMode: 'label',
      sector: 'parfüm',
      subProduct: 'edp',
      dimensionsMm: { L: 90, W: 0, H: 70 },
    })
    const tuck = label.find((row) => row.structureId === 'tuck-end-box')
    expect(tuck?.eligible).toBe(false)
    expect(tuck?.score).toBe(-1)
    expect(label.filter((row) => row.eligible).every((row) => row.structureId.endsWith('label'))).toBe(true)
  })

  it('TEST 6 — choosing #2 writes that template into generate', () => {
    const first = runConversation({
      text: 'Luma parfüm kutusu 70x35x140 siyah altın',
      attachments: [],
      brief: emptyBrief(),
      awaiting: null,
      hasDesign: false,
    })
    const secondId = first.structureOffer?.candidates[1]?.templateId
    expect(secondId).toBeTruthy()
    expect(parseOfferChoice('2. yapıyı seçiyorum', first.structureOffer!.candidates.length)).toBe(2)
    const picked = runConversation({
      text: '2. yapıyı seçiyorum',
      attachments: [],
      brief: first.brief,
      awaiting: null,
      hasDesign: true,
    })
    expect(picked.shouldGenerate).toBe(true)
    expect(picked.brief.templateId).toBe(secondId)
    expect(picked.brief.templateId).not.toBe(first.brief.templateId)
    const spec = new FormaLocalEngine().generate({ brief: picked.brief, overridePatch: { studio: true } })
    expect(spec.brief.templateId).toBe(secondId)
    expect(spec.dieline.structureId).toBe(first.structureOffer!.candidates[1]!.structureId)
  })

  it('TEST 7 — colour / story do not retie structure ranking', () => {
    const base = perfume({ L: 70, W: 35, H: 140 })
    const colored = perfume({ L: 70, W: 35, H: 140 }, { colors: 'bej · koyu yeşil', story: 'Gece laboratuvarında doğdu.', copyOverrides: 'Sessiz yoğunluk.' })
    const a = recommendStructures(base)
    const b = recommendStructures(colored)
    expect(ids(a.candidates)).toEqual(ids(b.candidates))
    expect(a.candidates.map((r) => r.score)).toEqual(b.candidates.map((r) => r.score))
    expect(a.selectedTemplateId).toBe(b.selectedTemplateId)
  })

  it('TEST 8 — same brief is deterministic', () => {
    const brief = perfume({ L: 70, W: 35, H: 140 })
    const a = recommendStructures(brief)
    const b = recommendStructures(brief)
    expect(a).toEqual(b)
    const specA = new FormaLocalEngine().generate({ brief: { ...brief, templateId: a.selectedTemplateId }, overridePatch: { studio: true } })
    const specB = new FormaLocalEngine().generate({ brief: { ...brief, templateId: a.selectedTemplateId }, overridePatch: { studio: true } })
    expect(specA.dieline.structureId).toBe(specB.dieline.structureId)
    const hash = (spec: typeof specA) =>
      createHash('sha256').update(spec.artwork.layers.map((l) => l.markup).join('\n')).digest('hex').slice(0, 16)
    expect(hash(specA)).toBe(hash(specB))
  })

  it('TEST 9 — USER → recommend → select → compose → SVG → preflight', () => {
    const turned = runConversation({
      text: 'Luma parfüm kutusu 70x35x140 siyah altın',
      attachments: [],
      brief: emptyBrief(),
      awaiting: null,
      hasDesign: false,
    })
    expect(turned.shouldGenerate).toBe(false)
    expect(turned.awaiting).toBe('templateId')
    expect(turned.structureOffer?.candidates.length).toBeGreaterThan(1)
    expect(turned.showTemplates).toBe(true)
    const pick = runConversation({
      text: '2. yapıyı seçiyorum',
      attachments: [],
      brief: turned.brief,
      awaiting: null,
      hasDesign: true,
    })
    const spec = new FormaLocalEngine().generate({ brief: pick.brief, overridePatch: { studio: true } })
    expect(spec.brief.templateId).toBe(pick.brief.templateId)
    expect(spec.dieline.structureId).toBe(getTemplate(pick.brief.templateId)?.structureId)
    expect(spec.artwork.layers.some((l) => /data-art="studio"/.test(l.markup))).toBe(true)
    expect(spec.preflight.exportOk).toBe(true)
  })

  it('missing dimensions keep the sector fallback and do not crash', () => {
    const rec = recommendStructures({
      ...emptyBrief(),
      brandName: 'Luma',
      sector: 'parfüm',
      subProduct: 'edp',
      packagingMode: 'box',
    })
    expect(rec.hasPhysics).toBe(false)
    expect(rec.candidates.length).toBeGreaterThan(0)
    expect(rec.candidates[0]?.structureId).toBe('tuck-end-box')
  })
})
