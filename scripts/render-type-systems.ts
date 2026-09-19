/**
 * Render the Phase 4 type systems to a folder the owner can open.
 *
 * One face per new system, on a family that lists it, pinned through `studioPick` — the same
 * road a picked card takes — plus the base system on the same face beside it, so the behaviour
 * reads as a difference and not as a face on its own. Ids are namespaced per figure and the
 * markup goes through the same escape the exporter uses (see `render-compositions.ts`).
 *
 * Usage: `npx vite-node scripts/render-type-systems.ts [outDir]` (default `.compositions-out`).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderPanelSvg } from '../src/engine/artwork/renderArtwork'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { emptyBrief } from '../src/engine/fields'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { xmlSafeSvg } from '../src/engine/llm/rasterise'
import { STUDIO_GALLERY_JOBS } from '../src/engine/studio/studioGalleryJobs'
import { TYPE_SYSTEMS } from '../src/engine/studio/typeSystem'
import type { StudioFamily, TypePairing } from '../src/engine/studio/types'

const out = process.argv[2] ?? '.compositions-out'
mkdirSync(out, { recursive: true })

const CASES: { name: string; slug: string; family: StudioFamily; brand: string; systems: TypePairing[] }[] = [
  { name: 'noir-condensed-mono', slug: '01-parfum-etiket', family: 'dark-luxe', brand: 'Rebull', systems: ['serif-display/sans-meta', 'condensed-serif/mono'] },
  { name: 'marble-oversized', slug: '05-kahve-etiket', family: 'marble', brand: 'Nova', systems: ['spaced-serif/spaced-sans', 'display-serif-oversized/sans-meta'] },
  { name: 'tech-condensed-grotesk', slug: '06-elektronik-etiket', family: 'tech', brand: 'Nox', systems: ['sans-light/sans-heavy', 'condensed-grotesk/sans-light'] },
  { name: 'tech-heavy-block', slug: '06-elektronik-kutu', family: 'tech', brand: 'Nox', systems: ['sans-light/sans-heavy', 'heavy-grotesk-block/sans'] },
  { name: 'wave-rounded', slug: '09-temizlik-etiket', family: 'wave', brand: 'Ferah', systems: ['sans-light/sans-heavy', 'rounded/sans'] },
  { name: 'linescene-light-wide', slug: '08-saglik-etiket', family: 'line-scene', brand: 'Sera', systems: ['sans-light/sans-heavy', 'light-geometric/wide'] },
]

const figures: string[] = []
let n = 0
for (const c of CASES) {
  const job = STUDIO_GALLERY_JOBS.find((j) => j.slug === c.slug)
  if (!job) throw new Error(`no gallery job ${c.slug}`)
  const svgs: string[] = []
  for (const system of c.systems) {
    resetArtMemory()
    const spec = new FormaLocalEngine().generate({
      brief: {
        ...emptyBrief(),
        brandName: c.brand,
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
        studioPick: { typePairing: system },
      },
      overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 },
    })
    const d = spec.studio?.direction
    console.log(`${c.name.padEnd(24)} ${system.padEnd(36)} → ${d?.archetype}/${d?.typePairing} · çarpışma ${spec.studio?.collisions.length} · taşma ${spec.studio?.outOfBounds.length} · min ${spec.studio?.minTextMm.toFixed(2)} mm · craft ${spec.craftScore?.visualCraft} tip ${spec.craftScore?.typography}`)
    const svg = xmlSafeSvg(renderPanelSvg(spec.dieline, spec.artwork, spec.artwork.frontPanelId, spec.palette))
    writeFileSync(join(out, `type-${c.name}-${system.replace(/[^a-z]+/g, '-')}.svg`), svg)
    const ns = `t${n++}-`
    svgs.push(
      svg
        .replace(/<svg([^>]*?)\s(?:width|height)="[^"]*"/g, '<svg$1')
        .replace('<svg', '<svg height="430"')
        .replace(/id="([^"]+)"/g, (_m, id: string) => `id="${ns}${id}"`)
        .replace(/url\(#([^)]+)\)/g, (_m, id: string) => `url(#${ns}${id})`)
        .replace(/href="#([^"]+)"/g, (_m, id: string) => `href="#${ns}${id}"`),
    )
  }
  figures.push(`<figure><div style="display:flex;gap:6px">${svgs.join('')}</div><figcaption>${c.name}: ${c.systems.map((s) => TYPE_SYSTEMS[s].talk).join(' → ')}</figcaption></figure>`)
}
writeFileSync(
  join(out, 'type-systems.html'),
  `<!doctype html><meta charset="utf-8"><title>Faz 4 tip sistemleri</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Great+Vibes&family=Montserrat:wght@300;500;700&family=Instrument+Serif:ital@0;1&family=Barlow+Condensed:wght@600;700&family=Righteous&family=IBM+Plex+Mono:wght@400;500&display=swap"><style>body{background:#777;margin:0;padding:16px;font:12px system-ui;color:#fff}.row{display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start}figure{margin:0}svg{background:#fff;box-shadow:0 2px 12px #0006;display:block}</style><div class="row">${figures.join('')}</div>`,
)
console.log(`→ ${out}/type-systems.html`)
