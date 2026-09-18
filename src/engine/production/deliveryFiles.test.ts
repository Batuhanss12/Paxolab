/**
 * The delivered file has to open, whole, in the tool the printer actually uses.
 *
 * The owner opened a downloaded design in Illustrator and found it incomplete. The cause was one
 * attribute: the outliner emitted every glyph as `<use href="#g12">` against a pool of shared
 * `<path id>` definitions. That is correct SVG 2 and smaller — and Illustrator's importer is SVG
 * 1.1, where the attribute is `xlink:href` and the namespace must be declared. Given a bare `href`
 * it resolves nothing, so the shapes and colours arrived and every letter was missing.
 *
 * Adding `xlink:href` would most likely have worked. Inlining the glyphs cannot fail, and a print
 * file is opened once by a printer, so the extra kilobytes buy the property that matters. These
 * tests assert the shape of the delivered file rather than the mechanism, so a future change that
 * reintroduces *any* cross-reference is caught here:
 *
 *   - nothing to resolve: no `<use>`, no `xlink`, no id references;
 *   - nothing to install: no `<text>`, no `@font-face`;
 *   - and the label's bundle is the design, with its cut contour inside it.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief, DesignSpec } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { buildOutlinedExportFiles, buildUserExportFiles } from './exportDoc'

function make(extra: Partial<DesignBrief>): DesignSpec {
  resetArtMemory()
  return new FormaLocalEngine().generate({
    brief: {
      ...emptyBrief(),
      brandName: 'Noctis',
      productName: 'Gece Serisi',
      styleType: 'luxury',
      colors: 'siyah · altın',
      volume: '50 ml',
      barcode: '8690000000017',
      ...extra,
    } as DesignBrief,
    overridePatch: { studio: true, variationIndex: 0 },
  })
}

const LABEL = {
  sector: 'kozmetik',
  subProduct: 'parfüm',
  packagingMode: 'label' as const,
  templateId: 'fm-cos-label-bottle',
  dimensionsMm: { L: 90, W: 0, H: 70 },
}

const CARTON = {
  sector: 'kozmetik',
  subProduct: 'parfüm',
  packagingMode: 'box' as const,
  templateId: 'fm-cos-tuck-perfume',
  dimensionsMm: { L: 70, W: 35, H: 140 },
}

const ROUND_LABEL = {
  sector: 'kozmetik',
  subProduct: 'krem',
  packagingMode: 'label' as const,
  templateId: 'fm-lid-round',
  dimensionsMm: { L: 60, W: 60, H: 0 },
}

async function delivered(spec: DesignSpec) {
  const files = await buildOutlinedExportFiles(spec)
  expect(files, 'paket üretilemedi').toBeTruthy()
  return files!
}

describe('delivered vector opens whole, anywhere', () => {
  for (const [label, brief] of [
    ['etiket', LABEL],
    ['karton', CARTON],
    ['yuvarlak etiket', ROUND_LABEL],
  ] as const) {
    it(`${label}: the design file has nothing to resolve and nothing to install`, async () => {
      const files = await delivered(make(brief))
      const design = files.find((file) => file.name.endsWith('-tasarim.svg'))
      expect(design, `${label}: tasarım dosyası yok`).toBeTruthy()
      const svg = String(design!.data)

      expect(svg, 'glyph referansı — Illustrator çözemez').not.toMatch(/<use\b/)
      expect(svg, 'xlink — SVG 1.1 ad alanı beyan edilmeden kullanılamaz').not.toMatch(/xlink/)
      expect(svg, 'canlı metin — kurulu fonta bağımlı').not.toMatch(/<text\b/)
      expect(svg, 'gömülü font bildirimi').not.toMatch(/@font-face/)
      // Whatever ids remain must be defined in the same file, not pointed at from outside it.
      for (const ref of svg.match(/url\(#([^)]+)\)/g) ?? []) {
        const id = /url\(#([^)]+)\)/.exec(ref)![1]
        expect(svg.includes(`id="${id}"`), `${id} tanımsız referans`).toBe(true)
      }
    })
  }

  it('the outlined design still draws — the glyphs became paths, they did not vanish', async () => {
    const spec = make(LABEL)
    const before = buildUserExportFiles(spec)!.find((f) => f.name.endsWith('-tasarim.svg'))!
    const after = (await delivered(spec)).find((f) => f.name.endsWith('-tasarim.svg'))!
    const textRuns = (String(before.data).match(/<text\b/g) ?? []).length
    expect(textRuns, 'fikstürde hiç yazı yok').toBeGreaterThan(5)
    const pathsBefore = (String(before.data).match(/<path\b/g) ?? []).length
    const pathsAfter = (String(after.data).match(/<path\b/g) ?? []).length
    expect(pathsAfter, 'yazılar yola dönmedi').toBeGreaterThan(pathsBefore + textRuns)
  })

  /**
   * A label is one printed face, not a folded sheet. Shipping it with a four-file dieline set was
   * noise — but the cut still has to reach the printer, so it travels inside the design.
   */
  it('a label is delivered as the design alone, with its cut inside it', async () => {
    for (const brief of [LABEL, ROUND_LABEL]) {
      const files = await delivered(make(brief))
      const names = files.map((f) => f.name)
      expect(names.some((n) => n.endsWith('-tasarim.svg'))).toBe(true)
      expect(names.filter((n) => /knife|dieline|combined/.test(n)), `etikette kalıp dosyası var: ${names.join(', ')}`).toEqual([])

      const svg = String(files.find((f) => f.name.endsWith('-tasarim.svg'))!.data)
      expect(svg, 'kesim katmanı yok').toMatch(/data-layer="CUT"/)
      expect(svg, 'baskı katmanı adlandırılmamış').toMatch(/data-layer="ARTWORK"/)
    }
  })

  it('a carton still gets its knife, dieline and dxf — it is folded from a sheet', async () => {
    const names = (await delivered(make(CARTON))).map((f) => f.name)
    for (const needed of ['-knife.svg', '-knife.dxf', '-dieline.svg', '-dieline.pdf', '-combined.svg']) {
      expect(names.some((n) => n.endsWith(needed)), `kartonda ${needed} yok`).toBe(true)
    }
  })

  it('the readme names files that are actually in the bundle', async () => {
    for (const brief of [LABEL, CARTON]) {
      const files = await delivered(make(brief))
      const readme = String(files.find((f) => f.name === 'OKU.txt')!.data)
      for (const line of readme.split('\n')) {
        const named = /\*(-[a-z.]+)/.exec(line)
        if (!named) continue
        expect(files.some((f) => f.name.endsWith(named[1])), `OKU.txt olmayan dosyayı sayıyor: ${named[1]}`).toBe(true)
      }
    }
  })
})
