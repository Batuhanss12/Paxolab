/**
 * The mixed-language gate must not refuse Turkish for having no ç, ğ, ı, ö, ş or ü.
 *
 * `copy-locale-mix` is one of the eleven conditions on `exportOk`, so when it fires the customer
 * cannot download anything at all. It used to decide "this product line is English" from the
 * *absence* of Turkish letters, which is a test for diacritics, not for English — and a great many
 * ordinary Turkish names carry none.
 *
 * Measured: a Turkish perfume label named "Gece Serisi" was refused its print-ready export as a
 * language mix. So was anything shaped like "Beyaz Sabun" or "Altin Seri". The last step of the
 * funnel was closed to a whole class of Turkish names, and nothing said why beyond "Engel var".
 *
 * The rule now asks for a known English word on a word boundary, which is both stricter (it still
 * catches a real mix) and kinder (it stops guessing from spelling).
 */
import { describe, expect, it } from 'vitest'
import { detectCopyLocaleMix } from './copyLocale'
import type { DesignSpec } from '../types'
import { emptyBrief } from './fields'
import type { DesignSystem } from './designSystem/types'

function check(product: string, tagline: string, category = 'EAU DE PARFUM') {
  const spec = {
    brief: { ...emptyBrief(), copyLocale: 'tr' as const },
    copy: { product, tagline } as DesignSpec['copy'],
    overrides: {} as DesignSpec['overrides'],
  }
  return detectCopyLocaleMix(spec as never, { category } as DesignSystem, '')
}

const TR_TAGLINE = 'SESSİZ BİR YOĞUNLUK'

describe('copy locale mix — Turkish without diacritics is still Turkish', () => {
  for (const name of ['Gece Serisi', 'Beyaz Sabun', 'Altin Seri', 'Dag Bali', 'Bahar Kolonyasi']) {
    it(`"${name}" is not a language mix`, () => {
      expect(check(name, TR_TAGLINE).mix, `${name} EN sayıldı`).toBe(false)
    })
  }

  for (const name of ['Night Serum', 'Face Cream', 'Deep Repair', 'Limited Edition']) {
    it(`"${name}" with a Turkish tagline is still caught`, () => {
      expect(check(name, TR_TAGLINE).mix, `${name} yakalanmadı`).toBe(true)
    })
  }

  it('an English word inside a Turkish word does not count — “Serisi” is not “series”', () => {
    expect(check('Serisi', TR_TAGLINE).mix).toBe(false)
    expect(check('Series', TR_TAGLINE).mix).toBe(true)
  })

  it('a Turkish product with a Turkish tagline passes whatever its spelling', () => {
    expect(check('Çiçek Balı', TR_TAGLINE).mix).toBe(false)
    expect(check('Cicek Bali', TR_TAGLINE).mix).toBe(false)
  })

  it('the perfume category stays an allowed exception', () => {
    expect(check('Gece Serisi', TR_TAGLINE, 'EAU DE PARFUM').mix).toBe(false)
  })
})
