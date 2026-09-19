/**
 * Required, rendered, or refused — and the gate must tell which.
 *
 * `REQUIRED_INFO_MISSING` was enforced in Phase 1, withdrawn in Phase 1.5, and comes back here
 * narrower. The reason for the withdrawal was not the rule but the evidence: `nutritionTable`
 * returns empty markup when the declaration will not fit, the carton back skips the food register
 * when it has under 26 mm left, and a swing tag carries no legal register at all — three unrelated
 * facts arriving at the detector as one absence in the back markup. Enforcing that absence blocked
 * eight legitimate catalogue designs.
 *
 * The painters now record a declined block with its reason (`Ledger.skip`), so `nutritionState`
 * reads the ledger rather than the markup and separates the cases. Only an absence with no reason
 * recorded — a renderer that did not do its job — closes the gate.
 */
import { describe, expect, it } from 'vitest'
import type { DesignSpec } from '../../types'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import { activeTemplates } from '../catalog/catalog'
import { nutritionRows } from '../studio/copyBank'
import type { StudioReport } from '../studio/types'
import { resetArtMemory } from './DesignMemory'
import { scoreVisualCraft } from './scoreVisualCraft'

function build(patch: Partial<DesignSpec['brief']>): DesignSpec {
  resetArtMemory()
  return new FormaLocalEngine().generate({
    brief: {
      ...emptyBrief(),
      brandName: 'Yayla',
      productName: 'Çiçek Balı',
      sector: 'gıda',
      subProduct: 'bal',
      packagingMode: 'label',
      templateId: 'fm-label-universal',
      styleType: 'classic',
      volume: '450 gr',
      dimensionsMm: { L: 70, W: 0, H: 90 },
      barcode: '8690000000017',
      ...patch,
    },
    overridePatch: { studio: true, variationIndex: 0 },
  })
}

/** Re-score with the studio report rewritten — the ledger is what the detector reads. */
function rescore(spec: DesignSpec, edit: (r: StudioReport) => StudioReport) {
  const studio = edit(JSON.parse(JSON.stringify(spec.studio)) as StudioReport)
  return scoreVisualCraft(
    {
      artwork: spec.artwork,
      preflight: spec.preflight,
      copy: spec.copy,
      kind: spec.kind,
      studio,
      brief: { colors: spec.brief.colors },
      dieline: spec.dieline,
    },
    spec.designPlan!,
  )
}

const ids = (card: { blockers: { id: string }[] }) => card.blockers.map((b) => b.id)
const REQUIRED_INFO = 'REQUIRED_INFO_MISSING'

describe('A — not required', () => {
  it('a cosmetic face is never asked for a nutrition declaration', () => {
    const spec = build({ sector: 'kozmetik', subProduct: 'yüz kremi', productName: 'Onarıcı Krem', volume: '50 ml' })
    expect(spec.designPlan!.sector).not.toBe('food')
    expect(ids(spec.craftScore!)).not.toContain(REQUIRED_INFO)
    expect(spec.craftScore!.exportAllowed).toBe(true)
  })

  it('and neither is a swing tag, which carries no legal register at all', () => {
    /*
     * `paintKitBack` places a brand line, a city and a QR — no ingredients, no usage, no warnings.
     * The declaration belongs on the pack the tag hangs from. Before the surface said so, this read
     * as a renderer failure and blocked two catalogue designs.
     */
    const tag = activeTemplates(true).find((t) => t.id === 'fm-kit-hangtag')
    if (!tag) return
    const spec = build({ packagingMode: tag.packagingMode, templateId: tag.id, dimensionsMm: tag.defaultsMm })
    const skips = spec.studio!.panels.flatMap((p) => p.skipped ?? [])
    expect(skips.some((s) => s.id === 'nutrition-table' && s.reason === 'not-this-surface')).toBe(true)
    expect(ids(spec.craftScore!)).not.toContain(REQUIRED_INFO)
  })
})

describe('B — required, and drawn', () => {
  it('the honey label carries its table and passes', () => {
    const spec = build({})
    expect(spec.designPlan!.sector).toBe('food')
    const placed = spec.studio!.panels.flatMap((p) => p.placed)
    expect(placed.some((b) => (b.id.split('#')[0] ?? b.id) === 'nutrition-table')).toBe(true)
    expect(ids(spec.craftScore!)).not.toContain(REQUIRED_INFO)
    expect(spec.craftScore!.exportAllowed).toBe(true)
  })
})

