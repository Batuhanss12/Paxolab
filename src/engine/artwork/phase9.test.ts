import { beforeEach, describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { resetArtMemory } from '../brain'
import { scoreVisualCraft } from '../brain/DesignScore'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import { claimMotifSvg, type ClaimMotifKind } from './icons'

function brief(patch: Partial<DesignBrief>): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'LUMINA',
    packagingMode: 'box',
    ...patch,
  }
}

function generate(patch: Partial<DesignBrief>, variationIndex = 0) {
  return new FormaLocalEngine().generate({
    brief: brief(patch),
    overridePatch: { variationIndex },
  })
}

function jobSpec(slug: string, variationIndex = 0) {
  const job = JOBS.find((j) => j.slug === slug) as Job
  return new FormaLocalEngine().generate({
    brief: briefFrom(job),
    overridePatch: { variationIndex, heroFamily: job.heroFamily },
  })
}

function face(spec: { artwork: { layers: { panelId: string; markup: string }[] } }) {
  return spec.artwork.layers.find((l) => l.panelId === 'front' || l.panelId === 'label' || l.panelId === 'trayFront')?.markup ?? ''
}

describe('Phase 9 polish craft + claim motifs', () => {
  beforeEach(() => resetArtMemory())

  it('P9-A playful and luxury cosmetics keep a painted pattern or craft ≥77', () => {
    const soft = [
      jobSpec('24-krem-playful-palm', 0),
      jobSpec('25-krem-playful-wave', 0),
      jobSpec('03-krem-tuck-luxury', 2),
      jobSpec('17-evrensel-kozmetik-tuck', 2),
    ]
    for (const spec of soft) {
      const family = spec.designPlan?.patternSystem.family
      const craft = scoreVisualCraft(spec, spec.designPlan!).visualCraft
      const painted = /data-art="pattern"/.test(face(spec))
      expect(family).not.toBe('none')
      expect(painted || craft >= 77).toBe(true)
      expect(craft).toBeGreaterThanOrEqual(77)
      expect(spec.preflight.exportOk).toBe(true)
    }
  })

  it('P9-B wrap step-pill and electronics stripe clear craft 77', () => {
    const wrap = jobSpec('29-sampuan-wrap-modern', 0)
    const wrap2 = jobSpec('29-sampuan-wrap-modern', 2)
    const device = jobSpec('16-cihaz-label-minimal', 2)
    expect(face(wrap)).toContain('data-art="step-pill"')
    expect(scoreVisualCraft(wrap, wrap.designPlan!).visualCraft).toBeGreaterThanOrEqual(77)
    expect(scoreVisualCraft(wrap2, wrap2.designPlan!).visualCraft).toBeGreaterThanOrEqual(77)
    expect(face(device)).toMatch(/data-pattern="(stripe|hexagon|dotgrid)"/)
    expect(scoreVisualCraft(device, device.designPlan!).visualCraft).toBeGreaterThanOrEqual(77)
    expect(wrap.preflight.exportOk).toBe(true)
    expect(device.preflight.exportOk).toBe(true)
  })

  it('P9-C food faces paint vector claim motifs, not unicode disks', () => {
    const honey = jobSpec('11-bal-label-classic', 0)
    const jam = jobSpec('12-recel-label-eco', 0)
    const oil = jobSpec('08-zeytinyagi-tuck-luxury', 0)
    for (const spec of [honey, jam, oil]) {
      const svg = face(spec)
      expect(svg).toContain('data-art="claim-motif"')
      expect(svg).toContain('<circle')
      expect(svg).not.toMatch(/[⛰❋☀✓]/)
      expect(svg).not.toContain('>%100<')
      expect(spec.preflight.items.find((i) => i.id === 'collision')?.status).toBe('pass')
      expect(spec.preflight.exportOk).toBe(true)
    }
    expect(face(honey)).toMatch(/YAYLA|DAĞ ÇİÇEĞİ|SAF DAMLA|ÇİÇEK/)
    expect(face(jam)).toMatch(/BAHÇE|GÜNEŞ|MEYVE/)
    expect(face(oil)).toMatch(/KORU|SIZMA|ERKEN/)
    expect(scoreVisualCraft(honey, honey.designPlan!).visualCraft).toBeGreaterThanOrEqual(81)
  })

  it('P9-C motif kinds stay inside a 12-unit stroke set', () => {
    const kinds: ClaimMotifKind[] = ['leaf', 'bee', 'jar', 'sun', 'mountain', 'drop', 'check']
    for (const kind of kinds) {
      const svg = claimMotifSvg(kind, 10, 10, 4, '#333')
      expect(svg).toContain('data-art="claim-motif"')
      expect(svg).toContain(`data-motif="${kind}"`)
      expect(svg).not.toMatch(/<text/)
    }
  })

  it('P9-D luxury perfume and honey nutrition hold', () => {
    const perfume = generate({
      brandName: 'AURELIA',
      sector: 'parfüm',
      subProduct: 'eau de parfum',
      styleType: 'luxury',
      templateId: 'fm-cos-tuck-perfume',
      volume: '50 ml',
      productName: 'Noir',
    })
    expect(scoreVisualCraft(perfume, perfume.designPlan!).visualCraft).toBeGreaterThanOrEqual(77)
    expect(perfume.preflight.exportOk).toBe(true)
  })
})
