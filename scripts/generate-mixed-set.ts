/**
 * 5 mixed Faz 2.5 samples: boxes + labels. Blank-canvas so family constraints apply.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { renderArtworkDoc, renderFrontSvg } from '../src/engine/artwork/renderArtwork'
import { lastCompositionSearch } from '../src/engine/artwork/compositionCandidates'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { JOBS, briefFrom, type Job } from './catalog-jobs'

const OUT = path.join(process.env.USERPROFILE ?? 'C:\\Users\\Admin', 'Desktop', 'FORMA-Karisik-Ornekler')

const SLUGS = [
  '08-zeytinyagi-tuck-luxury',
  '01-parfum-tuck-luxury',
  '11-bal-label-classic',
  '12-recel-label-eco',
  '05-parfum-wrap-luxury',
] as const

function xmlFront(svg: string): string {
  return svg.startsWith('<?xml') ? svg : `<?xml version="1.0" encoding="UTF-8"?>\n${svg}`
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}

function jobOf(slug: string): Job {
  const job = JOBS.find((j) => j.slug === slug)
  if (!job) throw new Error(`missing job ${slug}`)
  return job
}

async function main() {
  await fs.mkdir(OUT, { recursive: true })
  for (const name of await fs.readdir(OUT)) {
    await fs.rm(path.join(OUT, name), { recursive: true, force: true })
  }

  const engine = new FormaLocalEngine()
  const cards: {
    slug: string
    title: string
    surface: string
    concept: string
    family: string
    winner: string
    asset: string
    match: string
    critic: string
    style: string
    exportOk: boolean
    bg: string
    accent: string
  }[] = []
  const lines = [
    'FORMA — kutu + etiket karışık set (Faz 2.5 blank canvas)',
    `klasör: ${OUT}`,
    '',
  ]

  for (const slug of SLUGS) {
    const job = jobOf(slug)
    resetArtMemory()
    const spec = engine.generate({
      brief: briefFrom(job),
      overridePatch: { variationIndex: job.variationIndex ?? 0, blankCanvas: true, heroFamily: job.heroFamily },
    })
    const front = xmlFront(renderFrontSvg(spec.dieline, spec.artwork, spec.palette))
    const full = renderArtworkDoc(spec.dieline, spec.artwork, job.title)
    await fs.writeFile(path.join(OUT, `${slug}-front.svg`), front, 'utf8')
    await fs.writeFile(path.join(OUT, `${slug}-full.svg`), full, 'utf8')
    const search = lastCompositionSearch()
    if (search) {
      await fs.writeFile(path.join(OUT, `${slug}-adaylar.json`), `${JSON.stringify(search, null, 2)}\n`, 'utf8')
    }
    const vc = spec.designPlan?.visualConcept
    const concept = search?.concept?.label ?? vc?.label ?? vc?.id ?? '—'
    const family = search?.concept?.family ?? vc?.family ?? '—'
    const winner = search?.winner ?? '—'
    const asset = search?.concept?.winnerAssetId ?? '—'
    const match = search?.concept?.familyMatch ?? '—'
    const critic = search?.concept?.critic ?? '—'
    const style =
      typeof search?.concept?.styleConsistency === 'number' ? String(Math.round(search.concept.styleConsistency)) : '—'
    const surface = job.packagingMode === 'label' ? 'ETİKET' : 'KUTU'
    const line = [
      slug,
      surface,
      job.title,
      `concept:${concept}`,
      `family:${family}`,
      `winner:${winner}`,
      `asset:${asset}`,
      `match:${match}`,
      `critic:${critic}`,
      `style:${style}`,
      spec.preflight.exportOk ? 'exportOK' : 'exportBLOCK',
      `bg:${spec.palette.bg}`,
      `accent:${spec.palette.accent}`,
    ].join(' | ')
    lines.push(line)
    cards.push({
      slug,
      title: `${job.brandName} ${job.productName} · ${job.title}`,
      surface,
      concept,
      family,
      winner,
      asset,
      match,
      critic,
      style,
      exportOk: spec.preflight.exportOk,
      bg: spec.palette.bg,
      accent: spec.palette.accent,
    })
    console.log(line)
  }

  await fs.writeFile(path.join(OUT, '00-OZET.txt'), `${lines.join('\n')}\n`, 'utf8')
  const html = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>FORMA kutu + etiket</title>
  <style>
    body { font-family: Georgia, serif; margin: 0; background: #111; color: #f4efe6; }
    header { padding: 28px 32px 12px; }
    h1 { font-size: 22px; font-weight: 600; margin: 0 0 8px; }
    p { margin: 0 0 8px; color: #b7b0a4; font-size: 14px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; padding: 8px 32px 40px; }
    article { background: #1c1c1c; border: 1px solid #2c2c2c; padding: 12px; }
    article img { width: 100%; height: 380px; object-fit: contain; background: #fff; }
    .tag { display: inline-block; font-family: ui-monospace, Consolas, monospace; font-size: 10px; letter-spacing: 0.08em; color: #c9a86c; margin-bottom: 6px; }
    .meta { font-family: ui-monospace, Consolas, monospace; font-size: 11px; color: #9a9388; margin-top: 8px; line-height: 1.45; }
    a { color: #e6c27a; }
  </style>
</head>
<body>
  <header>
    <h1>FORMA — kutu + etiket</h1>
    <p>Faz 2.5 blank canvas. Family hard-constraint açık.</p>
  </header>
  <div class="grid">
    ${cards
      .map(
        (c) => `<article>
      <div class="tag">${esc(c.surface)}</div>
      <img src="${esc(`${c.slug}-front.svg`)}" alt="${esc(c.title)}" />
      <div class="meta">${esc(c.title)}<br/>
      Concept: ${esc(c.concept)} · Family: ${esc(c.family)}<br/>
      Winner: ${esc(c.winner)} · Asset: ${esc(c.asset)}<br/>
      Match: ${esc(c.match)} · Style: ${esc(c.style)} · Critic: ${esc(c.critic)}<br/>
      ${esc(c.bg)} / ${esc(c.accent)} · ${c.exportOk ? 'exportOK' : 'BLOCK'}<br/>
      <a href="${esc(`${c.slug}-full.svg`)}">tam dieline</a>
      · <a href="${esc(`${c.slug}-adaylar.json`)}">aday skorları</a></div>
    </article>`,
      )
      .join('\n')}
  </div>
</body>
</html>
`
  await fs.writeFile(path.join(OUT, 'index.html'), html, 'utf8')
  console.log(`wrote ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
