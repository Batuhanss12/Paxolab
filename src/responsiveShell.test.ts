/**
 * The shell fits the screen it is given.
 *
 * Measured on a design-open workspace before this was fixed:
 *
 *   1440 / 1280 / 1100 / 1024 / 900 px — clean
 *   768 px  — the top bar's right cluster ran 15 px past the edge
 *   390 px  — the page stayed **782 px** wide and scrolled sideways
 *
 * (The audit had said "breaks under 1280". It does not; measuring moved the break to just under
 * 800 and named two causes: a top bar told never to wrap, and a hard `460px` grid track. A fixed
 * grid track does not shrink, so below ~780 px the layout stopped fitting and the viewport
 * scrolled instead of the layout adapting.)
 *
 * There is no browser-driven test setup in this repo, so this reads the stylesheet: it cannot
 * prove the pixels, only that the two mechanisms that produced the bug cannot come back silently.
 * The pixel check was done in the browser at 1440 / 1024 / 900 / 768 / 640 / 390 — no horizontal
 * scroll and nothing clipped at any of them.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const CSS = readFileSync(new URL('./index.css', import.meta.url), 'utf8')

/** The body of one `@media (max-width: N)` block, braces balanced. */
function mediaBlock(maxWidth: number): string {
  const head = new RegExp(`@media \\(max-width:\\s*${maxWidth}px\\)\\s*\\{`)
  const m = head.exec(CSS)
  if (!m) return ''
  let depth = 1
  let i = m.index + m[0].length
  const start = i
  while (i < CSS.length && depth > 0) {
    if (CSS[i] === '{') depth += 1
    else if (CSS[i] === '}') depth -= 1
    i += 1
  }
  return CSS.slice(start, i - 1)
}

describe('the shell fits the screen it is given', () => {
  it('the workspace columns can shrink — no fixed track', () => {
    const rule = /\.workspace__body\.has-preview\s*\{([^}]*)\}/g
    const bodies = [...CSS.matchAll(rule)].map((m) => m[1])
    expect(bodies.length, 'iki sütunlu kural yok').toBeGreaterThan(0)
    for (const body of bodies) {
      const cols = /grid-template-columns:([^;]+);/.exec(body)?.[1]?.trim()
      if (!cols) continue
      // `var(--left) 1fr` was the bug: a fixed track refuses to shrink and the page scrolls.
      expect(cols, `sabit sütun geri geldi: ${cols}`).toMatch(/minmax\(\s*0/)
    }
  })

  it('stacks to one column before the two become unusable, and lets the top bar wrap', () => {
    const narrow = mediaBlock(820)
    expect(narrow, '820px kırılma noktası yok').toBeTruthy()
    expect(narrow, 'tek sütuna inmiyor').toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/)
    // The two causes, each nailed down.
    expect(narrow, 'üst çubuk hâlâ sarmıyor').toMatch(/\.topbar__right\s*\{[^}]*flex-wrap:\s*wrap/)
    expect(narrow, 'üst çubuk sarınca büyümüyor').toMatch(/\.topbar\s*\{[^}]*height:\s*auto/)
  })

  it('each stacked pane scrolls inside itself, so neither prints over the other', () => {
    const narrow = mediaBlock(820)
    // Measured: letting the content flow put a 2611 px checklist in a 591 px row.
    expect(narrow, 'sağ pano kendi içinde kaymıyor').toMatch(/\.workspace__right\s*\{[^}]*overflow:\s*auto/)
    expect(narrow, 'gövde kaydırmayı panolara bırakmıyor').toMatch(/overflow:\s*hidden/)
  })
})
