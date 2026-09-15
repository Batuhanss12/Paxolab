import { afterEach, describe, expect, it } from 'vitest'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import { setLlmProvider, type LLMProvider, type StructuredRequest } from './provider'
import { mergeLlmCopy } from './copyLlm'
import { sanitizeStudioDirection, studioDirectionWithLlm } from './studioDirectorLlm'
import { critiqueWithLlm } from './critiqueLlm'
import { isGenericTagline } from '../studio/copyBank'

function fakeProvider(answer: (request: StructuredRequest) => unknown): LLMProvider {
  return {
    enabled: () => true,
    config: () => ({ provider: 'fake', model: 'fake-1', promptVersion: 'test' }),
    async generateStructured<T>(request: StructuredRequest): Promise<T | null> {
      return answer(request) as T | null
    },
  }
}

describe('S8 studio-direct contract', () => {
  afterEach(() => setLlmProvider(null))

  it('keeps closed-vocabulary enums and drops invented archetypes, hex, and SVG rationale', () => {
    expect(
      sanitizeStudioDirection({
        archetype: 'marble-frame',
        background: 'marble',
        temperament: 'natural-warm',
        rationale: 'Kahve mermer sistemi.',
      }),
    ).toMatchObject({ source: 'llm', archetype: 'marble-frame', background: 'marble' })

    expect(sanitizeStudioDirection({ archetype: 'photo-real-botanical', background: 'ai-plate' })).toBeNull()
    expect(sanitizeStudioDirection({ archetype: 'marble', background: 'marble' })?.archetype).toBeUndefined()
    expect(sanitizeStudioDirection({ archetype: 'marble-frame', background: 'marble' })?.archetype).toBe('marble-frame')

    const mixed = sanitizeStudioDirection({
      archetype: 'not-a-thing',
      background: 'wave',
      temperament: 'vivid-neon',
      rationale: 'Use #C9A227 stroke 0.4mm in the SVG path.',
    })
    expect(mixed).toEqual({ source: 'llm', rationale: [], background: 'wave' })
  })

  it('studioDirectionWithLlm fail-opens when the provider is off and sanitizes live JSON', async () => {
    expect(await studioDirectionWithLlm({ brand: 'Elite', product: 'Brew', sector: 'gıda', surface: 'box' })).toBeNull()
    setLlmProvider(
      fakeProvider((request) => {
        expect(request.task).toBe('studio-direct')
        return { archetype: 'diagonal-tech', background: 'diagonal', extra: { x: 12, svg: '<rect/>' } }
      }),
    )
    const hints = await studioDirectionWithLlm({ brand: 'Nox', product: 'Buds', sector: 'elektronik', surface: 'box' })
    expect(hints?.archetype).toBe('diagonal-tech')
    expect(hints?.background).toBe('diagonal')
    expect(hints && 'extra' in hints).toBe(false)
  })

  it('drops LLM critique rows that invent geometry even when a studio ledger is attached', async () => {
    setLlmProvider(
      fakeProvider(() => ({
        critique: [
          { category: 'hierarchy', target: 'brand', severity: 'warn', issue: 'Marka küçük kalıyor.', suggestedDirection: 'Lockup’u büyüt' },
          { category: 'composition', target: 'front', severity: 'error', issue: 'Move 12mm', suggestedDirection: 'x=40' },
        ],
      })),
    )
    const rows = await critiqueWithLlm({
      plan: {
        sector: 'serum',
        style: 'luxury',
        positioning: 'luxury',
        visualIntent: 'elegant',
        visualLanguage: ['quiet-line'],
        visualConcept: { id: 'clinical', label: 'clinical', tags: [], avoid: [] },
        summaryTr: 'klinik',
      },
      brief: {},
      deterministic: [],
      studioLedger: { collisions: ['front:brand/product'], outOfBounds: [], minTextMm: 1.2 },
    })
    expect(rows).toHaveLength(1)
    expect(rows?.[0].issue).toMatch(/Marka/)
  })
})

describe('S8 copy merge', () => {
  it('rejects kit-leak and boilerplate taglines so the studio bank can win', () => {
    expect(isGenericTagline('Masada duran lezzet.')).toBe(true)
    expect(isGenericTagline('Premium Quality')).toBe(true)
    expect(isGenericTagline('Elite Brew', 'Elite Brew')).toBe(true)
    expect(isGenericTagline('SAVOR THE DISTINCTION')).toBe(false)

    const sample = { tagline: 'Masada duran lezzet.', ingredients: 'Kahve çekirdeği.', warnings: 'Örnek uyarı.' }
    const generic = mergeLlmCopy({ llm: { tagline: 'Premium Quality', ingredients: 'n/a', warnings: '' }, sample, brand: 'Elite Brew' })
    expect(generic.tagline).toBe(sample.tagline)
    expect(generic.usedLlm.tagline).toBe(false)
    expect(generic.ingredients).toBe(sample.ingredients)

    const good = mergeLlmCopy({
      llm: { tagline: 'Yavaş kavrum. Uzun bitiş.', ingredients: 'Arabica · Robusta blend', warnings: '' },
      sample,
    })
    expect(good.tagline).toBe('Yavaş kavrum. Uzun bitiş.')
    expect(good.usedLlm.tagline).toBe(true)
    expect(good.ingredients).toMatch(/Arabica/)

    const user = mergeLlmCopy({
      llm: { tagline: 'Yavaş kavrum. Uzun bitiş.', ingredients: 'Arabica · Robusta blend', warnings: '' },
      sample,
      userTagline: 'İmzalı kavrum',
    })
    expect(user.tagline).toBe('İmzalı kavrum')
    expect(user.usedLlm.tagline).toBe(false)
  })

  it('does not let generic LLM copy paint a coffee studio face', () => {
    const engine = new FormaLocalEngine()
    const brief = {
      ...emptyBrief(),
      brandName: 'Elite Brew',
      sector: 'gıda',
      subProduct: 'kahve',
      packagingMode: 'box' as const,
      templateId: 'coffee-box',
      dimensionsMm: { L: 80, W: 50, H: 180 },
      styleType: 'luxury' as const,
    }
    const leaked = engine.generate({
      brief,
      overridePatch: { studio: true },
      llmCopy: { tagline: 'Masada duran lezzet.', ingredients: 'örnek', warnings: '' },
    })
    expect(leaked.studio?.direction.taglineLine).not.toMatch(/masada duran|gurme gıda|premium quality/i)
    expect(leaked.studio?.direction.taglineLine).toBe('SAVOR THE DISTINCTION')

    const spoken = engine.generate({
      brief,
      overridePatch: { studio: true },
      llmCopy: { tagline: 'Yavaş kavrum uzun bitiş', ingredients: 'Arabica blend, yavaş kavrum', warnings: '' },
    })
    expect(spoken.studio?.direction.taglineLine).toMatch(/yavaş kavrum/i)
    expect(spoken.copy.ingredients).toMatch(/Arabica/)
  })
})
