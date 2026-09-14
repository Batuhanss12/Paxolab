import { beforeEach, describe, expect, it } from 'vitest'
import { resetArtMemory } from '../brain'
import { remapBannedHero } from '../brain/DesignPlan'
import { allowedHeroes } from '../brain/artDirectionAllowed'
import { scoreVisualCraft } from '../brain/DesignScore'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import { paintHeroGraphic } from './heroes'

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

describe('Phase 10b ban empty seal', () => {
  beforeEach(() => resetArtMemory())

  it('remaps seal to sector fallbacks and strips it from allowlists', () => {
    expect(remapBannedHero('seal', 'perfume')).toBe('crest')
    expect(remapBannedHero('seal', 'food')).toBe('harvest')
    expect(remapBannedHero('seal', 'cream')).toBe('oval')
    expect(allowedHeroes('classic', 'perfume')).not.toContain('seal')
    expect(allowedHeroes('luxury', 'perfume')).toContain('crest')
    expect(allowedHeroes('classic', 'food')).toEqual(['harvest', 'botanical'])
  })

  it('P10b-A leftover seal family paints a crest, not an octagon', () => {
    const panel = { id: 'front', x: 0, y: 0, w: 70, h: 140, role: 'body' as const, polygon: [] }
    const p = { bg: '#111', fg: '#eee', accent: '#c9a24e', muted: '#888', paper: '#f4efe4' }
    const svg = paintHeroGraphic('seal', panel, p)
    expect(svg).toMatch(/C[\d.-]+ [\d.-]+/)
    expect(svg).not.toMatch(/<polygon/)
  })

  it('P10b fixtures never ship data-hero=seal', () => {
    const perfume = jobSpec('01-parfum-tuck-luxury', 0)
    const cologne = jobSpec('02-kolonya-tuck-classic', 0)
    const honey = jobSpec('11-bal-label-classic', 0)
    expect(perfume.designPlan?.heroGraphic.family).toBe('crest')
    expect(face(perfume)).toContain('data-hero="crest"')
    expect(face(perfume)).toContain('data-art="gold-bar"')
    expect(face(cologne)).toContain('data-hero="crest"')
    expect(honey.designPlan?.heroGraphic.family).toBe('harvest')
    expect(face(honey)).not.toContain('data-hero="seal"')
    for (const spec of [perfume, cologne, honey]) {
      expect(spec.designPlan?.heroGraphic.family).not.toBe('seal')
      expect(face(spec)).not.toContain('data-hero="seal"')
      expect(face(spec)).not.toMatch(/<polygon[^>]+points="[^"]*(?:,[^"]*){14,}/)
      expect(spec.preflight.exportOk).toBe(true)
      expect(scoreVisualCraft(spec, spec.designPlan!).visualCraft).toBeGreaterThanOrEqual(77)
    }
  })
})
