/**
 * Phase 4 — type systems: what a pairing does, on faces the studio can actually export.
 *
 * Three promises. The four systems the frozen faces were painted with keep their exact values,
 * so nothing golden moves. Every face a system names has measured advances and export outlines,
 * so a delivered file still carries no live text. And the six new systems are reachable — by the
 * brief's personality, by a picked card, by the strip — where the wordmark suits them.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief, DesignSpec } from '../../types'
import { resetArtMemory } from '../brain/DesignMemory'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { inspectStudioDirectionOffer } from './directionTalk'
import METRICS from './fontMetrics.json'
import OUTLINES from './fontOutlines.json'
import { outlineSvgText, resolveFaceKey } from './outlineText'
import { brandPersonality, TYPE_PERSONALITY, bestByPersonality } from './personality'
import { ALL_ARCHETYPES, BOX_DNA, LABEL_DNA, dnaFor } from './referenceDna'
import { STUDIO_GALLERY_JOBS } from './studioGalleryJobs'
import { faceFamily, faceWeight, pairingFaces, type Face } from './text'
import { ALL_TYPE_SYSTEMS, TYPE_SYSTEMS, brandCase, brandScale, brandTracking, copyShape, pairingsFor, suitsCopy } from './typeSystem'
import type { StudioFamily, TypePairing } from './types'

const ORIGINAL: TypePairing[] = ['serif-display/sans-meta', 'script-accent/sans-heavy', 'sans-light/sans-heavy', 'spaced-serif/spaced-sans']
const NEW: TypePairing[] = ['condensed-serif/mono', 'condensed-grotesk/sans-light', 'rounded/sans', 'display-serif-oversized/sans-meta', 'heavy-grotesk-block/sans', 'light-geometric/wide']
const FACES: Face[] = ['serif', 'serif-italic', 'serif-heavy', 'sans', 'sans-light', 'sans-heavy', 'script', 'mono', 'condensed-serif', 'condensed-serif-italic', 'condensed-grotesk', 'rounded']

function jobBrief(slug: string, patch: Partial<DesignBrief> = {}): DesignBrief {
  const job = STUDIO_GALLERY_JOBS.find((j) => j.slug === slug)
  if (!job) throw new Error(`no gallery job ${slug}`)
  return {
    ...emptyBrief(),
    brandName: job.brand,
    productName: job.product,
    sector: job.sector,
    subProduct: job.subProduct,
    packagingMode: job.packagingMode,
    templateId: job.templateId,
    styleType: job.styleType,
    colors: job.colors,
    volume: job.volume,
    dimensionsMm: job.dimensionsMm,
    barcode: '8690000000017',
    ...patch,
  }
}

function generate(brief: DesignBrief): DesignSpec {
  resetArtMemory()
  return new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, premium: brief.styleType === 'luxury', variationIndex: brief.directionVariation ?? 0 } })
}

function front(spec: DesignSpec): string {
  return spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)?.markup ?? ''
}

/** A gallery job whose family lists the system, pinned to it. */
function briefFor(system: TypePairing, surface: 'label' | 'box'): DesignBrief {
  const slugs = STUDIO_GALLERY_JOBS.filter((j) => (j.packagingMode === 'box') === (surface === 'box')).map((j) => j.slug)
  for (const [family, pair] of Object.entries({ marble: 'marble-frame', 'dark-luxe': surface === 'box' ? 'noir-stack' : 'noir-plate', tech: surface === 'box' ? 'diagonal-tech' : 'diagonal-split', botanical: surface === 'box' ? 'botanical-card' : 'card-on-art', wave: 'wave-panel', specimen: 'specimen-hero', atelier: 'atelier-plate', 'line-scene': 'line-scene', ink: surface === 'box' ? 'ink-wash' : 'ink-panel', crest: 'crest-panel' })) {
    if (dnaFor(pair as never, surface).typePairings.includes(system)) {
      return jobBrief(slugs[0]!, { brandName: 'Nova', studioFamily: family as StudioFamily, studioFamilyLocked: true, studioPick: { typePairing: system } })
    }
  }
  throw new Error(`no family lists ${system}`)
}

