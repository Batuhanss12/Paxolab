import { describe, expect, it } from 'vitest'
import { isIteration, parseIntent } from './parseIntent'

describe('qualitative iteration', () => {
  it('maps bold direction to a stronger graphic plan', () => {
    const intent = parseIntent('daha cesur ve grafik yap', 'modern')
    expect(intent.overridePatch.directorCue).toBe('graphic-push')
    expect(intent.overridePatch.titleScale).toBeGreaterThan(1)
  })

  it('maps audience maturity language to style changes', () => {
    expect(parseIntent('daha genç ve dinamik yap').briefPatch.styleType).toBe('playful')
    expect(parseIntent('daha olgun ve zamansız yap').briefPatch.styleType).toBe('classic')
  })

  it('recognizes qualitative phrases as iterations', () => {
    expect(isIteration('kontrastı artır')).toBe(true)
    expect(isIteration('daha güvenilir görünmeli')).toBe(true)
  })
})

describe('common Turkish revision phrases', () => {
  it('maps daha minimal to minimal style + palette', () => {
    const intent = parseIntent('daha minimal', 'luxury')
    expect(intent.briefPatch.styleType).toBe('minimal')
    expect(intent.overridePatch.paletteShift).toBe('minimal')
    expect(intent.overridePatch.premium).toBe(false)
    expect(isIteration('daha minimal')).toBe(true)
  })

  it('maps altın ekle to gold accent overrides', () => {
    const fromModern = parseIntent('altın ekle', 'modern')
    expect(fromModern.overridePatch.paletteShift).toBe('gold')
    expect(fromModern.overridePatch.premium).toBe(true)
    expect(fromModern.briefPatch.styleType).toBe('luxury')

    const stayLuxury = parseIntent('altın ekle', 'luxury')
    expect(stayLuxury.overridePatch.paletteShift).toBe('gold')
    expect(stayLuxury.overridePatch.premium).toBe(true)
    expect(isIteration('altın ekle')).toBe(true)
  })

  it('maps ürün adını büyüt to titleScale', () => {
    const up = parseIntent('ürün adını büyüt', 'modern')
    expect(up.overridePatch.titleScale).toBe(1.28)
    expect(up.briefPatch.productName).toBeUndefined()

    const down = parseIntent('ürün adını küçült', 'modern')
    expect(down.overridePatch.titleScale).toBe(0.82)
    expect(isIteration('ürün adını büyüt')).toBe(true)
  })
})
