/**
 * How far the illustrator really reaches — the check behind `svgHull`.
 *
 * Every species × arrangement × style is drawn at a nominal size of 100 for five seeds, and each
 * cell carries the box `svgHull` computed for it. The page then measures the same drawings with
 * the browser's own geometry (points sampled along every path, every ellipse) and prints, at the
 * top, whether any hull came back smaller than its drawing and how tight the hulls are.
 *
 * This is the measurement that replaced the `heroAspect` table in the compositions: at nominal
 * 100 an arch reaches 155 wide and a spray 148 tall, a lavender sprig 48 wide — the table said
 * 56 for that arch. First run: 0 of 1120 hulls smaller than the drawing, median area 1.07 × the
 * drawing's own box; the wreath's ring (an arc) was the loose case until arcs were followed.
 *
 * Permanent instrument. Run: `npx vite-node scripts/render-hero-reach.ts`, then open
 * `.compositions-out/hero-reach.html` (the `compositions-out` preview serves the folder).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { speciesHero, type HeroInk, type HeroLayout, type Species } from '../src/engine/studio/species'
import { svgHull } from '../src/engine/studio/svgHull'

const SPECIES: Species[] = ['olive', 'coffee', 'tea', 'grain', 'citrus', 'cocoa', 'flora', 'conifer', 'aloe', 'lavender', 'chamomile', 'rose', 'mint', 'grape', 'berry', 'blossom']
const LAYOUTS: HeroLayout[] = ['spray', 'arch', 'sprig', 'wreath', 'crossed', 'rosette', 'citrus']
const SEEDS = [11, 2778717097, 3394461931, 97, 5]
const ink: HeroInk = { leafLight: '#5a9a6f', leaf: '#2d6a4f', leafMid: '#2a5c46', leafDeep: '#24503d', fruit: '#b5651d', fruitDeep: '#8f4f16', stem: '#233f33' }

const cells: string[] = []
for (const species of SPECIES) {
  for (const layout of LAYOUTS) {
    for (const style of ['solid', 'engraved'] as const) {
      for (const seed of SEEDS) {
        const body = speciesHero(species, 150, 150, 100, ink, seed, { layout, style, uid: `p${cells.length}` })
        const h = svgHull(body)
        const hull = h ? [h.minX, h.minY, h.maxX, h.maxY].map((n) => n.toFixed(3)).join(',') : ''
        cells.push(`<svg viewBox="0 0 300 300" width="60" height="60" data-key="${species}|${layout}|${style}|${seed}" data-hull="${hull}">${body}</svg>`)
      }
    }
  }
}

// The page checks itself: the browser's geometry against the hull node computed.
const check = `
<script>
addEventListener('load', () => {
  let cells = 0, smaller = [], maxUnder = 0, ratios = []
  for (const svg of document.querySelectorAll('svg[data-key]')) {
    const hull = svg.getAttribute('data-hull'); if (!hull) continue
    const [hx0, hy0, hx1, hy1] = hull.split(',').map(Number)
    const root = svg.getScreenCTM().inverse()
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    const take = (m, x, y) => { const px = m.a * x + m.c * y + m.e, py = m.b * x + m.d * y + m.f; x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py) }
    for (const el of svg.querySelectorAll('path, circle, ellipse')) {
      if (el.closest('defs')) continue
      const m = root.multiply(el.getScreenCTM())
      if (el.tagName === 'path') {
        const len = el.getTotalLength(); const n = Math.max(16, Math.min(80, Math.ceil(len / 3)))
        for (let i = 0; i <= n; i++) { const p = el.getPointAtLength((len * i) / n); take(m, p.x, p.y) }
      } else {
        const cx = +el.getAttribute('cx') || 0, cy = +el.getAttribute('cy') || 0
        const rx = el.tagName === 'circle' ? +el.getAttribute('r') : +el.getAttribute('rx'), ry = el.tagName === 'circle' ? +el.getAttribute('r') : +el.getAttribute('ry')
        for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; take(m, cx + rx * Math.cos(a), cy + ry * Math.sin(a)) }
      }
    }
    if (!Number.isFinite(x0)) continue
    cells++
    const u = Math.max(hx0 - x0, hy0 - y0, x1 - hx1, y1 - hy1)
    if (u > 0.05) smaller.push(svg.getAttribute('data-key') + ' by ' + u.toFixed(2))
    maxUnder = Math.max(maxUnder, u)
    ratios.push(((hx1 - hx0) * (hy1 - hy0)) / ((x1 - x0) * (y1 - y0)))
  }
  ratios.sort((a, b) => a - b)
  const q = (p) => ratios[Math.min(ratios.length - 1, Math.floor(ratios.length * p))].toFixed(3)
  document.getElementById('summary').textContent =
    'hücre ' + cells + ' · çizimden küçük hull ' + smaller.length + ' (en çok ' + maxUnder.toFixed(3) + ') · hull alanı / çizim alanı: medyan ' + q(0.5) + ' · p90 ' + q(0.9) + ' · en gevşek ' + q(1) +
    (smaller.length ? ' · KÜÇÜK: ' + smaller.slice(0, 8).join('; ') : '')
})
</script>`

mkdirSync('.compositions-out', { recursive: true })
writeFileSync(
  '.compositions-out/hero-reach.html',
  `<!doctype html><meta charset="utf-8"><title>İllüstratör erişimi · svgHull denetimi</title><body style="background:#eee;font:13px system-ui;margin:0;padding:12px"><p id="summary" style="position:sticky;top:0;background:#fff;padding:8px;margin:0 0 8px">ölçülüyor…</p>${cells.join('')}${check}`,
)
console.log(`${cells.length} hücre → .compositions-out/hero-reach.html (sayfa açılınca kendini denetler)`)
