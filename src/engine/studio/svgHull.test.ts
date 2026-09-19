/**
 * The control-point hull — the conservative box a composition fits a drawn subject with.
 *
 * Every case is hand-computed. The illustrator check at the end is the one that matters for the
 * studio: the same drawing moved by a known offset has to report a hull moved by exactly that
 * offset, which is only true when every transform and every path command is read correctly.
 */
import { describe, expect, it } from 'vitest'
import { speciesHero, type HeroInk, type HeroLayout, type Species } from './species'
import { parseTransform, svgHull } from './svgHull'

const near = (hull: ReturnType<typeof svgHull>, expected: [number, number, number, number], tol = 1e-6) => {
  expect(hull).not.toBeNull()
  expect(hull!.minX).toBeCloseTo(expected[0], Math.log10(1 / tol))
  expect(hull!.minY).toBeCloseTo(expected[1], Math.log10(1 / tol))
  expect(hull!.maxX).toBeCloseTo(expected[2], Math.log10(1 / tol))
  expect(hull!.maxY).toBeCloseTo(expected[3], Math.log10(1 / tol))
}

describe('svgHull — primitives', () => {
  it('rect, line, polygon', () => {
    near(svgHull('<rect x="1" y="2" width="3" height="4" />'), [1, 2, 4, 6])
    near(svgHull('<line x1="-2" y1="0" x2="5" y2="-3" />'), [-2, -3, 5, 0])
    near(svgHull('<polygon points="0,0 4,1 2,5" />'), [0, 0, 4, 5])
  })

  it('circle and ellipse, exactly, even under rotation', () => {
    near(svgHull('<circle cx="3" cy="4" r="2" />'), [1, 2, 5, 6])
    // A 4×1 ellipse turned by ninety degrees is a 1×4 ellipse.
    near(svgHull('<ellipse cx="0" cy="0" rx="4" ry="1" transform="rotate(90)" />'), [-1, -4, 1, 4])
    // A circle 10 units out, turned by forty-five degrees: centre at (7.07, 7.07), still radius 2.
    const c = Math.SQRT1_2 * 10
    near(svgHull('<g transform="rotate(45)"><circle cx="10" cy="0" r="2" /></g>'), [c - 2, c - 2, c + 2, c + 2])
  })

  it('paths: absolute, relative, smooth and closed', () => {
    near(svgHull('<path d="M0 0 L10 0 L10 5 Z" />'), [0, 0, 10, 5])
    // The control point of a quadratic curve counts — the curve bends toward it.
    near(svgHull('<path d="M0 0 q5 -10 10 0" />'), [0, -10, 10, 0])
    near(svgHull('<path d="M0 0 C1 -4 9 -4 10 0 S19 4 20 0" />'), [0, -4, 20, 4])
    // Implicit line-to after move-to, and a horizontal/vertical pair.
    near(svgHull('<path d="M1 1 3 3 H10 V-2" />'), [1, -2, 10, 3])
  })

  it('an arc is followed, not boxed by its radii', () => {
    // A half circle over the chord (0,0)→(10,0), swept the positive way: it rises to y = −5.
    near(svgHull('<path d="M0 0 A5 5 0 0 1 10 0" />'), [0, -5, 10, 0], 0.02)
    // The wreath's ring: a three-quarter circle of radius 36. Boxed by its radii it came back
    // 144 wide; followed, it is the circle it is.
    const ring = svgHull('<path d="M36 0 A36 36 0 1 1 0 -36" fill="none" />')!
    expect(ring.maxX - ring.minX).toBeLessThan(72.2)
    expect(ring.maxY - ring.minY).toBeLessThan(72.2)
    expect(ring.maxX - ring.minX).toBeGreaterThan(60)
  })
})

