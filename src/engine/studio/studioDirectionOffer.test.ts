import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { runConversation } from '../conversation'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { parseOfferChoice } from '../catalog/structureRecommend'
import { parseDirectionChoice } from './directionOffer'
import { STUDIO_FACE_GOLDEN, generateStudioFace, hashStudioFace } from './studioGolden'
import { STUDIO_GALLERY_JOBS } from './studioGalleryJobs'

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

describe('D3 direction offer — ranked DesignDirection, user picks', () => {
  it('parses “2. yön” and ignores structure-offer phrasing', () => {
    expect(parseDirectionChoice('2. yön', 3)).toBe(2)
    expect(parseDirectionChoice('2. yönü seç', 3)).toBe(2)
    expect(parseDirectionChoice('ikinci yön', 3)).toBe(2)
    expect(parseDirectionChoice('3. arketip', 3)).toBe(3)
    expect(parseDirectionChoice('2. yapı', 3)).toBeNull()
    expect(parseOfferChoice('2. yön', 3)).toBeNull()
  })

  it('lists 2–3 real directions from the same brief; selected is the painted winner', () => {
    const spec = generate(coffee())
    const offer = spec.studio?.offer
    expect(offer?.candidates.length).toBeGreaterThanOrEqual(2)
    expect(offer?.candidates.length).toBeLessThanOrEqual(3)
    const selected = offer?.candidates.filter((row) => row.selected)
    expect(selected).toHaveLength(1)
    expect(selected?.[0]?.archetype).toBe(spec.studio?.direction.archetype)
    expect(new Set(offer?.candidates.map((row) => row.archetype)).size).toBe(offer?.candidates.length)
  })

  it('paints those candidates with the same studio painter and hashes diverge', () => {
    const spec = generate(coffee())
    const offer = spec.studio!.offer!
    expect(spec.artwork.layers.filter((row) => row.panelId === spec.artwork.frontPanelId)).toHaveLength(1)
    const hashes = offer.candidates.map((row) => faceHash(generate(coffee({ studioFamily: row.family }))))
    expect(new Set(hashes).size).toBe(hashes.length)
    expect(hashes[offer.selectedIndex - 1]).toBe(faceHash(spec))
  })

  it('keeps the variationIndex 0 coffee golden hash', () => {
    const job = STUDIO_GALLERY_JOBS.find((row) => row.slug === '05-kahve-kutu')!
    const face = generateStudioFace(job)
    expect(face.hash).toBe(STUDIO_FACE_GOLDEN['05-kahve-kutu']!.hash)
    expect(face.archetype).toBe('marble-frame')
  })

  it('lets the user pick a runner; critic does not choose', () => {
    const start = generate(coffee())
    const runner = start.studio!.offer!.candidates.find((row) => !row.selected)
    expect(runner).toBeTruthy()
    const turn = runConversation({
      text: `${runner!.index}. yön`,
      attachments: [],
      brief: start.brief,
      awaiting: null,
      hasDesign: true,
      directionOffer: start.studio?.offer,
      studioCritic: start.studio?.critic,
    })
    expect(turn.note).toBe('direction-pick')
    expect(turn.shouldGenerate).toBe(true)
    expect(turn.brief.studioFamily).toBe(runner!.family)
    expect(turn.replies).toHaveLength(1)
    expect(turn.replies[0]).toMatch(/yön/)
    expect(turn.directionOffer?.candidates.find((row) => row.selected)?.family).toBe(runner!.family)
    const next = generate(turn.brief, turn.overridePatch)
    expect(next.studio?.direction.archetype).toBe(runner!.archetype)
    expect(faceHash(next)).not.toBe(faceHash(start))
    expect(start.studio?.offer?.candidates.find((row) => row.selected)?.archetype).toBe(start.studio?.direction.archetype)
    expect((start.studio?.critic ?? []).every((row) => row.kind === 'quieter' || row.kind === 'vary')).toBe(true)
  })

  it('does not regenerate when the selected face is picked again', () => {
    const start = generate(coffee())
    const selected = start.studio!.offer!.candidates.find((row) => row.selected)!
    const turn = runConversation({
      text: `${selected.index}. yönü seç`,
      attachments: [],
      brief: start.brief,
      awaiting: null,
      hasDesign: true,
      directionOffer: start.studio?.offer,
    })
    expect(turn.shouldGenerate).toBe(false)
    expect(turn.note).toBe('direction-same')
  })
})
