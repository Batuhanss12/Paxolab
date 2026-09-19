/**
 * Render the Phase 2 compositions to a folder the owner can open.
 *
 * Six faces — band split and rotated brand, on labels and cartons, across families — written as
 * standalone SVGs plus one `inline.html` that shows them side by side. Two details learned the
 * hard way while checking Phase 2 by eye, both handled here so the page shows the engine and not
 * the page's own bugs:
 *
 *   - six inline SVGs in one document share ids (`clip-front`, `clip-label`, the uid-based clip
 *     and gradient ids), and the browser resolves `url(#…)` document-wide — the box front was
 *     being clipped by the first label's polygon. Ids are namespaced per figure;
 *   - the studio front is not valid XML on its own (a bare `&` in the font import), so the
 *     standalone files go through the same escape the preview rasteriser uses.
 *
 * Usage: `npx vite-node scripts/render-compositions.ts [outDir]` (default `.compositions-out`).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderPanelSvg } from '../src/engine/artwork/renderArtwork'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { emptyBrief } from '../src/engine/fields'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { xmlSafeSvg } from '../src/engine/llm/rasterise'
import { STUDIO_GALLERY_JOBS } from '../src/engine/studio/studioGalleryJobs'
import type { LockupStyle, StudioFamily } from '../src/engine/studio/types'

const out = process.argv[2] ?? '.compositions-out'
mkdirSync(out, { recursive: true })

const CASES: { name: string; slug: string; family: StudioFamily; lockup: LockupStyle; height: number; sides?: boolean }[] = [
  { name: 'label-marble-band', slug: '05-kahve-etiket', family: 'marble', lockup: 'band-split', height: 430 },
  { name: 'label-marble-rotated', slug: '05-kahve-etiket', family: 'marble', lockup: 'rotated-brand', height: 430 },
  { name: 'label-noir-band', slug: '01-parfum-etiket', family: 'dark-luxe', lockup: 'band-split', height: 430 },
  { name: 'label-wave-band', slug: '09-temizlik-etiket', family: 'wave', lockup: 'band-split', height: 430 },
  { name: 'box-marble-band', slug: '05-kahve-kutu', family: 'marble', lockup: 'band-split', height: 560 },
  { name: 'box-noir-rotated', slug: '01-parfum-kutu', family: 'dark-luxe', lockup: 'rotated-brand', height: 560 },
  // Phase 2B — the subject inside the compositions, the corner block, and the carton roles with their sides.
  { name: 'label-specimen-band', slug: '07-bebek-etiket', family: 'specimen', lockup: 'band-split', height: 430 },
  { name: 'label-specimen-topleft', slug: '07-bebek-etiket', family: 'specimen', lockup: 'top-left-block', height: 430 },
  { name: 'label-diagonal-topleft', slug: '06-elektronik-etiket', family: 'tech', lockup: 'top-left-block', height: 430 },
  { name: 'box-specimen-artpanel', slug: '07-bebek-kutu', family: 'specimen', lockup: 'art-panel', height: 560, sides: true },
  { name: 'box-specimen-flanked', slug: '07-bebek-kutu', family: 'specimen', lockup: 'flanked', height: 560, sides: true },
  { name: 'box-marble-artpanel', slug: '05-kahve-kutu', family: 'marble', lockup: 'art-panel', height: 560, sides: true },
]

const figures: string[] = []
CASES.forEach((c, i) => {
  const job = STUDIO_GALLERY_JOBS.find((j) => j.slug === c.slug)
  if (!job) throw new Error(`no gallery job ${c.slug}`)
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({
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
      barcode: '8690000000017',
      studioFamily: c.family,
      studioFamilyLocked: true,
      studioPick: { lockup: c.lockup },
    },
    overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 },
  })
  // A carton role is about its sides, so those cases render every side beside the front.
  const panelIds = c.sides
    ? spec.dieline.panels.filter((p) => p.id === spec.artwork.frontPanelId || /^(left|right|side)/i.test(p.id)).map((p) => p.id)
    : [spec.artwork.frontPanelId]
  const d = spec.studio?.direction
  console.log(`${c.name.padEnd(24)} ${d?.archetype}/${d?.lockup} · çarpışma ${spec.studio?.collisions.length} · taşma ${spec.studio?.outOfBounds.length} · craft ${spec.craftScore?.visualCraft} hero ${spec.craftScore?.hero}`)
  const svgs = panelIds.map((panelId, k) => {
    const svg = xmlSafeSvg(renderPanelSvg(spec.dieline, spec.artwork, panelId, spec.palette))
    writeFileSync(join(out, `${c.name}${panelIds.length > 1 ? `-${panelId}` : ''}.svg`), svg)
    const ns = `f${i}-${k}-`
    return svg
      .replace(/<svg([^>]*?)\s(?:width|height)="[^"]*"/g, '<svg$1')
      .replace('<svg', `<svg height="${c.height}"`)
      .replace(/id="([^"]+)"/g, (_m, id: string) => `id="${ns}${id}"`)
      .replace(/url\(#([^)]+)\)/g, (_m, id: string) => `url(#${ns}${id})`)
      .replace(/href="#([^"]+)"/g, (_m, id: string) => `href="#${ns}${id}"`)
  })
  figures.push(`<figure><div style="display:flex;gap:4px">${svgs.join('')}</div><figcaption>${c.name}</figcaption></figure>`)
})

writeFileSync(
  join(out, 'inline.html'),
  `<!doctype html><meta charset="utf-8"><title>Faz 2 kompozisyonlar</title><style>body{background:#777;margin:0;padding:16px;font:12px system-ui;color:#fff}.row{display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start}figure{margin:0}svg{background:#fff;box-shadow:0 2px 12px #0006;display:block}</style><div class="row">${figures.join('')}</div>`,
)
console.log(`→ ${out}/inline.html`)
