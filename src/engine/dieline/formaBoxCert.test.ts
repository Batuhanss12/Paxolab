import { describe, expect, it } from 'vitest'
import { buildInventory, listBoxTemplates } from './cert/boxContracts'
import { runBoxCert } from './cert/runBoxCert'

describe('forma:box-cert', () => {
  it('inventories every catalog box and no labels', () => {
    const inv = buildInventory()
    const catalog = listBoxTemplates()
    expect(inv.count).toBe(catalog.length)
    expect(inv.count).toBeGreaterThan(0)
    expect(inv.templates.every((t) => t.packType === 'box')).toBe(true)
    expect(inv.excludedLabels.every((l) => l.structureId === 'flat-label' || l.structureId === 'wrap-label')).toBe(true)
  })

  it('exits clean: zero open P0 across default + stress dims', () => {
    const result = runBoxCert()
    expect(result.templateCount).toBe(result.inventoryCount)
    expect(result.sampleCount).toBe(result.inventoryCount * 3)
    expect(result.p0, result.templates.filter((t) => t.p0.length).map((t) => `${t.templateId}:${t.p0.map((f) => f.code).join(',')}`).join(' | ')).toBe(0)
    expect(result.verdict).toBe('PASS')
  })
})
