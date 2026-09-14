import { beforeEach, describe, expect, it } from 'vitest'
import { resetArtMemory } from '../brain'
import { scoreVisualCraft } from '../brain/DesignScore'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import { paintBgKit } from './bgKits'

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

describe('Phase 10 SVG background kits', () => {
  beforeEach(() => resetArtMemory())

  it('P10-B eco cream paints botanical-field and holds craft ≥77', () => {
    for (const setIdx of [0, 2]) {
      const spec = jobSpec('21-krem-eco-monstera', setIdx)
      const svg = face(spec)
      expect(svg).toContain('data-bg-kit="botanical-field"')
      expect(svg).toContain('data-bg="eco-grain"')
      expect(svg).toContain('data-art="title-card"')
      expect(scoreVisualCraft(spec, spec.designPlan!).visualCraft).toBeGreaterThanOrEqual(77)
      expect(spec.preflight.exportOk).toBe(true)
    }
  })

  it('P10-C food boxes get meadow-wash; honey label stays label-flat', () => {
    const pantry = jobSpec('18-evrensel-gida-tuck', 0)
    const oil = jobSpec('08-zeytinyagi-tuck-luxury', 0)
    const honey = jobSpec('11-bal-label-classic', 0)
    expect(face(pantry)).toContain('data-art="landscape-band"')
    expect(face(pantry)).toContain('data-bg-kit="meadow-wash"')
    expect(face(oil)).toContain('data-bg-kit="meadow-wash"')
    expect(face(honey)).not.toContain('data-bg-kit="meadow-wash"')
    expect(face(honey)).not.toContain('data-art="landscape-band"')
    expect(face(honey)).toContain('data-art="claim-motif"')
    expect(scoreVisualCraft(pantry, pantry.designPlan!).visualCraft).toBeGreaterThanOrEqual(77)
    expect(scoreVisualCraft(oil, oil.designPlan!).visualCraft).toBeGreaterThanOrEqual(77)
    expect(scoreVisualCraft(honey, honey.designPlan!).visualCraft).toBeGreaterThanOrEqual(81)
    expect(pantry.preflight.exportOk).toBe(true)
    expect(honey.preflight.exportOk).toBe(true)
  })

  it('P10-D luxury perfume paints night-topo and keeps crest + gold bar', () => {
    const spec = jobSpec('01-parfum-tuck-luxury', 0)
    const svg = face(spec)
    expect(svg).toContain('data-bg-kit="night-topo"')
    expect(svg).toMatch(/data-hero="crest"|data-art="hero"/)
    expect(svg).toContain('data-art="gold-bar"')
    expect(scoreVisualCraft(spec, spec.designPlan!).visualCraft).toBeGreaterThanOrEqual(77)
    expect(spec.preflight.exportOk).toBe(true)
  })

  it('P10-A kit wrapper marks kinds without text', () => {
    const panel = { id: 'front', x: 0, y: 0, w: 70, h: 140, role: 'body' as const, polygon: [] }
    const p = { bg: '#111', fg: '#eee', accent: '#c9a24e', muted: '#888', paper: '#f4efe4' }
    for (const kit of ['botanical-field', 'meadow-wash', 'night-topo'] as const) {
      const svg = paintBgKit(panel, kit, p, { density: 0 })
      expect(svg).toContain('data-art="bg-kit"')
      expect(svg).toContain(`data-bg-kit="${kit}"`)
      expect(svg).not.toMatch(/<text/)
    }
  })
})