describe('the four original systems are exactly what the painters carried', () => {
  it('faces, tracking, case and scale', () => {
    expect(pairingFaces('serif-display/sans-meta')).toEqual({ brand: 'serif', product: 'sans', prefix: 'serif-italic', meta: 'sans', body: 'sans' })
    expect(pairingFaces('script-accent/sans-heavy')).toEqual({ brand: 'sans-heavy', product: 'sans-heavy', prefix: 'script', meta: 'sans', body: 'sans' })
    expect(pairingFaces('sans-light/sans-heavy')).toEqual({ brand: 'serif', product: 'sans-heavy', prefix: 'sans-light', meta: 'sans', body: 'sans' })
    expect(pairingFaces('spaced-serif/spaced-sans')).toEqual({ brand: 'serif', product: 'sans', prefix: 'serif-italic', meta: 'sans', body: 'serif' })
    expect(brandTracking('spaced-serif/spaced-sans')).toBe(0.16)
    expect(brandTracking('serif-display/sans-meta')).toBe(0.08)
    expect(brandTracking('script-accent/sans-heavy')).toBe(0.02)
    expect(brandTracking('sans-light/sans-heavy')).toBe(0.02)
    expect(brandCase('script-accent/sans-heavy', 'Elite Brew')).toBe('Elite Brew')
    // Turkish casing: the dotted capital İ is the engine's, and the print file's.
    expect(brandCase('serif-display/sans-meta', 'Elite Brew')).toBe('ELİTE BREW')
    for (const p of ORIGINAL) expect(brandScale(p), p).toBe(1)
  })

  it('every studio archetype still opens its list with one of them', () => {
    for (const id of ALL_ARCHETYPES) {
      for (const surface of ['label', 'box'] as const) {
        const dna = dnaFor(id, surface)
        if (dna.id !== id) continue
        // The second repertoire (F-32) was distilled after these systems existed and opens on
        // whichever one its reference actually uses; the invariant is about the frozen faces.
        if ((dna.repertoire ?? 'studio') !== 'studio') continue
        expect(ORIGINAL, `${id}/${surface} first pairing`).toContain(dna.typePairings[0])
        for (const p of dna.typePairings) expect(TYPE_SYSTEMS[p], `${id}: ${p}`).toBeDefined()
      }
    }
    expect(ALL_TYPE_SYSTEMS.length).toBe(10)
  })

  it('the six new systems are listed somewhere, and never open a studio archetype', () => {
    const rows = [...Object.values(LABEL_DNA), ...Object.values(BOX_DNA)]
    for (const p of NEW) {
      const listed = rows.filter((dna) => dna.typePairings.includes(p))
      expect(listed.length, `${p} listed`).toBeGreaterThan(0)
      for (const dna of listed) {
        if ((dna.repertoire ?? 'studio') !== 'studio') continue
        expect(dna.typePairings[0], `${dna.id} opens with ${p}`).not.toBe(p)
      }
    }
  })
})

