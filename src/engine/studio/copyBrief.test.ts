import { describe, expect, it } from 'vitest'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { extractFields } from '../extract'
import { extractSpokenCopy, isSpokenStory, isSpokenTagline } from '../extractCopy'
import { emptyBrief } from '../fields'
import { copyBankFor } from './copyBank'
import { resolveStudioCopy } from './direction'
import type { DesignBrief } from '../../types'

const USER_TAG = 'Geceye özel koyu kavrum.'
const USER_CLAIM = 'Doğal içerik, günlük kullanım için.'
const USER_STORY = 'Bu marka geceleri küçük partiler halinde kavrulan kahvelerden doğdu.'
const LUMA =
  'Yeni çıkardığım doğal içerikli yüz serumum için premium bir kutu ve şişe etiketi istiyorum. Marka adı Luma olsun. Çok klasik görünmesin ama ucuz da durmasın. Bej ve koyu yeşil tonlarında, biraz editorial bir şey istiyorum.'

function coffeeBrief(patch: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Elite Brew',
    sector: 'gıda',
    subProduct: 'kahve',
    packagingMode: 'box',
    templateId: 'coffee-box',
    dimensionsMm: { L: 80, W: 50, H: 180 },
    styleType: 'luxury',
    volume: '250 g',
    ...patch,
  }
}

function generateCoffee(patch: Partial<DesignBrief> = {}) {
  return new FormaLocalEngine().generate({
    brief: coffeeBrief(patch),
    overridePatch: { studio: true },
  })
}

function markupOf(spec: ReturnType<FormaLocalEngine['generate']>): string {
  return spec.artwork.layers.map((l) => l.markup).join('\n')
}

