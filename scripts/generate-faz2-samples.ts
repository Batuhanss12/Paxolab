/**
 * Writes Faz 2.8 sample designs to a Desktop folder.
 * Blank-canvas faces: visual concept → family/budget → candidate search.
 * Kit faces read the same VisualConcept for lockup/chrome/frame, then motif overlay.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { renderArtworkDoc, renderFrontSvg } from '../src/engine/artwork/renderArtwork'
import { clearCompositionSearch, lastCompositionSearch } from '../src/engine/artwork/compositionCandidates'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { emptyBrief } from '../src/engine/fields'
import { JOBS, briefFrom, type Job } from './catalog-jobs'

const OUT = path.join(process.env.USERPROFILE ?? 'C:\\Users\\Admin', 'Desktop', 'FORMA-Faz25-Ornekler')

type Sample = {
  slug: string
  title: string
  folder: '01-blank-canvas' | '02-katalog-kit'
  blank: boolean
  job?: Job
  brief?: ReturnType<typeof Object.assign>
}

const BLANK: Sample[] = [
  {
    slug: 'blank-parfum-luxury-noir',
    title: 'Parfüm · luxury · AURELIA Noir',
    folder: '01-blank-canvas',
    blank: true,
    brief: {
      ...emptyBrief(),
      brandName: 'AURELIA',
      productName: 'Noir',
      sector: 'parfüm',
      subProduct: 'eau de parfum',
      packagingMode: 'box',
      templateId: 'fm-cos-tuck-perfume',
      dimensionsMm: { L: 70, W: 40, H: 140 },
      volume: '50 ml',
      styleType: 'luxury',
      colors: '#1a0a0a #c9a227',
    },
  },
  {
    slug: 'blank-parfum-minimal-noir',
    title: 'Parfüm · minimal · AURELIA Noir',
    folder: '01-blank-canvas',
    blank: true,
    brief: {
      ...emptyBrief(),
      brandName: 'AURELIA',
      productName: 'Noir',
      sector: 'parfüm',
      subProduct: 'eau de parfum',
      packagingMode: 'box',
      templateId: 'fm-cos-tuck-perfume',
      dimensionsMm: { L: 70, W: 40, H: 140 },
      volume: '50 ml',
      styleType: 'minimal',
      colors: '#f5f0e8 #2d6a4f',
    },
  },
  {
    slug: 'blank-parfum-classic-aqua',
    title: 'Kolonya · classic · LUCENT Aqua',
    folder: '01-blank-canvas',
    blank: true,
    job: JOBS.find((j) => j.slug === '02-kolonya-tuck-classic'),
  },
  {
    slug: 'blank-krem-luxury',
    title: 'Krem · luxury · LUMINA Night Cream',
    folder: '01-blank-canvas',
    blank: true,
    job: JOBS.find((j) => j.slug === '03-krem-tuck-luxury'),
  },
  {
    slug: 'blank-serum-minimal',
    title: 'Serum · minimal · CLARA Concentrate',
    folder: '01-blank-canvas',
    blank: true,
    job: JOBS.find((j) => j.slug === '04-serum-tuck-minimal'),
  },
  {
    slug: 'blank-zeytinyagi-luxury',
    title: 'Zeytinyağı · luxury · TERRA GROVE',
    folder: '01-blank-canvas',
    blank: true,
    job: JOBS.find((j) => j.slug === '08-zeytinyagi-tuck-luxury'),
  },
  {
    slug: 'blank-cikolata-playful',
    title: 'Çikolata · playful · NIB Cacao',
    folder: '01-blank-canvas',
    blank: true,
    job: JOBS.find((j) => j.slug === '09-cikolata-tray-playful'),
  },
  {
    slug: 'blank-kulaklik-modern',
    title: 'Kulaklık · modern · NOX Pulse',
    folder: '01-blank-canvas',
    blank: true,
    job: JOBS.find((j) => j.slug === '14-kulaklik-tuck-modern'),
  },
  {
    slug: 'blank-kulaklik-luxury',
    title: 'Kulaklık · luxury (gold-bar yok) · NOX Pulse',
    folder: '01-blank-canvas',
    blank: true,
    brief: {
      ...emptyBrief(),
      brandName: 'NOX',
      productName: 'Pulse',
      sector: 'elektronik',
      subProduct: 'kulaklık',
      packagingMode: 'box',
      templateId: 'fm-elec-tuck-earbuds',
      dimensionsMm: { L: 80, W: 40, H: 120 },
      volume: '1 adet',
      styleType: 'luxury',
      colors: '#1a0a0a #c9a227',
    },
  },
  {
    slug: 'blank-temizlik-minimal',
    title: 'Temizlik · minimal · PURE Surface',
    folder: '01-blank-canvas',
    blank: true,
    job: JOBS.find((j) => j.slug === '20-temizlik-tuck-minimal'),
  },
]

const KIT_SLUGS = [
  '01-parfum-tuck-luxury',
  '03-krem-tuck-luxury',
  '04-serum-tuck-minimal',
  '08-zeytinyagi-tuck-luxury',
  '09-cikolata-tray-playful',
  '14-kulaklik-tuck-modern',
  '20-temizlik-tuck-minimal',
]

function xmlFront(svg: string): string {
  return svg.startsWith('<?xml') ? svg : `<?xml version="1.0" encoding="UTF-8"?>\n${svg}`
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}

async function main() {
  await fs.mkdir(OUT, { recursive: true })
  for (const name of await fs.readdir(OUT)) {
    await fs.rm(path.join(OUT, name), { recursive: true, force: true })
  }
  await fs.mkdir(path.join(OUT, '01-blank-canvas'), { recursive: true })
  await fs.mkdir(path.join(OUT, '02-katalog-kit'), { recursive: true })

  const engine = new FormaLocalEngine()
  const cards: {
    slug: string
    title: string
    folder: string
    winner: string
    exportOk: boolean
    atoms: number
    blank: boolean
    bg: string
    accent: string
    concept: string
    family: string
    budget: string
    winnerFamily: string
    familyMatch: string
    compatibility: string
    assetId: string
    subfamily: string
    fallback: string
    styleConsistency: string
    critic: string
    hardConstraint: string
    spend: string
    hasSearch: boolean
  }[] = []
  const lines = [
    'FORMA — FAZ 2.8 örnek üretim (Visual Concept / kit alignment)',
    `tarih: 2026-09-15`,
    `klasör: ${OUT}`,
    '',
    '01-blank-canvas  → concept → family/budget → 3–5 strateji → winner paint',
    '02-katalog-kit   → kit chrome + aynı family match/gate',
    '',
  ]

  const all: Sample[] = [
    ...BLANK,
    ...KIT_SLUGS.map((slug) => {
      const job = JOBS.find((j) => j.slug === slug)
      return {
        slug: `kit-${slug}`,
        title: job ? `${job.title} · kit` : slug,
        folder: '02-katalog-kit' as const,
        blank: false,
        job,
      }
    }),
  ]

  for (const sample of all) {
    if (sample.job === undefined && !sample.brief) throw new Error(`missing job for ${sample.slug}`)
    resetArtMemory()
    clearCompositionSearch()
    const brief = sample.brief ?? briefFrom(sample.job as Job)
    const spec = engine.generate({
      brief,
      overridePatch: {
        variationIndex: sample.job?.variationIndex ?? 0,
        blankCanvas: sample.blank,
        heroFamily: sample.job?.heroFamily,
      },
    })
    const dir = path.join(OUT, sample.folder)
    const front = xmlFront(renderFrontSvg(spec.dieline, spec.artwork, spec.palette))
    const full = renderArtworkDoc(spec.dieline, spec.artwork, sample.title)
    await fs.writeFile(path.join(dir, `${sample.slug}-front.svg`), front, 'utf8')
    await fs.writeFile(path.join(dir, `${sample.slug}-full.svg`), full, 'utf8')

    const search = lastCompositionSearch()
    if (search) {
      await fs.writeFile(path.join(dir, `${sample.slug}-adaylar.json`), `${JSON.stringify(search, null, 2)}\n`, 'utf8')
    }

    const atoms = (front.match(/data-motif-atom="/g) || []).length
    const winner = search?.winner ?? (sample.blank ? '—' : 'kit')
    const vc = spec.designPlan?.visualConcept
    const conceptLabel = search?.concept?.label ?? vc?.label ?? vc?.id ?? '—'
    const family = search?.concept?.family ?? vc?.family ?? '—'
    const spendVal = search?.concept?.spend
    const budgetVal = search?.concept?.decorationBudget ?? vc?.decorationBudget
    const budget = typeof budgetVal === 'number' ? `budget ${budgetVal.toFixed(2)}` : '—'
    const spend = typeof spendVal === 'number' ? `spend ${spendVal.toFixed(2)}` : '—'
    const winnerFamily = search?.concept?.winnerFamily ?? '—'
    const familyMatch = search?.concept?.familyMatch ?? '—'
    const assetId = search?.concept?.winnerAssetId ?? '—'
    const subfamily = search?.concept?.winnerSubfamily ?? '—'
    const fallback = search?.concept?.fallbackMode ?? '—'
    const styleConsistency =
      typeof search?.concept?.styleConsistency === 'number' ? String(Math.round(search.concept.styleConsistency)) : '—'
    const fidelity =
      typeof search?.concept?.conceptFidelity === 'number' ? String(Math.round(search.concept.conceptFidelity)) : '—'
    const lang = search?.concept?.visualLanguage ?? '—'
    const langs = (search?.concept?.languages ?? []).join(',') || '—'
    const avoid = (search?.concept?.avoid ?? []).join(',') || '—'
    const lexicon = (search?.concept?.motifLexicon ?? []).join(',') || '—'
    const roles = (search?.concept?.roles ?? []).join(',') || '—'
    const regions = (search?.concept?.regions ?? []).join(',') || '—'
    const critic = search?.concept?.critic ?? '—'
    const hardConstraint = search?.concept?.hardConstraint ?? '—'
    const compatibility =
      hardConstraint === 'FAILURE' ? 'HARD CONSTRAINT FAILURE' : familyMatch === 'NONE' && assetId !== '—' ? 'INCOMPATIBLE' : familyMatch
    const line = [
      sample.slug,
      sample.blank ? 'BLANK' : 'KIT',
      `concept:${conceptLabel}`,
      `family:${family}`,
      budget,
      spend,
      `winner:${winner}`,
      `winnerFamily:${winnerFamily}`,
      `match:${familyMatch}`,
      `asset:${assetId}`,
      `sub:${subfamily}`,
      `fallback:${fallback}`,
      `style:${styleConsistency}`,
      `lang:${lang}`,
      `langs:${langs}`,
      `avoid:${avoid}`,
      `lex:${lexicon}`,
      `fidelity:${fidelity}`,
      `roles:${roles}`,
      `regions:${regions}`,
      `critic:${critic}`,
      `gate:${hardConstraint}`,
      `atoms:${atoms}`,
      `bg:${spec.palette.bg}`,
      `accent:${spec.palette.accent}`,
      spec.preflight.exportOk ? 'exportOK' : 'exportBLOCK',
      search ? `aday:${search.perf.candidateCount} paint:${search.perf.paintCount} ${search.perf.generateMs}ms` : '',
    ]
      .filter(Boolean)
      .join(' | ')
    lines.push(line)
    cards.push({
      slug: sample.slug,
      title: sample.title,
      folder: sample.folder,
      winner,
      exportOk: spec.preflight.exportOk,
      atoms,
      blank: sample.blank,
      bg: spec.palette.bg,
      accent: spec.palette.accent,
      concept: conceptLabel,
      family,
      budget,
      winnerFamily,
      familyMatch,
      compatibility,
      assetId,
      subfamily,
      fallback,
      styleConsistency,
      critic,
      hardConstraint,
      spend,
      hasSearch: Boolean(search),
    })
    console.log(line)
  }

  await fs.writeFile(path.join(OUT, '00-OZET.txt'), `${lines.join('\n')}\n`, 'utf8')

  const blankCards = cards.filter((c) => c.blank)
  const kitCards = cards.filter((c) => !c.blank)
  const html = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>FORMA FAZ 2.8 örnekler</title>
  <style>
    body { font-family: Georgia, serif; margin: 0; background: #111; color: #f4efe6; }
    header { padding: 28px 32px 12px; }
    h1 { font-size: 22px; font-weight: 600; margin: 0 0 8px; }
    p { margin: 0 0 8px; color: #b7b0a4; font-size: 14px; }
    section { padding: 8px 32px 32px; }
    h2 { font-size: 15px; letter-spacing: 0.08em; text-transform: uppercase; color: #c9a86c; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    article { background: #1c1c1c; border: 1px solid #2c2c2c; padding: 12px; }
    article img { width: 100%; height: 360px; object-fit: contain; background: #fff; }
    .meta { font-family: ui-monospace, Consolas, monospace; font-size: 11px; color: #9a9388; margin-top: 8px; line-height: 1.45; }
    a { color: #e6c27a; }
  </style>
</head>
<body>
  <header>
    <h1>FORMA — FAZ 2.8 örnekler</h1>
    <p>Blank-canvas ve katalog kit: visual concept → lockup/chrome/motif aynı SoT. Kit yüzü style costume değil, concept dilini izler.</p>
  </header>
  <section>
    <h2>Blank canvas · aday araması</h2>
    <div class="grid">
      ${blankCards
        .map(
          (c) => `<article>
        <img src="${esc(`${c.folder}/${c.slug}-front.svg`)}" alt="${esc(c.title)}" />
        <div class="meta">${esc(c.title)}<br/>
        Concept: ${esc(c.concept)} · Family: ${esc(c.family)} · ${esc(c.budget)} ${esc(c.spend)}<br/>
        Winner: ${esc(c.winner)} · Winner Family: ${esc(c.winnerFamily)} · Family Match: ${esc(c.familyMatch)} · Compat: ${esc(c.compatibility)}<br/>
        Asset: ${esc(c.assetId)} · Subfamily: ${esc(c.subfamily)} · Fallback: ${esc(c.fallback)}<br/>
        Style Consistency: ${esc(c.styleConsistency)} · Critic: ${esc(c.critic)} · Gate: ${esc(c.hardConstraint)} · atoms: ${c.atoms}<br/>
        ${esc(c.bg)} / ${esc(c.accent)} · ${c.exportOk ? 'exportOK' : 'BLOCK'}<br/>
        <a href="${esc(`${c.folder}/${c.slug}-full.svg`)}">tam dieline</a>
        · ${c.hasSearch ? `<a href="${esc(`${c.folder}/${c.slug}-adaylar.json`)}">aday skorları</a>` : ''}</div>
      </article>`,
        )
        .join('\n')}
    </div>
  </section>
  <section>
    <h2>Katalog kit</h2>
    <div class="grid">
      ${kitCards
        .map(
          (c) => `<article>
        <img src="${esc(`${c.folder}/${c.slug}-front.svg`)}" alt="${esc(c.title)}" />
        <div class="meta">${esc(c.title)}<br/>
        Concept: ${esc(c.concept)} · Family: ${esc(c.family)} · ${esc(c.budget)} ${esc(c.spend)}<br/>
        Winner: ${esc(c.winner)} · Winner Family: ${esc(c.winnerFamily)} · Family Match: ${esc(c.familyMatch)} · Compat: ${esc(c.compatibility)}<br/>
        Asset: ${esc(c.assetId)} · Subfamily: ${esc(c.subfamily)} · Fallback: ${esc(c.fallback)}<br/>
        Style Consistency: ${esc(c.styleConsistency)} · Critic: ${esc(c.critic)} · Gate: ${esc(c.hardConstraint)} · atoms: ${c.atoms}<br/>
        ${esc(c.bg)} / ${esc(c.accent)} · ${c.exportOk ? 'exportOK' : 'BLOCK'}<br/>
        <a href="${esc(`${c.folder}/${c.slug}-full.svg`)}">tam dieline</a>
        ${c.hasSearch ? `· <a href="${esc(`${c.folder}/${c.slug}-adaylar.json`)}">aday skorları</a>` : ''}</div>
      </article>`,
        )
        .join('\n')}
    </div>
  </section>
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