describe('every face a system names can be measured and exported', () => {
  it('has measured advances and outlines for Latin + Turkish', () => {
    const metrics = METRICS as { faces: Record<string, Record<string, number>> }
    const outlines = OUTLINES as { faces: Record<string, Record<string, unknown>> }
    for (const face of FACES) {
      const key = resolveFaceKey(faceFamily(face), faceWeight(face), face.endsWith('italic'))
      expect(metrics.faces[key], `${face} → ${key} advances`).toBeDefined()
      expect(outlines.faces[key], `${face} → ${key} outlines`).toBeDefined()
      for (const ch of 'AŞİĞÜÖÇaşığüöç0') expect(outlines.faces[key]![ch], `${key} lacks ${ch}`).toBeDefined()
    }
  })

  it('resolves the new families to their own faces, not to a fallback', () => {
    expect(resolveFaceKey("'Instrument Serif', 'Cormorant Garamond', Georgia, serif", 400, false)).toBe('instrumentserif-400')
    expect(resolveFaceKey("'Instrument Serif', 'Cormorant Garamond', Georgia, serif", 400, true)).toBe('instrumentserif-400i')
    expect(resolveFaceKey("'Barlow Condensed', 'Oswald', 'Arial Narrow', Arial, sans-serif", 600, false)).toBe('barlowcondensed-600')
    expect(resolveFaceKey("'Righteous', 'Fredoka', 'Arial Rounded MT Bold', Arial, sans-serif", 400, false)).toBe('righteous-400')
    expect(resolveFaceKey("'IBM Plex Mono', 'JetBrains Mono', Consolas, 'Courier New', monospace", 400, false)).toBe('ibmplexmono-400')
  })

  for (const system of NEW) {
    it(`${system}: a delivered face carries no live text and every glyph`, async () => {
      const spec = generate(briefFor(system, 'label'))
      expect(spec.studio?.direction.typePairing).toBe(system)
      const face = front(spec)
      expect(face).toMatch(/<text/)
      const { markup, report } = await outlineSvgText(face)
      expect(report.outlined).toBe(report.total)
      expect(report.missing).toEqual([])
      expect(markup).not.toMatch(/<text[\s>]/)
      // The print floor holds on the new faces too.
      expect(spec.studio!.minTextMm).toBeGreaterThanOrEqual(1.5)
      expect(spec.studio?.collisions).toEqual([])
      expect(spec.studio?.outOfBounds).toEqual([])
      expect(spec.preflight.exportOk).toBe(true)
    })
  }
})

