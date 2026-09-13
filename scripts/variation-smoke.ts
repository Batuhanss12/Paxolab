import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
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
  return spec.artwork.layers.find((l) => l.panelId === 'front')?.markup ?? ''
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
const set0 = engine.generate({ brief: brief() })
assert((set0.designPlan?.variationIndex ?? -1) === 0, `set0 index ${set0.designPlan?.variationIndex}`)
assert(set0.designPlan?.heroGraphic.family === 'crest', `set0 hero ${set0.designPlan?.heroGraphic.family}`)
assert(set0.designPlan?.patternSystem.family === 'contour', `set0 pattern ${set0.designPlan?.patternSystem.family}`)
const face0 = face(set0)
assert(face0.includes('data-hero="crest"'), 'set0 missing crest')
assert(!face0.includes('fill-opacity="0.9"'), 'set0 still paints diamonds')

const set1 = engine.generate({
  brief: brief(),
  prev: set0,
  overridePatch: { variationIndex: 1 },
})
assert(set1.designPlan?.variationIndex === 1, `set1 index ${set1.designPlan?.variationIndex}`)
assert(set1.designPlan?.heroGraphic.family !== set0.designPlan?.heroGraphic.family, 'set1 hero same as set0')
assert(
  set1.designPlan?.patternSystem.family !== set0.designPlan?.patternSystem.family ||
    set1.designPlan?.heroGraphic.family !== set0.designPlan?.heroGraphic.family,
  'set1 identical vocabulary',
)
const face1 = face(set1)
assert(face1 !== face0, 'set1 markup identical')
assert(/data-hero="(seal|crest|emblem)"/.test(face1), `set1 hero tag ${set1.designPlan?.heroGraphic.family}`)
assert(face1.includes('AURELIA'), 'set1 lost brand')
assert(!face1.includes('data-mark="barcode"'), 'barcode on set1 front')

const set2 = engine.generate({
  brief: brief(),
  prev: set1,
  overridePatch: { variationIndex: 2 },
})
assert(set2.designPlan?.variationIndex === 2, 'set2 index')
assert(face(set2) !== face0, 'set2 identical to set0')
assert(face(set2) !== face1, 'set2 identical to set1')
assert(
  set2.designPlan?.heroGraphic.family !== set1.designPlan?.heroGraphic.family ||
    set2.designPlan?.patternSystem.family !== set1.designPlan?.patternSystem.family ||
    set2.designPlan?.artDirection.chrome !== set1.designPlan?.artDirection.chrome,
  'set2 vocabulary same as set1',
)

const tight = engine.generate({
  brief: brief(),
  prev: set1,
  overridePatch: { directorCue: 'luxury-tighten', variationIndex: 1 },
})
assert(tight.designPlan?.variationIndex === 1, 'tighten dropped variationIndex')
assert(tight.designPlan?.decor.restrainExtras, 'tighten lost air')
assert(tight.designPlan?.heroGraphic.family === set1.designPlan?.heroGraphic.family, 'tighten swapped hero')

resetArtMemory()
const modern0 = engine.generate({ brief: brief({ styleType: 'modern' }) })
const modern1 = engine.generate({
  brief: brief({ styleType: 'modern' }),
  prev: modern0,
  overridePatch: { variationIndex: 1 },
})
assert(modern1.designPlan?.patternSystem.family !== modern0.designPlan?.patternSystem.family, 'modern pattern did not vary')

resetArtMemory()
const food1 = engine.generate({
  brief: brief({
    brandName: 'Terra Grove',
    productName: 'Zeytinyağı',
    sector: 'gıda',
    subProduct: 'yağ',
    volume: '500 ml',
    dimensionsMm: { L: 80, W: 50, H: 180 },
  }),
  overridePatch: { variationIndex: 1 },
})
assert(food1.designPlan?.sector === 'food', 'food sector')
assert(/food/i.test(food1.designPlan?.marks.recipeKey ?? ''), `food marks ${food1.designPlan?.marks.recipeKey}`)
assert(!/2004\.78|986\.01/.test(face(food1)), 'food perfume asset leak')

if (fails) {
  console.error(`Variation smoke failed (${fails})`)
  process.exit(1)
}
console.log('Variation v3.6 smoke passed')
console.log('  set0', set0.designPlan?.heroGraphic.family, set0.designPlan?.patternSystem.family)
console.log('  set1', set1.designPlan?.heroGraphic.family, set1.designPlan?.patternSystem.family, set1.designPlan?.summaryTr)
