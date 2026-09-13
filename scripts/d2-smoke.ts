import {
  lockupWindow,
  seriesMark,
  spineLuxuryField,
  waveRibbon,
  wrapContinuity,
} from '../src/engine/artwork/motifs'
import type { Panel } from '../src/types'

const panel: Panel = { id: 'left', role: 'body', x: 0, y: 0, w: 35, h: 140, polygon: [] }
const wrap: Panel = { id: 'label', role: 'body', x: 0, y: 0, w: 90, h: 70, polygon: [] }
const safe = { x: 6, y: 18, w: 23, h: 104 }

let fails = 0
function assert(ok: boolean, msg: string) {
  if (!ok) {
    console.error('FAIL', msg)
    fails += 1
  }
}

const spine = spineLuxuryField(panel, '#c9a86c', safe, '01')
assert(!/Nº 01/.test(spine), 'luxury spine still paints series')
assert(spine.includes('stroke="#c9a86c"'), 'luxury spine missing foil rail')
assert(!/href=|image\/|\.jpg|\.png/.test(spine), 'spine embedded a photo')
assert(!spine.includes('<path'), 'spine still paints contour jewelry')

const wrapArt = wrapContinuity(wrap, '#c9a86c')
assert(wrapArt.includes('data-art="wrap-continuity"'), 'wrap continuity missing tag')
assert((wrapArt.match(/<path/g) || []).length >= 3, 'wrap continuity missing parallel waves')
assert(wrapArt.includes('<circle'), 'wrap continuity missing accent dots')
assert(waveRibbon(wrap, '#c9a86c', 8).includes('<path'), 'waveRibbon helper missing')

const window = lockupWindow({ x: 8, y: 40, w: 54, h: 36 }, '#c9a86c')
assert(window.includes('<rect') && window.includes('fill="none"'), 'lockup window missing')

const mark = seriesMark(60, 8, '02', '#c9a86c')
assert(/Nº 02/.test(mark), 'series mark helper')

if (fails) {
  console.error(`D2 smoke failed (${fails})`)
  process.exit(1)
}
console.log('D2 motif smoke passed')
console.log('  spine rail only · wrap continuity on')
