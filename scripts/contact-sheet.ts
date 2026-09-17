/**
 * Contact sheet — front faces across the product range, side by side for a human read.
 *
 * The engine can tell you a face has no collisions, legible type and the brief's colours.
 * It cannot tell you whether the face is *good*. This renders a spread so that judgement can
 * be made by eye, the way `FAILURE_CATALOG.md` set it up against real reference packs.
 *
 * Run: npx --yes vite-node scripts/contact-sheet.ts   → public/_sheet/index.html
 */
import fs from 'node:fs'
import path from 'node:path'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { emptyBrief } from '../src/engine/fields'
import { buildCombinedSvg } from '../src/engine/production/exportDoc'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { resetDecisionLogs } from '../src/engine/brain/DesignDecisionLog'
import { resetDesignKnowledge } from '../src/engine/brain/DesignKnowledgeStore'
import { resetLearning } from '../src/engine/brain/LearningEngine'
import type { DesignBrief } from '../src/types'

type Job = {
  brand: string
  product: string
  sector: string
  subProduct: string
  colors: string
  style: DesignBrief['styleType']
  volume: string
}

const JOBS: Job[] = [
  { brand: 'Noctis', product: 'Gece', sector: 'kozmetik', subProduct: 'parfüm', colors: 'siyah · altın', style: 'luxury', volume: '50 ml' },
  { brand: 'Köyden', product: 'Naturel Sızma', sector: 'gıda', subProduct: 'zeytinyağı', colors: 'koyu yeşil · altın', style: 'eco', volume: '500 ml' },
  { brand: 'Elite Brew', product: 'Mocha', sector: 'gıda', subProduct: 'kahve', colors: 'mermer · altın', style: 'luxury', volume: '250 g' },
  { brand: 'Verda', product: 'Aloe Mist', sector: 'kozmetik', subProduct: 'krem', colors: 'yeşil · krem', style: 'eco', volume: '50 ml' },
  { brand: 'Nox', product: 'Pulse Buds', sector: 'elektronik', subProduct: 'kulaklık', colors: 'antrasit · turuncu', style: 'modern', volume: '1 adet' },
  { brand: 'Yayla', product: 'Çiçek Balı', sector: 'gıda', subProduct: 'bal', colors: 'altın · sıcak', style: 'classic', volume: '450 g' },
  { brand: 'Cacaoa', product: 'Bitter', sector: 'gıda', subProduct: 'çikolata', colors: 'kahve · altın', style: 'luxury', volume: '80 g' },
  { brand: 'Clinia', product: 'B5 Serum', sector: 'kozmetik', subProduct: 'serum', colors: 'beyaz · mavi', style: 'minimal', volume: '30 ml' },
  { brand: 'Ferah', product: 'Limon', sector: 'temizlik', subProduct: 'deterjan', colors: 'mavi · beyaz', style: 'modern', volume: '750 ml' },
  { brand: 'Sleek', product: 'Volume', sector: 'kozmetik', subProduct: 'şampuan', colors: 'siyah · beyaz', style: 'modern', volume: '400 ml' },
]

function briefOf(job: Job): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: job.brand,
    productName: job.product,
    sector: job.sector,
    subProduct: job.subProduct,
    packagingMode: 'box',
    styleType: job.style,
    colors: job.colors,
    volume: job.volume,
    barcode: '8690000000017',
    dimensionsMm: { L: 70, W: 45, H: 150 },
  }
}

const cards: string[] = []
const files: [string, string][] = []
for (const job of JOBS) {
  resetArtMemory()
  resetDecisionLogs()
  resetDesignKnowledge()
  resetLearning()
  const spec = new FormaLocalEngine().generate({ brief: briefOf(job), overridePatch: { studio: true, variationIndex: 0 } })
  // Render through the real export path. A hand-rolled wrapper around a single layer loses the
  // artwork-level clip defs and renders a half-face — and a sheet that lies is worse than none.
  const svg = buildCombinedSvg(spec)
  if (!svg) continue
  const file = `${job.brand.replace(/\W+/g, '-').toLowerCase()}.svg`
  const d = spec.studio!.direction
  const hits = spec.studio!.collisions.length + spec.studio!.outOfBounds.length
  files.push([file, svg])
  cards.push(
    `<figure>
      <img src="${file}" alt="${job.brand}">
      <figcaption>
        <b>${job.brand}</b> · ${job.product}<br>
        <span>${job.subProduct} · ${job.style} · ${job.colors}</span><br>
        <span class="meta">${d.archetype} · yerleşim ${d.variant} · ${d.temperament}${hits ? ` · ⚠ ${hits}` : ''}</span>
      </figcaption>
    </figure>`,
  )
}

const html = `<!doctype html><meta charset="utf-8"><title>Paxolab — kontak baskı</title>
<style>
  body { margin: 0; padding: 20px; background: #f2f1ee; font: 13px/1.4 -apple-system, Segoe UI, sans-serif; color: #222 }
  h1 { font-size: 16px; font-weight: 600; margin: 0 0 4px }
  p.lead { margin: 0 0 18px; color: #666 }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px }
  figure { margin: 0; background: #fff; padding: 10px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,.1) }
  img { width: 100%; display: block; background: #fff }
  figcaption { margin-top: 8px; font-size: 11px; line-height: 1.45 }
  figcaption span { color: #777 }
  figcaption .meta { color: #a06; font-size: 10px }
</style>
<h1>Paxolab — ön yüzler</h1>
<p class="lead">Aynı ölçü (70×45×150 mm), farklı sektör ve brief. Değerlendirme sorusu: bu bir ajans işi gibi duruyor mu?</p>
<div class="grid">${cards.join('')}</div>`

const dir = path.join(process.cwd(), 'public', '_sheet')
fs.mkdirSync(dir, { recursive: true })
for (const [name, svg] of files) fs.writeFileSync(path.join(dir, name), svg)
fs.writeFileSync(path.join(dir, 'index.html'), html)
console.log('yazıldı: public/_sheet/index.html —', cards.length, 'yüz')
