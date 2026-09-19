/**
 * Render the Phase 5 graphic languages to a folder the owner can open.
 *
 * One face per field on a family that lists it, the two heritage frames, and the two flat render
 * modes beside the solid one on the same specimen face — pinned through `studioPick` and a
 * personality, the roads a picked card and a spoken brief take. Ids are namespaced per figure and
 * the markup goes through the exporter's escape (see `render-compositions.ts`).
 *
 * Usage: `npx vite-node scripts/render-graphic-language.ts [outDir]` (default `.compositions-out`).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { DesignBrief } from '../src/types'
import { renderPanelSvg } from '../src/engine/artwork/renderArtwork'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { emptyBrief } from '../src/engine/fields'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { xmlSafeSvg } from '../src/engine/llm/rasterise'
import { STUDIO_GALLERY_JOBS } from '../src/engine/studio/studioGalleryJobs'
import type { StudioFamily } from '../src/engine/studio/types'

const out = process.argv[2] ?? '.compositions-out'
mkdirSync(out, { recursive: true })

type Case = { name: string; slug: string; family: StudioFamily; brand?: string; pick?: DesignBrief['studioPick']; brief?: Partial<DesignBrief>; height?: number }
const CASES: Case[] = [
  { name: 'field-blob-botanical', slug: '04-gida-bal-etiket', family: 'botanical', brand: 'Nova', pick: { background: 'blob' } },
  { name: 'field-ogee-noir', slug: '01-parfum-etiket', family: 'dark-luxe', brand: 'Rebull', pick: { background: 'ogee' } },
  { name: 'field-celestial-noir', slug: '01-parfum-kutu', family: 'dark-luxe', brand: 'Lunara', pick: { background: 'celestial' }, height: 560 },
  { name: 'field-pictogram-tech', slug: '06-elektronik-kutu', family: 'tech', brand: 'Nox', pick: { background: 'pictogram' }, height: 560 },
  { name: 'field-toile-atelier', slug: '02-krem-etiket', family: 'atelier', brand: 'Verda', pick: { background: 'toile' } },
  { name: 'frame-laurel-crest', slug: '01-parfum-etiket', family: 'crest', brand: 'Azzurra', pick: { frame: 'laurel' } },
  { name: 'frame-cartouche-atelier', slug: '02-krem-etiket', family: 'atelier', brand: 'Diako', pick: { frame: 'cartouche' } },
  { name: 'style-solid-specimen', slug: '07-bebek-etiket', family: 'specimen', brand: 'Nova' },
  { name: 'style-cutpaper-specimen', slug: '07-bebek-etiket', family: 'specimen', brand: 'Nova', brief: { feeling: 'sıcak, neşeli, enerjik', audience: 'genç aileler' } },
  { name: 'style-silhouette-specimen', slug: '07-bebek-etiket', family: 'specimen', brand: 'Nova', brief: { feeling: 'teknik, hassas, sakin', channel: 'eczane', priceTier: 'premium' } },
]

const figures: string[] = []
CASES.forEach((c, i) => {
  const job = STUDIO_GALLERY_JOBS.find((j) => j.slug === c.slug)
  if (!job) throw new Error(`no gallery job ${c.slug}`)
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({
    brief: {
      ...emptyBrief(),
      brandName: c.brand ?? job.brand,
      productName: job.product,
      sector: job.sector,
      subProduct: job.subProduct,
      packagingMode: job.packagingMode,
      templateId: job.templateId,
      styleType: job.styleType,
      colors: job.colors,
      volume: job.volume,
      dimensionsMm: job.dimensionsMm,
      barcode: '8690000000017',
      studioFamily: c.family,
      studioFamilyLocked: true,
      ...(c.pick ? { studioPick: c.pick } : {}),
      ...(c.brief ?? {}),
    },
    overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 },
  })
  const d = spec.studio?.direction
  console.log(
    `${c.name.padEnd(28)} ${d?.archetype}/${d?.background}/${d?.frame}/${d?.subjectStyle ?? 'seed'} · çarpışma ${spec.studio?.collisions.length} · taşma ${spec.studio?.outOfBounds.length} · export ${spec.preflight.exportOk} · craft ${spec.craftScore?.visualCraft} hero ${spec.craftScore?.hero} dekor ${spec.craftScore?.decoration}`,
  )
  const svg = xmlSafeSvg(renderPanelSvg(spec.dieline, spec.artwork, spec.artwork.frontPanelId, spec.palette))
  writeFileSync(join(out, `${c.name}.svg`), svg)
  const ns = `g${i}-`
  const inline = svg
    .replace(/<svg([^>]*?)\s(?:width|height)="[^"]*"/g, '<svg$1')
    .replace('<svg', `<svg height="${c.height ?? 430}"`)
    .replace(/id="([^"]+)"/g, (_m, id: string) => `id="${ns}${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_m, id: string) => `url(#${ns}${id})`)
    .replace(/href="#([^"]+)"/g, (_m, id: string) => `href="#${ns}${id}"`)
  figures.push(`<figure>${inline}<figcaption>${c.name}</figcaption></figure>`)
})
writeFileSync(
  join(out, 'graphic-language.html'),
  `<!doctype html><meta charset="utf-8"><title>Faz 5 grafik dili</title><style>body{background:#777;margin:0;padding:16px;font:12px system-ui;color:#fff}.row{display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start}figure{margin:0}svg{background:#fff;box-shadow:0 2px 12px #0006;display:block}</style><div class="row">${figures.join('')}</div>`,
)
console.log(`→ ${out}/graphic-language.html`)
