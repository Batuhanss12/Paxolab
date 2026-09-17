/**
 * Background contact sheet — what one brief looks like as the customer presses "variation".
 *
 * `contact-sheet.ts` shows one face per brief, which answers "is this an agency job?". This answers
 * a different question: how much *range* a single brief actually has. Each row is one brief, each
 * column one of the backgrounds its archetype can wear, rendered from the real engine.
 *
 * Run: npx --yes vite-node scripts/background-sheet.ts   → public/_bg/index.html
 */
import fs from 'node:fs'
import path from 'node:path'
import type { DesignBrief, PackagingMode, StyleType } from '../src/types'
import { emptyBrief } from '../src/engine/fields'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { facePanelId, renderPanelSvg } from '../src/engine/artwork/renderArtwork'
import { STUDIO_FONT_HREF } from '../src/engine/studio/text'

type Job = {
  brand: string; product: string; sector: string; sub: string
  colors: string; style: StyleType; mode: PackagingMode
}

const JOBS: Job[] = [
  { brand: 'Verda', product: 'Aloe Mist', sector: 'kozmetik', sub: 'krem', colors: 'yeşil · krem', style: 'eco', mode: 'label' },
  { brand: 'Aurelle', product: 'Velvet Dew', sector: 'kozmetik', sub: 'serum', colors: 'şeftali · leylak', style: 'playful', mode: 'label' },
  { brand: 'Mini', product: 'Bebek Losyonu', sector: 'bebek', sub: 'losyon', colors: 'pembe · krem', style: 'playful', mode: 'label' },
  { brand: 'Clinia', product: 'B5 Serum', sector: 'kozmetik', sub: 'serum', colors: 'beyaz · mavi', style: 'minimal', mode: 'box' },
  { brand: 'Mini', product: 'Bebek Losyonu', sector: 'bebek', sub: 'losyon', colors: 'pembe · krem', style: 'playful', mode: 'box' },
]

const NEW_BG = 'gradient-wash'

function run(job: Job, variationIndex: number) {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({
    brief: {
      ...emptyBrief(),
      brandName: job.brand, productName: job.product, sector: job.sector, subProduct: job.sub,
      packagingMode: job.mode, styleType: job.style, colors: job.colors,
      volume: '250 ml', barcode: '8690000000017', dimensionsMm: { L: 70, W: 45, H: 150 },
      studioFamily: 'botanical', studioFamilyLocked: true,
    } as DesignBrief,
    overridePatch: { studio: true, variationIndex },
  })
  const id = spec.artwork.frontPanelId || facePanelId(spec.dieline, spec.artwork, 'front')
  const d = spec.studio!
  return {
    svg: id ? renderPanelSvg(spec.dieline, spec.artwork, id, spec.palette, { pad: 0 }) : '',
    dir: d.direction,
    hits: d.collisions.length + d.outOfBounds.length,
    variationIndex,
  }
}

const rows: string[] = []
for (const job of JOBS) {
  const byBg = new Map<string, ReturnType<typeof run>>()
  for (let v = 0; v <= 5; v++) {
    const r = run(job, v)
    if (!byBg.has(r.dir.background)) byBg.set(r.dir.background, r)
  }
  const cells = [...byBg.entries()].map(
    ([bg, r]) => `<figure class="${bg === NEW_BG ? 'is-new' : ''}">
      <div class="f">${r.svg}</div>
      <figcaption>${bg === NEW_BG ? '<b class="new">YENİ</b> ' : ''}${bg}<br><span>varyasyon ${r.variationIndex}${r.hits ? ` · ⚠ ${r.hits}` : ''}</span></figcaption>
    </figure>`,
  )
  rows.push(`<section>
    <h2>${job.brand} · ${job.product}<em>${job.sub} · ${job.mode} · ${job.colors} · ${[...byBg.values()][0].dir.archetype}</em></h2>
    <div class="row">${cells.join('')}</div>
  </section>`)
}

const html = `<!doctype html><meta charset="utf-8"><title>Paxolab — zemin çeşitliliği</title>
<link rel="stylesheet" href="${STUDIO_FONT_HREF}">
<style>
  body{margin:0;padding:24px;background:#15161a;color:#e2e2e2;font:13px/1.5 -apple-system,Segoe UI,sans-serif}
  h1{font-size:18px;margin:0 0 6px;color:#fff}
  p.lead{margin:0 0 24px;color:#8b8b8b;max-width:76ch}
  section{margin:0 0 26px;border-top:1px solid #262830;padding-top:14px}
  h2{font-size:13px;margin:0 0 12px;color:#f0f0f0}
  h2 em{font-style:normal;color:#7b7b7b;font-weight:400;font-size:11px;margin-left:10px}
  .row{display:flex;gap:12px;flex-wrap:wrap}
  figure{margin:0;flex:0 0 148px;width:148px;background:#20222a;padding:8px;border-radius:6px;border:1px solid transparent}
  figure.is-new{border-color:#c9a86c}
  .f{background:#fff;border-radius:3px;overflow:hidden}
  .f svg{width:100%;height:auto;display:block}
  figcaption{margin-top:7px;font-size:11px;color:#cfcfcf}
  figcaption span{color:#7b7b7b;font-size:10px}
  b.new{color:#c9a86c;font-size:9px;letter-spacing:.1em}
</style>
<h1>Bir brief kaç farklı görünüm veriyor?</h1>
<p class="lead">Her satır tek bir brief. Yan yana duranlar, müşteri "varyasyon" dedikçe gelen zeminler —
aynı renkler, aynı iskelet, farklı yüzey. Altın çerçeveli olan bu turda eklenen yeni zemin.</p>
${rows.join('')}`

const dir = path.join(process.cwd(), 'public', '_bg')
fs.mkdirSync(dir, { recursive: true })
fs.writeFileSync(path.join(dir, 'index.html'), html)
console.log('yazıldı: public/_bg/index.html —', rows.length, 'brief')
