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

function chatOffer(text: string) {
  let t = runConversation({ text, attachments: [], brief: emptyBrief(), awaiting: null, hasDesign: false })
  if (t.awaiting === 'productName') {
    t = runConversation({ text: 'Noir', attachments: [], brief: t.brief, awaiting: t.awaiting, hasDesign: false })
  }
  if (t.awaiting === 'barcode') {
    t = runConversation({ text: 'örnek', attachments: [], brief: t.brief, awaiting: t.awaiting, hasDesign: false })
  }
  return t
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

    const tallGen = chatOffer('Luma parfüm kutusu 70x35x140 siyah altın')
    const wideGen = chatOffer('Luma parfüm kutusu 180x120x60 siyah altın')
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
    const chat = chatOffer('Luma parfüm kutusu 70x35x140 siyah altın')
    expect(chat.replies.join(' ')).toMatch(/140/)
    // C1 turned this turn into a structure *offer* (numbered, user picks a card); the single
    // "Yapı: X" sentence now belongs to the generate turn. The contract here is that the offer
    // names real structures instead of a generic slogan.
    expect(chat.replies.join(' ')).toMatch(/tuck|sleeve|mailer|tepsi|kılıf/i)
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
    // This used to assert the opposite: that physical closeness outweighed product fit. It no
    // longer should. `physicalFit` compares the brief to a template's *catalogue default*, and the
    // net is parametric — the box is built at the size the customer gave either way, so that
    // closeness does not constrain the output. It cost the dedicated cream carton first place on a
    // cream brief by 0.003. It stays in the mix as a scale tie-breaker, below the category.
    expect(DEFAULT_STRUCTURE_WEIGHTS.product).toBeGreaterThan(DEFAULT_STRUCTURE_WEIGHTS.physical)
    expect(DEFAULT_STRUCTURE_WEIGHTS.physical, 'scale still has to count for something').toBeGreaterThan(0)
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
    const first = chatOffer('Luma parfüm kutusu 70x35x140 siyah altın')
    const secondId = first.structureOffer?.candidates[1]?.templateId
    expect(secondId).toBeTruthy()
    expect(parseOfferChoice('2. yapıyı seçiyorum', first.structureOffer!.candidates.length)).toBe(2)
    const picked = runConversation({
      text: '2. yapıyı seçiyorum',
      attachments: [],
      brief: first.brief,
      awaiting: 'templateId',
      hasDesign: false,
    })
    expect(picked.shouldGenerate).toBe(false)
    expect(picked.brief.templateId).toBe(secondId)
    const started = runConversation({
      text: 'başlat',
      attachments: [],
      brief: picked.brief,
      awaiting: 'templateId',
      hasDesign: false,
    })
    expect(started.shouldGenerate).toBe(true)
    expect(started.brief.templateId).toBe(secondId)
    const spec = new FormaLocalEngine().generate({ brief: started.brief, overridePatch: { studio: true } })
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
    const turned = chatOffer('Luma parfüm kutusu 70x35x140 siyah altın')
    expect(turned.shouldGenerate).toBe(false)
    expect(turned.awaiting).toBe('templateId')
    expect(turned.structureOffer?.candidates.length).toBeGreaterThan(1)
    expect(turned.showTemplates).toBe(true)
    const pick = runConversation({
      text: '2. yapıyı seçiyorum',
      attachments: [],
      brief: turned.brief,
      awaiting: 'templateId',
      hasDesign: false,
    })
    const started = runConversation({
      text: 'başlat',
      attachments: [],
      brief: pick.brief,
      awaiting: 'templateId',
      hasDesign: false,
    })
    expect(started.shouldGenerate).toBe(true)
    const spec = new FormaLocalEngine().generate({ brief: started.brief, overridePatch: { studio: true } })
    expect(spec.brief.templateId).toBe(started.brief.templateId)
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

  it('uses the food tuck representative and drops perfume-only families for gıda', () => {
    const rec = recommendStructures({
      ...emptyBrief(),
      sector: 'gıda',
      subProduct: 'yağ',
      packagingMode: 'box',
      dimensionsMm: { L: 80, W: 50, H: 180 },
    })
    expect(rec.selectedTemplateId).toBe('fm-food-tuck-oil')
    expect(rec.candidates.some((row) => row.structureId === 'mailer-box')).toBe(false)
    expect(rec.candidates.some((row) => row.structureId === 'sleeve')).toBe(false)
    const tuck = rec.all.find((row) => row.structureId === 'tuck-end-box')
    expect(tuck?.templateId).toBe('fm-food-tuck-oil')
  })

  it('keeps perfume candidates inside the cosmetics sector set', () => {
    const rec = recommendStructures(perfume({ L: 70, W: 35, H: 140 }))
    expect(rec.candidates.some((row) => row.structureId === 'mailer-box')).toBe(false)
    expect(rec.candidates.some((row) => row.structureId === 'simple-tray')).toBe(false)
    expect(rec.candidates[0]?.structureId).toBe('tuck-end-box')
  })
})
