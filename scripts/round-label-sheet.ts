/**
 * Round label contact sheet — the disc format across diameters and sectors.
 *
 * Run: npx --yes vite-node scripts/round-label-sheet.ts   → public/_round/index.html
 */
import fs from 'node:fs'
import path from 'node:path'
import { emptyBrief } from '../src/engine/fields'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { facePanelId, renderPanelSvg } from '../src/engine/artwork/renderArtwork'
import { STUDIO_FONT_HREF } from '../src/engine/studio/text'
import { buildCombinedSvg } from '../src/engine/production/exportDoc'
import type { DesignBrief, StyleType } from '../src/types'

const JOBS: [string,string,string,string,string,StyleType,number][] = [
  ['Verda','Aloe Balm','kozmetik','balm','yeşil · krem','eco',60],
  ['Noctis','Gece','kozmetik','krem','siyah · altın','luxury',60],
  ['Yayla','Çiçek Balı','gıda','reçel','altın · sıcak','classic',70],
  ['Mini','Bebek Merhem','bebek','merhem','pembe · krem','playful',50],
  ['Elite Brew','Mocha','gıda','mum','kahve · altın','luxury',80],
  ['Clinia','B5','kozmetik','krem','beyaz · mavi','minimal',45],
]
const cards: string[] = []
for (const [brand,product,sector,sub,colors,style,dia] of JOBS) {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({
    brief: { ...emptyBrief(), brandName:brand, productName:product, sector, subProduct:sub,
      packagingMode:'label', templateId:'fm-lid-round', styleType:style, colors,
      volume:'50 ml', barcode:'8690000000017', dimensionsMm:{L:dia,W:dia,H:0} } as DesignBrief,
    overridePatch:{ studio:true, variationIndex:0 },
  })
  const id = spec.artwork.frontPanelId || facePanelId(spec.dieline, spec.artwork, 'front')
  const st = spec.studio!
  const fr = st.panels?.find(p=>p.panelId===id)
  const hits = (fr?.collisions.length ?? 0) + (fr?.outOfBounds.length ?? 0)
  const ok = Boolean(buildCombinedSvg(spec))
  cards.push(`<figure><div class="f">${id?renderPanelSvg(spec.dieline,spec.artwork,id,spec.palette,{pad:0}):''}</div>
    <figcaption><b>${brand}</b> Ø${dia}mm · ${colors}<br><span>${st.direction.background} · ${st.direction.temperament}</span>
    ${hits?`<br><span class="w">⚠ ${hits}</span>`:''}${ok?'':'<br><span class="w">⚠ export</span>'}</figcaption></figure>`)
  console.log(`${brand.padEnd(11)} Ø${dia} ${st.direction.background.padEnd(16)} hits=${hits} export=${ok}`)
}
fs.mkdirSync(path.join(process.cwd(),'public','_round'),{recursive:true})
fs.writeFileSync(path.join(process.cwd(),'public','_round','index.html'),
`<!doctype html><meta charset="utf-8"><title>yuvarlak etiket</title><link rel="stylesheet" href="${STUDIO_FONT_HREF}">
<style>body{margin:0;padding:18px;background:#191a1e;color:#ddd;font:12px Segoe UI,sans-serif}
.g{display:flex;gap:16px;flex-wrap:wrap}figure{margin:0;width:180px;background:#25262c;padding:9px;border-radius:5px}
.f{background:#fff;border-radius:50%;overflow:hidden}.f svg{width:100%;height:auto;display:block}
figcaption{margin-top:7px;font-size:11px}figcaption span{color:#8a8a8a;font-size:10px}.w{color:#e88}</style>
<h3 style="margin:0 0 12px;font-size:14px">round-label — kapak / balm tin</h3><div class="g">${cards.join('')}</div>`)
console.log('yazıldı: public/_round/index.html')
