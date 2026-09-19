/**
 * The preview PNG was silently missing from every studio delivery.
 *
 * `rasteriseSvg` hands the face to the browser as an `image/svg+xml` blob, and the browser parses
 * that as XML. The studio front carries `<style>@import url('…?family=Cormorant+Garamond…&family=
 * Great+Vibes…')</style>` — a bare `&` in the Google Fonts URL, which HTML forgives inline and XML
 * does not. Measured in the browser pane: the raw front fails to decode as an image, the same
 * markup with `&amp;` decodes at 96×150. The failure was caught and turned into "no preview"
 * on purpose — a missing picture must never cost a customer the print files — which is exactly
 * why nobody saw it.
 *
 * The fix sits in the consumer: the face markup is what the golden hashes freeze, and it renders
 * correctly everywhere it is used inline. Only the XML parser needs the escape.
 */
import { describe, expect, it } from 'vitest'
import { xmlSafeSvg } from './rasterise'

describe('xmlSafeSvg', () => {
  it('escapes a bare ampersand, the one in the font import included', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><style>@import url('https://fonts.googleapis.com/css2?family=A&family=B&display=swap');</style></svg>`
    const safe = xmlSafeSvg(svg)
    expect(safe).toContain('family=A&amp;family=B&amp;display=swap')
    expect(safe).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;|#)/)
  })

  it('leaves entities that are already correct alone', () => {
    const svg = '<svg><text>Tom &amp; Jerry &lt; 3 &#8364; &#x20AC;</text></svg>'
    expect(xmlSafeSvg(svg)).toBe(svg)
  })
})