describe('the behaviours', () => {
  it('an oversized system sets a short brand larger than the base system on the same face', () => {
    const base = generate(jobBrief('05-kahve-etiket', { brandName: 'Nova', studioFamily: 'marble', studioFamilyLocked: true, studioPick: { typePairing: 'serif-display/sans-meta' } }))
    const over = generate(jobBrief('05-kahve-etiket', { brandName: 'Nova', studioFamily: 'marble', studioFamilyLocked: true, studioPick: { typePairing: 'display-serif-oversized/sans-meta' } }))
    const brandSize = (spec: DesignSpec) => spec.studio!.panels.find((p) => p.panelId === spec.artwork.frontPanelId)!.placed.find((b) => b.id.startsWith('brand#'))!.sizeMm!
    expect(over.studio?.direction.typePairing).toBe('display-serif-oversized/sans-meta')
    expect(brandSize(over)).toBeGreaterThan(brandSize(base) * 1.15)
    // Brand over product still holds.
    const product = over.studio!.panels.find((p) => p.panelId === over.artwork.frontPanelId)!.placed.find((b) => b.id.startsWith('product#'))!.sizeMm!
    expect(brandSize(over)).toBeGreaterThan(product)
  })

  it('a wordmark that is not short is kept away from the systems that want one', () => {
    expect(copyShape('Nova')).toEqual({ chars: 4, words: 1, short: true })
    expect(copyShape('Verda Botanicals Apothecary').short).toBe(false)
    expect(suitsCopy('display-serif-oversized/sans-meta', 'Verda Botanicals Apothecary')).toBe(false)
    expect(suitsCopy('rounded/sans', 'Verda Botanicals Apothecary')).toBe(true)
    const list = dnaFor('marble-frame', 'label').typePairings
    const pool = pairingsFor(list, 'Verda Botanicals Apothecary')
    expect(pool[0]).toBe(list[0])
    expect(pool).not.toContain('display-serif-oversized/sans-meta')
    // And the engine honours it: the pick is dropped for the long name, kept for the short one.
    const long = generate(jobBrief('05-kahve-etiket', { brandName: 'Verda Botanicals Apothecary', studioFamily: 'marble', studioFamilyLocked: true, studioPick: { typePairing: 'display-serif-oversized/sans-meta' } }))
    expect(long.studio?.direction.typePairing).not.toBe('display-serif-oversized/sans-meta')
  })

  it('the case mode is the system\'s: a rounded display keeps the customer\'s casing', () => {
    const spec = generate(jobBrief('09-temizlik-etiket', { brandName: 'Ferah', studioFamily: 'wave', studioFamilyLocked: true, studioPick: { typePairing: 'rounded/sans' } }))
    expect(spec.studio?.direction.typePairing).toBe('rounded/sans')
    expect(front(spec)).toMatch(/>Ferah</)
    expect(front(spec)).toMatch(/font-family="'Righteous'/)
  })

  it('a brief that said who the brand is reaches a new system over the brain\'s prior', () => {
    // Persona B of the sweep: loud, young, online, mass — an energetic, technical wordmark.
    const brief = jobBrief('06-elektronik-etiket', {
      brandName: 'Zapp',
      audience: '18-25 gençler',
      feeling: 'gösterişli, enerjik, cesur',
      priceTier: 'mass',
      channel: 'online',
      studioFamily: 'tech',
      studioFamilyLocked: true,
    })
    const spec = generate(brief)
    const pool = pairingsFor(dnaFor('diagonal-split', 'label').typePairings, 'Zapp')
    const expected = bestByPersonality(pool, TYPE_PERSONALITY, brandPersonality(brief))
    expect(spec.studio?.direction.typePairing).toBe(expected)
    expect(NEW, 'the personality reached one of the new systems').toContain(expected)
    expect(spec.studio?.direction.reasons?.find((r) => r.axis === 'typePairing')?.because).toMatch(/kişilik/)
  })

  it('reaches the painters that set their title in their own two sans weights', () => {
    // diagonal-split: the product title takes the condensed grotesk, the light word its prefix face.
    const tech = generate(jobBrief('06-elektronik-etiket', { brandName: 'Nox', studioFamily: 'tech', studioFamilyLocked: true, studioPick: { typePairing: 'condensed-grotesk/sans-light' } }))
    expect(tech.studio?.direction.typePairing).toBe('condensed-grotesk/sans-light')
    const title = /<g data-edit="product">([^]*?)<\/g>/.exec(front(tech))?.[1] ?? ''
    expect(title).toMatch(/font-family="'Barlow Condensed'/)
    // line-scene: the two-tone title takes the wide tracking of the light geometric system.
    const scene = generate(jobBrief('08-saglik-etiket', { brandName: 'Sera', studioFamily: 'line-scene', studioFamilyLocked: true, studioPick: { typePairing: 'light-geometric/wide' } }))
    expect(scene.studio?.direction.typePairing).toBe('light-geometric/wide')
    const sceneTitle = /<g data-edit="product">([^]*?)<\/g>/.exec(front(scene))?.[1] ?? ''
    const spacing = Number(/letter-spacing="([\d.]+)"/.exec(sceneTitle)?.[1] ?? 0)
    const size = Number(/font-size="([\d.]+)"/.exec(sceneTitle)?.[1] ?? 1)
    expect(spacing / size).toBeCloseTo(0.3, 1)
    // diagonal-tech on the squat earbuds carton: the badge yields to the chips instead of printing through them.
    const carton = generate(jobBrief('06-elektronik-kutu', { brandName: 'Nox', studioFamily: 'tech', studioFamilyLocked: true, studioPick: { typePairing: 'heavy-grotesk-block/sans' } }))
    expect(carton.studio?.direction.typePairing).toBe('heavy-grotesk-block/sans')
    expect(carton.studio?.collisions).toEqual([])
    expect(carton.preflight.exportOk).toBe(true)
  })

  it('the strip shows the type systems the archetype lists, and a picked card pins the one shown', () => {
    const brief = jobBrief('06-elektronik-etiket', { brandName: 'Nova' })
    const offer = inspectStudioDirectionOffer(brief)
    const systems = new Set(offer.candidates.map((c) => c.fingerprint?.typePairing))
    expect(systems.size).toBeGreaterThanOrEqual(4)
    const card = offer.candidates.find((c) => !c.selected && NEW.includes(c.fingerprint?.typePairing as TypePairing))
    expect(card, 'a card wearing a new system').toBeDefined()
    const system = card!.fingerprint!.typePairing as TypePairing
    const picked = generate({ ...brief, studioFamily: card!.family, studioFamilyLocked: true, studioPick: { typePairing: system } })
    expect(picked.studio?.direction.typePairing).toBe(system)
  })
})
