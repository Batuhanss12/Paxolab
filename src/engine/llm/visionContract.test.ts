/**
 * F-7 vision contract — the model sees the face; nothing it says becomes geometry.
 *
 * Pinned here: the request really carries the image (as multimodal parts, in the shape the
 * endpoint expects); the rasteriser is injected, so a stub is enough and the engine never touches
 * the DOM; every enum is gated and free text is screened exactly as the art director's is; a
 * critique reaches the face only as offers whose utterances are design commands the parser
 * already understands; and the pass is fail-silent when the provider is off or the rasteriser
 * has nothing to give.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import { resetArtMemory } from '../brain/DesignMemory'
import { parseDesignCommands } from '../iterate/parseDesignCommands'
import { setLlmProvider, userContent, type LLMProvider, type StructuredRequest } from './provider'
import {
  compareFacesWithVision,
  critiqueFaceWithVision,
  describeReferenceWithVision,
  sanitizeVisionCritique,
  sanitizeVisionReference,
  studioVisionOffers,
  visionCritiqueToOffers,
} from './visionLlm'

const PNG = 'data:image/png;base64,iVBORw0KGgo='
const stubRasterise = async (svg: string) => (svg ? PNG : null)

function fakeProvider(answer: (request: StructuredRequest) => unknown): LLMProvider {
  return {
    enabled: () => true,
    config: () => ({ provider: 'fake', model: 'fake-vision', promptVersion: 'test' }),
    async generateStructured<T>(request: StructuredRequest): Promise<T | null> {
      return answer(request) as T | null
    },
  }
}

describe('vision — transport', () => {
  it('turns images into multimodal parts and leaves text-only requests as a string', () => {
    const plain = userContent({ task: 'copy', system: 's', user: 'hello' })
    expect(plain).toBe('hello')
    const parts = userContent({ task: 'vision-critique', system: 's', user: 'look', images: [PNG, ''] })
    expect(Array.isArray(parts)).toBe(true)
    expect(parts).toEqual([
      { type: 'text', text: 'look' },
      { type: 'image_url', image_url: { url: PNG, detail: 'low' } },
    ])
  })
})

describe('vision — gates', () => {
  it('keeps closed-vocabulary readings and drops geometry, hex and unknown enums', () => {
    const clean = sanitizeVisionCritique({
      legibility: 'weak',
      balance: 'crowded',
      hierarchy: 'brand-leads',
      issues: ['Süs markayla yarışıyor.', 'Move the brand 4mm up', 'Use #C9A227 for the frame', 'Alt satır küçük.', 'Dördüncü.'],
      suggest: { ornament: 'quiet', frame: 'emboss', typePairing: 'serif-display/sans-meta', temperament: 'neon' },
    })
    expect(clean).toEqual({
      legibility: 'weak',
      balance: 'crowded',
      hierarchy: 'brand-leads',
      // Two of five dropped for geometry and hex; the three that survive are the cap.
      issues: ['Süs markayla yarışıyor.', 'Alt satır küçük.', 'Dördüncü.'],
      suggest: { ornament: 'quiet', typePairing: 'serif-display/sans-meta' },
    })
    expect(sanitizeVisionCritique({ legibility: 'fine', balance: 'so-so', issues: ['x=12'] })).toBeNull()
    expect(sanitizeVisionCritique('nope')).toBeNull()
  })

  it('reads a reference into direction hints and a short hex palette', () => {
    const ref = sanitizeVisionReference({
      archetype: 'crest-panel',
      background: 'arabesque',
      frame: 'thin-double',
      ornament: 'rich',
      palette: ['#1A2744', '#c9a227', 'gold', '#fff', '#f3ead8', '#000000'],
      notes: 'Lacivert zemin, altın arma.',
    })
    expect(ref?.direction).toMatchObject({ source: 'llm', archetype: 'crest-panel', background: 'arabesque', frame: 'thin-double', ornament: 'rich' })
    expect(ref?.palette).toEqual(['#1a2744', '#c9a227', '#f3ead8'])
    expect(ref?.notes).toBe('Lacivert zemin, altın arma.')
    expect(sanitizeVisionReference({ archetype: 'photo', palette: ['red'] })).toBeNull()
  })
})

describe('vision — offers the parser understands', () => {
  it('maps every suggestion to a command parseDesignCommands accepts, at most three, deduplicated', () => {
    const offers = visionCritiqueToOffers({
      legibility: 'weak',
      balance: 'crowded',
      hierarchy: 'brand-leads',
      issues: ['Süs markayla yarışıyor.'],
      suggest: { ornament: 'quiet', frame: 'none', typePairing: 'sans-light/sans-heavy', temperament: 'light-luxe' },
    })
    expect(offers.length).toBe(3)
    expect(offers.every((row) => row.kind === 'vision')).toBe(true)
    expect(offers[0]).toEqual({ kind: 'vision', utterance: 'süsü azalt', reason: 'Süs markayla yarışıyor.' })
    for (const row of offers) {
      const cmd = parseDesignCommands(row.utterance)
      expect(Object.keys(cmd.direction).length, `${row.utterance} is not a design command`).toBeGreaterThan(0)
    }
    // A reading with no suggestion still lands on the nearest command.
    const bare = visionCritiqueToOffers({ legibility: 'ok', balance: 'top-heavy', hierarchy: 'brand-leads', issues: [], suggest: {} })
    expect(bare.map((row) => row.utterance)).toEqual(['ortala'])
  })
})

describe('vision — live tasks through the provider', () => {
  afterEach(() => setLlmProvider(null))

  it('critiques a rendered face: the image travels, the answer is gated', async () => {
    let seen: StructuredRequest | null = null
    setLlmProvider(
      fakeProvider((request) => {
        seen = request
        return { legibility: 'ok', balance: 'ok', hierarchy: 'brand-leads', issues: [], suggest: { frame: 'band-hairline' } }
      }),
    )
    const critique = await critiqueFaceWithVision(
      { svg: '<svg/>', brief: { brand: 'Odette', product: 'Fleur', sector: 'parfüm' }, direction: { archetype: 'ink-panel', frame: 'thin-double', ornament: 'measured', typePairing: 'spaced-serif/spaced-sans', temperament: 'light-luxe' } },
      stubRasterise,
    )
    expect(critique?.suggest.frame).toBe('band-hairline')
    expect(seen!.task).toBe('vision-critique')
    expect(seen!.images).toEqual([PNG])
    expect(seen!.user).toContain('ink-panel')
  })

  it('is silent when the rasteriser gives nothing, and when the provider is off', async () => {
    setLlmProvider(fakeProvider(() => ({ legibility: 'poor' })))
    expect(await critiqueFaceWithVision({ svg: '', brief: { brand: '', product: '', sector: 'parfüm' }, direction: { archetype: 'ink-panel', frame: 'none', ornament: 'quiet', typePairing: 'sans-light/sans-heavy', temperament: 'dark-luxe' } }, stubRasterise)).toBeNull()
    setLlmProvider(null)
    expect(await describeReferenceWithVision({ imageUrl: PNG })).toBeNull()
    expect(await compareFacesWithVision({ svgs: ['<svg/>', '<svg/>'], brief: { brand: 'x', sector: 'gıda' } }, stubRasterise)).toBeNull()
  })

  it('compares two fronts and returns which one, sanitised', async () => {
    setLlmProvider(fakeProvider((request) => (request.images?.length === 2 ? { preferred: '1', reason: 'İkincisi daha hızlı okunuyor.' } : null)))
    const pick = await compareFacesWithVision({ svgs: ['<svg>a</svg>', '<svg>b</svg>'], brief: { brand: 'x', sector: 'gıda' } }, stubRasterise)
    expect(pick).toEqual({ preferred: 1, reason: 'İkincisi daha hızlı okunuyor.' })
  })

  it('runs the whole pass on a real studio design and hands back critic offers', async () => {
    setLlmProvider(fakeProvider(() => ({ legibility: 'weak', balance: 'crowded', hierarchy: 'brand-leads', issues: ['Doku markayı boğuyor.'], suggest: { ornament: 'quiet' } })))
    resetArtMemory()
    const spec = new FormaLocalEngine().generate({
      brief: { ...emptyBrief(), brandName: 'Elite Brew', productName: 'Mocha', sector: 'gıda', subProduct: 'kahve', packagingMode: 'box', templateId: 'coffee-box', dimensionsMm: { L: 80, W: 50, H: 180 }, styleType: 'luxury', colors: 'siyah · altın', volume: '250 g' },
      overridePatch: { studio: true, variationIndex: 0 },
    })
    const offers = await studioVisionOffers(spec, stubRasterise)
    expect(offers).toEqual([{ kind: 'vision', utterance: 'süsü azalt', reason: 'Doku markayı boğuyor.' }])
  })
})
