/**
 * The brand chooses, not only the sector and the mood.
 *
 * Phase 0 measured two briefs identical except for who the brand is — a restrained boutique
 * house for corporate buyers, a loud mass label for eighteen-year-olds — sharing an archetype in
 * 107 of 108 sector/mood pairs. This file pins the three things Phase 3 changes and the one thing
 * it must not: a brief that says nothing about itself is ranked exactly as before, which is what
 * keeps the frozen faces frozen (the golden diff proves the faces; this proves the term).
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { runConversation } from '../conversation'
import { emptyBrief } from '../fields'
import { explainStudioDirection, inspectStudioDirection, inspectStudioDirectionOffer } from './directionTalk'
import { directionFingerprint, fingerprintDistance } from './fingerprint'
import { STUDIO_GALLERY_JOBS } from './studioGalleryJobs'

function jobBrief(slug: string, patch: Partial<DesignBrief> = {}): DesignBrief {
  const job = STUDIO_GALLERY_JOBS.find((j) => j.slug === slug)!
  return {
    ...emptyBrief(),
    brandName: job.brand,
    productName: job.product,
    sector: job.sector,
    subProduct: job.subProduct,
    packagingMode: job.packagingMode,
    templateId: job.templateId,
    styleType: job.styleType,
    colors: job.colors,
    volume: job.volume,
    dimensionsMm: job.dimensionsMm,
    barcode: '8690000000017',
    ...patch,
  }
}

const QUIET: Partial<DesignBrief> = { brandName: 'Meridian', productName: 'Aurum', audience: 'kurumsal yöneticiler, 40+', feeling: 'sakin, zarif, dingin', priceTier: 'boutique', channel: 'butik mağaza' }
const LOUD: Partial<DesignBrief> = { brandName: 'Zapp', productName: 'Vivid', audience: '18-25 gençler', feeling: 'gösterişli, enerjik, cesur', priceTier: 'mass', channel: 'online' }

function perfumeLabel(patch: Partial<DesignBrief> = {}): DesignBrief {
  return { ...emptyBrief(), sector: 'parfüm', subProduct: 'eau de parfum', packagingMode: 'label', templateId: 'fm-cos-label-bottle', styleType: 'luxury', volume: '50 ml', barcode: '8690000000017', dimensionsMm: { L: 90, W: 0, H: 70 }, ...patch }
}

const SECTORS: { sector: string; subProduct: string }[] = [
  { sector: 'serum', subProduct: 'serum' },
  { sector: 'krem', subProduct: 'yüz kremi' },
  { sector: 'sağlık', subProduct: 'vitamin' },
  { sector: 'içecek', subProduct: 'kombucha' },
  { sector: 'gıda', subProduct: 'bal' },
  { sector: 'bebek', subProduct: 'bebek şampuanı' },
]

function sectorLabel(s: { sector: string; subProduct: string }, patch: Partial<DesignBrief>): DesignBrief {
  return { ...emptyBrief(), sector: s.sector, subProduct: s.subProduct, packagingMode: 'label', templateId: 'fm-cos-label-bottle', styleType: 'modern', volume: '100 ml', barcode: '8690000000017', dimensionsMm: { L: 90, W: 0, H: 70 }, ...patch }
}

describe('a brief that says nothing about itself is ranked as before', () => {
  it('every golden brief scores zero on the personality term, on every archetype', () => {
    for (const job of STUDIO_GALLERY_JOBS) {
      const decision = inspectStudioDirection(jobBrief(job.slug))
      for (const row of decision.scores) expect(row.parts.personalityFit, `${job.slug} ${row.id}`).toBe(0)
      expect(decision.direction.reasons.find((r) => r.axis === 'archetype')?.because).not.toMatch(/kişilik/)
    }
  })
})

describe('two brands, one sector, one mood', () => {
  it('a restrained boutique house and a loud mass label do not get the same design', () => {
    /*
     * Not "the same skeleton": a loud perfume brand may well keep the perfume language, because
     * the sector prior is strong and that is the right call. What it must not get is the same
     * arrangement, pairing and ornament as the boutique house — measured on 108 pairs, the two
     * brands share all five design axes in none of them.
     */
    const quiet = directionFingerprint(inspectStudioDirection(perfumeLabel(QUIET)).direction)
    const loud = directionFingerprint(inspectStudioDirection(perfumeLabel(LOUD)).direction)
    expect(fingerprintDistance(quiet, loud, ['archetype', 'lockup', 'typePairing', 'ornament', 'frame'])).toBeGreaterThanOrEqual(2)
  })

  it('and where the sector does not pin, the personality moves the skeleton itself', () => {
    // Measured (Phase 3 probe, 7 sectors × 6 moods × 2 surfaces): 47 of 84 pairs change archetype.
    // One exact pair, then the share, so a regression in either the lexicon or the weight shows.
    const quiet = inspectStudioDirection(sectorLabel({ sector: 'serum', subProduct: 'serum' }, { ...QUIET, styleType: 'classic' })).direction
    const loud = inspectStudioDirection(sectorLabel({ sector: 'serum', subProduct: 'serum' }, { ...LOUD, styleType: 'classic' })).direction
    expect(quiet.archetype).toBe('ink-panel')
    expect(loud.archetype).toBe('diagonal-split')
    let pairs = 0
    let flipped = 0
    for (const s of SECTORS) {
      for (const mood of ['luxury', 'classic', 'minimal', 'modern', 'eco', 'playful'] as const) {
        pairs += 1
        const a = inspectStudioDirection(sectorLabel(s, { ...QUIET, styleType: mood })).direction.archetype
        const b = inspectStudioDirection(sectorLabel(s, { ...LOUD, styleType: mood })).direction.archetype
        if (a !== b) flipped += 1
      }
    }
    expect(flipped / pairs, `arketip değişen ${flipped}/${pairs}`).toBeGreaterThanOrEqual(0.3)
  })

  it('the same brand asked twice gets the same answer', () => {
    const a = inspectStudioDirection(perfumeLabel(QUIET)).direction
    const b = inspectStudioDirection(perfumeLabel(QUIET)).direction
    expect(b.archetype).toBe(a.archetype)
    expect(b.lockup).toBe(a.lockup)
    expect(b.typePairing).toBe(a.typePairing)
  })

  it('the personality chooses the pairing and the arrangement from what the archetype allows', () => {
    // Pin the family so only the axes move: a loud, contemporary brand on marble goes rotated;
    // a restrained heritage one stays stacked and takes the tracked serif pairing.
    const loud = inspectStudioDirection(jobBrief('05-kahve-etiket', { ...LOUD, feeling: 'gösterişli, enerjik, çağdaş', studioFamily: 'marble', studioFamilyLocked: true })).direction
    expect(loud.archetype).toBe('marble-frame')
    expect(loud.lockup).toBe('rotated-brand')
    const quiet = inspectStudioDirection(jobBrief('05-kahve-etiket', { ...QUIET, feeling: 'sakin, zarif, köklü', studioFamily: 'marble', studioFamilyLocked: true })).direction
    expect(quiet.lockup).toBe('stacked-center')
    expect(quiet.typePairing).toBe('spaced-serif/spaced-sans')
  })

  it('and says so, in the customer’s own words — only where the personality actually decided', () => {
    // Where the personality wins the archetype the claim is real, and the "why" quotes the field
    // it came from, in plain Turkish (measured: the classic serum label, both brands).
    const decided = explainStudioDirection(sectorLabel({ sector: 'serum', subProduct: 'serum' }, { ...LOUD, styleType: 'classic' }))
    expect(decided.claims.some((c) => c.key === 'personality'), 'kişilik iddiası yok').toBe(true)
    expect(decided.text).toMatch(/hedef kitlen|istediğin his|satış kanalın|fiyat katmanın/)
    expect(decided.text).not.toMatch(/arketip|personality|restraint/)
    expect(decided.decision.direction.reasons.find((r) => r.axis === 'archetype')?.because).toMatch(/kişilik/)

    // On a luxury perfume the sector prior keeps the perfume language for the loud brand too. The
    // archetype reason must not say "kişilik" there — that would be a false reason — while the
    // axes the personality did decide say so honestly.
    const perfume = inspectStudioDirection(perfumeLabel(LOUD)).direction
    expect(perfume.reasons.map((r) => r.axis)).toEqual(['archetype', 'typePairing', 'lockup', 'ornament', 'temperament'])
    const archetypeWhy = perfume.reasons.find((r) => r.axis === 'archetype')!.because
    const decidedByPersonality = explainStudioDirection(perfumeLabel(LOUD)).claims.some((c) => c.key === 'personality')
    if (!decidedByPersonality) expect(archetypeWhy).not.toMatch(/kişilik/)
    expect(perfume.reasons.find((r) => r.axis === 'lockup')?.because).toMatch(/kişilik|seçilen kart/)
  })
})