describe('svgHull — transforms and structure', () => {
  it('composes translate then rotate the way SVG does', () => {
    // translate(10 10) rotate(90): the segment (0,0)→(5,0) turns to point down, then moves.
    near(svgHull('<g transform="translate(10 10) rotate(90)"><path d="M0 0 L5 0" /></g>'), [10, 10, 10, 15])
    near(svgHull('<path d="M0 0 L5 0" transform="rotate(90 5 0)" />'), [5, -5, 5, 0])
    near(svgHull('<g transform="scale(2)"><rect x="1" y="1" width="1" height="1" /></g>'), [2, 2, 4, 4])
    const m = parseTransform('translate(3 4) scale(2)')
    expect(m).toEqual([2, 0, 0, 2, 3, 4])
  })

  it('nested groups pop correctly and defs are skipped', () => {
    const markup =
      '<defs><linearGradient id="g"><stop offset="0" /></linearGradient><path d="M-100 -100 L100 100" /></defs>' +
      '<g transform="translate(10 0)"><g transform="translate(0 10)"><circle cx="0" cy="0" r="1" /></g><rect x="0" y="0" width="1" height="1" /></g>' +
      '<rect x="-1" y="-1" width="1" height="1" />'
    near(svgHull(markup), [-1, -1, 11, 11])
  })

  it('pads by half the stroke, inherited from the group, and never for stroke="none"', () => {
    near(svgHull('<path d="M0 0 L10 0" stroke="#000" stroke-width="2" />'), [-1, -1, 11, 1])
    near(svgHull('<g stroke="#000" stroke-width="4"><path d="M0 0 L10 0" /></g>'), [-2, -2, 12, 2])
    near(svgHull('<path d="M0 0 L10 0" fill="#000" stroke="none" stroke-width="2" />'), [0, 0, 10, 0])
  })

  it('returns null for nothing drawn', () => {
    expect(svgHull('')).toBeNull()
    expect(svgHull('<defs><path d="M0 0 L1 1" /></defs>')).toBeNull()
  })
})

describe('svgHull — the illustrator', () => {
  const ink: HeroInk = { leafLight: '#5a9a6f', leaf: '#2d6a4f', leafMid: '#2a5c46', leafDeep: '#24503d', fruit: '#b5651d', fruitDeep: '#8f4f16', stem: '#233f33' }
  const SPECIES: Species[] = ['olive', 'coffee', 'flora', 'lavender', 'citrus', 'aloe', 'grain']
  const LAYOUTS: HeroLayout[] = ['spray', 'arch', 'sprig', 'wreath', 'crossed', 'rosette', 'citrus']

  it('moving the drawing moves the hull by the same offset, for every arrangement and style', () => {
    for (const species of SPECIES) {
      for (const layout of LAYOUTS) {
        for (const style of ['solid', 'engraved'] as const) {
          const a = svgHull(speciesHero(species, 0, 0, 100, ink, 11, { layout, style, uid: 'a' }))!
          const b = svgHull(speciesHero(species, 40, -25, 100, ink, 11, { layout, style, uid: 'b' }))!
          expect(b.minX - a.minX, `${species}/${layout}/${style}`).toBeCloseTo(40, 1)
          expect(b.maxX - a.maxX, `${species}/${layout}/${style}`).toBeCloseTo(40, 1)
          expect(b.minY - a.minY, `${species}/${layout}/${style}`).toBeCloseTo(-25, 1)
          expect(b.maxY - a.maxY, `${species}/${layout}/${style}`).toBeCloseTo(-25, 1)
        }
      }
    }
  })

  it('the reach is a drawing-sized box, and it is not the nominal size', () => {
    // Measured in the browser: an olive arch at nominal 100 reaches ~123 wide and ~79 tall.
    const arch = svgHull(speciesHero('olive', 0, 0, 100, ink, 11, { layout: 'arch', style: 'engraved' }))!
    expect(arch.maxX - arch.minX).toBeGreaterThan(100)
    expect(arch.maxX - arch.minX).toBeLessThan(150)
    expect(arch.maxY - arch.minY).toBeGreaterThan(55)
    expect(arch.maxY - arch.minY).toBeLessThan(100)
    // And a lavender sprig is narrow: the room it needs is under half the nominal size wide.
    const sprig = svgHull(speciesHero('lavender', 0, 0, 100, ink, 11, { layout: 'sprig', style: 'solid' }))!
    expect(sprig.maxX - sprig.minX).toBeLessThan(60)
  })
})
