/**
 * Every panel of one carton, side by side, at a size you can judge.
 *
 * `measure-panel-coherence.ts` says the non-front panels share ~22% of the front's system. This
 * page is the same claim with the panels next to each other, so the eye can check the number.
 *
 * Permanent instrument. Run: `npx vite-node scripts/render-panel-coherence.ts [outDir]`
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderPanelSvg } from '../src/engine/artwork/renderArtwork'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { emptyBrief } from '../src/engine/fields'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { xmlSafeSvg } from '../src/engine/llm/rasterise'
import type { DesignBrief } from '../src/types'
import type { StudioFamily, StudioRepertoire } from '../src/engine/studio/types'

const out = process.argv[2] ?? '.compositions-out'
mkdirSync(out, { recursive: true })

const CASES: Array<{ label: string; repertoire: StudioRepertoire; family: StudioFamily }> = [
  { label: 'studio · mermer', repertoire: 'studio', family: 'marble' },
  { label: 'studio · karanlık lüks', repertoire: 'studio', family: 'dark-luxe' },
  { label: 'reference · kemer taç', repertoire: 'reference', family: 'arch' },
  { label: 'reference · gravür kolaj', repertoire: 'reference', family: 'collage' },
]

let n = 0
const blocks: string[] = []
for (const { label, repertoire, family } of CASES) {
  const brief: DesignBrief = {
    ...emptyBrief(),
    brandName: 'Rebull',
    productName: 'Noir',
    sector: 'parfüm',
    subProduct: 'eau de parfum',
    packagingMode: 'box',
    templateId: 'parfum-tuck-end',
    styleType: 'luxury',
    volume: '50 ml',
    dimensionsMm: { L: 100, W: 50, H: 150 },
    barcode: '8690000000017',
    studioRepertoire: repertoire,
    studioFamily: family,
    studioFamilyLocked: true,
  }
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, premium: true, variationIndex: 0 } })
  const figs: string[] = []
  for (const panel of spec.dieline.panels) {
    const layer = spec.artwork.layers.find((l) => l.panelId === panel.id)
    // The four panels a customer holds: the flaps and dust wings are not what "one design" means.
    if (!layer || !['left', 'front', 'right', 'back'].includes(panel.id)) continue
    const ns = `c${n++}-`
    const svg = xmlSafeSvg(renderPanelSvg(spec.dieline, spec.artwork, panel.id, spec.palette))
    const isFront = panel.id === spec.artwork.frontPanelId
    figs.push(
      `<figure class="${isFront ? 'front' : ''}">` +
        svg
          .replace(/<svg([^>]*?)\s(?:width|height)="[^"]*"/g, '<svg$1')
          .replace('<svg', '<svg height="250"')
          .replace(/id="([^"]+)"/g, (_m, id: string) => `id="${ns}${id}"`)
          .replace(/url\(#([^)]+)\)/g, (_m, id: string) => `url(#${ns}${id})`)
          .replace(/href="#([^"]+)"/g, (_m, id: string) => `href="#${ns}${id}"`) +
        `<figcaption>${panel.id}${isFront ? ' · ÖN' : ''} · ${panel.w.toFixed(0)}×${panel.h.toFixed(0)}</figcaption></figure>`,
    )
  }
  console.log(`${label.padEnd(26)} ${spec.dieline.panels.length} panel · çizili ${figs.length} · ${spec.studio?.direction.archetype}`)
  blocks.push(`<h2>${label} <small>${spec.studio?.direction.archetype}</small></h2><div class="row">${figs.join('')}</div>`)
}

writeFileSync(
  join(out, 'panel-coherence.html'),
  `<!doctype html><meta charset="utf-8"><title>Panel tutarlılığı</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Great+Vibes&family=Montserrat:wght@300;500;700&family=Instrument+Serif:ital@0;1&family=Barlow+Condensed:wght@600;700&family=Righteous&family=IBM+Plex+Mono:wght@400;500&display=swap"><style>body{background:#6d6d6d;margin:0;padding:16px;font:11px system-ui;color:#fff}h2{margin:20px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.12em}small{opacity:.6;text-transform:none;letter-spacing:0}.row{display:flex;gap:10px;flex-wrap:nowrap;align-items:flex-start}figure{margin:0;flex:0 0 auto}figure.front figcaption{color:#ffd76a}svg{background:#fff;display:block;box-shadow:0 2px 12px #0007}figcaption{padding-top:4px}</style>${blocks.join('')}`,
)
console.log(`→ ${out}/panel-coherence.html`)
