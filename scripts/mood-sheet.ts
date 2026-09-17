/**
 * Mood sheet — one brief, six moods, side by side.
 *
 * The engine can report that six grounds differ. It cannot tell you whether the six *read* as six
 * deliberate design decisions or as one design with the paint swapped. That judgement needs an eye,
 * so this renders the row the owner actually clicks through.
 *
 * Run: npx --yes vite-node scripts/mood-sheet.ts   → public/_sheet/mood.html
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
import type { DesignBrief, StyleType } from '../src/types'

const MOODS: StyleType[] = ['luxury', 'minimal', 'modern', 'eco', 'classic', 'playful']

type Job = { slug: string; brand: string; product: string; sector: string; subProduct: string; colors: string; volume: string }

const JOBS: Job[] = [
  { slug: 'verda', brand: 'Verda', product: 'Aloe Mist', sector: 'kozmetik', subProduct: 'krem', colors: 'yeşil · krem', volume: '50 ml' },
  { slug: 'elite', brand: 'Elite Brew', product: 'Mocha', sector: 'gıda', subProduct: 'kahve', colors: 'mermer · altın', volume: '250 g' },
  { slug: 'nox', brand: 'Nox', product: 'Pulse Buds', sector: 'elektronik', subProduct: 'kulaklık', colors: 'antrasit · turuncu', volume: '1 adet' },
]

function briefOf(job: Job, mood: StyleType): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: job.brand,
    productName: job.product,
    sector: job.sector,
    subProduct: job.subProduct,
    packagingMode: 'box',
    styleType: mood,
    colors: job.colors,
    volume: job.volume,
    barcode: '8690000000017',
    dimensionsMm: { L: 70, W: 45, H: 150 },
  }
}

const files: [string, string][] = []
const sections: string[] = []

for (const job of JOBS) {
  const cards: string[] = []
  for (const mood of MOODS) {
    resetArtMemory()
    resetDecisionLogs()
    resetDesignKnowledge()
    resetLearning()
    const spec = new FormaLocalEngine().generate({ brief: briefOf(job, mood), overridePatch: { studio: true, variationIndex: 0 } })
    const svg = buildCombinedSvg(spec)
    if (!svg) {
      cards.push(`<figure class="bad"><figcaption><b>${mood}</b><br><span>dışa aktarılamadı</span></figcaption></figure>`)
      continue
    }
    const file = `mood-${job.slug}-${mood}.svg`
    files.push([file, svg])
    const d = spec.studio!.direction
    const hits = spec.studio!.collisions.length + spec.studio!.outOfBounds.length
    cards.push(
      `<figure>
        <img src="${file}" alt="${job.brand} ${mood}">
        <figcaption>
          <b>${mood}</b>
          <span class="sw" style="background:${d.palette.ground}"></span><span class="sw" style="background:${d.palette.accent}"></span><br>
          <span class="meta">${d.temperament} · ${d.archetype}${hits ? ` · ⚠ ${hits}` : ''}</span>
        </figcaption>
      </figure>`,
    )
  }
  sections.push(`<h2>${job.brand} · ${job.product}<small>brief rengi: ${job.colors}</small></h2><div class="grid">${cards.join('')}</div>`)
}

const html = `<!doctype html><meta charset="utf-8"><title>Paxolab — ruh hali</title>
<style>
  body { margin: 0; padding: 20px; background: #f2f1ee; font: 13px/1.4 -apple-system, Segoe UI, sans-serif; color: #222 }
  h1 { font-size: 16px; font-weight: 600; margin: 0 0 4px }
  h2 { font-size: 13px; font-weight: 600; margin: 22px 0 10px; display: flex; gap: 10px; align-items: baseline }
  h2 small { font-weight: 400; color: #888 }
  p.lead { margin: 0 0 6px; color: #666 }
  .grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px }
  figure { margin: 0; background: #fff; padding: 8px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,.1) }
  figure.bad { background: #fde8e8 }
  img { width: 100%; display: block; background: #fff }
  figcaption { margin-top: 6px; font-size: 11px; line-height: 1.5 }
  figcaption .meta { color: #a06; font-size: 10px }
  .sw { display: inline-block; width: 9px; height: 9px; border-radius: 2px; margin-left: 3px; border: 1px solid rgba(0,0,0,.2); vertical-align: middle }
</style>
<h1>Paxolab — aynı brief, altı ruh hali</h1>
<p class="lead">Brief'teki renk sabit; değişen tek şey ruh hali. Soru: altısı da ayrı birer tasarım kararı gibi mi duruyor, yoksa aynı tasarımın boyası mı değişmiş?</p>
${sections.join('')}`

const dir = path.join(process.cwd(), 'public', '_sheet')
fs.mkdirSync(dir, { recursive: true })
for (const [name, svg] of files) fs.writeFileSync(path.join(dir, name), svg)
fs.writeFileSync(path.join(dir, 'mood.html'), html)
console.log('yazıldı: public/_sheet/mood.html —', files.length, 'yüz')
