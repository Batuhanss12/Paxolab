import { beforeEach, describe, expect, it } from 'vitest'
import type { DesignBrief } from '../types'
import { appReducer, createInitialAppState } from '../appState'
import { resetArtMemory } from './brain'
import { buildCombinedSvg, buildExportBundle, buildUserExportFiles } from './production/exportDoc'
import { FormaLocalEngine } from './FormaLocalEngine'
import { emptyBrief } from './fields'
import { artworkFromDocument, validateDesignDocument } from './document'
import { parseIntent } from './iterate/parseIntent'
import { facePanelId, renderPanelSvg } from './artwork/renderArtwork'

function perfumeBrief(patch: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Aurelia',
    productName: 'Noir',
    sector: 'Parfüm',
    subProduct: 'Parfum',
    packagingMode: 'box',
    templateId: 'perfume-box',
    dimensionsMm: { L: 70, W: 35, H: 140 },
    styleType: 'luxury',
    volume: '50 ml',
    ...patch,
  }
}

function frontMarkup(design: { artwork: { layers: { panelId: string; markup: string }[] } }): string {
  const layer = design.artwork.layers.find(
    (l) => l.panelId === 'front' || l.panelId === 'label' || l.panelId === 'trayFront',
  )
  return layer?.markup ?? ''
}

