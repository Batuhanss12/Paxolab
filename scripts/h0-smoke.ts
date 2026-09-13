import { emptyBrief, mergeBrief } from '../src/engine/fields'
import { nextMissing, runConversation } from '../src/engine/conversation'

const base = mergeBrief(emptyBrief(), {
  brandName: 'Aurelia',
  productName: 'Parfüm',
  sector: 'kozmetik',
  packagingMode: 'box',
})

const miss = nextMissing(base)
if (miss !== 'volume') {
  console.error('expected volume ask, got', miss)
  process.exit(1)
}

const asked = runConversation({
  text: 'Aurelia için parfüm kutusu, luxury',
  attachments: [],
  brief: emptyBrief(),
  awaiting: null,
  hasDesign: false,
})
if (asked.brief.productName === 'Parfüm') {
  console.error('extract filled generic product Parfüm')
  process.exit(1)
}
if (asked.awaiting !== 'productName' && !asked.replies.some((r) => /hacim|ml|hattı|ürün/i.test(r))) {
  console.error('chat did not ask product line or volume', asked)
  process.exit(1)
}
if (asked.shouldGenerate) {
  console.error('chat generated without volume', asked)
  process.exit(1)
}

const withMl = runConversation({
  text: 'Aurelia için Noir parfüm kutusu, 50 ml, 70x35x140 mm, luxury',
  attachments: [],
  brief: emptyBrief(),
  awaiting: null,
  hasDesign: false,
})
if (withMl.brief.productName === 'Parfüm') {
  console.error('Noir brief still product=Parfüm', withMl.brief)
  process.exit(1)
}
if (nextMissing(withMl.brief) !== 'barcode') {
  console.error('full brief should ask barcode next, got', nextMissing(withMl.brief), withMl.brief)
  process.exit(1)
}

console.log('H0 conversation smoke passed')
console.log('  no-ml →', asked.awaiting, asked.replies[asked.replies.length - 1])
console.log('  with-ml →', nextMissing(withMl.brief), withMl.brief.volume)
