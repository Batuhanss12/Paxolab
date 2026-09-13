import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import type { DesignBrief, StyleType } from '../src/types'

const STYLES: StyleType[] = ['luxury', 'modern', 'minimal', 'eco', 'playful', 'classic']

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
    manufacturerName: 'Test A.Ş.',
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

const designs = new Map<StyleType, string>()
const markups = new Map<StyleType, string>()
const heroes = new Map<StyleType, string>()
const patterns = new Map<StyleType, string>()

for (const style of STYLES) {
  resetArtMemory()
  const d = engine.generate({ brief: brief({ styleType: style }) })
  const f = face(d)
  designs.set(style, f)
  markups.set(style, f.slice(0, 200))
  heroes.set(style, d.designPlan?.heroGraphic.family ?? 'none')
  patterns.set(style, d.designPlan?.patternSystem.family ?? 'none')
}

for (let i = 0; i < STYLES.length; i++) {
  for (let j = i + 1; j < STYLES.length; j++) {
    const a = STYLES[i]
    const b = STYLES[j]
    const fa = designs.get(a) ?? ''
    const fb = designs.get(b) ?? ''
    assert(fa !== fb, `${a} and ${b} produce identical front markup`)
  }
}

const luxuryFace = designs.get('luxury') ?? ''
const modernFace = designs.get('modern') ?? ''
const minimalFace = designs.get('minimal') ?? ''
const ecoFace = designs.get('eco') ?? ''
const playfulFace = designs.get('playful') ?? ''
const classicFace = designs.get('classic') ?? ''

assert(luxuryFace.includes('data-hero="crest"'), 'luxury missing crest')
assert(!luxuryFace.includes('fill-opacity="0.9"'), 'luxury still paints corner diamonds')
assert(!luxuryFace.includes('Nº 01'), 'luxury still paints series index')

assert(modernFace.includes('height="1.8"'), 'modern missing top accent bar')
assert(!modernFace.includes('fill-opacity="0.9"'), 'modern has luxury diamonds')

assert(!minimalFace.includes('data-pattern='), 'minimal has visible pattern (should be intentional air)')
assert(!minimalFace.includes('fill-opacity="0.9"'), 'minimal has luxury diamonds')

assert(!ecoFace.includes('fill-opacity="0.9"'), 'eco has luxury diamonds')

assert(!playfulFace.includes('fill-opacity="0.9"'), 'playful has luxury diamonds')

assert(classicFace.includes('stroke-opacity="0.2"') || classicFace.includes('stroke-opacity="0.12"'), 'classic missing heritage double frame')

resetArtMemory()
const foodLux = engine.generate({
  brief: brief({
    brandName: 'Anadolu',
    productName: 'Dağ Balı',
    sector: 'gıda',
    subProduct: 'bal',
    volume: '500 g',
    styleType: 'luxury',
    dimensionsMm: { L: 80, W: 50, H: 180 },
  }),
})
const foodBack = foodLux.artwork.layers.find((l) => l.panelId === 'back')?.markup ?? ''
assert(foodBack.includes('BESİN DEĞERLERİ'), 'food luxury back missing nutrition table')
assert(foodBack.includes('Enerji'), 'food back nutrition missing energy row')
assert(foodBack.includes('Karbonhidrat'), 'food back nutrition missing carb row')

const foodFront = face(foodLux)
assert(foodFront.includes('data-art="claim-strip"'), 'food luxury front missing claim strip')
assert(foodFront.includes('DOĞAL'), 'food claim strip missing doğal')
assert(!foodFront.includes('EAU DE PARFUM'), 'food front has perfume copy')
assert(!foodFront.includes('fill-opacity="0.9"'), 'food luxury has perfume diamonds')

if (fails) {
  console.error(`Style parity smoke failed (${fails})`)
  process.exit(1)
}
console.log('Style parity smoke passed')
console.log('  heroes:', [...heroes.entries()].map(([s, h]) => `${s}:${h}`).join(' '))
console.log('  patterns:', [...patterns.entries()].map(([s, p]) => `${s}:${p}`).join(' '))
console.log('  food nutrition table: present')
console.log('  food claim strip: present')
console.log('  all 6 styles distinct: yes')
