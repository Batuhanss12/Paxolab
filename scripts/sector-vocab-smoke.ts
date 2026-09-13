import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { lookupVocabulary, detectCrossSectorBleed } from '../src/engine/brain/SectorVisualVocabulary'
import type { DesignBrief } from '../src/types'

function brief(partial: Partial<DesignBrief> = {}): DesignBrief {
  return {
    brandName: 'Test',
    productName: '',
    sector: '',
    subProduct: '',
    packagingMode: 'box',
    templateId: '',
    dimensionsMm: { L: 70, W: 35, H: 140 },
    styleType: 'luxury',
    colors: '',
    volume: '50 ml',
    barcode: '8681234567890',
    manufacturerName: 'Test A.Ş.',
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

let fails = 0
function assert(ok: boolean, msg: string) {
  if (!ok) {
    console.error('FAIL', msg)
    fails += 1
  }
}

const perfumeVocab = lookupVocabulary('perfume', 'parfum')
assert(perfumeVocab.id === 'perfume:parfum', `perfume vocab ${perfumeVocab.id}`)
assert(perfumeVocab.forbiddenHeroes.includes('harvest'), 'perfume allows harvest')
assert(perfumeVocab.forbiddenMotifs.includes('bee'), 'perfume allows bee')
assert(!perfumeVocab.claimStrip, 'perfume has claim strip')

const honeyVocab = lookupVocabulary('food', 'honey')
assert(honeyVocab.id === 'food:honey', `honey vocab ${honeyVocab.id}`)
assert(honeyVocab.forbiddenHeroes.includes('crest'), 'honey allows crest')
assert(honeyVocab.forbiddenMotifs.includes('eau-de-parfum'), 'honey allows EDP')
assert(honeyVocab.claimStrip, 'honey missing claim strip')
assert(honeyVocab.legalKitId === 'nutrition', `honey legal ${honeyVocab.legalKitId}`)

const elecVocab = lookupVocabulary('electronics', 'audio')
assert(elecVocab.forbiddenHeroes.includes('harvest'), 'electronics allows harvest')
assert(elecVocab.forbiddenHeroes.includes('crest'), 'electronics allows crest')
assert(elecVocab.forbiddenMotifs.includes('bee'), 'electronics allows bee')

const bleedHarvest = detectCrossSectorBleed(perfumeVocab, 'harvest', 'contour', 'dark-field', 'perfume')
assert(bleedHarvest.some((f) => f.code === 'CROSS_SECTOR_HERO'), 'harvest on perfume not flagged')

const bleedCrest = detectCrossSectorBleed(honeyVocab, 'crest', 'ornament', 'dark-field', 'food')
assert(bleedCrest.some((f) => f.code === 'CROSS_SECTOR_HERO'), 'crest on food not flagged')

const bleedPerfumeCopy = detectCrossSectorBleed(honeyVocab, 'harvest', 'ornament', 'kraft', 'food', 'EAU DE PARFUM')
assert(bleedPerfumeCopy.some((f) => f.code === 'CROSS_SECTOR_BLEED'), 'EDP copy on food not flagged')

const cleanPerfume = detectCrossSectorBleed(perfumeVocab, 'crest', 'contour', 'dark-field', 'perfume')
assert(cleanPerfume.length === 0, `clean perfume has faults: ${cleanPerfume.map((f) => f.code).join(',')}`)

const cleanFood = detectCrossSectorBleed(honeyVocab, 'harvest', 'ornament', 'kraft', 'food')
assert(cleanFood.length === 0, `clean food has faults: ${cleanFood.map((f) => f.code).join(',')}`)

resetArtMemory()
const engine = new FormaLocalEngine()

const perfume = engine.generate({
  brief: brief({ brandName: 'Aurelia', productName: 'Noir', sector: 'parfüm', subProduct: 'edp', styleType: 'luxury' }),
})
assert(perfume.designPlan?.vocabularyId === 'perfume:parfum', `perfume vocabId ${perfume.designPlan?.vocabularyId}`)
assert(perfume.designPlan?.heroGraphic.family === 'crest', `perfume hero ${perfume.designPlan?.heroGraphic.family}`)
const pFace = face(perfume)
assert(pFace.includes('EAU DE PARFUM'), 'perfume missing EDP')
assert(!pFace.includes('NET') || !pFace.includes('Besin'), 'perfume has food copy')
assert(!perfume.critique?.needsRepair, 'perfume triggered repair')

resetArtMemory()
const honey = engine.generate({
  brief: brief({
    brandName: 'Anadolu Bal',
    productName: 'Dağ Balı',
    sector: 'gıda',
    subProduct: 'bal',
    volume: '450 g',
    dimensionsMm: { L: 80, W: 50, H: 180 },
    styleType: 'luxury',
  }),
})
assert(honey.designPlan?.vocabularyId === 'food:honey', `honey vocabId ${honey.designPlan?.vocabularyId}`)
assert(honey.designPlan?.heroGraphic.family === 'harvest', `honey hero ${honey.designPlan?.heroGraphic.family}`)
const hFace = face(honey)
assert(!hFace.includes('EAU DE PARFUM'), 'honey has perfume EDP')
assert(!hFace.includes('Alcohol Denat'), 'honey has perfume composition')
assert(!/2004\.78|986\.01/.test(hFace), 'honey has perfume icon viewbox')
assert(hFace.includes('NET') || hFace.includes('EXTRA VIRGIN') || hFace.includes('ARTISAN'), 'honey missing food copy')
assert(!honey.critique?.needsRepair, 'honey triggered repair')

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
assert(elec.designPlan?.heroGraphic.family === 'tech', `elec hero ${elec.designPlan?.heroGraphic.family}`)
const eFace = face(elec)
assert(!eFace.includes('EAU DE PARFUM'), 'electronics has perfume')
assert(!eFace.includes('honey') && !eFace.includes('bee'), 'electronics has food pastoral')
assert(/WIRELESS|SPEC/.test(eFace), 'electronics missing spec')

resetArtMemory()
const luxuryHoney = engine.generate({
  brief: brief({
    brandName: 'Royal',
    productName: 'Çam Balı',
    sector: 'gıda',
    subProduct: 'bal',
    volume: '500 g',
    dimensionsMm: { L: 80, W: 50, H: 180 },
    styleType: 'luxury',
  }),
})
assert(luxuryHoney.designPlan?.heroGraphic.family !== 'crest', 'luxury food got perfume crest')
assert(luxuryHoney.designPlan?.patternSystem.family !== 'lattice', 'luxury food got electronics lattice')
const lhFace = face(luxuryHoney)
assert(!lhFace.includes('EAU DE PARFUM'), 'luxury honey has EDP')
assert(!lhFace.includes('Alcohol Denat'), 'luxury honey has perfume composition')

if (fails) {
  console.error(`Sector vocabulary smoke failed (${fails})`)
  process.exit(1)
}
console.log('Sector vocabulary smoke passed')
console.log('  perfume:', perfume.designPlan?.vocabularyId, perfume.designPlan?.heroGraphic.family)
console.log('  honey:', honey.designPlan?.vocabularyId, honey.designPlan?.heroGraphic.family)
console.log('  elec:', elec.designPlan?.vocabularyId, elec.designPlan?.heroGraphic.family)
console.log('  luxury-honey:', luxuryHoney.designPlan?.vocabularyId, luxuryHoney.designPlan?.heroGraphic.family)
console.log('  cross-bleed faults detected:', bleedHarvest.length, bleedCrest.length, bleedPerfumeCopy.length)
