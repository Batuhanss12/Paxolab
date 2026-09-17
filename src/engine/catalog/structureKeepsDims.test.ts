/**
 * L1 — picking a structure must not throw away the size the user gave.
 *
 * Found in the 2026-09-17 launch walkthrough: the brief said 70×70×180, the user picked
 * "1. yapı", and the box came out 80×50×180 (the catalog default). The nets are parametric,
 * so there is no reason to overwrite a real measurement.
 */
import { describe, expect, it } from 'vitest'
import { runConversation } from '../conversation'
import { emptyBrief } from '../fields'
import type { DesignBrief } from '../../types'

function pickStructure(brief: DesignBrief, utterance = '1. yapı') {
  return runConversation({ text: utterance, attachments: [], brief, awaiting: 'templateId', hasDesign: false })
}

const spoken: DesignBrief = {
  ...emptyBrief(),
  brandName: 'Nexora',
  sector: 'gıda',
  subProduct: 'zeytinyağı',
  packagingMode: 'box',
  dimensionsMm: { L: 70, W: 70, H: 180 },
  dimsDefaulted: false,
}

describe('L1 — the structure choice keeps the user size', () => {
  it('keeps a size the user actually stated', () => {
    const out = pickStructure(spoken)
    expect(out.brief.dimensionsMm).toEqual({ L: 70, W: 70, H: 180 })
    expect(out.brief.dimsDefaulted).toBe(false)
  })

  it('says whose size it is', () => {
    expect(pickStructure(spoken).replies.join(' ')).toMatch(/senin ölçünle/i)
  })

  it('still falls back to the catalog default when the user gave nothing', () => {
    const blank = { ...emptyBrief(), brandName: 'Nexora', sector: 'gıda', packagingMode: 'box' as const }
    const out = pickStructure(blank)
    expect(out.brief.dimensionsMm.L).toBeGreaterThan(0)
    expect(out.brief.dimensionsMm.H).toBeGreaterThan(0)
    expect(out.brief.dimsDefaulted).toBe(true)
    expect(out.replies.join(' ')).toMatch(/şablon ölçüsü/i)
  })

  it('a defaulted size is not treated as the user’s', () => {
    const defaulted = { ...spoken, dimsDefaulted: true }
    const out = pickStructure(defaulted)
    expect(out.brief.dimsDefaulted).toBe(true)
  })

  it('the kept size survives into the generated design', () => {
    const picked = pickStructure(spoken)
    expect(picked.brief.dimensionsMm).toEqual({ L: 70, W: 70, H: 180 })
  })
})
