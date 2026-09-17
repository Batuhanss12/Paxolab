/**
 * L1 — the downloaded print file must not depend on installed fonts.
 *
 * Found in the 2026-09-17 launch walkthrough: export declared `src: local('Cormorant Garamond'),
 * local('Georgia')` and embedded no font data, so a printer without those faces renders the
 * fallback and every fitted line shifts.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { buildOutlinedExportFiles, buildUserExportFiles } from '../production/exportDoc'
import { outlineSvgText, resolveFaceKey } from './outlineText'

function oilBox(): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Nexora',
    productName: 'Sızma Zeytinyağı',
    sector: 'gıda',
    subProduct: 'zeytinyağı',
    packagingMode: 'box',
    templateId: 'fm-food-tuck-oil',
    styleType: 'luxury',
    colors: 'koyu yeşil · altın',
    volume: '250 ml',
    dimensionsMm: { L: 80, W: 50, H: 180 },
  }
}

function spec() {
  return new FormaLocalEngine().generate({ brief: oilBox(), overridePatch: { studio: true } })
}

describe('L1 — export text is outlined', () => {
  it('maps markup font attributes back to a generated face', () => {
    expect(resolveFaceKey("'Cormorant Garamond', Georgia, serif", 500, false)).toBe('cormorant-500')
    expect(resolveFaceKey("'Cormorant Garamond', Georgia, serif", 500, true)).toBe('cormorant-500i')
    expect(resolveFaceKey("'Cormorant Garamond', Georgia, serif", 700, false)).toBe('cormorant-700')
    expect(resolveFaceKey("'Montserrat', Arial, sans-serif", 300, false)).toBe('montserrat-300')
    expect(resolveFaceKey("'Montserrat', Arial, sans-serif", 700, false)).toBe('montserrat-700')
    expect(resolveFaceKey("'Great Vibes', cursive", 400, false)).toBe('greatvibes-400')
    // Icon numerals use Inter — they must still be outlined, not left as live text.
    expect(resolveFaceKey('Inter, Arial, sans-serif', 600, false)).toBe('montserrat-500')
  })

  it('leaves no live text in the artwork', async () => {
    const art = String(buildUserExportFiles(spec())!.find((f) => f.name.endsWith('artwork.svg'))!.data)
    expect(art).toMatch(/<text/)
    const { markup, report } = await outlineSvgText(art)
    expect(report.total).toBeGreaterThan(20)
    expect(report.outlined).toBe(report.total)
    expect(markup).not.toMatch(/<text/)
  })

  it('every glyph in the copy is covered by the table', async () => {
    const art = String(buildUserExportFiles(spec())!.find((f) => f.name.endsWith('artwork.svg'))!.data)
    const { report } = await outlineSvgText(art)
    expect(report.missing).toEqual([])
  })

  it('shares repeated glyphs instead of copying them', async () => {
    const art = String(buildUserExportFiles(spec())!.find((f) => f.name.endsWith('artwork.svg'))!.data)
    const { markup, report } = await outlineSvgText(art)
    expect(markup).toContain('data-art="outlined-glyphs"')
    const defs = (markup.match(/<path id="/g) ?? []).length
    const uses = (markup.match(/<use href="#/g) ?? []).length
    expect(defs).toBe(report.glyphs)
    // A letter appearing many times must not multiply the file.
    expect(uses).toBeGreaterThan(defs * 2)
  })

  it('the delivery ZIP ships outlined artwork and an untouched knife', async () => {
    const files = (await buildOutlinedExportFiles(spec()))!
    const artwork = String(files.find((f) => f.name.endsWith('artwork.svg'))!.data)
    const combined = String(files.find((f) => f.name.endsWith('combined.svg'))!.data)
    const knife = String(files.find((f) => f.name.endsWith('knife.svg'))!.data)

    expect(artwork).not.toMatch(/<text/)
    expect(combined).not.toMatch(/<text/)
    // No font dependency is left behind in the printed faces.
    expect(artwork).not.toMatch(/src:\s*local\(/)
    expect(combined).not.toMatch(/src:\s*local\(/)
    // The knife carries no studio type, so it must pass through unchanged.
    expect(knife).toBe(String(buildUserExportFiles(spec())!.find((f) => f.name.endsWith('knife.svg'))!.data))
  })

  it('keeps the file a reasonable size', async () => {
    const plain = String(buildUserExportFiles(spec())!.find((f) => f.name.endsWith('artwork.svg'))!.data)
    const { markup } = await outlineSvgText(plain)
    // Outlines cost bytes, but glyph sharing must keep it within ~4x.
    expect(markup.length).toBeLessThan(plain.length * 4)
  })
})
