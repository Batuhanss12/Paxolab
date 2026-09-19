/**
 * Does a sector change the design, or only the words on it?
 *
 * The owner's rule is that a sector must not be reduced to a cliché symbol — food is not "add a
 * leaf". So this holds everything else still (same brand, same product name, same structure, same
 * size, same mood) and changes only the sector, then reads what the engine decided: the archetype,
 * the field, the type system, the ornament level, the temperament, the illustrator's species, and
 * what the face actually carries.
 *
 * Anything identical across sectors is a decision the sector did not touch.
 *
 * Audit instrument. Run: `npx vite-node scripts/audit-sector-grammar.ts`
 */
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { emptyBrief } from '../src/engine/fields'
import type { DesignBrief } from '../src/types'

/** The engine's own sector vocabulary, with a product word each so `resolveSubProduct` can bite. */
const SECTORS: [string, string, string][] = [
  ['parfüm', 'eau de parfum', '50 ml'],
  ['kozmetik', 'yüz kremi', '50 ml'],
  ['serum', 'serum', '30 ml'],
  ['gıda', 'çiçek balı', '450 gr'],
  ['içecek', 'filtre kahve', '250 gr'],
  ['sağlık', 'vitamin', '60 kapsül'],
  ['bebek', 'bebek şampuanı', '250 ml'],
  ['elektronik', 'kulaklık', '1 adet'],
  ['temizlik', 'yüzey temizleyici', '500 ml'],
  ['ilaç', 'tablet', '30 tablet'],
  ['ev', 'mum', '200 gr'],
  ['tekstil', 'çorap', '1 çift'],
]

type Row = {
  sector: string
  archetype: string
  background: string
  typePairing: string
  ornament: string
  temperament: string
  species: string
  frame: string
  marks: string
  legal: string
}

const rows: Row[] = []

for (const [sector, subProduct, volume] of SECTORS) {
  const brief: DesignBrief = {
    ...emptyBrief(),
    brandName: 'Vera',
    productName: 'Altın',
    sector,
    subProduct,
    packagingMode: 'box',
    templateId: 'parfum-tuck-end',
    styleType: 'luxury',
    volume,
    dimensionsMm: { L: 70, W: 35, H: 140 },
    barcode: '8690000000017',
  }
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } })
  const d = spec.studio?.direction
  const front = spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)?.markup ?? ''
  const back = spec.artwork.layers.find((l) => l.panelId === 'back')?.markup ?? ''
  rows.push({
    sector,
    archetype: String(d?.archetype),
    background: String(d?.background),
    typePairing: String(d?.typePairing),
    ornament: String(d?.ornament),
    temperament: String(d?.temperament),
    species: String((spec.studio as unknown as { species?: string })?.species ?? d?.subjectStyle ?? '—'),
    frame: String(d?.frame),
    marks: [...front.matchAll(/data-picto="([a-z]+)"/g)].map((m) => m[1]).join(',') || '—',
    legal: [...back.matchAll(/>(KULLANIM|UYARI|İÇİNDEKİLER|SAKLAMA KOŞULLARI|ÜRETİCİ|Besin Değerleri[^<]*|KOKU PİRAMİDİ)</g)].map((m) => m[1]!.slice(0, 14)).join(' ') || '—',
  })
}

console.log('sektör       arketip           alan            tip sistemi                    süs       mizaç           çerçeve')
for (const r of rows) {
  console.log(
    `${r.sector.padEnd(12)} ${r.archetype.padEnd(17)} ${r.background.padEnd(15)} ${r.typePairing.padEnd(30)} ${r.ornament.padEnd(9)} ${r.temperament.padEnd(15)} ${r.frame}`,
  )
}

console.log('\nsektör       arka yüz bilgi mimarisi')
for (const r of rows) console.log(`${r.sector.padEnd(12)} ${r.legal}`)

const axes: (keyof Row)[] = ['archetype', 'background', 'typePairing', 'ornament', 'temperament', 'frame', 'legal']
console.log('\neksen bazında sektör ayrımı:')
for (const axis of axes) {
  const values = new Set(rows.map((r) => r[axis]))
  console.log(`  ${String(axis).padEnd(13)} ${String(values.size).padStart(2)} farklı değer / ${rows.length} sektör${values.size === 1 ? '  ← SEKTÖR HİÇ DOKUNMUYOR' : ''}`)
}
const fingerprint = (r: Row) => `${r.archetype}|${r.background}|${r.typePairing}|${r.ornament}|${r.frame}`
const uniq = new Set(rows.map(fingerprint))
console.log(`\ngörsel parmak izi: ${uniq.size} farklı / ${rows.length} sektör`)
const groups = new Map<string, string[]>()
for (const r of rows) groups.set(fingerprint(r), [...(groups.get(fingerprint(r)) ?? []), r.sector])
for (const [, list] of groups) if (list.length > 1) console.log(`  aynı parmak izi: ${list.join(', ')}`)
