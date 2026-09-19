/**
 * A regulated register that is not on the page has to say why it is not.
 *
 * Phase 2D gave the nutrition table that contract. `legalColumn` — ingredients, usage, warnings,
 * storage — had the same three silent exits and one worse property: two of them `break`, so a
 * column that ran out of room dropped every *remaining* register, not just the one that would not
 * fit. Measured across 599 faces, 106 register drops were silent.
 *
 * `no-content` is reachable here in a way it never was for nutrition: `nutritionRows` always returns
 * a blank row set, but a section with an empty body is skipped outright. That is the customer's
 * missing copy, not a renderer fault, and the two must not arrive as the same absence.
 */
import { describe, expect, it } from 'vitest'
import { activeTemplates } from '../catalog/catalog'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import type { DesignBrief, DesignSpec } from '../../types'
import { resetArtMemory } from '../brain/DesignMemory'
import { legalColumn } from './anatomy'
import { Ledger } from './text'
import type { Panel } from '../../types'

const panel = { id: 'back', role: 'back', x: 0, y: 0, w: 70, h: 90 } as unknown as Panel
const section = (id: string, body = 'Örnek gövde metni, iki satır sürecek kadar uzun.') => ({ title: id, body, id })

function run(sections: ReturnType<typeof section>[], maxBottom: number) {
  const ledger = new Ledger(panel)
  const out = legalColumn(ledger, 4, 4, 60, maxBottom, sections, '#222', { size: 1.8 })
  const drawn = ledger.placed
    .map((b) => b.id.split('#')[0] ?? b.id)
    .filter((id) => id.startsWith('legal-title:'))
    .map((id) => id.slice('legal-title:'.length))
  return { ledger, out, drawn }
}

describe('a register that is set is named in the ledger', () => {
  it('so the record says which one, not just that something legal was drawn', () => {
    const { drawn } = run([section('ingredients'), section('usage'), section('warnings')], 80)
    expect(drawn).toEqual(['ingredients', 'usage', 'warnings'])
  })
})

describe('no-content — the copy is missing, not the renderer', () => {
  it('an empty body is recorded rather than passed over', () => {
    const { ledger, drawn } = run([section('ingredients', '   '), section('usage')], 80)
    expect(drawn).toEqual(['usage'])
    expect(ledger.skipped).toContainEqual({ id: 'ingredients', reason: 'no-content' })
  })

  it('and it does not stop the registers after it', () => {
    // `continue`, not `break` — one missing field must not silence the rest of the column.
    const { ledger, drawn } = run([section('ingredients', ''), section('usage'), section('warnings')], 80)
    expect(drawn).toEqual(['usage', 'warnings'])
    expect(ledger.skipped.filter((s) => s.reason === 'no-space')).toEqual([])
  })
})

describe('no-space — the column ran out, and says so for every register it dropped', () => {
  it('records the ones it could not reach, not only the one it stopped on', () => {
    /*
     * The old `break` left no trace at all, so a tight back reported three registers as simply
     * absent. Measured on the catalogue: 106 such drops across four registers.
     */
    const { ledger, drawn } = run([section('ingredients'), section('usage'), section('warnings')], 16)
    expect(drawn.length).toBeLessThan(3)
    const dropped = ledger.skipped.filter((s) => s.reason === 'no-space').map((s) => s.id)
    for (const id of ['ingredients', 'usage', 'warnings']) {
      expect(drawn.includes(id) || dropped.includes(id), `${id} ne çizildi ne kaydedildi`).toBe(true)
    }
  })

  it('a column with room drops nothing and records nothing', () => {
    const { ledger, drawn } = run([section('ingredients'), section('usage')], 120)
    expect(drawn).toEqual(['ingredients', 'usage'])
    expect(ledger.skipped).toEqual([])
  })
})

describe('the two reasons stay apart', () => {
  it('a missing body and a missing millimetre are different records', () => {
    const { ledger } = run([section('ingredients', ''), section('usage'), section('warnings')], 16)
    const byId = new Map(ledger.skipped.map((s) => [s.id, s.reason]))
    expect(byId.get('ingredients')).toBe('no-content')
    expect([...byId.values()].some((r) => r === 'no-space')).toBe(true)
  })
})

