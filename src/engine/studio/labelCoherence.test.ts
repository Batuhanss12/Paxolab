/**
 * One label set is one design — the label sibling of `cartonCoherence.test.ts`.
 *
 * The carton fault was fixed first and the label kept it for another two rounds, because the test
 * that caught it only ever generated `packagingMode: 'box'`. All three label back painters —
 * `paintLabelBack`, `paintRoundBack`, `paintKitBack` — started with a bare `ground()` while all
 * twelve label *front* painters laid down the direction's own background, so opening the
 * "Ön + arka etiket seti" showed a textured front beside a blank back.
 *
 * Nothing else could see it. Every panel was inside its cut, nothing collided, the export gate
 * passed and the frozen hashes matched, because each of those looks at one panel at a time. The
 * defect only exists at the level of the set.
 *
 * The glue tab is the deliberate exception and is asserted separately: adhesive does not bond over
 * ink, so `glue-art` fails any glue face carrying artwork. It must stay empty.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { buildCombinedSvg } from '../production/exportDoc'
import { STUDIO_FAMILIES } from './family'
import type { StudioFamily } from './types'

/** Every active label format, one per structure the catalogue actually offers. */
const FORMATS: { id: string; label: string; sector: string; sub: string; dims: { L: number; W: number; H: number } }[] = [
  { id: 'fm-cos-label-bottle', label: 'wrap', sector: 'kozmetik', sub: 'parfüm', dims: { L: 90, W: 0, H: 70 } },
  { id: 'fm-food-label-jar', label: 'düz (kavanoz)', sector: 'gıda', sub: 'reçel', dims: { L: 70, W: 0, H: 90 } },
  { id: 'fm-elec-label-device', label: 'düz (cihaz)', sector: 'elektronik', sub: 'cihaz', dims: { L: 60, W: 0, H: 40 } },
  { id: 'fm-label-universal', label: 'düz (genel)', sector: 'bebek', sub: 'genel', dims: { L: 80, W: 0, H: 110 } },
  { id: 'fm-lid-round', label: 'yuvarlak', sector: 'kozmetik', sub: 'krem', dims: { L: 60, W: 60, H: 0 } },
  { id: 'fm-label-oval', label: 'oval', sector: 'kozmetik', sub: 'parfüm', dims: { L: 70, W: 0, H: 45 } },
  { id: 'fm-kit-hangtag', label: 'askı etiketi', sector: 'kozmetik', sub: 'askı etiketi', dims: { L: 38, W: 0, H: 76 } },
  { id: 'fm-kit-card', label: 'kart', sector: 'kozmetik', sub: 'teşekkür kartı', dims: { L: 90, W: 0, H: 55 } },
]

const SPINE_EXCEPTION: Record<string, string> = {
  'noir-stack': 'marble',
  'diagonal-tech': 'circuit',
}

function brief(format: (typeof FORMATS)[number], extra: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Verda',
    productName: 'Gece Serisi',
    sector: format.sector,
    subProduct: format.sub,
    packagingMode: 'label',
    templateId: format.id,
    styleType: 'luxury',
    colors: 'krem · altın',
    volume: '50 ml',
    barcode: '8690000000017',
    dimensionsMm: format.dims,
    ...extra,
  }
}

function generate(b: DesignBrief) {
  resetArtMemory()
  return new FormaLocalEngine().generate({ brief: b, overridePatch: { studio: true, variationIndex: 0 } })
}

describe('label coherence — the set is one design', () => {
  for (const format of FORMATS) {
    it(`${format.label}: front and back wear the same field`, () => {
      const spec = generate(brief(format))
      const d = spec.studio!.direction
      const expected = SPINE_EXCEPTION[d.archetype] ?? d.background

      const frontId = spec.artwork.frontPanelId
      const glueIds = new Set(spec.dieline.glueIds)
      const backs = spec.artwork.layers.filter((l) => l.panelId !== frontId && !glueIds.has(l.panelId))
      expect(backs.length, `${format.label} arka yüz üretmedi`).toBeGreaterThan(0)

      for (const layer of backs) {
        const fields = [...layer.markup.matchAll(/data-bg="([^"]+)"/g)].map((m) => m[1])
        expect(fields.length, `${layer.panelId} düz levha — hiç alan yok`).toBeGreaterThan(0)
        for (const field of fields) {
          expect(field, `${format.label}/${layer.panelId} ${field} giyiyor, tasarım ${expected}`).toBe(expected)
        }
      }
    })
  }

  it('the glue tab stays clean — adhesive does not bond over ink', () => {
    const wrap = generate(brief(FORMATS[0]))
    const glueIds = new Set(wrap.dieline.glueIds)
    expect(glueIds.size, 'wrap etikette yapıştırma paneli yok').toBeGreaterThan(0)
    for (const layer of wrap.artwork.layers) {
      if (!glueIds.has(layer.panelId)) continue
      expect(layer.markup, `${layer.panelId} hero taşıyor`).not.toMatch(/data-art="hero"/)
      expect(layer.markup, `${layer.panelId} zemin taşıyor`).not.toMatch(/data-bg="/)
    }
    // …and the set still exports, which is the gate that catches ink on the glue.
    expect(Boolean(buildCombinedSvg(wrap)), 'wrap etiket export edemiyor').toBe(true)
  })

  it('every format paints clean and exports', () => {
    for (const format of FORMATS) {
      const spec = generate(brief(format))
      expect(spec.studio!.collisions, `${format.label} çarpışma`).toEqual([])
      expect(spec.studio!.outOfBounds, `${format.label} taşma`).toEqual([])
      expect(Boolean(buildCombinedSvg(spec)), `${format.label} export`).toBe(true)
    }
  })

  /**
   * `dark-luxe` used to have no label of its own — it shared `ink-panel` with `ink`, and because the
   * offer de-duplicates by family it was unreachable on a label. A customer could choose "karanlık
   * lüks" for a carton and never find it again on the bottle.
   */
  it('every family can be worn by a label, dark-luxe included', () => {
    const families = Object.keys(STUDIO_FAMILIES) as StudioFamily[]
    const labelArchetypes = new Set(families.map((f) => STUDIO_FAMILIES[f].label))
    expect(labelArchetypes.size, 'iki aile aynı etiket arketipini paylaşıyor').toBe(families.length)

    for (const family of families) {
      const spec = generate(brief(FORMATS[0], { studioFamily: family, studioFamilyLocked: true }))
      expect(spec.studio!.direction.archetype, `${family} etikette çizilmedi`).toBe(STUDIO_FAMILIES[family].label)
      expect(spec.studio!.collisions, `${family} çarpışma`).toEqual([])
      expect(Boolean(buildCombinedSvg(spec)), `${family} export`).toBe(true)
    }
  })
})
