import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { facePanelId, renderPanelSvg } from '../artwork/renderArtwork'
import { runConversation } from '../conversation'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { familyOf } from './family'
import { labelFaceForField, recomposeCopy } from './recomposeCopy'
import { generateStudioFace } from './studioGolden'
import { STUDIO_GALLERY_JOBS } from './studioGalleryJobs'

function perfumeLabel(extra: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'REBULL NOIR',
    productName: 'Sauvage',
    sector: 'parfüm',
    subProduct: 'eau de parfum',
    packagingMode: 'label',
    templateId: 'fm-cos-label-bottle',
    styleType: 'luxury',
    colors: '#f3ead8 #1a2744',
    volume: '100 ml',
    dimensionsMm: { L: 90, W: 0, H: 140 },
    ...extra,
  }
}

function generate(brief: DesignBrief, overridePatch: Record<string, unknown> = {}) {
  return new FormaLocalEngine().generate({
    brief,
    overridePatch: { studio: true, ...overridePatch },
  })
}

describe('ink perfume label → daha teknik does not stack copy', () => {
  it('pins tech / diagonal-split without monogram×brand or duplicate product', () => {
    const ink = generate(perfumeLabel())
    expect(ink.studio?.direction.archetype).toBe('ink-panel')
    expect(familyOf(ink.studio!.direction.archetype)).toBe('ink')

    const talk = runConversation({
      text: 'etiket tasarımında ink tasarımından daha teknik bir tasarım yap',
      attachments: [],
      brief: ink.brief,
      awaiting: null,
      hasDesign: true,
    })
    expect(talk.shouldGenerate).toBe(true)
    expect(talk.brief.studioFamily).toBe('tech')
    expect(talk.replies).toHaveLength(1)
    expect(talk.replies[0]).not.toMatch(/Yön adayları|critic seçmez|İterasyon:/)

    const painted = generate(talk.brief, talk.overridePatch)
    expect(painted.studio?.direction.archetype).toBe('diagonal-split')
    const hits = (painted.studio?.collisions ?? []).filter((c) =>
      /monogram×brand|brand×monogram|product×product/.test(c),
    )
    expect(hits).toEqual([])
    const front = painted.artwork.layers.find((row) => row.panelId === painted.artwork.frontPanelId)?.markup ?? ''
    const productEdits = front.match(/data-edit="product"/g) ?? []
    expect(productEdits.length).toBe(1)
  })

  it('keeps address / usage / warnings off every studio label front', () => {
    const ink = generate(perfumeLabel())
    const talk = runConversation({
      text: 'etiket tasarımında ink tasarımından daha teknik bir tasarım yap',
      attachments: [],
      brief: ink.brief,
      awaiting: null,
      hasDesign: true,
    })
    const tech = generate(talk.brief, talk.overridePatch)
    const cream = generate({
      ...perfumeLabel(),
      brandName: 'Capelli',
      productName: 'Argan Cream',
      sector: 'kozmetik',
      subProduct: 'krem',
      styleType: 'eco',
      colors: '#e8f0e4 #2f4a38',
    })

    for (const spec of [ink, tech, cream]) {
      const front = spec.artwork.layers.find((row) => row.panelId === spec.artwork.frontPanelId)?.markup ?? ''
      expect(front, spec.studio?.direction.archetype).not.toMatch(/Örnek Mah/)
      expect(front, spec.studio?.direction.archetype).not.toMatch(/data-edit="warnings"/)
      expect(front, spec.studio?.direction.archetype).not.toMatch(/data-edit="ingredients"/)
      expect(front, spec.studio?.direction.archetype).not.toMatch(/data-edit="manufacturer"/)
      expect(front, spec.studio?.direction.archetype).not.toMatch(/data-edit="usage"/)
      expect(front, spec.studio?.direction.archetype).not.toMatch(/>KULLANIM</i)
      expect(front, spec.studio?.direction.archetype).not.toMatch(/>UYARI</i)
    }

    for (const job of STUDIO_GALLERY_JOBS.filter((row) => row.packagingMode === 'label')) {
      const face = generateStudioFace(job)
      expect(face.markup, job.slug).not.toMatch(/Örnek Mah/)
      expect(face.markup, job.slug).not.toMatch(/data-edit="warnings"/)
      expect(face.markup, job.slug).not.toMatch(/data-edit="ingredients"/)
      expect(face.markup, job.slug).not.toMatch(/data-edit="manufacturer"/)
      expect(face.markup, job.slug).not.toMatch(/data-edit="address"/)
      expect(face.markup, job.slug).not.toMatch(/data-edit="usage"/)
      expect(face.markup, job.slug).not.toMatch(/>KULLANIM</i)
      expect(face.markup, job.slug).not.toMatch(/>UYARI</i)
      expect(face.markup, job.slug).toMatch(/data-edit="brand"/)
      expect(face.markup, job.slug).toMatch(/data-edit="product"/)
    }
  })

  it('puts the perfume chip on default ink and exposes back address', () => {
    const painted = generate(perfumeLabel())
    expect(painted.studio?.direction.archetype).toBe('ink-panel')
    const front = painted.artwork.layers.find((row) => row.panelId === painted.artwork.frontPanelId)?.markup ?? ''
    const back = painted.artwork.layers.find((row) => row.panelId === 'labelBack')?.markup ?? ''
    expect(front).toMatch(/data-edit="cta"/)
    expect(front).toMatch(/VAPORISATEUR/)
    expect(front.match(/data-edit="tagline"/g) ?? []).toHaveLength(1)
    expect(back).toMatch(/data-edit="usage"/)
    expect(back).toMatch(/data-edit="address"/)
    expect(back).toMatch(/data-edit="manufacturer"/)
    const next = recomposeCopy(painted, { cta: 'NATURAL SPRAY TEST', address: 'İstiklal Cad. 12' })
    const nextFront = next.artwork.layers.find((row) => row.panelId === next.artwork.frontPanelId)?.markup ?? ''
    const nextBack = next.artwork.layers.find((row) => row.panelId === 'labelBack')?.markup ?? ''
    expect(nextFront).toMatch(/NATURAL SPRAY TEST/)
    expect(nextBack).toMatch(/İstiklal Cad/)
  })

  it('exposes the chip and back usage to the copy canvas', () => {
    const ink = generate(perfumeLabel())
    const talk = runConversation({
      text: 'etiket tasarımında ink tasarımından daha teknik bir tasarım yap',
      attachments: [],
      brief: ink.brief,
      awaiting: null,
      hasDesign: true,
    })
    const painted = generate(talk.brief, talk.overridePatch)
    const front = painted.artwork.layers.find((row) => row.panelId === painted.artwork.frontPanelId)?.markup ?? ''
    const back = painted.artwork.layers.find((row) => row.panelId === 'labelBack')?.markup ?? ''
    expect(front).toMatch(/data-edit="cta"/)
    expect(back).toMatch(/data-edit="usage"/)

    const next = recomposeCopy(painted, { cta: 'NATURAL SPRAY TEST', usage: 'Özel kullanım notu' })
    const nextFront = next.artwork.layers.find((row) => row.panelId === next.artwork.frontPanelId)?.markup ?? ''
    const nextBack = next.artwork.layers.find((row) => row.panelId === 'labelBack')?.markup ?? ''
    expect(nextFront).toMatch(/NATURAL SPRAY TEST/)
    expect(nextBack).toMatch(/Özel kullanım notu/)
  })

  it('keeps a single product on wrap landscape tech and routes Arka to labelBack', () => {
    const ink = generate(perfumeLabel({ dimensionsMm: { L: 90, W: 0, H: 70 } }))
    const talk = runConversation({
      text: 'etiket tasarımında ink tasarımından daha teknik bir tasarım yap',
      attachments: [],
      brief: ink.brief,
      awaiting: null,
      hasDesign: true,
    })
    const painted = generate(talk.brief, talk.overridePatch)
    expect(painted.studio?.direction.archetype).toBe('diagonal-split')
    const front = painted.artwork.layers.find((row) => row.panelId === painted.artwork.frontPanelId)?.markup ?? ''
    expect(front.match(/data-edit="product"/g) ?? []).toHaveLength(1)
    expect(front).toMatch(/data-edit="cta"/)
    expect(front).toMatch(/clipPath/)
    expect(facePanelId(painted.dieline, painted.artwork, 'back')).toBe('labelBack')
    const back = renderPanelSvg(painted.dieline, painted.artwork, 'labelBack', painted.palette)
    expect(back).toMatch(/data-edit="usage"/)
    expect(labelFaceForField('cta')).toBe('front')
    expect(labelFaceForField('usage')).toBe('back')
  })
})
