import { typeScaleFor } from '../src/engine/designSystem/kits'
import { resolveDesignSystem } from '../src/engine/designSystem/resolve'
import {
  estimateLineWidth,
  fitLine,
  layoutFrontLockup,
  smallCapsRuns,
  smallCapsText,
  volumeMarkup,
} from '../src/engine/designSystem/typeSystem'
import type { DesignBrief, Panel, StyleType } from '../src/types'

const STYLES: StyleType[] = ['luxury', 'modern', 'minimal', 'eco', 'playful', 'classic']

function brief(style: StyleType, mode: 'box' | 'label' = 'box'): DesignBrief {
  return {
    brandName: 'Aurelia',
    productName: 'Noir',
    sector: 'parfüm',
    subProduct: 'edp',
    packagingMode: mode === 'label' ? 'label' : 'box',
    templateId: mode === 'label' ? 'wrap-label' : 'perfume-tuck',
    dimensionsMm: mode === 'label' ? { L: 80, W: 0, H: 40 } : { L: 70, W: 35, H: 140 },
    styleType: style,
    colors: 'siyah altın',
    volume: '50 ml',
    barcode: '',
    manufacturerName: '',
    manufacturerAddress: '',
    logo: '',
    references: '',
    copyOverrides: '',
  }
}

function panel(w: number, h: number): Panel {
  return { id: 'front', role: 'body', x: 0, y: 0, w, h, polygon: [] }
}

const copy = { brand: 'Aurelia', product: 'Noir', tagline: 'Sessiz bir yoğunluk.', volume: '50 ml' }
const overrides = { titleScale: 1 }

let fails = 0
function assert(ok: boolean, msg: string) {
  if (!ok) {
    console.error('FAIL', msg)
    fails += 1
  }
}

const boxSizes = new Map<StyleType, number>()
for (const style of STYLES) {
  const system = resolveDesignSystem(brief(style), 'tuck-end-box')
  const p = panel(70, 140)
  const layout = layoutFrontLockup(p, system, copy, overrides, false)
  boxSizes.set(style, layout.brandSize)
  const r = layout.rect
  assert(r.x >= 0 && r.y >= 0 && r.x + r.w <= 70 && r.y + r.h <= 140, `${style} box lockup outside 70×140`)
  assert(layout.brandSize >= system.type.minMm - 0.01, `${style} display below min`)
  assert(layout.productSize >= system.type.minMm - 0.01, `${style} product below min`)
  assert(layout.taglineSize >= system.type.minMm - 0.01, `${style} tagline below min`)
  if (layout.ruleY != null) {
    assert(layout.ruleY > layout.brandY + 0.8, `${style} rule collides with brand baseline`)
    assert(layout.productY > layout.ruleY + 0.6, `${style} product collides with rule`)
  }
  const brandW = estimateLineWidth(copy.brand.toUpperCase(), layout.brandSize, layout.brandTracking, style === 'luxury' || style === 'classic' || style === 'eco' ? 'serif' : 'sans')
  assert(brandW <= r.w + 0.8, `${style} brand wider than lockup (${brandW.toFixed(1)} > ${r.w.toFixed(1)})`)
}

const wrap = resolveDesignSystem(brief('luxury', 'label'), 'wrap-label')
assert(wrap.grammar === 'label' && wrap.type.minMm >= 2.8, 'wrap min type')
const wrapLayout = layoutFrontLockup(panel(80, 40), wrap, copy, overrides, true)
assert(wrapLayout.rect.y >= 0 && wrapLayout.rect.y + wrapLayout.rect.h <= 40, 'wrap lockup outside 80×40')
assert(wrapLayout.brandSize >= 2.8 && wrapLayout.productSize >= 2.8 && wrapLayout.taglineSize >= 2.8, 'wrap type below 2.8')

const long = fitLine('MAISON AURELIA COLLECTION', 9.1, 0.95, 58, 1.9, 'serif')
assert(long.width <= 58.2, 'fitLine did not contain long display')
assert(long.tracking < 0.95 || long.size < 9.1, 'fitLine did not reduce tracking or size')

const runs = smallCapsRuns('50 ml')
assert(runs.some((r) => r.kind === 'full' && /50/.test(r.text)), 'small-caps lost lining figures')
assert(runs.some((r) => r.kind === 'small' && r.text === 'ML'), `small-caps letters not drawn as caps: ${JSON.stringify(runs)}`)
const sc = smallCapsText(0, 0, '50 ml', 3, 1, '#fff', 'middle', 'Inter, Arial, sans-serif', 0.7)
assert(sc.includes('<tspan') && !/font-variant/i.test(sc), 'small-caps used fake CSS')
const vol = volumeMarkup(0, 0, '50 ml', typeScaleFor('luxury', 'box'), '#fff', 'middle', 'Inter, Arial, sans-serif', true)
assert(vol.includes('tspan') && !/font-variant/i.test(vol), 'volume small-caps used font-variant')

const luxury = boxSizes.get('luxury') ?? 0
const minimal = boxSizes.get('minimal') ?? 0
assert(luxury > minimal + 0.6, `styles not distinct: luxury ${luxury} vs minimal ${minimal}`)

if (fails) {
  console.error(`D1 smoke failed (${fails})`)
  process.exit(1)
}
console.log('D1 type/lockup smoke passed')
console.log('  box 70×140', STYLES.map((s) => `${s}:${boxSizes.get(s)?.toFixed(2)}`).join(' '))
console.log('  wrap lockup', `y=${wrapLayout.rect.y.toFixed(1)} h=${wrapLayout.rect.h.toFixed(1)} display=${wrapLayout.brandSize.toFixed(2)}`)
console.log('  small-caps', JSON.stringify(runs))