describe('C4 copy from brief', () => {
  it('TEST 1 — user copy is detected and copyBank is not selected', () => {
    expect(isSpokenTagline(USER_TAG)).toBe(true)
    const extracted = extractFields(USER_TAG, [])
    expect(extracted.copyOverrides).toMatch(/geceye özel koyu kavrum/i)

    const bank = copyBankFor(coffeeBrief(), 'food', 'tr')
    const decided = resolveStudioCopy({
      brief: coffeeBrief({ copyOverrides: extracted.copyOverrides ?? '' }),
      spokenTag: extracted.copyOverrides ?? '',
      bankTagline: bank.tagline,
    })
    expect(decided.copySource).toBe('user')
    expect(decided.tagline).toMatch(/geceye özel koyu kavrum/i)
    expect(decided.tagline).not.toBe(bank.tagline)

    const spec = generateCoffee({ copyOverrides: extracted.copyOverrides ?? '' })
    expect(spec.studio?.direction.copySource).toBe('user')
    expect(spec.studio?.direction.taglineLine).toMatch(/geceye özel koyu kavrum/i)
    expect(spec.copy.tagline).toMatch(/geceye özel koyu kavrum/i)
    const svg = markupOf(spec)
    expect(svg).toMatch(/data-art="studio"/)
    expect(svg).toMatch(/GECEYE ÖZEL KOYU KAVRUM/i)
    expect(svg).not.toMatch(/>SAVOR THE DISTINCTION</)
  })

  it('TEST 2 — user claim reaches compose → SVG markup', () => {
    const extracted = extractFields(USER_CLAIM, [])
    expect(extracted.copyOverrides).toMatch(/doğal içerik/i)
    const spec = generateCoffee({ copyOverrides: extracted.copyOverrides ?? '' })
    expect(spec.studio?.direction.copySource).toBe('user')
    expect(spec.studio?.direction.taglineLine).toMatch(/doğal içerik/i)
    expect(spec.copy.tagline).toMatch(/doğal içerik/i)
    const svg = markupOf(spec)
    expect(svg).toMatch(/DOĞAL İÇERİK/i)
    expect(svg).toMatch(/GÜNLÜK KULLANIM/i)
    expect(svg).toMatch(/data-art="studio"/)
    expect(svg).toMatch(/data-art="lockup"/)
  })

  it('TEST 3 — copyBank fallback when the user gives no copy', () => {
    const spec = generateCoffee()
    expect(spec.studio?.direction.copySource).toBe('bank')
    expect(spec.studio?.direction.taglineLine).toBe('SAVOR THE DISTINCTION')
    expect(markupOf(spec)).toMatch(/SAVOR THE DISTINCTION/)
  })

  it('TEST 4 — same brief with vs without user copy differs in painted copy, not only metadata', () => {
    const withUser = generateCoffee({ copyOverrides: USER_TAG })
    const without = generateCoffee()
    expect(withUser.studio?.direction.taglineLine).not.toBe(without.studio?.direction.taglineLine)
    expect(withUser.studio?.direction.copySource).toBe('user')
    expect(without.studio?.direction.copySource).toBe('bank')
    const a = markupOf(withUser)
    const b = markupOf(without)
    expect(a).not.toBe(b)
    expect(a).toMatch(/GECEYE ÖZEL KOYU KAVRUM/i)
    expect(b).not.toMatch(/GECEYE ÖZEL KOYU KAVRUM/i)
    expect(b).toMatch(/SAVOR THE DISTINCTION/)
  })

  it('TEST 5 — spoken story is consumed on the back, not invented as a tagline', () => {
    expect(isSpokenStory(USER_STORY)).toBe(true)
    const extracted = extractSpokenCopy(USER_STORY)
    expect(extracted.story).toMatch(/partiler halinde kavrulan/i)
    expect(extracted.copyOverrides).toBeUndefined()

    const spec = generateCoffee({ story: extracted.story })
    expect(spec.studio?.direction.story).toMatch(/küçük partiler halinde/i)
    expect(spec.studio?.direction.copySource).toBe('bank')
    const svg = markupOf(spec)
    expect(svg).toMatch(/partiler/i)
    expect(svg).toMatch(/kavrulan/i)
    expect(svg).toMatch(/data-art="paragraph"/)
  })

  it('TEST 6 — generic bank slogans do not override user copy', () => {
    const bank = copyBankFor(coffeeBrief(), 'food', 'tr')
    const decided = resolveStudioCopy({
      brief: coffeeBrief({ copyOverrides: USER_TAG }),
      spokenTag: 'PREMIUM COFFEE',
      bankTagline: bank.tagline,
    })
    expect(decided.copySource).toBe('user')
    expect(decided.tagline).toBe(USER_TAG)
    expect(decided.tagline).toMatch(/geceye özel koyu kavrum/i)
    expect(decided.tagline).not.toBe('PREMIUM COFFEE')
    expect(decided.tagline).not.toBe(bank.tagline)
    expect(decided.tagline).not.toMatch(/EAU DE PARFUM|HIGH-QUALITY COFFEE|^COFFEE$/i)

    const spec = generateCoffee({ copyOverrides: USER_TAG })
    expect(spec.studio?.direction.taglineLine).toMatch(/geceye özel koyu kavrum/i)
    expect(spec.studio?.direction.taglineLine).not.toBe('PREMIUM COFFEE')
    expect(spec.studio?.direction.taglineLine).not.toBe('SAVOR THE DISTINCTION')
    expect(spec.studio?.direction.taglineLine).not.toMatch(/^(COFFEE|ELECTRONICS|EAU DE PARFUM)$/i)
    expect(markupOf(spec)).toMatch(/GECEYE ÖZEL KOYU KAVRUM/i)
    expect(markupOf(spec)).not.toMatch(/>SAVOR THE DISTINCTION</)
  })

  it('negative control — empty copy stays on the same bank fallback', () => {
    const a = generateCoffee()
    const b = generateCoffee()
    expect(a.studio?.direction.copySource).toBe('bank')
    expect(b.studio?.direction.copySource).toBe('bank')
    expect(a.studio?.direction.taglineLine).toBe(b.studio?.direction.taglineLine)
    expect(a.studio?.direction.taglineLine).toBe('SAVOR THE DISTINCTION')
    expect(a.studio?.direction.seed).toBe(b.studio?.direction.seed)
  })

  it('does not steal LUMA intake sentences as a slogan', () => {
    const extracted = extractFields(LUMA, [])
    expect(extracted.copyOverrides ?? '').toBe('')
    expect(extracted.story ?? '').toBe('')
    expect(extracted.brandName).toBe('Luma')
  })

  it('a coffee paragraph with a trailing slogan still extracts user copy', () => {
    const extracted = extractFields(`Elite Brew kahve kutusu 80x50x180. ${USER_TAG}`, [])
    expect(extracted.brandName).toMatch(/Elite/i)
    expect(extracted.subProduct).toBe('kahve')
    expect(extracted.copyOverrides).toMatch(/geceye özel koyu kavrum/i)
  })
})