describe('C — required, room existed, nothing drawn and nothing said', () => {
  it('closes the gate', () => {
    // The renderer's failure mode: the table is gone from the ledger and no reason was recorded.
    const spec = build({})
    const card = rescore(spec, (r) => ({
      ...r,
      panels: r.panels.map((p) => ({
        ...p,
        placed: p.placed.filter((b) => (b.id.split('#')[0] ?? b.id) !== 'nutrition-table'),
        skipped: [],
      })),
    }))
    expect(ids(card)).toContain(REQUIRED_INFO)
    expect(card.exportAllowed).toBe(false)
    expect(card.blockers[0]!.reason).toMatch(/sebep kaydetmedi/)
  })
})

describe('D — required, but the shape cannot carry it', () => {
  it('is a different fact, and does not close the gate', () => {
    /*
     * A complete declaration needs 18.2 mm; a 60 mm lid's legal band is 12–16 mm. F-42 settled that
     * the honest outcome there is no table plus a `ds-nutrition-fit` warning telling the customer
     * to use the body label. That must not read the same as a renderer that stopped emitting.
     */
    const spec = build({})
    const card = rescore(spec, (r) => ({
      ...r,
      panels: r.panels.map((p) => ({
        ...p,
        placed: p.placed.filter((b) => (b.id.split('#')[0] ?? b.id) !== 'nutrition-table'),
        skipped: [{ id: 'nutrition-table', reason: 'no-space' as const }],
      })),
    }))
    expect(ids(card)).not.toContain(REQUIRED_INFO)
    expect(card.exportAllowed).toBe(true)
  })

  it('and the engine really does reach that state in the catalogue', () => {
    // Measured: five catalogue faces, all on small shapes. If this ever reaches zero the instrument
    // is no longer exercising the case the blocker was withdrawn for.
    const small = activeTemplates(true).filter((t) => ['fm-lid-round', 'fm-label-oval'].includes(t.id))
    const reached = small.some((t) => {
      const spec = build({ packagingMode: t.packagingMode, templateId: t.id, dimensionsMm: t.defaultsMm })
      return spec.studio!.panels.some((p) => (p.skipped ?? []).some((s) => s.reason === 'no-space'))
    })
    expect(reached).toBe(true)
  })
})

describe('data availability — why there is no "data missing" state', () => {
  it('the declaration always has a row set, because the engine never fabricates one', () => {
    /*
     * F-42 settled this: the engine used to print convincing figures for honey, olive oil and
     * coffee. The values are now blanks a producer fills in and the table is marked ÖRNEK, so the
     * *structure* is always available and only the numbers are the customer's to supply. That is
     * what makes `REQUIRED_BUT_DATA_MISSING` unreachable rather than unhandled — and measured, a
     * zero-row table would still be drawn and recorded, so it could never read as a renderer
     * failure either.
     */
    const blobs = ['bal honey', 'zeytinyağı olive oil', 'kahve coffee', 'çikolata', '']
    for (const blob of blobs) {
      expect(nutritionRows('tr', blob).length, blob || '(boş)').toBeGreaterThan(0)
      for (const [, value] of nutritionRows('tr', blob)) expect(value).toMatch(/—/)
    }
  })
})

describe('detector integrity — the evidence is structured, not textual', () => {
  it('rewriting the back markup cannot move the verdict', () => {
    /*
     * Phase 1's false positives were all of this shape: the detector demanded `BESİN DEĞERLERİ`
     * while the studio wrote `Besin Değerleri`, and 100 faces reported a table they were carrying.
     * The ledger is not spellable.
     */
    const spec = build({})
    const wrecked: DesignSpec = {
      ...spec,
      artwork: {
        ...spec.artwork,
        layers: spec.artwork.layers.map((l) => ({ ...l, markup: l.markup.replace(/Besin Değerleri/g, 'XXX') })),
      },
    }
    const card = scoreVisualCraft(
      { artwork: wrecked.artwork, preflight: spec.preflight, copy: spec.copy, kind: spec.kind, studio: spec.studio, brief: { colors: spec.brief.colors }, dieline: spec.dieline },
      spec.designPlan!,
    )
    expect(ids(card)).not.toContain(REQUIRED_INFO)
  })
})