describe('the footer registers say why they are absent too', () => {
  const build = (patch: Partial<DesignBrief>): DesignSpec => {
    resetArtMemory()
    return new FormaLocalEngine().generate({
      brief: {
        ...emptyBrief(),
        brandName: 'Nox',
        productName: 'Kulaklık',
        sector: 'elektronik',
        subProduct: 'kulaklık',
        packagingMode: 'box',
        templateId: 'fm-elec-tuck-earbuds',
        styleType: 'modern',
        volume: '',
        dimensionsMm: { L: 90, W: 90, H: 45 },
        barcode: '8690000000017',
        ...patch,
      },
      overridePatch: { studio: true, variationIndex: 0 },
    })
  }
  const skips = (spec: DesignSpec) => spec.studio!.panels.flatMap((p) => p.skipped ?? [])

  it('no volume in the brief is recorded as missing copy, not as a failure', () => {
    /*
     * Measured: all 24 faces that reach this are electronics, where a pair of earbuds has no net
     * quantity. The painters guard their own `netQuantity` calls, so the primitive is never reached
     * to say so — the fact is recorded where it is known instead.
     */
    const spec = build({})
    expect(spec.studio!.direction.volumeLine ?? '').toBe('')
    expect(skips(spec)).toContainEqual({ id: 'net-quantity', reason: 'no-content' })
  })

  it('and a volume that is supplied is drawn, with nothing skipped', () => {
    const spec = build({ volume: '250 ml' })
    const placed = spec.studio!.panels.flatMap((p) => p.placed).map((b) => b.id.split('#')[0] ?? b.id)
    expect(placed).toContain('net-quantity')
    expect(skips(spec).some((s) => s.id === 'net-quantity')).toBe(false)
  })

  it('ingredients fall back into the column when the table cannot fit', () => {
    /*
     * A food back keeps its ingredients beside the nutrition table, so the legal column below leaves
     * them out. When the table has no room they used to have nowhere to go and simply vanished —
     * measured on five catalogue shapes, a regulated register missing from a file sent to print.
     * The column takes them back now, and whatever it cannot hold instead is recorded.
     */
    const tray = activeTemplates(true).find((t) => t.id === 'fm-food-tray-snack' || t.id === 'fm-box-tray-glued')
    if (!tray) return
    const spec = build({
      sector: 'gıda', subProduct: 'bal', productName: 'Çiçek Balı', volume: '250 gr',
      packagingMode: tray.packagingMode, templateId: tray.id, dimensionsMm: tray.defaultsMm,
    })
    const placed = spec.studio!.panels.flatMap((p) => p.placed).map((b) => b.id.split('#')[0] ?? b.id)
    if (placed.includes('nutrition-table')) return // this shape found the room; nothing to fall back
    expect(skips(spec).filter((x) => x.reason === 'no-space').map((x) => x.id), 'tablo sığmadı').toContain('nutrition-table')
    const drawn = placed.filter((i) => i.startsWith('legal-title:')).map((i) => i.slice('legal-title:'.length))
    expect(drawn, 'içindekiler kolona düştü').toContain('ingredients')
  })

  it('and a round food label that cannot hold its table still carries its registers', () => {
    /*
     * The same disappearance, one painter over: `paintRoundBack` led with the table and its legal
     * sections lived only in the non-food branch, so a food lid whose band could not hold the table
     * went out with no ingredients, no usage and no warnings — and no record of any of it.
     */
    const lid = activeTemplates(true).find((t) => t.id === 'fm-lid-round' || t.id === 'fm-label-oval')
    if (!lid) return
    const spec = build({
      sector: 'gıda', subProduct: 'bal', productName: 'Çiçek Balı', volume: '250 gr',
      packagingMode: lid.packagingMode, templateId: lid.id, dimensionsMm: lid.defaultsMm,
    })
    const placed = spec.studio!.panels.flatMap((p) => p.placed).map((b) => b.id.split('#')[0] ?? b.id)
    if (placed.includes('nutrition-table')) return
    const touched = new Set([
      ...placed.filter((i) => i.startsWith('legal-title:')).map((i) => i.slice('legal-title:'.length)),
      ...skips(spec).map((x) => x.id),
    ])
    for (const reg of ['ingredients', 'usage', 'warnings']) {
      expect(touched, `${reg} ne çizildi ne kaydedildi`).toContain(reg)
    }
  })

  it('a swing tag names every register it does not carry', () => {
    /*
     * The net quantity is the telling one: the brief supplies it and the surface still does not
     * state it, so without the record it reads as a renderer that stopped emitting.
     */
    const tag = activeTemplates(true).find((t) => t.id === 'fm-kit-hangtag')
    if (!tag) return
    const spec = build({ sector: 'kozmetik', subProduct: 'yüz kremi', volume: '250 ml', packagingMode: tag.packagingMode, templateId: tag.id, dimensionsMm: tag.defaultsMm })
    expect(spec.studio!.direction.volumeLine ?? '').not.toBe('')
    const named = skips(spec).filter((s) => s.reason === 'not-this-surface').map((s) => s.id)
    for (const reg of ['nutrition-table', 'barcode', 'pictograms', 'net-quantity', 'ingredients', 'usage', 'warnings', 'storage']) {
      expect(named, reg).toContain(reg)
    }
  })
})
