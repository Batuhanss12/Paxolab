/**
 * Golden faces, inline — the 18 frozen fronts as they render today, with the direction's axes.
 *
 * `contact-sheet.ts` writes each face to its own file, which a static snapshot cannot load; this
 * inlines the SVG so a change to the table can be judged by eye in one page. Meant to be read next
 * to `diff-studio-golden.ts`: that says *which* rows moved, this shows *what* moved.
 *
 * Run: npx --yes vite-node scripts/golden-sheet.ts   → public/_golden/index.html
 */
import fs from 'node:fs'
import path from 'node:path'
import { emptyBrief } from '../src/engine/fields'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { facePanelId, renderPanelSvg } from '../src/engine/artwork/renderArtwork'
import { STUDIO_FONT_HREF } from '../src/engine/studio/text'
import { STUDIO_GALLERY_JOBS } from '../src/engine/studio/studioGalleryJobs'
import { STUDIO_FACE_GOLDEN, hashStudioFace } from '../src/engine/studio/studioGolden'

const cards: string[] = []
for (const job of STUDIO_GALLERY_JOBS) {
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
    },
    overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 },
  })
  const id = spec.artwork.frontPanelId || facePanelId(spec.dieline, spec.artwork, 'front')
  const d = spec.studio!.direction
  const fr = spec.studio!.panels?.find((p) => p.panelId === id)
  const hits = (fr?.collisions.length ?? 0) + (fr?.outOfBounds.length ?? 0)
  const layer = spec.artwork.layers.find((row) => row.panelId === id)?.markup ?? ''
  const frozen = STUDIO_FACE_GOLDEN[job.slug]
  const moved = !frozen ? 'new' : frozen.archetype !== d.archetype || frozen.background !== d.background ? 'DNA' : frozen.hash !== hashStudioFace(layer) ? 'hash' : ''
  const brain = d.rationale.find((r) => r.startsWith('Tasarım beyni')) ?? ''
  cards.push(`<figure class="${moved}"><div class="f">${renderPanelSvg(spec.dieline, spec.artwork, id, spec.palette, { pad: 0 })}</div>
    <figcaption><b>${job.slug}</b> · ${job.styleType}${moved ? ` <em>${moved}</em>` : ''}<br><span>${d.archetype} · ${d.background}<br>${d.typePairing} · ${d.frame} · ${d.ornament}</span>
    ${brain ? `<br><span class="b">${brain}</span>` : ''}${hits ? `<br><span class="w">⚠ ${hits} çakışma</span>` : ''}</figcaption></figure>`)
}
fs.mkdirSync(path.join(process.cwd(), 'public', '_golden'), { recursive: true })
fs.writeFileSync(
  path.join(process.cwd(), 'public', '_golden', 'index.html'),
  `<!doctype html><meta charset="utf-8"><title>golden yüzler</title><link rel="stylesheet" href="${STUDIO_FONT_HREF}">
<style>body{margin:0;padding:18px;background:#191a1e;color:#ddd;font:12px Segoe UI,sans-serif}
.g{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start}figure{margin:0;width:200px;background:#25262c;padding:8px;border-radius:5px}
figure.DNA{outline:2px solid #e88}figure.hash{outline:1px solid #cb8}
.f{background:#fff;overflow:hidden}.f svg{width:100%;height:auto;display:block}
figcaption{margin-top:6px;font-size:11px}figcaption span{color:#8a8a8a;font-size:10px}.b{color:#9ab}em{color:#e88;font-style:normal}.w{color:#e88}</style>
<h3 style="margin:0 0 12px;font-size:14px">golden yüzler — kırmızı çerçeve: DNA oynadı · sarı: sadece hash</h3><div class="g">${cards.join('')}</div>`,
)
console.log('yazıldı: public/_golden/index.html —', cards.length, 'yüz')
