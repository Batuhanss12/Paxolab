/**
 * Brand kit contact sheet — the pieces beyond the pack itself.
 *
 * Run: npx --yes vite-node scripts/brand-kit-sheet.ts   → public/_kit/index.html
 */
import fs from 'node:fs'; import path from 'node:path'
import { emptyBrief } from '../src/engine/fields'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { facePanelId, renderPanelSvg } from '../src/engine/artwork/renderArtwork'
import { STUDIO_FONT_HREF } from '../src/engine/studio/text'
import { buildCombinedSvg } from '../src/engine/production/exportDoc'
import type { DesignBrief, StyleType } from '../src/types'

const JOBS: [string,string,string,string,string,StyleType][] = [
  ['Köyden','Naturel Sızma','gıda','zeytinyağı','koyu yeşil · altın','eco'],
  ['Noctis','Gece','kozmetik','parfüm','siyah · altın','luxury'],
  ['Verda','Aloe Mist','kozmetik','krem','yeşil · krem','eco'],
  ['Yayla','Çiçek Balı','gıda','bal','altın · sıcak','classic'],
]
const cards: string[] = []
for (const [brand,product,sector,sub,colors,style] of JOBS) {
  for (const [tpl, label] of [['fm-kit-hangtag','askı etiketi'],['fm-kit-card','teşekkür kartı']] as const) {
    resetArtMemory()
    const spec = new FormaLocalEngine().generate({
      brief: { ...emptyBrief(), brandName:brand, productName:product, sector, subProduct:sub,
        packagingMode:'label', templateId:tpl, styleType:style, colors,
        volume:'250 ml', barcode:'8690000000017',
        dimensionsMm: tpl==='fm-kit-hangtag' ? {L:38,W:0,H:76} : {L:90,W:0,H:55} } as DesignBrief,
      overridePatch:{ studio:true, variationIndex:0 },
    })
    const id = spec.artwork.frontPanelId || facePanelId(spec.dieline, spec.artwork, 'front')
    const st = spec.studio!
    const fr = st.panels?.find(p=>p.panelId===id)
    const hits = (fr?.collisions.length ?? 0) + (fr?.outOfBounds.length ?? 0)
    const ok = Boolean(buildCombinedSvg(spec))
    cards.push(`<figure class="${tpl==='fm-kit-card'?'wide':''}"><div class="f">${id?renderPanelSvg(spec.dieline,spec.artwork,id,spec.palette,{pad:0}):''}</div>
      <figcaption><b>${brand}</b> ${label}<br><span>${st.direction.background} · ${st.direction.temperament}</span>
      ${hits?`<br><span class="w">⚠ ${hits}</span>`:''}${ok?'':'<br><span class="w">⚠ export</span>'}</figcaption></figure>`)
    console.log(`${brand.padEnd(11)} ${label.padEnd(16)} panel=${id} hits=${hits} export=${ok}`)
  }
}
fs.mkdirSync(path.join(process.cwd(),'public','_kit'),{recursive:true})
fs.writeFileSync(path.join(process.cwd(),'public','_kit','index.html'),
`<!doctype html><meta charset="utf-8"><title>marka kiti</title><link rel="stylesheet" href="${STUDIO_FONT_HREF}">
<style>body{margin:0;padding:18px;background:#191a1e;color:#ddd;font:12px Segoe UI,sans-serif}
.g{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start}
figure{margin:0;width:120px;background:#25262c;padding:9px;border-radius:5px}
figure.wide{width:230px}
.f{background:#fff;border-radius:3px;overflow:hidden}.f svg{width:100%;height:auto;display:block}
figcaption{margin-top:7px;font-size:11px}figcaption span{color:#8a8a8a;font-size:10px}.w{color:#e88}</style>
<h3 style="margin:0 0 12px;font-size:14px">Marka kiti — askı etiketi + teşekkür kartı</h3><div class="g">${cards.join('')}</div>`)
console.log('yazıldı: public/_kit/index.html')
