import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { typeScaleFor } from '../src/engine/designSystem/kits'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { buildCombinedSvg } from '../src/engine/production/exportDoc'
import type { DesignBrief } from '../src/types'

function brief(partial: Partial<DesignBrief> = {}): DesignBrief {
  return {
    brandName: 'Aurelia',
    productName: 'Noir',
    sector: 'parfüm',
    subProduct: 'edp',
    packagingMode: 'box',
    templateId: '',
    dimensionsMm: { L: 70, W: 35, H: 140 },
    styleType: 'luxury',
    colors: 'siyah altın',
    volume: '50 ml',
    barcode: '8681234567890',
    manufacturerName: 'Aurelia Kozmetik A.Ş.',
    manufacturerAddress: 'İstanbul TR',
    logo: '',
    references: '',
    copyOverrides: '',
    ...partial,
  }
}

function face(spec: { artwork: { layers: { panelId: string; markup: string }[] } }): string {
  return spec.artwork.layers.find((l) => l.panelId === 'front' || l.panelId === 'label')?.markup ?? ''
}

function glue(spec: { artwork: { layers: { panelId: string; markup: string }[] } }): string {
  return spec.artwork.layers
    .filter((l) => /glue|overlap/i.test(l.panelId))
    .map((l) => l.markup)
    .join('\n')
}

let fails = 0
function assert(ok: boolean, msg: string) {
  if (!ok) {
    console.error('FAIL', msg)
    fails += 1
  }
}

resetArtMemory()
const engine = new FormaLocalEngine()

const perfume = typeScaleFor('luxury', 'box', false, 'perfume')
assert(perfume.displayMm === 9.1, `perfume luxury display ${perfume.displayMm}`)
assert(Math.abs(perfume.trackingDisplay - 0.62) < 0.001, `perfume tracking ${perfume.trackingDisplay}`)

const foodType = typeScaleFor('luxury', 'box', false, 'food')
assert(foodType.displayMm < perfume.displayMm, `food type not distinct ${foodType.displayMm}`)

resetArtMemory()
const set0 = engine.generate({ brief: brief() })
const face0 = face(set0)
assert((set0.designPlan?.variationIndex ?? -1) === 0, 'set0 index')
assert(set0.designPlan?.heroGraphic.family === 'crest', `set0 hero ${set0.designPlan?.heroGraphic.family}`)
assert(set0.designPlan?.illustrationSystem.primitives.length === 0, 'set0 luxury primitives')
assert(face0.includes('data-hero="crest"'), 'set0 missing crest')
assert(face0.includes('fill-opacity="0.9"'), 'set0 lost diamonds')
assert(face0.includes('lockout-'), 'set0 lost lockout')
assert(!face0.includes('data-art="primitive"'), 'set0 painted primitives')
assert(!/data-art="hero"/.test(glue(set0)), 'glue carries hero')
assert(set0.preflight.items.some((i) => i.id === 'proof'), 'missing proof item')
assert(set0.preflight.items.find((i) => i.id === 'glue-art')?.status === 'pass', 'glue-art not pass')
assert(set0.preflight.items.find((i) => i.id === 'type-fit')?.status === 'pass', 'type-fit not pass')
assert(!set0.critique?.needsRepair, 'default luxury auto-repair')

const long = engine.generate({
  brief: brief({ brandName: 'Maison Aurelia Noir', productName: 'Collection' }),
})
const longFace = face(long)
assert(longFace.includes('MAISON AURELIA'), 'long brand lost head line')
assert(longFace.includes('NOIR'), 'long brand lost second line')
assert(!long.preflight.collisions, `long brand collision ${long.preflight.items.find((i) => i.id === 'collision')?.detail}`)

const set1 = engine.generate({
  brief: brief(),
  prev: set0,
  overridePatch: { variationIndex: 1 },
})
const face1 = face(set1)
assert(set1.designPlan?.variationIndex === 1, 'set1 index')
assert(set1.designPlan?.heroGraphic.family !== set0.designPlan?.heroGraphic.family, 'set1 hero same')
assert(face1 !== face0, 'set1 markup identical')
assert((set1.designPlan?.illustrationSystem.primitives.length ?? 0) >= 1, 'set1 missing primitive plan')
assert(face1.includes('data-art="primitive"'), 'set1 did not paint primitive')
assert(face1.includes('AURELIA'), 'set1 lost brand')

resetArtMemory()
const food = engine.generate({
  brief: brief({
    brandName: 'Terra Grove',
    productName: 'Zeytinyağı',
    sector: 'gıda',
    subProduct: 'yağ',
    volume: '500 ml',
    dimensionsMm: { L: 80, W: 50, H: 180 },
  }),
})
const foodFace = face(food)
assert(food.designPlan?.sector === 'food', 'food sector')
assert(foodFace.includes('data-hero="harvest"'), 'food missing harvest')
assert(/NET|EXTRA VIRGIN/.test(foodFace), 'food missing NET/harvest copy')
assert(!foodFace.includes('fill-opacity="0.9"'), 'food still has perfume diamonds')
assert(!foodFace.includes('EAU DE PARFUM'), 'food wears perfume')
assert(!/2004\.78|986\.01/.test(foodFace), 'food perfume asset leak')

resetArtMemory()
const elec = engine.generate({
  brief: brief({
    brandName: 'Nox',
    productName: 'Pulse',
    sector: 'elektronik',
    subProduct: 'kulaklık',
    styleType: 'modern',
    volume: '',
    dimensionsMm: { L: 90, W: 45, H: 90 },
  }),
})
const elecFace = face(elec)
assert(!elecFace.includes('EAU DE PARFUM'), 'elec perfume copy')
assert(/WIRELESS|SPEC/.test(elecFace), 'elec missing spec')

const ready = engine.generate({
  brief: brief(),
  overridePatch: { printReady: true },
})
const svg = buildCombinedSvg(ready)
assert(!!svg && svg.includes('data-proof="safe"'), 'printReady combined missing safe inset')
assert(!!svg && svg.includes('not PDF/X'), 'proof comment missing')

if (fails) {
  console.error(`Studio smoke failed (${fails})`)
  process.exit(1)
}
console.log('Studio S1–S5 smoke passed')
console.log('  set0', set0.designPlan?.heroGraphic.family, 'prims', set0.designPlan?.illustrationSystem.primitives.length)
console.log('  set1', set1.designPlan?.heroGraphic.family, set1.designPlan?.illustrationSystem.primitives.join(','))
console.log('  food jewelry off · perfume diamonds on')
