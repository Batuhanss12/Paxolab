/**
 * Hero illustration sheet — every species, in three palettes, so the drawing can be judged by eye.
 *
 * The point of drawing the subject instead of placing a scan is that it wears the brief's colours.
 * So the same species is rendered three times here: a cream/green care palette, a dark luxe one and
 * a vivid one. If a drawing only works in one of them it is not finished.
 *
 * Run: npx --yes vite-node scripts/species-hero-sheet.ts   → public/_hero/index.html
 */
import fs from 'node:fs'
import path from 'node:path'
import { heroLayout, speciesHero, type HeroInk, type HeroLayout, type HeroStyle, type Species } from '../src/engine/studio/species'

const SPECIES: Species[] = ['flora', 'olive', 'rose', 'chamomile', 'lavender', 'grape']

const PALETTES: { name: string; ground: string; ink: HeroInk }[] = [
  {
    name: 'doğal / krem',
    ground: '#f2efe6',
    ink: { leafLight: '#a8bd97', leaf: '#6f8f63', leafMid: '#5d7c54', leafDeep: '#4a6742', fruit: '#c8a24a', fruitDeep: '#8a6f2c', stem: '#4b5a41' },
  },
  {
    name: 'koyu lüks',
    ground: '#14140f',
    ink: { leafLight: '#e0cd94', leaf: '#b9a15e', leafMid: '#9b8649', leafDeep: '#7d6a35', fruit: '#d8c07a', fruitDeep: '#8d7433', stem: '#9c8848' },
  },
  {
    name: 'canlı / pembe',
    ground: '#f7dfe4',
    ink: { leafLight: '#ef9ab4', leaf: '#d1567e', leafMid: '#b8446b', leafDeep: '#9c3457', fruit: '#f0834f', fruitDeep: '#c15a2c', stem: '#a8446a' },
  },
]

const W = 150
const H = 150

const LAYOUTS: HeroLayout[] = ['spray', 'arch', 'sprig', 'wreath']
const STYLES: HeroStyle[] = ['solid', 'engraved']

function cell(sp: Species, pal: (typeof PALETTES)[number], seed: number, opts: { style?: HeroStyle; layout?: HeroLayout }, cap: string) {
  const art = speciesHero(sp, W / 2, H / 2, Math.min(W, H) * 0.78, pal.ink, seed, opts)
  return `<figure>
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${W}" height="${H}" fill="${pal.ground}" />
      ${art}
    </svg>
    <figcaption>${cap}</figcaption>
  </figure>`
}

const rows: string[] = []

// 1 — every species, one row each, in the three palettes.
rows.push('<h3>Tür kimliği — yaprak anatomisi</h3>')
for (const sp of SPECIES) {
  // Aloe and citrus are pinned to their own arrangement; forcing an arch on them would be
  // showing a composition the engine never produces.
  const lay = heroLayout(sp, 7)
  const cells = [cell(sp, PALETTES[0], 7, { layout: lay, style: 'solid' }, PALETTES[0].name)]
  rows.push(`<section><h2>${sp}</h2><div class="row">${cells.join('')}</div></section>`)
}

// 2 — the four arrangements, so "variation" changes the picture.
rows.push('<h3>Kompozisyon</h3>')
for (const sp of ['flora', 'olive'] as Species[]) {
  const cells = LAYOUTS.map((l) => cell(sp, PALETTES[0], 7, { layout: l, style: 'solid' }, l))
  rows.push(`<section><h2>${sp}</h2><div class="row">${cells.join('')}</div></section>`)
}

// 3 — solid against engraved, the second render language.
rows.push('<h3>Gravür modu — aynı geometri, ikinci dil</h3>')
for (const sp of ['lavender', 'rose'] as Species[]) {
  const cells: string[] = []
  for (const st of STYLES) cells.push(cell(sp, PALETTES[0], 7, { style: st, layout: heroLayout(sp, 7) }, st))
  rows.push(`<section><h2>${sp}</h2><div class="row">${cells.join('')}</div></section>`)
}

const html = `<!doctype html><meta charset="utf-8"><title>Paxolab — kahraman illüstrasyon</title>
<style>
  body{margin:0;padding:22px;background:#17181c;color:#ddd;font:12px/1.5 -apple-system,Segoe UI,sans-serif}
  h1{font-size:17px;margin:0 0 6px;color:#fff}
  p.lead{margin:0 0 22px;color:#888;max-width:74ch}
  section{margin:0 0 20px;border-top:1px solid #272a31;padding-top:12px}
  h2{font-size:12px;margin:0 0 10px;color:#c9a86c;text-transform:uppercase;letter-spacing:.1em}
  h3{font-size:14px;margin:26px 0 8px;color:#fff;border-bottom:1px solid #2c2f36;padding-bottom:6px}
  .row{display:flex;gap:14px;flex-wrap:wrap}
  section{display:inline-block;vertical-align:top;margin:0 14px 12px 0;border:0;padding:0}
  figure{margin:0}
  svg{width:150px;height:150px;display:block;border-radius:4px}
  figcaption{margin-top:5px;font-size:10px;color:#7d7d7d}
</style>
<h1>Kahraman illüstrasyon — çizilmiş, yerleştirilmiş değil</h1>
<p class="lead">Aynı bitki üç ayrı palette. Hepsi vektör, hepsi brief'in renklerini giyiyor —
taranmış bir suluboyanın yapamayacağı tek şey bu. Kamu malı botanik levhalar sadece geometri
referansı olarak kullanıldı; çıktıya hiçbir şey girmiyor.</p>
${rows.join('')}`

const dir = path.join(process.cwd(), 'public', '_hero')
fs.mkdirSync(dir, { recursive: true })
fs.writeFileSync(path.join(dir, 'index.html'), html)
console.log('yazıldı: public/_hero/index.html —', SPECIES.length, 'tür ×', PALETTES.length, 'palet')
