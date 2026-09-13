/**
 * Audit every box template + every Forxa/native box engine.
 * Prints a per-row report; exits 1 if any hard fail.
 */
import { FORMA_TEMPLATES } from '../src/engine/catalog/catalog'
import { emptyBrief } from '../src/engine/fields'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { buildDieline } from '../src/engine/dieline/buildDieline'
import { findHeroPanel, isGluePanel } from '../src/engine/dieline/panelKind'
import { registry } from '../src/engine/dieline/forxa/registry'
import type { DesignBrief, DesignSpec, StructureId } from '../src/types'

type Row = {
  id: string
  ok: boolean
  notes: string[]
}

function briefFor(templateId: string, dims: { L: number; W: number; H: number }, extra: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Aurelia',
    productName: 'Noir',
    sector: extra.sector || 'kozmetik',
    subProduct: extra.subProduct || 'kutu',
    packagingMode: 'box',
    templateId,
    dimensionsMm: dims,
    styleType: 'luxury',
    volume: '50 ml',
    ...extra,
  }
}

function checkSpec(spec: DesignSpec): string[] {
  const notes: string[] = []
  const d = spec.dieline
  if (!d.consistent) notes.push(`dieline inconsistent: ${d.issues.join(' | ') || 'no issues[]'}`)
  if (d.cut.length === 0) notes.push('CUT yok')
  if (d.crease.length === 0) notes.push('CREASE yok')
  if (d.panels.length === 0) notes.push('panel yok')
  if (d.width <= 0 || d.height <= 0) notes.push(`bounds ${d.width}×${d.height}`)
  const badPanel = d.panels.filter((p) => p.w <= 0 || p.h <= 0 || !Number.isFinite(p.x))
  if (badPanel.length) notes.push(`bozuk panel: ${badPanel.map((p) => p.id).join(',')}`)

  const hero = findHeroPanel(d.panels)
  if (!hero) notes.push('hero panel yok')
  else {
    const layer = spec.artwork.layers.find((l) => l.panelId === hero.id)
    if (!layer || !layer.markup.trim()) notes.push(`hero ${hero.id} artwork boş`)
    else if (!/AURELIA/i.test(layer.markup) && !/data-art="hero"/.test(layer.markup)) {
      notes.push(`hero ${hero.id} marka/lockup zayıf`)
    }
    if (isGluePanel(hero)) notes.push('hero glue üzerinde')
  }

  const glueHero = spec.artwork.layers.filter((l) => {
    const p = d.panels.find((x) => x.id === l.panelId)
    return p && isGluePanel(p) && /data-art="hero"/.test(l.markup)
  })
  if (glueHero.length) notes.push('yapıştırmada hero')

  const orphan = spec.artwork.layers.filter((l) => !d.panels.some((p) => p.id === l.panelId))
  if (orphan.length) notes.push(`panel'siz layer: ${orphan.map((l) => l.panelId).join(',')}`)

  const dieFail = spec.preflight.items.find((i) => i.id === 'dieline' && i.status === 'fail')
  if (dieFail) notes.push(`preflight dieline fail: ${dieFail.detail}`)
  const collide = spec.preflight.items.find((i) => i.id === 'collision' && i.status === 'fail')
  if (collide) notes.push(`lockup çarpışma: ${collide.detail}`)
  const overflow = spec.preflight.items.find((i) => i.id === 'text-overflow' && i.status === 'fail')
  if (overflow) notes.push(`metin taşma: ${overflow.detail}`)
  const struct = spec.preflight.items.find((i) => i.id === 'structural' && i.status === 'fail')
  if (struct) notes.push(`yapısal kapı: ${struct.detail}`)
  const fatal = (d.structural?.findings ?? []).filter((f) => f.severity === 'FATAL')
  if (fatal.length) notes.push(`FATAL: ${fatal.map((f) => f.code).join(',')}`)

  return notes
}

