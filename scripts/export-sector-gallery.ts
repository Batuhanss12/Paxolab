/**
 * One box + one label per live sector, studio path, mixed templates.
 * Writes SVG to the Desktop gallery folder. Jobs live in studioGalleryJobs (S6 golden).
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { renderArtworkDoc, renderFrontSvg } from '../src/engine/artwork/renderArtwork'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { emptyBrief } from '../src/engine/fields'
import { STUDIO_GALLERY_JOBS } from '../src/engine/studio/studioGalleryJobs'

const OUT = 'C:\\Users\\Admin\\Desktop\\GRAPXOR-SEKTOR-TASARIMLAR'
const JOBS = STUDIO_GALLERY_JOBS

async function main() {
  await fs.mkdir(OUT, { recursive: true })
  const engine = new FormaLocalEngine()
  const index: string[] = [
    '# Grapxor — sektör galerisi (stüdyo yolu)',
    '',
    'Her sektörden 1 kutu + 1 etiket. `overrides.studio = true`. Farklı şablon / ölçü / palet.',
    '',
    '| Dosya | Marka | Sektör | Yüzey | Şablon | Arketip | Doku |',
    '|---|---|---|---|---|---|---|',
  ]

  for (const job of JOBS) {
    resetArtMemory()
    const spec = engine.generate({
      brief: {
        ...emptyBrief(),
        brandName: job.brand,
        productName: job.product,
        sector: job.sector,
        subProduct: job.subProduct,
        packagingMode: job.packagingMode,
        templateId: job.templateId,
        styleType: job.styleType,
        colors: job.colors,
        volume: job.volume,
        dimensionsMm: job.dimensionsMm,
      },
      overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 },
    })
    const dir = spec.studio?.direction
    const front = renderFrontSvg(spec.dieline, spec.artwork, spec.palette)
    const full = renderArtworkDoc(spec.dieline, spec.artwork, `${job.slug} — ${job.brand}`)
    await fs.writeFile(path.join(OUT, `${job.slug}-on.svg`), front, 'utf8')
    await fs.writeFile(path.join(OUT, `${job.slug}-net.svg`), full, 'utf8')
    index.push(
      `| ${job.slug} | ${job.brand} | ${job.sector}/${job.subProduct} | ${job.packagingMode} | ${spec.templateId} | ${dir?.archetype ?? '—'} | ${dir?.background ?? '—'} |`,
    )
    console.log(`${job.slug}  ${spec.templateId}  ${dir?.archetype}/${dir?.background}  studio=${Boolean(spec.studio)}`)
  }

  index.push('', `Toplam ${JOBS.length} iş · ${JOBS.length * 2} SVG.`, '')
  await fs.writeFile(path.join(OUT, 'INDEX.md'), index.join('\n'), 'utf8')
  console.log(`yazıldı: ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
