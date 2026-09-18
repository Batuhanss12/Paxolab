/**
 * STİCKERR REF intake sheet — the two plates kept from the perfume set and the oval cut.
 *
 * Run: npx --yes vite-node scripts/ref-plates-sheet.ts   → public/_ref/index.html
 */
import fs from 'node:fs'
import path from 'node:path'
import { emptyBrief } from '../src/engine/fields'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { facePanelId, renderPanelSvg } from '../src/engine/artwork/renderArtwork'
import { STUDIO_FONT_HREF } from '../src/engine/studio/text'
import { buildCombinedSvg } from '../src/engine/production/exportDoc'
import type { DesignBrief, PackagingMode, StyleType } from '../src/types'
import type { DirectionHints } from '../src/engine/studio/types'

type Job = {
  title: string
  brand: string
  product: string
  colors: string
  style: StyleType
  mode: PackagingMode
  templateId: string
  dims: { L: number; W: number; H: number }
  direction?: DirectionHints
  tiers?: Partial<Pick<DesignBrief, 'concentration' | 'edition' | 'attribution' | 'origin'>>
}

const pin = (archetype: DirectionHints['archetype'], extra: Partial<DirectionHints> = {}): DirectionHints => ({
  archetype,
  source: 'user',
  pinSource: 'user',
  ...extra,
})

const TIERS = { concentration: 'edt', edition: 'No. 07 · Limited', attribution: 'by Diako Atelier', origin: 'İstanbul · 1998' }

const JOBS: Job[] = [
  { title: 'atelier-plate · etiket', brand: 'Diako', product: 'Fleur de Nuit', colors: 'krem · altın', style: 'luxury', mode: 'label', templateId: 'fm-cos-label-bottle', dims: { L: 70, W: 0, H: 90 }, direction: pin('atelier-plate'), tiers: TIERS },
  { title: 'atelier-plate · kutu', brand: 'Diako', product: 'Fleur de Nuit', colors: 'krem · altın', style: 'luxury', mode: 'box', templateId: 'fm-cos-tuck-perfume', dims: { L: 70, W: 35, H: 140 }, direction: pin('atelier-plate'), tiers: TIERS },
  { title: 'atelier-plate · koyu · fleuron', brand: 'Heeva', product: 'Oud Royale', colors: 'siyah · altın', style: 'classic', mode: 'label', templateId: 'fm-cos-label-bottle', dims: { L: 70, W: 0, H: 90 }, direction: pin('atelier-plate', { frame: 'fleuron-crown' }), tiers: { concentration: 'extrait', attribution: 'Maison Heeva' } },
  { title: 'crest-panel · etiket', brand: 'Azzurra', product: 'Mediterraneo', colors: 'lacivert · altın', style: 'classic', mode: 'label', templateId: 'fm-cos-label-bottle', dims: { L: 70, W: 0, H: 90 }, direction: pin('crest-panel'), tiers: { concentration: 'edp', edition: 'Riviera Edition' } },
  { title: 'crest-panel · kutu', brand: 'Azzurra', product: 'Mediterraneo', colors: 'lacivert · altın', style: 'classic', mode: 'box', templateId: 'fm-cos-tuck-perfume', dims: { L: 70, W: 35, H: 140 }, direction: pin('crest-panel'), tiers: { concentration: 'edp' } },
  { title: 'crest-panel · zengin süs', brand: 'Azzurra', product: 'Mediterraneo', colors: 'krem · bakır', style: 'luxury', mode: 'label', templateId: 'fm-cos-label-bottle', dims: { L: 70, W: 0, H: 90 }, direction: pin('crest-panel', { ornament: 'rich' }) },
  { title: 'oval-label · parfüm (bezel)', brand: 'Raavi', product: 'Amber Noir', colors: 'siyah · altın', style: 'luxury', mode: 'label', templateId: 'fm-label-oval', dims: { L: 70, W: 0, H: 45 }, tiers: { concentration: 'edp' } },
  { title: 'oval-label · krem', brand: 'Verda', product: 'Gül Suyu', colors: 'krem · yeşil', style: 'eco', mode: 'label', templateId: 'fm-label-oval', dims: { L: 60, W: 0, H: 40 } },
  { title: 'oval-label · zeytinyağı', brand: 'Ege', product: 'Erken Hasat', colors: 'zeytin · krem', style: 'classic', mode: 'label', templateId: 'fm-label-oval', dims: { L: 80, W: 0, H: 55 } },
]

const cards: string[] = []
for (const job of JOBS) {
  resetArtMemory()
  const brief: DesignBrief = {
    ...emptyBrief(),
    brandName: job.brand,
    productName: job.product,
    sector: job.templateId.includes('oval') && job.brand === 'Ege' ? 'gıda' : 'kozmetik',
    subProduct: job.brand === 'Ege' ? 'zeytinyağı' : job.brand === 'Verda' ? 'krem' : 'parfüm',
    packagingMode: job.mode,
    templateId: job.templateId,
    styleType: job.style,
    colors: job.colors,
    volume: '50 ml',
    barcode: '8690000000017',
    dimensionsMm: job.dims,
    ...(job.tiers ?? {}),
  }
  const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0, direction: job.direction } })
  const id = spec.artwork.frontPanelId || facePanelId(spec.dieline, spec.artwork, 'front')
  const st = spec.studio!
  const fr = st.panels?.find((p) => p.panelId === id)
  const hits = (fr?.collisions.length ?? 0) + (fr?.outOfBounds.length ?? 0)
  const ok = Boolean(buildCombinedSvg(spec))
  const d = st.direction
  cards.push(`<figure><div class="f">${id ? renderPanelSvg(spec.dieline, spec.artwork, id, spec.palette, { pad: 0 }) : ''}</div>
    <figcaption><b>${job.title}</b><br><span>${d.archetype} · ${d.background} · ${d.frame} · ${d.ornament} · ${d.temperament}</span>
    ${hits ? `<br><span class="w">⚠ ${hits} çakışma</span>` : ''}${ok ? '' : '<br><span class="w">⚠ export</span>'}</figcaption></figure>`)
  console.log(`${job.title.padEnd(32)} ${d.archetype.padEnd(14)} ${d.frame.padEnd(14)} ${d.categoryLine.padEnd(18)} hits=${hits} export=${ok}`)
}
fs.mkdirSync(path.join(process.cwd(), 'public', '_ref'), { recursive: true })
fs.writeFileSync(
  path.join(process.cwd(), 'public', '_ref', 'index.html'),
  `<!doctype html><meta charset="utf-8"><title>STİCKERR REF — plakalar</title><link rel="stylesheet" href="${STUDIO_FONT_HREF}">
<style>body{margin:0;padding:18px;background:#191a1e;color:#ddd;font:12px Segoe UI,sans-serif}
.g{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start}figure{margin:0;width:230px;background:#25262c;padding:9px;border-radius:5px}
.f{background:#fff;overflow:hidden}.f svg{width:100%;height:auto;display:block}
figcaption{margin-top:7px;font-size:11px}figcaption span{color:#8a8a8a;font-size:10px}.w{color:#e88}</style>
<h3 style="margin:0 0 12px;font-size:14px">STİCKERR REF — atelier-plate · crest-panel · oval-label</h3><div class="g">${cards.join('')}</div>`,
)
console.log('yazıldı: public/_ref/index.html')
