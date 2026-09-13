import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { evaluateDesignGates, resolveDesignSystem } from '../src/engine/designSystem'
import { paoMonthsFromBrief, resolveMarks } from '../src/engine/marks/MarkMatrix'
import { PERFUME_VIEWBOXES } from '../src/engine/marks/perfumeAssets'
import { opticalStrip } from '../src/engine/marks/stripLayout'
import type { DesignBrief } from '../src/types'

function brief(partial: Partial<DesignBrief>): DesignBrief {
  return {
    brandName: 'Test',
    productName: 'Item',
    sector: '',
    subProduct: '',
    packagingMode: 'box',
    templateId: '',
    dimensionsMm: { L: 70, W: 35, H: 140 },
    styleType: 'luxury',
    colors: '',
    volume: '50 ml',
    barcode: '',
    manufacturerName: '',
    manufacturerAddress: '',
    logo: '',
    references: '',
    copyOverrides: '',
    ...partial,
  }
}

let fails = 0
function assert(ok: boolean, msg: string) {
  if (!ok) {
    console.error('FAIL', msg)
    fails += 1
  }
}

const perfume = resolveMarks('perfume', 'box', 70, 140)
assert(perfume.strip.join(',') === 'flammable,keepaway,pao,leaflet', `perfume strip ${perfume.strip}`)
assert(perfume.recipe.perfumeAssets.flammable === 'ic1', 'ic1 mapping')

const label = resolveMarks('perfume', 'label', 80, 40)
assert(label.strip.length === 0, 'label face must skip bulky strip')

const tiny = resolveMarks('perfume', 'box', 30, 80)
assert(tiny.strip.length === 0, 'tiny face must skip strip')

const food = resolveMarks('food', 'box', 80, 180)
assert(!food.strip.includes('flammable') && !food.strip.includes('pao'), 'food perfume ids')

const elec = resolveMarks('electronics', 'box', 90, 90)
assert(!elec.strip.includes('flammable') && !elec.strip.includes('pao'), 'elec perfume ids')

assert(paoMonthsFromBrief(brief({ paoMonths: '12M' }), '36M') === '12M', 'brief pao field')
assert(paoMonthsFromBrief(brief({ copyOverrides: 'PAO 6 ay' }), '36M') === '6M', 'brief pao text')
assert(paoMonthsFromBrief(brief({}), '36M') === '36M', 'perfume default pao')

const layout = opticalStrip(['flammable', 'keepaway', 'pao', 'leaflet'], 58, perfume.recipe)
assert(layout.ids.length === 4, `optical kept 4 got ${layout.ids.length}`)
assert(layout.xs[0] >= 0, 'optical x0')
for (let i = 1; i < layout.xs.length; i++) {
  assert(layout.xs[i] >= layout.xs[i - 1] + layout.size, `overlap at ${i}`)
}

const engine = new FormaLocalEngine()
const perfumeSpec = engine.generate({
  brief: brief({
    brandName: 'Aurelia',
    productName: 'Noir',
    sector: 'parfüm',
    subProduct: 'edp',
    barcode: '8681234567890',
    manufacturerName: 'Aurelia',
    manufacturerAddress: 'İstanbul TR',
  }),
})
const perfumeArt = perfumeSpec.artwork.layers.map((l) => l.markup).join('')
assert(
  PERFUME_VIEWBOXES.every((vb) => perfumeArt.includes(vb)),
  'perfume box missing PARFUM İCON viewBoxes',
)

const foodSpec = engine.generate({
  brief: brief({
    brandName: 'Terra Grove',
    productName: 'Zeytinyağı',
    sector: 'gıda',
    subProduct: 'yağ',
    volume: '500 ml',
    dimensionsMm: { L: 80, W: 50, H: 180 },
  }),
})
const foodArt = foodSpec.artwork.layers.map((l) => l.markup).join('')
assert(
  PERFUME_VIEWBOXES.every((vb) => !foodArt.includes(vb)),
  'food artwork leaked perfume viewBoxes',
)

const elecSpec = engine.generate({
  brief: brief({
    brandName: 'Nox',
    productName: 'Kulaklık',
    sector: 'elektronik',
    subProduct: 'kulaklık',
    styleType: 'modern',
    dimensionsMm: { L: 90, W: 45, H: 90 },
  }),
})
const elecArt = elecSpec.artwork.layers.map((l) => l.markup).join('')
assert(
  PERFUME_VIEWBOXES.every((vb) => !elecArt.includes(vb)),
  'electronics artwork leaked perfume viewBoxes',
)

const wrap = engine.generate({
  brief: brief({
    brandName: 'Aurelia',
    productName: 'Noir',
    sector: 'parfüm',
    packagingMode: 'label',
    templateId: 'fm-cos-label-bottle',
    dimensionsMm: { L: 90, W: 0, H: 70 },
  }),
})
const face = wrap.artwork.layers.find((l) => l.panelId === 'label')?.markup ?? ''
const sticker = wrap.artwork.layers.find((l) => l.panelId === 'labelBack')?.markup ?? ''
assert(PERFUME_VIEWBOXES.every((vb) => !face.includes(vb)), 'label face leaked perfume icons')
assert(sticker.includes('2004.78'), 'back label missing IC1')

const sys = resolveDesignSystem(foodSpec.brief, foodSpec.structureId)
const leakGate = evaluateDesignGates(
  {
    brief: foodSpec.brief,
    copy: foodSpec.copy,
    kind: foodSpec.kind,
    palette: foodSpec.palette,
    structureId: foodSpec.structureId,
    artwork: {
      ...foodSpec.artwork,
      layers: [{ panelId: 'back', markup: '<svg viewBox="0 0 2004.78 2004.78"></svg>' }],
    },
  },
  sys,
)
assert(
  leakGate.some((g) => g.id === 'ds-marks' && g.status === 'fail'),
  'leak gate did not fail on planted perfume viewBox',
)

if (fails) {
  console.error(`D3 smoke failed (${fails})`)
  process.exit(1)
}
console.log('D3 marks smoke passed')
console.log('  perfume IC1–IC4 · label/tiny skip · food/elec leak gate')
console.log('  PAO from brief · optical strip no overlap')
