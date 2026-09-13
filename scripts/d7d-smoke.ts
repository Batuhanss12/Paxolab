import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { emptyBrief } from '../src/engine/fields'
import type { DesignBrief } from '../src/types'

function brief(partial: Partial<DesignBrief>): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Aurelia',
    productName: 'Noir',
    sector: 'parfüm',
    subProduct: 'euroslot',
    packagingMode: 'box',
    styleType: 'luxury',
    volume: '50 ml',
    ...partial,
  }
}

let fails = 0
function assert(ok: boolean, msg: string) {
  if (!ok) {
    console.error('FAIL', msg)
    fails += 1
  } else {
    console.log('OK  ', msg)
  }
}

const engine = new FormaLocalEngine()
const host = engine.generate({
  brief: brief({
    templateId: 'fm-cos-tuck-perfume',
    dimensionsMm: { L: 70, W: 35, H: 140 },
    subProduct: 'edp',
  }),
})
const slotted = engine.generate({
  brief: brief({
    templateId: 'fm-cos-tuck-euroslot',
    dimensionsMm: { L: 70, W: 35, H: 140 },
  }),
})

assert(host.structureId === 'tuck-end-box', 'host is native tuck-end')
assert(slotted.structureId === 'tuck-end-box', 'euroslot keeps tuck-end id')
assert(slotted.dieline.panels.some((p) => p.kind === 'device-overlay'), 'euroslot adds overlay panels')
assert(slotted.dieline.cut.length >= host.dieline.cut.length, 'euroslot has extra cut geometry')

const hostFront = host.artwork.layers.find((l) => l.panelId === 'front')?.markup ?? ''
const slotFront = slotted.artwork.layers.find((l) => l.panelId === 'front')?.markup ?? ''
assert(/AURELIA/i.test(slotFront), 'euroslot front still has brand')
assert(!/SEAM/.test(slotFront), 'euroslot front is not a wrap')
assert(hostFront.length > 0 && slotFront.length > 0, 'both fronts painted')

const overlay = slotted.artwork.layers.filter((l) => l.panelId.startsWith('aux-'))
assert(overlay.length > 0, 'overlay layers present')
assert(overlay.every((l) => l.markup.includes('device-overlay')), 'overlay layers tagged')

if (fails) {
  console.error(`d7d-smoke: ${fails} fail`)
  process.exit(1)
}
console.log('d7d-smoke green')
