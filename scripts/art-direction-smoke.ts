import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { createPlan } from '../src/engine/brain/DesignDirector'
import { critiquePlan } from '../src/engine/brain/CritiqueEngine'
import { repairPlan } from '../src/engine/brain/RepairPlanner'
import { scoreDesign } from '../src/engine/brain/DesignScore'
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

let fails = 0
function assert(ok: boolean, msg: string) {
  if (!ok) {
    console.error('FAIL', msg)
    fails += 1
  }
}

function heroes(markup: string): number {
  return (markup.match(/data-art="hero"/g) || []).length
}

function faceOf(spec: { artwork: { layers: { panelId: string; markup: string }[] } }): string {
  return spec.artwork.layers.find((l) => l.panelId === 'front' || l.panelId === 'label')?.markup ?? ''
}

resetArtMemory()
const engine = new FormaLocalEngine()

const luxury = engine.generate({ brief: brief() })
const luxFace = faceOf(luxury)
assert(!!luxury.designPlan?.artDirection, 'missing artDirection')
assert(!!luxury.designPlan?.visualConcept.id, 'missing visualConcept')
assert(luxury.designPlan?.heroGraphic.family === 'crest', `luxury hero ${luxury.designPlan?.heroGraphic.family}`)
assert(luxury.designPlan?.patternSystem.family === 'contour' && luxury.designPlan.patternSystem.avoidLockup, 'luxury pattern')
assert(luxury.designPlan?.backgroundTreatment === 'dark-field', `bg ${luxury.designPlan?.backgroundTreatment}`)
assert(luxury.designPlan?.density.front === 'dense', `density ${luxury.designPlan?.density.front}`)
assert(luxFace.includes('data-hero="crest"'), 'luxury front missing crest tag')
assert(heroes(luxFace) === 1, `luxury heroes ${heroes(luxFace)}`)
assert(luxFace.includes('lockout-'), 'luxury lost lockout')
assert(luxFace.includes('fill-opacity="0.9"'), 'luxury lost diamonds')
assert(!luxury.critique?.needsRepair, 'default luxury should not auto-repair')
assert(!luxury.critique?.repaired, 'default luxury ran repair')

const tight = engine.generate({
  brief: brief(),
  prev: luxury,
  overridePatch: { directorCue: 'luxury-tighten' },
})
const tightFace = faceOf(tight)
assert(tight.designPlan?.cue === 'luxury-tighten', 'tighten cue')
assert(tight.designPlan?.decor.density === 'sparse' && tight.designPlan.decor.restrainExtras, 'tighten air')
assert(tight.designPlan?.heroGraphic.family === 'crest', 'tighten swapped hero')
assert(!tightFace.includes('fill-opacity="0.9"'), 'tighten still paints diamonds')
assert(tightFace.includes('AURELIA'), 'tighten lost brand')
assert(heroes(tightFace) === 1, `tighten heroes ${heroes(tightFace)}`)

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
const foodFace = faceOf(food)
assert(food.designPlan?.sector === 'food', 'food sector')
assert(food.designPlan?.heroGraphic.family === 'harvest', `food hero ${food.designPlan?.heroGraphic.family}`)
assert(foodFace.includes('data-hero="harvest"'), 'food missing harvest tag')
assert(heroes(foodFace) === 1, `food heroes ${heroes(foodFace)}`)
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
const elecFace = faceOf(elec)
assert(elec.designPlan?.sector === 'electronics', 'elec sector')
assert(elec.designPlan?.heroGraphic.family === 'tech', `elec hero ${elec.designPlan?.heroGraphic.family}`)
assert(elecFace.includes('data-hero="tech"'), 'elec missing tech tag')
assert(heroes(elecFace) === 1, `elec heroes ${heroes(elecFace)}`)
assert(!/EAU DE PARFUM|2004\.78/.test(elecFace), 'elec perfume copy/asset')

resetArtMemory()
const overloaded = createPlan({ brief: brief(), style: 'luxury', cue: 'force-overload' })
assert(overloaded.illustrationSystem.primitives.length >= 6, `overload prims ${overloaded.illustrationSystem.primitives.length}`)
assert(overloaded.cue === 'force-overload', 'overload cue')

const fakeFace = `${'<g data-art="hero" data-hero="crest"></g>'.repeat(3)}<g data-art="primitive"></g>`.repeat(8)
const fakeSpec = {
  artwork: { layers: [{ panelId: 'front', markup: fakeFace }], frontPanelId: 'front', language: 'tr', systemKey: 'x' },
  preflight: { ok: true, items: [] as { id: string; status: 'pass' | 'warn' | 'fail' }[] },
  copy: luxury.copy,
  kind: 'packaging' as const,
}
const report = critiquePlan(overloaded, scoreDesign(fakeSpec, overloaded))
assert(report.needsRepair, 'overload critique should repair')
assert(report.hints.some((h) => h.topic === 'densityFront' && h.action === 'MODIFY'), 'missing densityFront hint')
const fixed = repairPlan(overloaded, report)
assert(fixed.cue !== 'force-overload', `repair left cue ${fixed.cue}`)
assert(fixed.decor.restrainExtras && fixed.decor.density === 'sparse', 'repair did not sparse')
assert(fixed.illustrationSystem.primitives.length <= 2, `repair prims ${fixed.illustrationSystem.primitives.length}`)

resetArtMemory()
const loop = engine.generate({
  brief: brief(),
  overridePatch: { directorCue: 'force-overload' },
})
const loopFace = faceOf(loop)
assert(loop.critique?.repaired, 'engine did not run one repair pass')
assert(!loop.critique?.needsRepair, 'engine left needsRepair on')
assert(heroes(loopFace) === 1, `repaired heroes ${heroes(loopFace)}`)
assert(loop.designPlan?.illustrationSystem.primitives.length <= 2, 'repaired plan still overloaded')
assert(loop.designPlan?.decor.restrainExtras, 'repaired plan not restrained')
assert(loopFace.includes('AURELIA'), 'repair lost brand')
assert(loopFace.includes('lockout-'), 'repair lost lockout')

if (fails) {
  console.error(`Art-direction smoke failed (${fails})`)
  process.exit(1)
}
console.log('Art-direction v3.5 smoke passed')
console.log(' ', luxury.designPlan?.summaryTr)
console.log('  food', food.designPlan?.heroGraphic.family, food.designPlan?.visualConcept.id)
console.log('  elec', elec.designPlan?.heroGraphic.family, elec.designPlan?.visualConcept.id)
console.log('  repair', loop.designPlan?.summaryTr)
