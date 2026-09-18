/**
 * Product line contact sheet — four SKUs of one brand, side by side.
 *
 * The question it answers is not "is this face good" but "do these read as a range": shared
 * composition, shared colour, a different subject on each.
 *
 * Run: npx --yes vite-node scripts/product-line-sheet.ts   → public/_line/index.html
 */
import fs from 'node:fs'; import path from 'node:path'
import { emptyBrief } from '../src/engine/fields'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { facePanelId, renderPanelSvg } from '../src/engine/artwork/renderArtwork'
import { STUDIO_FONT_HREF } from '../src/engine/studio/text'
import type { DesignBrief, StudioFamily } from '../src/types'

const SKUS = [['Aloe Mist','krem'],['Rose Tonik','tonik'],['Papatya Sütü','süt'],['Lavanta Yağı','yağ']] as const
const engine = new FormaLocalEngine()
const cards: string[] = []
for (const fam of ['specimen','botanical'] as StudioFamily[]) {
  for (const [product, sub] of SKUS) {
    resetArtMemory()
    const spec = engine.generate({
      brief: { ...emptyBrief(), brandName:'Verda', productName:product, sector:'kozmetik', subProduct:sub,
        packagingMode:'label', templateId:'fm-label-universal', styleType:'eco', colors:'yeşil · krem',
        volume:'50 ml', barcode:'8690000000017', dimensionsMm:{L:80,W:0,H:110},
        studioFamily:fam, studioFamilyLocked:true } as DesignBrief,
      overridePatch:{ studio:true, variationIndex:0 },
    })
    const id = spec.artwork.frontPanelId || facePanelId(spec.dieline, spec.artwork, 'front')
    const m = String(spec.artwork.layers.find(l=>l.panelId===id)?.markup ?? '')
    const hero = (m.match(/data-hero="(\w+)"/)?.[1]) ?? '-'
    const bl = (m.match(/data-bloom="(\w+)"/)?.[1]) ?? '-'
    cards.push(`<figure><div class="f">${id?renderPanelSvg(spec.dieline,spec.artwork,id,spec.palette,{pad:0}):''}</div>
      <figcaption><b>${product}</b><br><span>${fam} · ${hero} · ${bl}</span></figcaption></figure>`)
  }
  cards.push('<div class="brk"></div>')
}
fs.mkdirSync(path.join(process.cwd(),'public','_line'),{recursive:true})
fs.writeFileSync(path.join(process.cwd(),'public','_line','index.html'),
`<!doctype html><meta charset="utf-8"><title>ürün hattı</title><link rel="stylesheet" href="${STUDIO_FONT_HREF}">
<style>body{margin:0;padding:18px;background:#191a1e;color:#ddd;font:12px Segoe UI,sans-serif}
.g{display:flex;gap:14px;flex-wrap:wrap}figure{margin:0;width:150px;background:#25262c;padding:8px;border-radius:5px}
.brk{flex-basis:100%;height:4px}
.f{background:#fff;border-radius:3px;overflow:hidden}.f svg{width:100%;height:auto;display:block}
figcaption{margin-top:6px;font-size:11px}figcaption span{color:#8a8a8a;font-size:10px}</style>
<h3 style="margin:0 0 4px;font-size:14px">Verda — dört SKU, tek seri</h3>
<p style="margin:0 0 12px;color:#8a8a8a;font-size:11px">Paylaşılan: kompozisyon, renk, tipografi. Değişen: özne.</p>
<div class="g">${cards.join('')}</div>`)
console.log('yazıldı')