const engine = new FormaLocalEngine()
const rows: Row[] = []

console.log('=== KATALOG KUTU ŞABLONLARI (FormaLocalEngine) ===')
for (const t of FORMA_TEMPLATES) {
  if (t.status !== 'active' || t.packagingMode !== 'box') continue
  try {
    const spec = engine.generate({
      brief: briefFor(t.id, t.defaultsMm, {
        sector: t.sectors[0],
        subProduct: t.subProducts[0],
      }),
    })
    const notes = checkSpec(spec)
    if (spec.structureId !== t.structureId) notes.push(`structureId ${spec.structureId} ≠ ${t.structureId}`)
    const ok = notes.length === 0
    rows.push({ id: t.id, ok, notes })
    console.log(`${ok ? 'OK ' : 'FAIL'} ${t.id}  ${t.structureId}  ${t.defaultsMm.L}×${t.defaultsMm.W}×${t.defaultsMm.H}${t.auxDevice ? ` +x${t.auxDevice}` : ''}${t.library === 'advanced' ? '  [adv]' : ''}`)
    for (const n of notes) console.log(`     · ${n}`)
  } catch (err) {
    rows.push({ id: t.id, ok: false, notes: [String(err)] })
    console.log(`FAIL ${t.id}  CRASH ${err}`)
  }
}

console.log('\n=== FORXA MOTORLARI (ham generateDieline) ===')
for (const id of registry.listIds()) {
  const st = registry.get(id)!
  const p = st.getDefaultParameters()
  const raw = st.generateDieline(p)
  const notes: string[] = []
  if (!raw.success) notes.push(`success=false ${raw.errors.join(' | ')}`)
  if (!raw.paths.cut.length) notes.push('CUT yok')
  if (!raw.paths.crease.length) notes.push('CREASE yok')
  if (!raw.panels.length) notes.push('panel yok')
  if (raw.bounds.width <= 0 || raw.bounds.height <= 0) notes.push('bounds 0')
  if (raw.errors.length) notes.push(`errors: ${raw.errors.join(' | ')}`)
  const ok = notes.length === 0
  rows.push({ id: `engine:${id}`, ok, notes })
  console.log(`${ok ? 'OK ' : 'FAIL'} engine:${id}  ${raw.bounds.width.toFixed(0)}×${raw.bounds.height.toFixed(0)} mm  panels=${raw.panels.length} cut=${raw.paths.cut.length} crease=${raw.paths.crease.length}`)
  for (const n of notes) console.log(`     · ${n}`)
}

console.log('\n=== NATIVE NETLER (buildDieline) ===')
const natives: StructureId[] = ['tuck-end-box', 'simple-tray']
for (const id of natives) {
  const model = buildDieline(id, briefFor('', { L: 80, W: 40, H: 120 }))
  const notes: string[] = []
  if (!model.consistent) notes.push(model.issues.join(' | ') || 'inconsistent')
  if (!model.cut.length) notes.push('CUT yok')
  if (!model.crease.length) notes.push('CREASE yok')
  if (!findHeroPanel(model.panels)) notes.push('hero yok')
  const ok = notes.length === 0
  rows.push({ id: `native:${id}`, ok, notes })
  console.log(`${ok ? 'OK ' : 'FAIL'} native:${id}  panels=${model.panels.length} ${model.width.toFixed(0)}×${model.height.toFixed(0)}`)
  for (const n of notes) console.log(`     · ${n}`)
}

const fails = rows.filter((r) => !r.ok)
const oks = rows.filter((r) => r.ok)
console.log(`\nÖZET  ${oks.length}/${rows.length} geçti  ·  ${fails.length} sorun`)
if (fails.length) {
  console.log('SORUNLU:')
  for (const f of fails) console.log(`  - ${f.id}: ${f.notes.join(' ; ')}`)
  process.exit(1)
}
console.log('Tüm kutu şablonları ve bıçak motorları bu denetimde geçti.')
