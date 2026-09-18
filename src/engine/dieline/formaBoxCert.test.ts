import { describe, expect, it } from 'vitest'
import { buildInventory, listBoxTemplates } from './cert/boxContracts'
import { FORMA_TEMPLATES } from '../catalog/catalog'
import { runBoxCert } from './cert/runBoxCert'

describe('forma:box-cert', () => {
  it('inventories every catalog box and no labels', () => {
    const inv = buildInventory()
    const catalog = listBoxTemplates()
    expect(inv.count).toBe(catalog.length)
    expect(inv.count).toBeGreaterThan(0)
    expect(inv.templates.every((t) => t.packType === 'box')).toBe(true)
    /*
     * Derived, not enumerated. This line has been a hardcoded list twice now and gone stale both
     * times — once for `round-label` and again for the brand-kit pieces. What it is actually
     * guarding is that the box cert tests cartons and nothing else, so the excluded pile is checked
     * against the catalog's own flat-printed structures rather than against a list kept by hand.
     */
    const flatStructures = new Set(
      FORMA_TEMPLATES.filter((t) => t.packagingMode === 'label').map((t) => t.structureId),
    )
    expect(flatStructures.size).toBeGreaterThan(2)
    expect(inv.excludedLabels.every((l) => flatStructures.has(l.structureId))).toBe(true)
  })

  it('exits clean: zero open P0 across default + stress dims', () => {
    const result = runBoxCert()
    expect(result.templateCount).toBe(result.inventoryCount)
    expect(result.sampleCount).toBe(result.inventoryCount * 3)
    expect(result.p0, result.templates.filter((t) => t.p0.length).map((t) => `${t.templateId}:${t.p0.map((f) => f.code).join(',')}`).join(' | ')).toBe(0)
    expect(result.verdict).toBe('PASS')
  })
})
