import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { emptyBrief } from '../src/engine/fields'
import { findHeroPanel } from '../src/engine/dieline/panelKind'
import type { DesignBrief } from '../src/types'

function brief(partial: Partial<DesignBrief>): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Aurelia',
    productName: 'Noir',
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

const hex = engine.generate({
  brief: brief({
    sector: 'hediye',
    subProduct: 'altıgen',
    templateId: 'fm-gift-hex-box',
    dimensionsMm: { L: 60, W: 60, H: 120 },
  }),
})
const hexHero = findHeroPanel(hex.dieline.panels)
assert(hex.structureId === 'polygon-box', 'hex structureId')
assert(hex.dieline.consistent, `hex consistent ${hex.dieline.issues.join(', ')}`)
assert(!!hexHero && hexHero.id.startsWith('wall-'), `hex hero is a wall (${hexHero?.id})`)
assert(hex.artwork.frontPanelId === hexHero?.id, 'hex artwork front is hero wall')
assert(!hex.preflight.items.some((i) => i.status === 'fail' && i.id === 'dieline'), 'hex dieline gate')

const carrier = engine.generate({
  brief: brief({
    sector: 'içecek',
    subProduct: 'şişe',
    templateId: 'fm-bev-carrier-6',
    dimensionsMm: { L: 180, W: 120, H: 45 },
    styleType: 'modern',
  }),
})
const cells = carrier.dieline.panels.filter((p) => p.kind === 'product-window')
const cellArt = carrier.artwork.layers.filter((l) => cells.some((c) => c.id === l.panelId))
assert(carrier.structureId === 'product-carrier-tray', 'carrier structureId')
assert(cells.length === 6, `carrier cells ${cells.length}`)
assert(cellArt.every((l) => l.markup.includes('product-window')), 'cells are windows, not heroes')
assert(carrier.artwork.frontPanelId === 'front', 'carrier hero stays on front wall')
assert(!cellArt.some((l) => /data-art="hero"|AURELIA/.test(l.markup)), 'no lockup on product windows')

if (fails) {
  console.error(`d7c-smoke: ${fails} fail`)
  process.exit(1)
}
console.log('d7c-smoke green')
