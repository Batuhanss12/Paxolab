/**
 * Phase 15 acceptance demo — same brand/product, two briefs.
 * Gallery HOLD. Writes only into 15-blank-canvas/.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { renderArtworkDoc, renderFrontSvg } from '../src/engine/artwork/renderArtwork'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { emptyBrief } from '../src/engine/fields'
import { matchMotifs } from '../src/engine/artwork/artMotifMatch'

const OUT = 'C:\\Users\\Admin\\Desktop\\FORMA-Pattern-Yeni-Tasarimlar\\15-blank-canvas'

const SHARED = {
  ...emptyBrief(),
  brandName: 'AURELIA',
  productName: 'Noir',
  sector: 'parfüm',
  subProduct: 'eau de parfum',
  packagingMode: 'box' as const,
  templateId: 'fm-cos-tuck-perfume',
  dimensionsMm: { L: 70, W: 40, H: 140 },
  volume: '50 ml',
}

async function main() {
  await fs.mkdir(OUT, { recursive: true })
  for (const name of await fs.readdir(OUT)) {
    await fs.rm(path.join(OUT, name), { recursive: true, force: true })
  }

  const engine = new FormaLocalEngine()
  const briefs = [
    { slug: '01-luxury-dark-gold', styleType: 'luxury' as const, colors: '#1a0a0a #c9a227' },
    { slug: '02-minimal-cream-green', styleType: 'minimal' as const, colors: '#f5f0e8 #2d6a4f' },
  ]

  const lines = [
    'FORMA — Phase 15 blank-canvas director (galeri HOLD)',
    `çıkış: ${OUT}`,
    'aynı marka/ürün: AURELIA Noir',
    '',
  ]

  for (const row of briefs) {
    resetArtMemory()
    const spec = engine.generate({
      brief: { ...SHARED, styleType: row.styleType, colors: row.colors },
      overridePatch: { blankCanvas: true },
    })
    const match = matchMotifs({
      mood: row.styleType,
      sector: spec.designPlan?.sector ?? 'perfume',
      colors: row.colors,
      seed: 0,
    })
    const front = renderFrontSvg(spec.dieline, spec.artwork, spec.palette)
    const full = renderArtworkDoc(spec.dieline, spec.artwork, `${row.slug} — blank canvas`)
    await fs.writeFile(path.join(OUT, `${row.slug}-front.svg`), front, 'utf8')
    await fs.writeFile(path.join(OUT, `${row.slug}-full.svg`), full, 'utf8')
    const atoms = (front.match(/data-motif-atom="/g) || []).length
    const sheets = [...new Set([...front.matchAll(/data-motif-atom="([^"]+)"/g)].map((m) => m[1].split('__')[0]))]
    const line = [
      row.slug,
      `mood:${row.styleType}`,
      `bg:${spec.palette.bg}`,
      `accent:${spec.palette.accent}`,
      `sheets:${sheets.join(',') || '—'}`,
      `atoms:${atoms}`,
      `matched:${match.sheetIds.join(',') || '—'}`,
      `goldBar:${/data-art="gold-bar"/.test(front) ? 'YES' : 'no'}`,
      `crest:${/data-hero="crest"/.test(front) ? 'YES' : 'no'}`,
      `nightTopo:${/data-bg-kit="night-topo"/.test(front) ? 'YES' : 'no'}`,
      `blank:${/data-face="blank-canvas"/.test(front) ? 'YES' : 'no'}`,
    ].join(' | ')
    lines.push(line)
    console.log(line)
    if (/data-hero="seal"/.test(front)) throw new Error(`${row.slug} shipped seal`)
    if (/data-bg-kit="/.test(front)) throw new Error(`${row.slug} shipped a style bg-kit`)
  }

  await fs.writeFile(path.join(OUT, '00-OZET.txt'), `${lines.join('\n')}\n`, 'utf8')
  console.log(`wrote ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
