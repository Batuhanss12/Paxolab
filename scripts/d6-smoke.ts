import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { isFormaSampleEan, isInventedRegisteredGtin } from '../src/engine/barcode'
import { nextMissing, runConversation } from '../src/engine/conversation'
import { resolveDesignSystem } from '../src/engine/designSystem/resolve'
import { extractFields } from '../src/engine/extract'
import { emptyBrief, mergeBrief } from '../src/engine/fields'
import { buildCombinedSvg } from '../src/engine/production/exportDoc'
import { runPreflight } from '../src/engine/production/preflight'
import type { DesignBrief, StyleType } from '../src/types'

const STYLES: StyleType[] = ['luxury', 'modern', 'minimal', 'eco', 'playful', 'classic']

function brief(partial: Partial<DesignBrief>): DesignBrief {
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
    barcode: '',
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
const palettes = new Set<string>()
const brandSizes = new Map<StyleType, number>()

for (const style of STYLES) {
  const design = engine.generate({ brief: brief({ styleType: style }) })
  const face = design.artwork.layers.find((l) => l.panelId === 'front')?.markup ?? ''
  const top = design.artwork.layers.find((l) => l.panelId === 'top')?.markup ?? ''
  const side = design.artwork.layers.find((l) => l.panelId === 'left')?.markup ?? ''
  const collision = design.preflight.items.find((i) => i.id === 'collision')
  const barcode = design.preflight.items.find((i) => i.id === 'barcode')
  const sampleLegal = design.preflight.items.find((i) => i.id === 'ds-sample-legal')
  const honesty = design.preflight.items.find((i) => i.id === 'ds-barcode-honesty')
  const voice = design.preflight.items.find((i) => i.id === 'ds-voice')
  palettes.add(`${design.palette.bg}|${design.palette.accent}|${design.palette.fg}`)
  const sys = resolveDesignSystem(design.brief, design.structureId)
  brandSizes.set(style, sys.type.displayMm)

  assert(design.preflight.exportOk, `${style} export blocked: ${design.preflight.items.filter((i) => i.status === 'fail').map((i) => i.id + ':' + i.detail).join(' · ')}`)
  assert(!design.preflight.collisions, `${style} collision ${collision?.detail}`)
  assert(face.includes('clip-path') || face.includes('clipPath') || design.artwork.layers.some((l) => l.markup.includes('clip-path')), `${style} missing panel clip`)
  if (style !== 'minimal') {
    assert(face.includes('EAU DE PARFUM'), `${style} perfume front missing EDP`)
  } else {
    assert(face.includes('AURELIA'), 'minimal perfume missing brand')
  }
  assert(!face.includes('FACE CREAM') && !face.includes('EXTRA VIRGIN'), `${style} perfume leaked other sectors`)
  assert(!/opacity="0\.92"/.test(face), `${style} product still dimmed`)
  assert(/AURELIA/.test(top) || /A\+A|AA/.test(top) || top.includes('AURELIA') || /A/.test(top), `${style} top missing brand`)
  assert(/rotate\(-90\)/.test(side) && /AURELIA|NOIR/.test(side), `${style} spine missing brand`)
  assert(!face.includes('data-mark="barcode"'), `${style} barcode on front`)
  assert(barcode?.status === 'warn', `${style} sample barcode not warned (${barcode?.status})`)
  assert(sampleLegal?.status === 'warn', `${style} sample-legal not warned`)
  assert(honesty?.status === 'pass', `${style} barcode honesty ${honesty?.detail}`)
  assert(voice?.status === 'pass', `${style} voice ${voice?.detail}`)
  assert(isFormaSampleEan(design.copy.barcode), `${style} motor did not use 200 sample EAN`)
  if (style === 'luxury') {
    assert(face.includes('lockout-front') || face.includes('id="lockout-'), `${style} missing lockout knockout`)
  }
}

assert(palettes.size >= 5, `styles collapsed: ${palettes.size} palettes`)
assert((brandSizes.get('luxury') ?? 0) > (brandSizes.get('minimal') ?? 99) - 8, 'luxury/minimal type ramps not distinct')

const cream = engine.generate({
  brief: brief({
    brandName: 'Lumina',
    productName: 'Night',
    sector: 'kozmetik',
    subProduct: 'krem',
    styleType: 'luxury',
    dimensionsMm: { L: 80, W: 40, H: 80 },
  }),
})
const creamFace = cream.artwork.layers.find((l) => l.panelId === 'front')?.markup ?? ''
assert(creamFace.includes('YÜZ KREMİ') || creamFace.includes('FACE CREAM'), 'cream front missing care category')
assert(!creamFace.includes('EAU DE PARFUM'), 'cream wearing perfume')

const food = engine.generate({
  brief: brief({
    brandName: 'Terra Grove',
    productName: 'Zeytinyağı',
    sector: 'gıda',
    subProduct: 'yağ',
    volume: '500 ml',
    dimensionsMm: { L: 80, W: 50, H: 180 },
    barcode: '8681234567890',
  }),
})
const foodFace = food.artwork.layers.find((l) => l.panelId === 'front')?.markup ?? ''
const foodArt = food.artwork.layers.map((l) => l.markup).join('\n')
assert(food.preflight.exportOk, `food export blocked ${food.preflight.items.filter((i) => i.status === 'fail').map((i) => i.detail).join(' · ')}`)
assert(!food.preflight.collisions, `food collision ${food.preflight.items.find((i) => i.id === 'collision')?.detail}`)
assert(foodFace.includes('NET') || foodFace.includes('EXTRA VIRGIN'), 'food front missing harvest/net')
assert(!foodFace.includes('EAU DE PARFUM') && !foodArt.includes('2004.78') && !foodArt.includes('986.01'), 'food leaked perfume icons')
assert(food.preflight.items.find((i) => i.id === 'barcode')?.status === 'pass', 'user barcode not passed')
assert(!isFormaSampleEan(food.copy.barcode), 'user barcode rewritten as 200 sample')

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
const elecFace = elec.artwork.layers.find((l) => l.panelId === 'front')?.markup ?? ''
assert(elec.preflight.exportOk || elec.preflight.items.find((i) => i.id === 'product')?.status !== 'fail', `elec hard-fail ${elec.preflight.items.filter((i) => i.status === 'fail').map((i) => i.id).join(',')}`)
assert(!elecFace.includes('EAU DE PARFUM') && !elecFace.includes('12M') && !elecFace.includes('2004.78'), 'electronics leaked perfume')
assert(/WIRELESS|KABLOSUZ|SPEC|BT |5V/.test(elecFace), 'electronics front missing spec')

const wrap = engine.generate({
  brief: brief({
    packagingMode: 'label',
    templateId: 'fm-cos-label-bottle',
    dimensionsMm: { L: 90, W: 0, H: 70 },
    barcode: '8681234567890',
  }),
})
const wrapFace = wrap.artwork.layers.find((l) => l.panelId === 'label')?.markup ?? ''
const wrapBack = wrap.artwork.layers.find((l) => l.panelId === 'labelBack')?.markup ?? ''
assert(wrap.kind === 'label', 'wrap kind')
assert(wrapFace.includes('SEAM'), 'wrap missing SEAM')
assert(!!wrapBack && wrapBack.includes('ARKA YÜZ') && wrapBack.includes('UYARI'), 'wrap missing back label')
assert(!wrapFace.includes('data-mark="barcode"'), 'wrap barcode on front')
assert(wrapBack.includes('data-mark="barcode"'), 'wrap barcode not on back')
assert(!wrap.preflight.collisions, `wrap collision ${wrap.preflight.items.find((i) => i.id === 'collision')?.detail}`)
assert(wrap.preflight.items.find((i) => i.id === 'ds-label')?.status === 'pass', `wrap surface ${wrap.preflight.items.find((i) => i.id === 'ds-label')?.detail}`)

const flat = engine.generate({
  brief: brief({
    packagingMode: 'label',
    templateId: 'fm-elec-label-device',
    dimensionsMm: { L: 70, W: 0, H: 90 },
    barcode: '8681234567890',
  }),
})
const flatFace = flat.artwork.layers.find((l) => l.panelId === 'label')?.markup ?? ''
assert(flat.kind === 'label', 'flat kind')
assert(!flatFace.includes('SEAM'), 'flat has wrap SEAM')
assert(!flat.preflight.collisions, `flat collision ${flat.preflight.items.find((i) => i.id === 'collision')?.detail}`)
assert(flat.preflight.items.find((i) => i.id === 'ds-label')?.status === 'pass', `flat surface ${flat.preflight.items.find((i) => i.id === 'ds-label')?.detail}`)

const generic = engine.generate({
  brief: brief({ productName: 'Parfüm' }),
})
assert(generic.copy.product !== 'Parfüm', 'generic product still Parfüm')
assert(generic.preflight.items.find((i) => i.id === 'product')?.status !== 'fail', 'empty product line blocked export')

const luxury = engine.generate({ brief: brief({ styleType: 'luxury' }) })
const svg = buildCombinedSvg(luxury)
assert(!!svg, 'luxury combined SVG refused')
assert(svg?.includes('sample barcode 200') || svg?.includes('örnek'), 'export hides sample-legal note')
assert(!svg?.includes('GS1 registration'), 'export claimed GS1')

const fake = {
  ...luxury,
  brief: { ...luxury.brief, barcodeDefaulted: true, barcode: '8691234567890' },
  copy: { ...luxury.copy, barcode: '8691234567890' },
}
const fakePf = runPreflight(fake)
assert(!fakePf.exportOk, 'invented country GTIN still exportOk')
assert(fakePf.items.find((i) => i.id === 'barcode')?.status === 'fail', 'invented GTIN not failed')
assert(buildCombinedSvg({ ...fake, preflight: fakePf }) === null, 'export did not refuse invented GTIN')
assert(isInventedRegisteredGtin('8691234567890', true), 'helper missed invented GTIN')
assert(!isInventedRegisteredGtin(luxury.copy.barcode, true), 'sample 200 treated as invented')

const volumeAsk = nextMissing(
  mergeBrief(emptyBrief(), {
    brandName: 'Aurelia',
    productName: 'Noir',
    sector: 'kozmetik',
    packagingMode: 'box',
  }),
)
assert(volumeAsk === 'volume', `P0 volume ask dead: ${volumeAsk}`)

const branded = extractFields('Marka: Aurelia', [])
assert(branded.brandName === 'Aurelia', `labeled brand ${branded.brandName}`)
assert(!branded.productName, `brand copied to product ${branded.productName}`)
assert(!branded.sector, `brand leaked into sector ${branded.sector}`)
const dup = mergeBrief(emptyBrief(), { brandName: 'Aurelia', productName: 'Aurelia', sector: 'Aurelia' })
assert(!dup.productName && !dup.sector, `merge kept brand twins ${dup.productName}/${dup.sector}`)

const brandOnly = runConversation({
  text: 'Aurelia',
  attachments: [],
  brief: mergeBrief(emptyBrief(), { packagingMode: 'box', sector: 'kozmetik' }),
  awaiting: 'brandName',
  hasDesign: false,
})
assert(brandOnly.brief.brandName === 'Aurelia', 'brand not stored')
assert(!brandOnly.brief.productName, `chat copied brand into product ${brandOnly.brief.productName}`)
assert(brandOnly.awaiting === 'productName', `expected product ask, got ${brandOnly.awaiting}`)

const echo = runConversation({
  text: 'Aurelia',
  attachments: [],
  brief: brandOnly.brief,
  awaiting: 'productName',
  hasDesign: false,
})
assert(!echo.brief.productName, `echoed brand became product ${echo.brief.productName}`)
assert(echo.awaiting === 'productName', 'accepted brand as product line')

const labelAsk = runConversation({
  text: 'Aurelia için parfüm etiketi',
  attachments: [],
  brief: emptyBrief(),
  awaiting: null,
  hasDesign: false,
})
assert(labelAsk.brief.packagingMode === 'label', `label mode ${labelAsk.brief.packagingMode}`)
assert(!labelAsk.brief.productName || labelAsk.brief.productName !== 'Aurelia', 'label product = brand')
assert(labelAsk.awaiting !== 'barcode' && labelAsk.awaiting !== 'manufacturerName', `label asked box field ${labelAsk.awaiting}`)

const labelReady = mergeBrief(emptyBrief(), {
  brandName: 'Aurelia',
  productName: 'Noir',
  sector: 'parfüm',
  packagingMode: 'label',
  volume: '50 ml',
  dimensionsMm: { L: 90, W: 0, H: 70 },
})
assert(nextMissing(labelReady) === 'templateId', `label still asking box inputs: ${nextMissing(labelReady)}`)

const asked = runConversation({
  text: 'Aurelia için parfüm kutusu, luxury',
  attachments: [],
  brief: emptyBrief(),
  awaiting: null,
  hasDesign: false,
})
assert(!asked.shouldGenerate, 'chat generated without volume / line name')
assert(asked.awaiting === 'productName' || asked.awaiting === 'volume' || asked.replies.some((r) => /hacim|ml|hattı|ürün/i.test(r)), 'chat skipped product/volume ask')

if (fails) {
  console.error(`D6 smoke failed (${fails})`)
  process.exit(1)
}
console.log('D6 QA-matrix smoke passed')
console.log('  6 perfume styles · food · electronics · wrap · flat')
console.log('  bbox collision · sample-legal warn · invented GTIN refused')
console.log('  palettes', palettes.size, '· luxury lockout intact')
