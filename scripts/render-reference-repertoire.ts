/**
 * Render the second repertoire to a folder the owner can open.
 *
 * The eight reference archetypes on the surfaces they have to work on: a tall label, a carton
 * front, a round label, a swing tag and a wrap. Same road the customer takes — the repertoire
 * flag plus a family pin, which is exactly what pressing "show me other designs" and then
 * clicking a card does.
 *
 * Usage: `npx vite-node scripts/render-reference-repertoire.ts [outDir]` (default `.compositions-out`).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderPanelSvg } from '../src/engine/artwork/renderArtwork'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { emptyBrief } from '../src/engine/fields'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { xmlSafeSvg } from '../src/engine/llm/rasterise'
import { STUDIO_GALLERY_JOBS } from '../src/engine/studio/studioGalleryJobs'
import type { StudioFamily } from '../src/engine/studio/types'

const out = process.argv[2] ?? '.compositions-out'
mkdirSync(out, { recursive: true })

const FAMILIES: StudioFamily[] = ['arch', 'collage', 'silhouette', 'ribbon', 'grid', 'pattern', 'acid', 'inner-card']

/** One job per surface the repertoire has to cover. */
const SURFACES: { key: string; slug: string; templateId?: string; height: number }[] = [
  { key: 'etiket', slug: '05-kahve-etiket', height: 400 },
  { key: 'kutu', slug: '05-kahve-kutu', height: 400 },
  { key: 'yuvarlak', slug: '02-krem-etiket', templateId: 'fm-lid-round', height: 300 },
  { key: 'oval', slug: '02-krem-etiket', templateId: 'fm-label-oval', height: 260 },
  { key: 'aski', slug: '02-krem-etiket', templateId: 'fm-kit-hangtag', height: 340 },
]

const figures: string[] = []
let n = 0
for (const surface of SURFACES) {
  const job = STUDIO_GALLERY_JOBS.find((j) => j.slug === surface.slug)
  if (!job) throw new Error(`no gallery job ${surface.slug}`)
  const row: string[] = []
  for (const family of FAMILIES) {
    resetArtMemory()
    const spec = new FormaLocalEngine().generate({
      brief: {
        ...emptyBrief(),
        brandName: job.brand,
        productName: job.product,
        sector: job.sector,
        subProduct: job.subProduct,
        packagingMode: job.packagingMode,
        templateId: surface.templateId ?? job.templateId,
        styleType: job.styleType,
        colors: job.colors,
        volume: job.volume,
        dimensionsMm: job.dimensionsMm,
        barcode: '8690000000017',
        studioRepertoire: 'reference',
        studioFamily: family,
        studioFamilyLocked: true,
      },
      overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 },
    })
    const d = spec.studio?.direction
    const hits = (spec.studio?.collisions.length ?? 0) + (spec.studio?.outOfBounds.length ?? 0)
    console.log(
      `${surface.key.padEnd(9)} ${family.padEnd(11)} → ${String(d?.archetype).padEnd(16)} ${String(d?.background).padEnd(11)} ${String(d?.typePairing).padEnd(34)} hits ${hits} export ${spec.preflight.exportOk ? 'OK' : 'NO'} craft ${spec.craftScore?.visualCraft} hero ${spec.craftScore?.hero}`,
    )
    const svg = xmlSafeSvg(renderPanelSvg(spec.dieline, spec.artwork, spec.artwork.frontPanelId, spec.palette))
    writeFileSync(join(out, `ref-${surface.key}-${family}.svg`), svg)
    const ns = `r${n++}-`
    row.push(
      `<figure>` +
        svg
          .replace(/<svg([^>]*?)\s(?:width|height)="[^"]*"/g, '<svg$1')
          .replace('<svg', `<svg height="${surface.height}"`)
          .replace(/id="([^"]+)"/g, (_m, id: string) => `id="${ns}${id}"`)
          .replace(/url\(#([^)]+)\)/g, (_m, id: string) => `url(#${ns}${id})`)
          .replace(/href="#([^"]+)"/g, (_m, id: string) => `href="#${ns}${id}"`) +
        `<figcaption>${family}</figcaption></figure>`,
    )
  }
  figures.push(`<h2>${surface.key}</h2><div class="row">${row.join('')}</div>`)
}

writeFileSync(
  join(out, 'reference-repertoire.html'),
  `<!doctype html><meta charset="utf-8"><title>İkinci repertuar — 8 yeni tasarım</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Great+Vibes&family=Montserrat:wght@300;500;700&family=Instrument+Serif:ital@0;1&family=Barlow+Condensed:wght@600;700&family=Righteous&family=IBM+Plex+Mono:wght@400;500&display=swap"><style>body{background:#777;margin:0;padding:16px;font:12px system-ui;color:#fff}h2{margin:18px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:.12em}.row{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start}figure{margin:0}svg{background:#fff;box-shadow:0 2px 12px #0006;display:block}figcaption{padding-top:4px}</style>${figures.join('')}`,
)
console.log(`→ ${out}/reference-repertoire.html`)
