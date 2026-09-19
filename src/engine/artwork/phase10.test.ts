import { beforeEach, describe, expect, it } from 'vitest'
import { resetArtMemory } from '../brain'
import { paintBgKit } from './bgKits'

describe('Phase 10 SVG background kits', () => {
  beforeEach(() => resetArtMemory())

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
