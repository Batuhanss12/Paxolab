/**
 * A button that looks selected has to say so.
 *
 * Measured across the shell: nine controls already carry `aria-selected` / `aria-expanded` /
 * `aria-pressed`, and four did not — the label's Ön / Arka toggle, the template card, and the two
 * copy-dock toggles. All four signalled their state with an `is-active` class alone, which is a
 * colour. A keyboard or screen-reader user heard two plain buttons and could not tell which face
 * was on screen.
 *
 * This reads the component sources rather than a rendered tree, because there is no DOM test setup
 * here and the rule is a source-level one: if a button's className depends on a boolean, the same
 * button needs an ARIA state attribute. Source-level means it cannot see a state passed down
 * through a wrapper component — it is a floor, not a proof of accessibility.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const DIR = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

function componentSources(): { file: string; body: string }[] {
  return readdirSync(DIR)
    .filter((name) => name.endsWith('.tsx'))
    .map((name) => ({ file: name, body: readFileSync(join(DIR, name), 'utf8') }))
}

/** Every `<button …>` opening tag in a source file, with its attributes. */
function buttonTags(body: string): string[] {
  return [...body.matchAll(/<button\b[\s\S]*?>/g)].map((m) => m[0])
}

const STATE = /aria-(?:pressed|selected|expanded|current)\s*=/
/** A className that switches on a boolean — `x ? 'is-active' : ''`, `${open ? ' is-active' : ''}`. */
const TOGGLED_CLASS = /className=\{[^}]*(?:\?[^}]*is-active|is-active[^}]*:)/

describe('a control that looks selected says it is', () => {
  it('every button whose class switches on a boolean carries an ARIA state', () => {
    const offenders: string[] = []
    for (const { file, body } of componentSources()) {
      for (const tag of buttonTags(body)) {
        if (!TOGGLED_CLASS.test(tag)) continue
        if (STATE.test(tag)) continue
        offenders.push(`${file}: ${tag.replace(/\s+/g, ' ').slice(0, 110)}`)
      }
    }
    expect(offenders, `durum bildirmeyen açma/kapama düğmesi:\n${offenders.join('\n')}`).toEqual([])
  })

  it('the shell has not quietly lost the states it already had', () => {
    // A floor, so a refactor that strips ARIA wholesale is caught even if no class-toggle remains.
    const all = componentSources().map((s) => s.body).join('\n')
    expect((all.match(/aria-pressed\s*=/g) ?? []).length, 'aria-pressed').toBeGreaterThanOrEqual(4)
    expect((all.match(/aria-selected\s*=/g) ?? []).length, 'aria-selected').toBeGreaterThanOrEqual(4)
    expect((all.match(/aria-expanded\s*=/g) ?? []).length, 'aria-expanded').toBeGreaterThanOrEqual(6)
  })
})