describe('the strip and the pick', () => {
  it('cards differ in ornament as well as arrangement', () => {
    const offer = inspectStudioDirection(jobBrief('05-kahve-etiket')).offer
    const ornaments = new Set(offer.candidates.filter((c) => !c.selected).map((c) => c.direction.ornament))
    expect(ornaments.size).toBeGreaterThanOrEqual(2)
    // The painted card keeps the level the brief decided.
    const selected = offer.candidates.find((c) => c.selected)!
    expect(selected.direction.ornament).toBe(inspectStudioDirection(jobBrief('05-kahve-etiket')).direction.ornament)
  })

  it('a chat pick carries the card’s ornament and pairing, and the next generation honours them', () => {
    const brief = jobBrief('05-kahve-etiket')
    const offer = inspectStudioDirectionOffer(brief)
    const card = offer.candidates.find((c) => !c.selected && c.fingerprint?.ornament !== offer.candidates.find((s) => s.selected)?.fingerprint?.ornament)
    expect(card).toBeDefined()
    const result = runConversation({ text: String(card!.index), attachments: [], brief, awaiting: null, hasDesign: true, directionOffer: offer })
    expect(result.brief.studioPick?.ornament).toBe(card!.fingerprint?.ornament)
    expect(result.brief.studioPick?.lockup).toBe(card!.fingerprint?.lockup)
    const next = inspectStudioDirection(result.brief).direction
    expect(next.archetype).toBe(card!.archetype)
    expect(next.ornament).toBe(card!.fingerprint?.ornament)
    expect(next.lockup).toBe(card!.fingerprint?.lockup)
  })
})
