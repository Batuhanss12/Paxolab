import { beforeEach, describe, expect, it } from 'vitest'
import { resetArtMemory } from '../brain'
import { claimMotifSvg, type ClaimMotifKind } from './icons'

describe('Phase 9 polish craft + claim motifs', () => {
  beforeEach(() => resetArtMemory())

  it('P9-C motif kinds stay inside a 12-unit stroke set', () => {
    const kinds: ClaimMotifKind[] = ['leaf', 'bee', 'jar', 'sun', 'mountain', 'drop', 'check']
    for (const kind of kinds) {
      const svg = claimMotifSvg(kind, 10, 10, 4, '#333')
      expect(svg).toContain('data-art="claim-motif"')
      expect(svg).toContain(`data-motif="${kind}"`)
      expect(svg).not.toMatch(/<text/)
    }
  })

})