describe('FormaLocalEngine', () => {
  beforeEach(() => resetArtMemory())

  it('produces deterministic design content for the same brief', () => {
    const first = new FormaLocalEngine().generate({ brief: perfumeBrief() })
    resetArtMemory()
    const second = new FormaLocalEngine().generate({ brief: perfumeBrief() })

    expect(second.palette).toEqual(first.palette)
    expect(second.layout).toEqual(first.layout)
    expect(second.copy).toEqual(first.copy)
    expect(second.designPlan).toEqual(first.designPlan)
    expect(second.artwork).toEqual(first.artwork)
  })

  it('varies composition, palette and artwork within the same brief', () => {
    const engine = new FormaLocalEngine()
    const base = engine.generate({ brief: perfumeBrief() })
    const varied = engine.generate({
      brief: perfumeBrief(),
      prev: base,
      overridePatch: { variationIndex: 2 },
    })

    expect(varied.palette).not.toEqual(base.palette)
    expect(varied.designPlan?.composition.lockup).toBe('left')
    expect(varied.artwork).not.toEqual(base.artwork)
  })

  it('keeps a valid sample design exportable', () => {
    const design = new FormaLocalEngine().generate({ brief: perfumeBrief() })

    expect(design.preflight.blocking).toBe(false)
    expect(design.preflight.exportOk).toBe(true)
    expect(validateDesignDocument(design.document).valid).toBe(true)
    expect(artworkFromDocument(design.document)).toEqual(design.artwork)
    expect(buildCombinedSvg(design)).toContain('<svg')
    const bundle = buildExportBundle(design)
    expect(bundle).toBeTruthy()
    const dxf = bundle!.dxf
    expect(dxf).toContain('LWPOLYLINE')
    expect(dxf).toContain('CUT')
    expect(dxf).toContain('CREASE')
    expect(dxf).toContain('TABLE')
    expect(dxf).toContain('LAYER')
    expect(dxf).toMatch(/LWPOLYLINE[\s\S]*?\n70\n1\n/)
    expect(design.dieline.cut.length).toBeGreaterThan(0)
    expect(design.dieline.crease.length).toBeGreaterThan(0)
    expect(bundle!.knife).toContain('id="CUT"')
    expect(bundle!.knife).toContain('data-type="cut"')
    expect(bundle!.knife).toContain('data-type="crease"')
    expect(bundle!.knife).toContain('width="')
    expect(bundle!.knife).toContain('mm')
  })

  it('user ZIP lists knife, PDF, shop.json and OKU with trim honesty', () => {
    const design = new FormaLocalEngine().generate({
      brief: perfumeBrief(),
      overridePatch: { printReady: true },
    })
    const files = buildUserExportFiles(design)
    expect(files).toBeTruthy()
    const names = files!.map((f) => f.name)
    expect(names.some((n) => n.endsWith('-knife.svg'))).toBe(true)
    expect(names.some((n) => n.endsWith('-knife.dxf'))).toBe(true)
    expect(names.some((n) => n.endsWith('-dieline.pdf'))).toBe(true)
    expect(names).toContain('shop.json')
    expect(names).toContain('OKU.txt')
    const pdf = files!.find((f) => f.name.endsWith('.pdf'))!.data as Uint8Array
    expect(String.fromCharCode(...pdf.slice(0, 8))).toBe('%PDF-1.6')
    const oku = files!.find((f) => f.name === 'OKU.txt')!.data as string
    expect(oku).toMatch(/CUT trim/)
    expect(oku).toMatch(/bıçağa işlenmez/)
    expect(oku).toMatch(/KESİM İÇİN KULLANMA/)
    const bleed = design.preflight.items.find((i) => i.id === 'bleed')
    expect(bleed?.detail).toMatch(/kılavuz/)
    expect(bleed?.detail).toMatch(/işlenmez/)
  })

  it('printReady proof draws 3 mm safe + bleed and stays honest (PDF/X-4 sRGB, no trap)', () => {
    const design = new FormaLocalEngine().generate({
      brief: perfumeBrief(),
      overridePatch: { printReady: true },
    })
    const svg = buildCombinedSvg(design)
    expect(svg).toBeTruthy()
    expect(svg!).toContain('data-proof="safe"')
    expect(svg!).toContain('data-proof="bleed"')
    expect(svg!).toContain('PDF/X-4 sRGB')
    expect(svg!).toContain('3 mm')
    expect(svg!).toContain('trap yok')
    expect(svg!).toContain('FOGRA değil')
    expect(svg!).not.toContain('not PDF/X')
    expect(svg!).toContain('data-type="cut"')
    expect(svg!).toContain('data-type="crease"')

    const bleed = design.preflight.items.find((i) => i.id === 'bleed')
    expect(bleed?.detail).toMatch(/3 mm/)
    expect(bleed?.detail).toMatch(/PDF\/X-4 sRGB/)
    expect(bleed?.detail).toMatch(/trap yok/)
    expect(bleed?.detail).not.toMatch(/FOGRA39|GRACoL/)
    expect(bleed?.detail).toMatch(/kılavuz/)
    const proof = design.preflight.items.find((i) => i.id === 'proof')
    expect(proof?.detail).toMatch(/3 mm/)
    expect(proof?.detail).toMatch(/PDF\/X-4 sRGB/)
  })

  it('blocks a country-looking barcode marked as invented', () => {
    const design = new FormaLocalEngine().generate({
      brief: perfumeBrief({ barcode: '8680000000000', barcodeDefaulted: true }),
    })

    expect(design.preflight.exportOk).toBe(false)
    expect(buildCombinedSvg(design)).toBeNull()
  })

  it('refuses combined SVG when exportOk is false even without collisions', () => {
    const design = new FormaLocalEngine().generate({ brief: perfumeBrief() })
    expect(design.preflight.exportOk).toBe(true)
    expect(
      buildCombinedSvg({
        ...design,
        preflight: { ...design.preflight, exportOk: false, blocking: true },
      }),
    ).toBeNull()
  })

  it('studio export SVG replaces Google @import with unicode-range named faces', () => {
    const design = new FormaLocalEngine().generate({
      brief: perfumeBrief(),
      overridePatch: { studio: true, printReady: true },
    })
    expect(design.preflight.exportOk).toBe(true)
    const svg = buildCombinedSvg(design)
    expect(svg).toBeTruthy()
    expect(svg!).toContain('studio-fonts-subset')
    expect(svg!).toContain('unicode-range')
    expect(svg!).toContain('Georgia')
    expect(svg!).not.toContain('@import url')
    expect(svg!).toContain('data-art="studio"')
    const frontId = facePanelId(design.dieline, design.artwork, 'front')
    expect(frontId).toBeTruthy()
    const front = renderPanelSvg(design.dieline, design.artwork, frontId!, design.palette)
    expect(front).toContain('data-art="studio"')
  })

  it('golden compose-wiring: luxury perfume tuck-end front carries pattern art', () => {
    const design = new FormaLocalEngine().generate({ brief: perfumeBrief() })
    const family = design.designPlan?.patternSystem.family ?? 'none'
    const front = frontMarkup(design)

    expect(design.structureId).toBe('tuck-end-box')
    expect(family).not.toBe('none')
    if (family !== 'none') {
      expect(front).toContain('data-art="pattern"')
    }
  })

  it('golden compose-wiring: wrap-label seam path can include wrap-continuity', () => {
    const design = new FormaLocalEngine().generate({
      brief: perfumeBrief({
        packagingMode: 'label',
        templateId: 'fm-cos-label-bottle',
        dimensionsMm: { L: 90, W: 0, H: 70 },
      }),
    })
    const face = frontMarkup(design)

    expect(design.structureId).toBe('wrap-label')
    expect(face).toContain('data-art="seam"')
    expect(face).not.toMatch(/>SEAM</)
    expect(face).toContain('data-art="wrap-continuity"')
  })

  it('golden compose-wiring: sideIntentional luxury sides carry side-pattern, glue/tuck stay clean', () => {
    const design = new FormaLocalEngine().generate({ brief: perfumeBrief() })
    const sides = design.artwork.layers.filter((l) => l.panelId === 'left' || l.panelId === 'right')
    const glue = design.artwork.layers.find((l) => l.panelId === 'glue')?.markup ?? ''
    const tucks = design.artwork.layers.filter((l) => l.panelId.includes('Tuck') || l.panelId.includes('Dust'))

    expect(design.designPlan?.patternSystem.sideIntentional).toBe(true)
    expect(sides.length).toBeGreaterThan(0)
    for (const side of sides) {
      expect(side.markup).toContain('data-art="side-pattern"')
    }
    expect(glue).not.toContain('data-art="side-pattern"')
    expect(glue).toMatch(/GLUE/)
    for (const tuck of tucks) {
      expect(tuck.markup).not.toContain('data-art="side-pattern"')
    }
  })

  it('eco and playful fronts keep Phase 0 backgrounds; eco sides are patterned, playful sides are not', () => {
    const eco = new FormaLocalEngine().generate({ brief: perfumeBrief({ styleType: 'eco' }) })
    resetArtMemory()
    const playful = new FormaLocalEngine().generate({ brief: perfumeBrief({ styleType: 'playful' }) })

    const ecoFront = frontMarkup(eco)
    const playfulFront = frontMarkup(playful)
    const ecoSide = eco.artwork.layers.find((l) => l.panelId === 'left')?.markup ?? ''
    const playfulSide = playful.artwork.layers.find((l) => l.panelId === 'left')?.markup ?? ''

    expect(ecoFront).toContain('data-art="bg"')
    expect(ecoFront).toContain('data-bg="eco-grain"')
    expect(eco.designPlan?.patternSystem.sideIntentional).toBe(true)
    expect(ecoSide).toContain('data-art="side-pattern"')

    expect(playfulFront).toContain('data-art="bg"')
    expect(playfulFront).toContain('data-bg="playful-capsules"')
    expect(playful.designPlan?.patternSystem.sideIntentional).toBe(false)
    expect(playfulSide).not.toContain('data-art="side-pattern"')
  })

  it('parseIntent regenerate increments revision and pushes history', () => {
    const engine = new FormaLocalEngine()
    const first = engine.generate({ brief: perfumeBrief() })
    const intent = parseIntent('logoyu küçült', first.brief.styleType || 'luxury')
    const second = engine.generate({
      brief: { ...first.brief, ...intent.briefPatch },
      prev: first,
      overridePatch: intent.overridePatch,
      copyPatch: intent.copyPatch,
    })

    expect(intent.overridePatch.logoScale).toBe(0.72)
    expect(second.revision).toBe(first.revision + 1)
    expect(second.id).toBe(first.id)

    const base = createInitialAppState()
    const withFirst = { ...base, design: first, brief: first.brief }
    const finished = appReducer(withFirst, {
      type: 'generation.finish',
      design: second,
      printReady: false,
    })

    expect(finished.designHistory).toHaveLength(1)
    expect(finished.designHistory[0].revision).toBe(first.revision)
    expect(finished.design?.revision).toBe(second.revision)
  })

  it('maps A60 side-left/right and tucks onto 3D faces with studio art', () => {
    const design = new FormaLocalEngine().generate({
      brief: perfumeBrief({ templateId: 'fm-box-ecma-a60' }),
      overridePatch: { studio: true },
    })
    expect(design.dieline.panels.some((p) => p.id === 'side-left')).toBe(true)
    expect(facePanelId(design.dieline, design.artwork, 'left')).toBe('side-left')
    expect(facePanelId(design.dieline, design.artwork, 'right')).toBe('side-right')
    expect(facePanelId(design.dieline, design.artwork, 'top')).toBe('top-tuck')
    const left = renderPanelSvg(design.dieline, design.artwork, 'side-left', design.palette)
    expect(left).toContain('data-art="studio"')
    expect(left).toMatch(/data-role="side"/)
    expect(design.dieline.cut.length).toBeGreaterThan(0)
    expect(design.dieline.crease.length).toBeGreaterThan(3)
    const knife = buildExportBundle(design)?.knife ?? ''
    expect(knife).toContain('data-type="cut"')
    expect(knife).toContain('data-type="crease"')
    expect(knife).toContain('id="CUT"')
    expect(knife).toContain('id="CREASE"')
  })
})
