import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { renderArtworkDoc, renderFrontSvg } from '../src/engine/artwork/composeArtwork'
import { buildCombinedSvg } from '../src/engine/production/exportDoc'
import { activeTemplates } from '../src/engine/catalog/catalog'
import { scoreVisualCraft } from '../src/engine/brain/DesignScore'
import { JOBS, briefFrom } from './catalog-jobs'

const outRoot = join(process.env.USERPROFILE ?? 'C:\\Users\\Admin', 'Desktop', 'FORMA-Tasarim-Katalogu')

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const engine = new FormaLocalEngine()
const rows: {
  slug: string
  title: string
  sector: string
  product: string
  templateId: string
  style: string
  folder: string
  exportOk: boolean
  hero: string
  usedTemplate: string
  craft?: number
}[] = []

mkdirSync(outRoot, { recursive: true })

for (const job of JOBS) {
  resetArtMemory()
  const spec = engine.generate({
    brief: briefFrom(job),
    overridePatch: {
      variationIndex: job.variationIndex ?? 0,
      heroFamily: job.heroFamily,
    },
  })
  const dir = join(outRoot, job.sectorFolder)
  mkdirSync(dir, { recursive: true })

  const face = spec.artwork.layers.find((l) => l.panelId === 'front' || l.panelId === 'label')?.markup ?? ''
  if (job.heroFamily && !face.includes(`data-hero="${job.heroFamily}"`)) {
    throw new Error(`${job.slug} missing data-hero="${job.heroFamily}" (got ${spec.designPlan?.heroGraphic.family})`)
  }

  const combined = spec.preflight.exportOk ? buildCombinedSvg(spec) : null
  const front = `<?xml version="1.0" encoding="UTF-8"?>\n${renderFrontSvg(spec.dieline, spec.artwork, spec.palette)}`
  const artwork = renderArtworkDoc(spec.dieline, spec.artwork, spec.copy.brand)

  writeFileSync(join(dir, `${job.slug}-on-yuz.svg`), front, 'utf8')
  if (combined) writeFileSync(join(dir, `${job.slug}-combined.svg`), combined, 'utf8')
  writeFileSync(join(dir, `${job.slug}-artwork.svg`), artwork, 'utf8')

  rows.push({
    slug: job.slug,
    title: job.title,
    sector: job.sector,
    product: `${job.brandName} ${job.productName}`.trim(),
    templateId: job.templateId,
    style: job.styleType,
    folder: job.sectorFolder,
    exportOk: spec.preflight.exportOk,
    hero: spec.designPlan?.heroGraphic.family ?? 'none',
    usedTemplate: spec.templateId,
    craft: spec.designPlan ? scoreVisualCraft(spec, spec.designPlan).visualCraft : 0,
  })

  console.log(
    [
      job.slug,
      spec.templateId,
      spec.brief.styleType,
      spec.designPlan?.heroGraphic.family ?? 'none',
      spec.preflight.exportOk ? 'exportOK' : 'exportBLOCK',
    ].join(' | '),
  )
}

const unusedActive = activeTemplates().filter((t) => !JOBS.some((j) => j.templateId === t.id))
const skippedSoon: string[] = []

const index = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FORMA Tasarım Kataloğu</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Georgia, "Times New Roman", serif; background: #0c0c0c; color: #efe8dc; }
    header { padding: 36px 40px 20px; border-bottom: 1px solid #2a2620; }
    header p { margin: 8px 0 0; color: #9a9184; font-family: Inter, Segoe UI, sans-serif; font-size: 14px; }
    h1 { margin: 0; font-weight: 400; letter-spacing: 0.08em; font-size: 28px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 22px; padding: 28px 40px 60px; }
    article { background: #141210; border: 1px solid #2c2822; padding: 14px 14px 16px; }
    .frame { background: #0a0a0a; min-height: 280px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .frame object { width: 100%; height: 280px; }
    h2 { margin: 14px 0 6px; font-size: 16px; font-weight: 400; letter-spacing: 0.04em; }
    .meta { font-family: Inter, Segoe UI, sans-serif; font-size: 12px; color: #9a9184; line-height: 1.55; }
    a { color: #d4c4a0; }
  </style>
</head>
<body>
  <header>
    <h1>FORMA TASARIM KATALOĞU</h1>
    <p>${rows.length} tasarım · görsel craft ort. ${Math.round(rows.reduce((s, r) => s + (r.craft ?? 0), 0) / rows.length)} · ${new Date().toLocaleDateString('tr-TR')}</p>
  </header>
  <div class="grid">
    ${rows
      .map(
        (r) => `<article>
      <div class="frame"><object data="${r.folder}/${r.slug}-on-yuz.svg" type="image/svg+xml">ön yüz</object></div>
      <h2>${esc(r.title)}</h2>
      <div class="meta">
        ${esc(r.product)} · ${esc(r.sector)}<br />
        Şablon ${esc(r.usedTemplate)} · stil ${esc(r.style)} · hero ${esc(r.hero)} · craft ${r.craft ?? '—'}<br />
        ${r.exportOk ? `<a href="${r.folder}/${r.slug}-combined.svg">combined</a> ·` : 'combined yok ·'}
        <a href="${r.folder}/${r.slug}-artwork.svg">artwork</a> ·
        <a href="${r.folder}/${r.slug}-on-yuz.svg">ön yüz</a>
        ${r.exportOk ? '' : ' · exportOk kapalı'}
      </div>
    </article>`,
      )
      .join('\n')}
  </div>
</body>
</html>
`

writeFileSync(join(outRoot, 'index.html'), index, 'utf8')

const readme = `FORMA Tasarım Kataloğu
======================
Tarih: ${new Date().toLocaleString('tr-TR')}
Klasör: ${outRoot}

Motor, mevcut aktif şablonlardan ve tüm canlı sektör/ürünlerden 1'er tasarım üretti.

Aktif şablonlar: ${activeTemplates().map((t) => t.id).join(', ')}
Atlanan (status=soon): ${skippedSoon.join(', ')}
Kapsanmayan aktif şablon: ${unusedActive.length ? unusedActive.map((t) => t.id).join(', ') : 'yok'}

Her tasarım için 3 SVG var:
- *-on-yuz.svg     ön panel / etiket yüzü
- *-combined.svg   dieline + artwork (üretim görünümü)
- *-artwork.svg    artwork katmanı

Galeriyi açmak için index.html dosyasına çift tıklayın.
`

writeFileSync(join(outRoot, 'README.txt'), readme, 'utf8')
writeFileSync(join(outRoot, 'manifest.json'), JSON.stringify({ outRoot, count: rows.length, rows }, null, 2), 'utf8')

console.log(`\nSaved ${rows.length} designs → ${outRoot}`)
if (unusedActive.length) {
  console.warn('Unused active templates:', unusedActive.map((t) => t.id).join(', '))
}
