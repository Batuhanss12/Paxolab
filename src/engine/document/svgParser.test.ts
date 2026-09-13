import { describe, expect, it } from 'vitest'
import { elementBounds, elementRole, parseSvgElements } from './svgParser'

describe('svgParser', () => {
  it('parses self-closing elements', () => {
    const markup = '<rect x="10" y="20" width="30" height="40" fill="#f00" />'
    const els = parseSvgElements(markup)
    expect(els).toHaveLength(1)
    expect(els[0].tag).toBe('rect')
    expect(els[0].attrs.fill).toBe('#f00')
  })

  it('parses text elements with inner content', () => {
    const markup = '<text x="5" y="10" font-size="4" fill="#000">FORMA</text>'
    const els = parseSvgElements(markup)
    expect(els).toHaveLength(1)
    expect(els[0].tag).toBe('text')
    expect(els[0].text).toBe('FORMA')
  })

  it('parses multiple elements', () => {
    const markup = '<rect x="0" y="0" width="10" height="10" /><circle cx="5" cy="5" r="3" /><text x="2" y="8">Hi</text>'
    const els = parseSvgElements(markup)
    expect(els).toHaveLength(3)
    expect(els[0].tag).toBe('rect')
    expect(els[1].tag).toBe('circle')
    expect(els[2].tag).toBe('text')
  })

  it('extracts bounds from rect', () => {
    const els = parseSvgElements('<rect x="10" y="20" width="30" height="40" />')
    expect(elementBounds(els[0])).toEqual({ x: 10, y: 20, w: 30, h: 40 })
  })

  it('extracts bounds from circle', () => {
    const els = parseSvgElements('<circle cx="50" cy="50" r="10" />')
    expect(elementBounds(els[0])).toEqual({ x: 40, y: 40, w: 20, h: 20 })
  })

  it('infers role from data-art attribute', () => {
    const els = parseSvgElements('<g data-art="hero"><path d="M0 0" /></g>')
    expect(elementRole(els[0])).toBe('hero')
  })

  it('infers copy role for text without data-art', () => {
    const els = parseSvgElements('<text x="0" y="0">Hello</text>')
    expect(elementRole(els[0])).toBe('copy')
  })

  it('handles empty markup', () => {
    expect(parseSvgElements('')).toEqual([])
  })

  it('skips malformed non-closed tags', () => {
    const els = parseSvgElements('<text>unclosed')
    expect(els).toHaveLength(0)
  })
})
