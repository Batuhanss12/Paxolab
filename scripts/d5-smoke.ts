import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { extractFields } from '../src/engine/extract'
import { resolveDesignSystem } from '../src/engine/designSystem/resolve'
import type { DesignBrief } from '../src/types'

function brief(partial: Partial<DesignBrief>): DesignBrief {
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
    barcode: '',
    manufacturerName: 'Test A.Ş.',
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

const bare = extractFields('Aurelia için parfüm kutusu, luxury', [])
assert(bare.brandName === 'Aurelia', `bare brand ${bare.brandName}`)
assert(bare.productName !== 'Parfüm' && !bare.productName, `bare product ${bare.productName}`)

const named = extractFields('Aurelia için Noir parfüm kutusu, 50 ml', [])
assert(named.productName === 'Noir', `named product ${named.productName}`)

const paletteLeak = extractFields('Aurelia Noir için siyah-altın parfüm kutusu, 50 ml, 70×35×140 mm', [])
assert(paletteLeak.productName !== 'siyah-altın', `palette leaked into product (${paletteLeak.productName})`)
assert(!/örnek/i.test(paletteLeak.brandName ?? ''), `skip word as brand ${paletteLeak.brandName}`)
assert(paletteLeak.brandName === 'Aurelia', `palette brief brand ${paletteLeak.brandName}`)
assert(paletteLeak.productName === 'Noir', `palette brief product ${paletteLeak.productName}`)

const skipOnly = extractFields('örnek', [])
assert(!skipOnly.brandName, `örnek became brand ${skipOnly.brandName}`)

const oil = extractFields('Terra Grove için zeytinyağı kutusu, 500 ml', [])
assert(oil.sector === 'gıda' || /yağ|gıda/.test(oil.subProduct ?? oil.sector ?? ''), `oil sector ${oil.sector}`)
assert(oil.productName !== 'Parfüm', 'oil product became Parfüm')

const engine = new FormaLocalEngine()
const perfume = engine.generate({
  brief: brief({
    brandName: 'Aurelia',
    productName: 'Parfüm',
    sector: 'parfüm',
    subProduct: 'edp',
    volume: '50 ml',
  }),
})
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
const cream = engine.generate({
  brief: brief({
    brandName: 'Lumina',
    productName: 'Night',
    sector: 'kozmetik',
    subProduct: 'krem',
    volume: '50 ml',
    dimensionsMm: { L: 80, W: 40, H: 80 },
  }),
})

const pFace = perfume.artwork.layers.find((l) => l.panelId === 'front')?.markup ?? ''
const fFace = food.artwork.layers.find((l) => l.panelId === 'front')?.markup ?? ''
const eFace = elec.artwork.layers.find((l) => l.panelId === 'front')?.markup ?? ''
const cFace = cream.artwork.layers.find((l) => l.panelId === 'front')?.markup ?? ''
const fBack = food.artwork.layers.find((l) => l.panelId === 'back')?.markup ?? ''
const eBack = elec.artwork.layers.find((l) => l.panelId === 'back')?.markup ?? ''

assert(perfume.copy.product !== 'Parfüm' && !pFace.includes('>PARFÜM<') && !pFace.includes('>PARFUM<'), 'perfume lockup still says PARFÜM')
assert(pFace.includes('EAU DE PARFUM'), 'perfume front missing EDP')
assert(!pFace.includes('FACE CREAM') && !pFace.includes('EXTRA VIRGIN'), 'perfume front leaked other sectors')

assert(fFace.includes('EXTRA VIRGIN') || fFace.includes('NET'), 'food front missing harvest/net')
assert(!fFace.includes('EAU DE PARFUM') && !fFace.includes('Alcohol Denat'), 'food front wears perfume')
assert(/ALERJEN|Alerjen|STORAGE/.test(fBack), 'food back missing allergen/storage')
assert(food.artwork.systemKey.includes('harvest') || resolveDesignSystem(food.brief, food.structureId).decor === 'olive' || resolveDesignSystem(food.brief, food.structureId).lockup === 'harvest-seal', 'food not harvest lockup')

assert(/WIRELESS|SPEC|BT |5V/.test(eFace), 'electronics front missing spec')
assert(!eFace.includes('EAU DE PARFUM') && !eFace.includes('12M'), 'electronics front has perfume/PAO')
assert(/WEEE/.test(eBack), 'electronics back missing WEEE')
assert(!eFace.includes('2004.78'), 'electronics leaked perfume icon')

assert(cFace.includes('FACE CREAM'), 'cream front missing care category')
assert(!cFace.includes('EAU DE PARFUM'), 'cream front is EDP')
assert(cream.copy.tagline.includes('onarır') || cream.copy.tagline.includes('Gece'), 'cream voice')

const pVoice = perfume.preflight.items.find((i) => i.id === 'ds-voice')
const fVoice = food.preflight.items.find((i) => i.id === 'ds-voice')
assert(pVoice?.status === 'pass', `perfume voice ${pVoice?.detail}`)
assert(fVoice?.status === 'pass', `food voice ${fVoice?.detail}`)

if (fails) {
  console.error(`D5 smoke failed (${fails})`)
  process.exit(1)
}
console.log('D5 sector-depth smoke passed')
console.log('  extract skips generic Parfüm · Noir named')
console.log('  blind front: EDP / EXTRA VIRGIN+NET / SPEC · cream FACE CREAM')
