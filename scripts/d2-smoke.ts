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
assert(/Nº 01/.test(spine), 'luxury spine missing series')
assert(spine.includes('stroke="#c9a86c"'), 'luxury spine missing foil rail')
assert(!/href=|image\/|\.jpg|\.png/.test(spine), 'spine embedded a photo')

const ys = [...spine.matchAll(/C[\d.]+ ([\d.]+)/g)].map((m) => Number(m[1]))
const midHits = ys.filter((yy) => yy > 40 && yy < 100)
assert(midHits.length === 0, `spine contour still scores mid band (${midHits.length} pts)`)

const wrapArt = wrapContinuity(wrap, '#c9a86c')
const ribbon = waveRibbon(wrap, '#c9a86c', 8)
assert(wrapArt.includes('<path') && ribbon.includes('<path'), 'waveRibbon not wired into wrap')
assert((wrapArt.match(/<path/g) || []).length >= 3, 'wrap continuity too thin')
assert(wrapArt.includes(`${wrap.w}`), 'wrap wave does not reach seam edge')

const window = lockupWindow({ x: 8, y: 40, w: 54, h: 36 }, '#c9a86c')
assert(window.includes('<rect') && window.includes('fill="none"'), 'lockup window missing')

const mark = seriesMark(60, 8, '02', '#c9a86c')
assert(/Nº 02/.test(mark), 'series mark')

if (fails) {
  console.error(`D2 smoke failed (${fails})`)
  process.exit(1)
}
console.log('D2 motif smoke passed')
console.log('  spine series + head/foot only')
console.log('  wrapContinuity paths', (wrapArt.match(/<path/g) || []).length)
console.log('  waveRibbon wired')
