import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { createPlan } from '../src/engine/brain/DesignDirector'
import { parseIntent } from '../src/engine/iterate/parseIntent'
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

let fails = 0
function assert(ok: boolean, msg: string) {
  if (!ok) {
    console.error('FAIL', msg)
    fails += 1
  }
}

const engine = new FormaLocalEngine()
const luxury = engine.generate({ brief: brief() })
assert(!!luxury.designPlan, 'missing DesignPlan')
assert(luxury.designPlan?.hierarchy.primary === 'brand', 'hierarchy not brand-first')
assert(luxury.designPlan?.hierarchy.order.includes('brand'), 'hierarchy order')
assert(luxury.designPlan?.decor.lockupClearance === true, 'lockup clearance missing')
assert(luxury.designPlan?.marks.frontClean === true, 'marks frontClean')
assert(/perfume/i.test(luxury.designPlan?.marks.recipeKey ?? ''), `recipe ${luxury.designPlan?.marks.recipeKey}`)
assert(luxury.designPlan?.risks.includes('gold_rule_cannot_cross_glyphs'), 'luxury risks')
assert(luxury.designPlan?.summaryTr.includes('marka baskın'), `summary ${luxury.designPlan?.summaryTr}`)
assert(!!luxury.critique, 'missing critique')
assert(luxury.critique?.hints.some((h) => h.action === 'KEEP'), 'critique has no KEEP')

const face = luxury.artwork.layers.find((l) => l.panelId === 'front')?.markup ?? ''
assert(face.includes('lockout-'), 'luxury lost lockout')
assert(!face.includes('fill-opacity="0.9"'), 'default luxury still paints corner diamonds')
assert(!face.includes('data-mark="barcode"'), 'barcode on luxury front')

const intent = parseIntent('daha lüks yap', 'luxury')
assert(intent.overridePatch.directorCue === 'luxury-tighten', `cue ${intent.overridePatch.directorCue}`)
assert(intent.overridePatch.paletteShift !== 'gold', 'daha lüks dumped gold palette')

const tight = engine.generate({
  brief: brief(),
  prev: luxury,
  overridePatch: { directorCue: 'luxury-tighten' },
})
assert(tight.designPlan?.cue === 'luxury-tighten', 'tighten cue not stored')
assert(tight.designPlan?.decor.density === 'sparse', `tighten density ${tight.designPlan?.decor.density}`)
assert(tight.designPlan?.decor.restrainExtras === true, 'tighten did not restrain extras')
assert(tight.designPlan?.composition.negativeSpace === 'high', 'tighten space')
const tightFace = tight.artwork.layers.find((l) => l.panelId === 'front')?.markup ?? ''
assert(!tightFace.includes('fill-opacity="0.9"'), 'tighten still paints corner diamonds')
assert(tightFace.includes('lockout-'), 'tighten lost lockout')
assert(tightFace.includes('AURELIA'), 'tighten lost brand')
assert(tight.overrides.titleScale === 1.1, `tighten titleScale ${tight.overrides.titleScale}`)
assert(tightFace.length !== face.length, 'tighten did not change markup')

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
assert(food.designPlan?.sector === 'food', `food sector ${food.designPlan?.sector}`)
assert(food.designPlan?.risks.includes('no_perfume_icons'), 'food risks')

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
assert(elec.designPlan?.sector === 'electronics', 'elec sector')
assert(elec.designPlan?.positioning === 'premium', 'modern positioning')

const label = engine.generate({
  brief: brief({
    packagingMode: 'label',
    templateId: 'fm-cos-label-bottle',
    dimensionsMm: { L: 90, W: 0, H: 70 },
  }),
})
assert(label.designPlan?.surface === 'label', 'label surface')
assert(label.designPlan?.dielineBehavior.labelFrontDesign && label.designPlan.dielineBehavior.labelBackUtility, 'label split')

const plan = createPlan({ brief: brief({ styleType: 'minimal' }), style: 'minimal' })
assert(plan.decor.density === 'sparse' && plan.composition.negativeSpace === 'high', 'minimal rule')

if (fails) {
  console.error(`Brain smoke failed (${fails})`)
  process.exit(1)
}
console.log('Brain v3 smoke passed')
console.log(' ', luxury.designPlan?.summaryTr)
console.log('  tighten', tight.designPlan?.summaryTr)
