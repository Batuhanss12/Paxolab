import { describe, expect, it } from 'vitest'
import type { DesignBrief, DielineModel, Panel } from '../../types'
import { emptyBrief } from '../fields'
import { resolveDesignSystem } from '../designSystem/resolve'
import { composeArtwork } from './composeArtwork'

function mysteryPanel(): Panel {
  return {
    id: 'mystery-extra',
    role: 'body',
    x: 0,
    y: 0,
    w: 40,
    h: 30,
    polygon: [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 30 },
      { x: 0, y: 30 },
    ],
  }
}

function stubDieline(extra: Panel): DielineModel {
  const label: Panel = {
    id: 'label',
    role: 'body',
    kind: 'hero-front',
    x: 50,
    y: 0,
    w: 70,
    h: 90,
    polygon: [
      { x: 50, y: 0 },
      { x: 120, y: 0 },
      { x: 120, y: 90 },
      { x: 50, y: 90 },
    ],
  }
  return {
    structureId: 'flat-label',
    unit: 'mm',
    width: 120,
    height: 90,
    dimensions: { L: 70, W: 0, H: 90 },
    panels: [label, extra],
    cut: [label.polygon],
    crease: [],
    glueIds: [],
    consistent: true,
    issues: [],
  }
}

describe('composeArtwork unknown kind (D7-B)', () => {
  it('does not crash on an unknown panel id without kind', () => {
    const brief: DesignBrief = {
      ...emptyBrief(),
      brandName: 'Aurelia',
      packagingMode: 'label',
      styleType: 'minimal',
    }
    const copy = {
      brand: 'Aurelia',
      product: 'Noir',
      tagline: 'x',
      volume: '50 ml',
      ingredients: 'INCI',
      warnings: 'Uyarı',
      barcode: '2000000000003',
      manufacturer: 'A',
      address: 'B',
      cta: '',
    }
    const art = composeArtwork(
      brief,
      stubDieline(mysteryPanel()),
      copy,
      { bg: '#111', fg: '#eee', accent: '#aaa', muted: '#888', paper: '#000' },
      {
        logoScale: 1,
        titleScale: 1,
        premium: false,
        printReady: false,
        paletteShift: 'default',
        barcodeVisible: true,
        customTagline: '',
      },
      undefined,
      resolveDesignSystem(brief, 'flat-label'),
    )
    const mystery = art.layers.find((l) => l.panelId === 'mystery-extra')
    expect(mystery).toBeTruthy()
    expect(mystery!.markup).toContain('data-art="plain"')
    expect(art.frontPanelId).toBe('label')
  })
})
