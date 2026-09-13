import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resolveDesignSystem } from '../src/engine/designSystem/resolve'
import type { DesignBrief } from '../src/types'

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

const boxBrief = brief({})
const wrapBrief = brief({
  packagingMode: 'label',
  templateId: 'fm-cos-label-bottle',
  dimensionsMm: { L: 90, W: 0, H: 70 },
})
const flatBrief = brief({
  packagingMode: 'label',
  templateId: 'fm-elec-label-device',
  dimensionsMm: { L: 70, W: 0, H: 90 },
})

const boxSys = resolveDesignSystem(boxBrief, 'tuck-end-box')
const wrapSys = resolveDesignSystem(wrapBrief, 'wrap-label')
const flatSys = resolveDesignSystem(flatBrief, 'flat-label')

assert(boxSys.lockup === 'centered-crest' && boxSys.decor === 'crest', `box lockup ${boxSys.lockup}/${boxSys.decor}`)
assert(wrapSys.lockup === 'label-wrap' && wrapSys.decor === 'none' && wrapSys.wrapSeam && wrapSys.align === 'left', `wrap kit ${wrapSys.lockup}/${wrapSys.decor}`)
assert(flatSys.lockup === 'label-stack' && !flatSys.wrapSeam, `flat kit ${flatSys.lockup}`)
assert(boxSys.key !== wrapSys.key, 'same brief collapsed to one kit')

const engine = new FormaLocalEngine()
const box = engine.generate({ brief: boxBrief })
const wrap = engine.generate({ brief: wrapBrief })
const flat = engine.generate({ brief: flatBrief })

const boxFace = box.artwork.layers.find((l) => l.panelId === 'front')?.markup ?? ''
const boxBack = box.artwork.layers.find((l) => l.panelId === 'back')?.markup ?? ''
const boxSide = box.artwork.layers.find((l) => l.panelId === 'left')?.markup ?? ''
const wrapFace = wrap.artwork.layers.find((l) => l.panelId === 'label')?.markup ?? ''
const wrapBack = wrap.artwork.layers.find((l) => l.panelId === 'labelBack')?.markup ?? ''
const flatFace = flat.artwork.layers.find((l) => l.panelId === 'label')?.markup ?? ''
const flatBack = flat.artwork.layers.find((l) => l.panelId === 'labelBack')?.markup ?? ''

assert(!boxFace.includes('SEAM'), 'box front has SEAM')
assert(wrapFace.includes('SEAM'), 'wrap missing SEAM')
assert(!flatFace.includes('SEAM'), 'flat label has wrap SEAM')
assert(boxBack.includes('COMPOSITION'), 'box back missing legal stack')
assert(!wrapFace.includes('COMPOSITION') && !wrapFace.includes('FLAMMABLE'), 'wrap face has box legal')
assert(!flatFace.includes('COMPOSITION'), 'flat face has box legal')
assert(/rotate\(-90\)/.test(boxSide), 'box spine missing')
assert(!/rotate\(-90\)/.test(wrapFace), 'wrap face has spine rotate')
assert(!/Nº 0[12]/.test(wrapFace), 'wrap still wears box series')
assert(!!wrapBack && wrapBack.includes('ARKA YÜZ') && wrapBack.includes('UYARI'), 'wrap missing back label')
assert(!!flatBack && flatBack.includes('ARKA YÜZ'), 'flat missing back label')
assert(!wrapFace.includes('data-mark="barcode"'), 'wrap front has barcode')
assert(!flatFace.includes('data-mark="barcode"'), 'flat front has barcode')
assert(wrapBack.includes('data-mark="barcode"'), 'wrap back missing barcode')
assert(!box.artwork.layers.some((l) => l.panelId === 'warnLabel' || l.panelId === 'labelBack'), 'box grew a label back')
assert(box.kind === 'packaging' && wrap.kind === 'label' && flat.kind === 'label', 'kinds')
assert(box.preflight.items.find((i) => i.id === 'ds-label')?.status === 'pass', 'box surface gate')
assert(wrap.preflight.items.find((i) => i.id === 'ds-label')?.status === 'pass', 'wrap surface gate')
assert(flat.preflight.items.find((i) => i.id === 'ds-label')?.status === 'pass', 'flat surface gate')

if (fails) {
  console.error(`D4 smoke failed (${fails})`)
  process.exit(1)
}
console.log('D4 surface-path smoke passed')
console.log(`  box ${boxSys.lockup} · wrap ${wrapSys.lockup} · flat ${flatSys.lockup}`)
console.log('  same brief = two jobs (SEAM / spine / back legal)')
