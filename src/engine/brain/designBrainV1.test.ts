import { afterEach, beforeEach, describe, expect, expectTypeOf, it } from 'vitest'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import { applyPlanToSystem } from './applyPlan'
import { kitGradeSkipsOverlay, chromeForConcept, goldBarForConcept, lockupForConcept, shouldPaintModernGrid, shouldPaintSectorFrame } from '../designSystem/conceptKitAlignment'
import { allowedHeroes, allowedPatterns } from './ArtDirection'
import { resolveDesignSystem } from '../designSystem/resolve'
import { allowedStrategies, compositionTargets, type CompositionTargets } from '../artwork/compositionStrategy'
import {
  applyCharacterLanguageModifier,
  baseVisualLanguageFor,
  languagesFromConcept,
  languagesOfConcept,
  preferredRolesForLanguages,
  visualLanguageFor,
} from '../artwork/visualLanguage'
import { languageTreatmentFor, strokeWidthForLanguage } from '../artwork/languageTreatment'
import { assetLanguageFor } from '../artwork/assetLanguage'
import { clearArtMotifAtomizerCache } from '../artwork/artMotifAtomizer'
import { clearArtPatternLibraryCache } from '../artwork/artPatternLibrary'
import { clearMotifBankCache } from '../artwork/artMotifBank'
import { buildDesignIntent, createPlan } from './DesignDirector'
import { principlesFor, type PrincipleId } from './DesignKnowledge'
import type { DesignIntentBlock } from './DesignPlan'
import { resetArtMemory } from './DesignMemory'
import { visualConceptFor } from './VisualConcept'

type Freeze = {
  concept: string
  hero: string
  chrome: 'full' | 'quiet'
  lockup: 'center' | 'left'
  opticalCenter: number
  budget: number
  densityTarget: number
  whitespaceTarget: number
  symmetryTarget: number
  decorationLevel: number
  focalStrength: number
  balanceTarget: number
  compositionBias: string
  framePreference: number
  ornamentPreference: number
}

/** Pre-slice createPlan + compositionTargets fingerprints (2026-09-15). */
const CONCEPT_LANG_FREEZE: Record<string, string[]> = {
  'nocturne-crest': ['heraldic'],
  'heraldic-crest': ['heraldic'],
  'soft-oval': ['oval', 'quiet-line'],
  'air-paper': ['quiet-line'],
  'index-stripe': ['linear'],
  'earthen-premium': ['botanical', 'organic'],
  'capsule-field': ['organic', 'geometric'],
  'heraldic-cartouche': ['heraldic', 'art-deco'],
  'harvest-kraft': ['botanical', 'organic'],
  'tech-glyph': ['linear', 'geometric'],
  'kraft-botanical': ['botanical', 'organic'],
}

const CATALOG_FREEZE: Record<string, Freeze> = {
  '01-parfum-tuck-luxury': { concept: 'nocturne-crest', hero: 'crest', chrome: 'full', lockup: 'center', opticalCenter: 0.38, budget: 0.28, densityTarget: 0.196, whitespaceTarget: 0.66, symmetryTarget: 0.88, decorationLevel: 0.28, focalStrength: 0.78, balanceTarget: 0.82, compositionBias: 'hero-with-support', framePreference: 0.75, ornamentPreference: 0.28 },
  '02-kolonya-tuck-classic': { concept: 'heraldic-crest', hero: 'crest', chrome: 'full', lockup: 'center', opticalCenter: 0.4, budget: 0.34, densityTarget: 0.238, whitespaceTarget: 0.52, symmetryTarget: 0.88, decorationLevel: 0.34, focalStrength: 0.78, balanceTarget: 0.82, compositionBias: 'hero-with-support', framePreference: 0.75, ornamentPreference: 0.34 },
  '03-krem-tuck-luxury': { concept: 'soft-oval', hero: 'botanical', chrome: 'quiet', lockup: 'center', opticalCenter: 0.38, budget: 0.24, densityTarget: 0.168, whitespaceTarget: 0.72, symmetryTarget: 0.88, decorationLevel: 0.24, focalStrength: 0.78, balanceTarget: 0.82, compositionBias: 'hero-with-support', framePreference: 0.22, ornamentPreference: 0.24 },
  '04-serum-tuck-minimal': { concept: 'air-paper', hero: 'line-scene', chrome: 'quiet', lockup: 'center', opticalCenter: 0.38, budget: 0.18, densityTarget: 0.16, whitespaceTarget: 0.8, symmetryTarget: 0.88, decorationLevel: 0.18, focalStrength: 0.78, balanceTarget: 0.82, compositionBias: 'minimal-accent', framePreference: 0.22, ornamentPreference: 0.18 },
  '05-parfum-wrap-luxury': { concept: 'nocturne-crest', hero: 'crest', chrome: 'full', lockup: 'center', opticalCenter: 0.4, budget: 0.28, densityTarget: 0.196, whitespaceTarget: 0.66, symmetryTarget: 0.88, decorationLevel: 0.28, focalStrength: 0.78, balanceTarget: 0.82, compositionBias: 'hero-with-support', framePreference: 0.75, ornamentPreference: 0.28 },
  '06-krem-wrap-modern': { concept: 'index-stripe', hero: 'emblem', chrome: 'quiet', lockup: 'left', opticalCenter: 0.4, budget: 0.26, densityTarget: 0.182, whitespaceTarget: 0.52, symmetryTarget: 0.88, decorationLevel: 0.26, focalStrength: 0.78, balanceTarget: 0.82, compositionBias: 'asymmetric-editorial', framePreference: 0.22, ornamentPreference: 0.26 },
  '07-serum-wrap-minimal': { concept: 'air-paper', hero: 'line-scene', chrome: 'quiet', lockup: 'center', opticalCenter: 0.38, budget: 0.18, densityTarget: 0.16, whitespaceTarget: 0.8, symmetryTarget: 0.88, decorationLevel: 0.18, focalStrength: 0.78, balanceTarget: 0.82, compositionBias: 'minimal-accent', framePreference: 0.22, ornamentPreference: 0.18 },
  '08-zeytinyagi-tuck-luxury': { concept: 'earthen-premium', hero: 'harvest', chrome: 'quiet', lockup: 'center', opticalCenter: 0.38, budget: 0.42, densityTarget: 0.22, whitespaceTarget: 0.66, symmetryTarget: 0.88, decorationLevel: 0.42, focalStrength: 0.78, balanceTarget: 0.82, compositionBias: 'asymmetric-editorial', framePreference: 0.22, ornamentPreference: 0.42 },
  '09-cikolata-tray-playful': { concept: 'capsule-field', hero: 'harvest', chrome: 'quiet', lockup: 'center', opticalCenter: 0.42, budget: 0.48, densityTarget: 0.336, whitespaceTarget: 0.36, symmetryTarget: 0.4, decorationLevel: 0.48, focalStrength: 0.78, balanceTarget: 0.42, compositionBias: 'pattern-field', framePreference: 0.22, ornamentPreference: 0.48 },
  '10-kurabiye-tray-classic': { concept: 'heraldic-cartouche', hero: 'harvest', chrome: 'full', lockup: 'center', opticalCenter: 0.4, budget: 0.36, densityTarget: 0.252, whitespaceTarget: 0.52, symmetryTarget: 0.88, decorationLevel: 0.36, focalStrength: 0.78, balanceTarget: 0.82, compositionBias: 'framed-content', framePreference: 0.75, ornamentPreference: 0.36 },
  '11-bal-label-classic': { concept: 'heraldic-cartouche', hero: 'harvest', chrome: 'full', lockup: 'center', opticalCenter: 0.4, budget: 0.36, densityTarget: 0.252, whitespaceTarget: 0.52, symmetryTarget: 0.88, decorationLevel: 0.36, focalStrength: 0.78, balanceTarget: 0.82, compositionBias: 'framed-content', framePreference: 0.75, ornamentPreference: 0.36 },
  '12-recel-label-eco': { concept: 'harvest-kraft', hero: 'harvest', chrome: 'quiet', lockup: 'center', opticalCenter: 0.4, budget: 0.38, densityTarget: 0.266, whitespaceTarget: 0.52, symmetryTarget: 0.4, decorationLevel: 0.38, focalStrength: 0.78, balanceTarget: 0.42, compositionBias: 'asymmetric-editorial', framePreference: 0.22, ornamentPreference: 0.38 },
  '13-cay-label-eco': { concept: 'harvest-kraft', hero: 'harvest', chrome: 'quiet', lockup: 'center', opticalCenter: 0.4, budget: 0.38, densityTarget: 0.266, whitespaceTarget: 0.52, symmetryTarget: 0.4, decorationLevel: 0.38, focalStrength: 0.78, balanceTarget: 0.42, compositionBias: 'asymmetric-editorial', framePreference: 0.22, ornamentPreference: 0.38 },
  '14-kulaklik-tuck-modern': { concept: 'tech-glyph', hero: 'tech', chrome: 'quiet', lockup: 'left', opticalCenter: 0.4, budget: 0.22, densityTarget: 0.16, whitespaceTarget: 0.52, symmetryTarget: 0.88, decorationLevel: 0.22, focalStrength: 0.78, balanceTarget: 0.82, compositionBias: 'asymmetric-editorial', framePreference: 0.22, ornamentPreference: 0.22 },
  '15-kablo-tuck-modern': { concept: 'tech-glyph', hero: 'tech', chrome: 'quiet', lockup: 'left', opticalCenter: 0.4, budget: 0.22, densityTarget: 0.16, whitespaceTarget: 0.52, symmetryTarget: 0.88, decorationLevel: 0.22, focalStrength: 0.78, balanceTarget: 0.82, compositionBias: 'asymmetric-editorial', framePreference: 0.22, ornamentPreference: 0.22 },
  '16-cihaz-label-minimal': { concept: 'air-paper', hero: 'none', chrome: 'quiet', lockup: 'center', opticalCenter: 0.38, budget: 0.18, densityTarget: 0.16, whitespaceTarget: 0.8, symmetryTarget: 0.88, decorationLevel: 0.18, focalStrength: 0.45, balanceTarget: 0.82, compositionBias: 'minimal-accent', framePreference: 0.22, ornamentPreference: 0.18 },
  '17-evrensel-kozmetik-tuck': { concept: 'soft-oval', hero: 'botanical', chrome: 'quiet', lockup: 'center', opticalCenter: 0.38, budget: 0.24, densityTarget: 0.168, whitespaceTarget: 0.72, symmetryTarget: 0.88, decorationLevel: 0.24, focalStrength: 0.78, balanceTarget: 0.82, compositionBias: 'hero-with-support', framePreference: 0.22, ornamentPreference: 0.24 },
  '18-evrensel-gida-tuck': { concept: 'heraldic-cartouche', hero: 'harvest', chrome: 'full', lockup: 'center', opticalCenter: 0.4, budget: 0.36, densityTarget: 0.252, whitespaceTarget: 0.52, symmetryTarget: 0.88, decorationLevel: 0.36, focalStrength: 0.78, balanceTarget: 0.82, compositionBias: 'framed-content', framePreference: 0.75, ornamentPreference: 0.36 },
  '19-evrensel-elektronik-tuck': { concept: 'tech-glyph', hero: 'tech', chrome: 'quiet', lockup: 'left', opticalCenter: 0.4, budget: 0.22, densityTarget: 0.16, whitespaceTarget: 0.52, symmetryTarget: 0.88, decorationLevel: 0.22, focalStrength: 0.78, balanceTarget: 0.82, compositionBias: 'asymmetric-editorial', framePreference: 0.22, ornamentPreference: 0.22 },
  '20-temizlik-tuck-minimal': { concept: 'air-paper', hero: 'none', chrome: 'quiet', lockup: 'center', opticalCenter: 0.38, budget: 0.18, densityTarget: 0.16, whitespaceTarget: 0.8, symmetryTarget: 0.88, decorationLevel: 0.18, focalStrength: 0.45, balanceTarget: 0.82, compositionBias: 'minimal-accent', framePreference: 0.22, ornamentPreference: 0.18 },
  '21-krem-eco-monstera': { concept: 'kraft-botanical', hero: 'monstera', chrome: 'quiet', lockup: 'center', opticalCenter: 0.4, budget: 0.36, densityTarget: 0.252, whitespaceTarget: 0.52, symmetryTarget: 0.4, decorationLevel: 0.36, focalStrength: 0.78, balanceTarget: 0.42, compositionBias: 'asymmetric-editorial', framePreference: 0.22, ornamentPreference: 0.36 },
  '22-serum-eco-monstera': { concept: 'kraft-botanical', hero: 'monstera', chrome: 'quiet', lockup: 'center', opticalCenter: 0.4, budget: 0.36, densityTarget: 0.252, whitespaceTarget: 0.52, symmetryTarget: 0.4, decorationLevel: 0.36, focalStrength: 0.78, balanceTarget: 0.42, compositionBias: 'asymmetric-editorial', framePreference: 0.22, ornamentPreference: 0.36 },
  '23-krem-eco-palm': { concept: 'kraft-botanical', hero: 'monstera', chrome: 'quiet', lockup: 'center', opticalCenter: 0.4, budget: 0.36, densityTarget: 0.252, whitespaceTarget: 0.52, symmetryTarget: 0.4, decorationLevel: 0.36, focalStrength: 0.78, balanceTarget: 0.42, compositionBias: 'asymmetric-editorial', framePreference: 0.22, ornamentPreference: 0.36 },
  '24-krem-playful-palm': { concept: 'capsule-field', hero: 'emblem', chrome: 'quiet', lockup: 'center', opticalCenter: 0.42, budget: 0.48, densityTarget: 0.336, whitespaceTarget: 0.36, symmetryTarget: 0.4, decorationLevel: 0.48, focalStrength: 0.78, balanceTarget: 0.42, compositionBias: 'pattern-field', framePreference: 0.22, ornamentPreference: 0.48 },
  '25-krem-playful-wave': { concept: 'capsule-field', hero: 'emblem', chrome: 'quiet', lockup: 'center', opticalCenter: 0.42, budget: 0.48, densityTarget: 0.336, whitespaceTarget: 0.36, symmetryTarget: 0.4, decorationLevel: 0.48, focalStrength: 0.78, balanceTarget: 0.42, compositionBias: 'pattern-field', framePreference: 0.22, ornamentPreference: 0.48 },
  '26-serum-playful-wave': { concept: 'capsule-field', hero: 'emblem', chrome: 'quiet', lockup: 'center', opticalCenter: 0.42, budget: 0.48, densityTarget: 0.336, whitespaceTarget: 0.36, symmetryTarget: 0.4, decorationLevel: 0.48, focalStrength: 0.78, balanceTarget: 0.42, compositionBias: 'pattern-field', framePreference: 0.22, ornamentPreference: 0.48 },
  '27-krem-modern-zebra': { concept: 'index-stripe', hero: 'emblem', chrome: 'quiet', lockup: 'left', opticalCenter: 0.4, budget: 0.26, densityTarget: 0.182, whitespaceTarget: 0.52, symmetryTarget: 0.88, decorationLevel: 0.26, focalStrength: 0.78, balanceTarget: 0.82, compositionBias: 'asymmetric-editorial', framePreference: 0.22, ornamentPreference: 0.26 },
  '28-serum-modern-zebra': { concept: 'index-stripe', hero: 'emblem', chrome: 'quiet', lockup: 'left', opticalCenter: 0.4, budget: 0.26, densityTarget: 0.182, whitespaceTarget: 0.52, symmetryTarget: 0.88, decorationLevel: 0.26, focalStrength: 0.78, balanceTarget: 0.82, compositionBias: 'asymmetric-editorial', framePreference: 0.22, ornamentPreference: 0.26 },
  '29-sampuan-wrap-modern': { concept: 'index-stripe', hero: 'emblem', chrome: 'quiet', lockup: 'left', opticalCenter: 0.4, budget: 0.26, densityTarget: 0.182, whitespaceTarget: 0.52, symmetryTarget: 0.88, decorationLevel: 0.26, focalStrength: 0.78, balanceTarget: 0.82, compositionBias: 'asymmetric-editorial', framePreference: 0.22, ornamentPreference: 0.26 },
}


/** createPlan set-0 pattern families. Generate may repair (e.g. serum styleLeakage → none). */
const PATTERN_FREEZE: Record<string, string> = {
  '01-parfum-tuck-luxury': 'stripe',
  '02-kolonya-tuck-classic': 'stripe',
  '03-krem-tuck-luxury': 'grain',
  '04-serum-tuck-minimal': 'none',
  '05-parfum-wrap-luxury': 'stripe',
  '06-krem-wrap-modern': 'lattice',
  '07-serum-wrap-minimal': 'none',
  '08-zeytinyagi-tuck-luxury': 'weave',
  '09-cikolata-tray-playful': 'capsule',
  '10-kurabiye-tray-classic': 'grain',
  '11-bal-label-classic': 'weave',
  '12-recel-label-eco': 'grain',
  '13-cay-label-eco': 'grain',
  '14-kulaklik-tuck-modern': 'hexagon',
  '15-kablo-tuck-modern': 'hexagon',
  '16-cihaz-label-minimal': 'none',
  '17-evrensel-kozmetik-tuck': 'grain',
  '18-evrensel-gida-tuck': 'grain',
  '19-evrensel-elektronik-tuck': 'hexagon',
  '20-temizlik-tuck-minimal': 'none',
  '21-krem-eco-monstera': 'grain',
  '22-serum-eco-monstera': 'weave',
  '23-krem-eco-palm': 'grain',
  '24-krem-playful-palm': 'grain',
  '25-krem-playful-wave': 'grain',
  '26-serum-playful-wave': 'capsule',
  '27-krem-modern-zebra': 'lattice',
  '28-serum-modern-zebra': 'stripe',
  '29-sampuan-wrap-modern': 'lattice',
}


function jobOf(slug: string): Job {
  const job = JOBS.find((j) => j.slug === slug)
  if (!job) throw new Error(`missing job ${slug}`)
  return job
}

function planOf(job: Job) {
  return createPlan({
    brief: briefFrom(job),
    style: job.styleType,
    blankCanvas: false,
    variationIndex: 0,
  })
}


describe('Design Brain V1 carrier (passive)', () => {
  beforeEach(() => {
    resetArtMemory()
    clearArtPatternLibraryCache()
    clearArtMotifAtomizerCache()
    clearMotifBankCache()
  })

  afterEach(() => {
    clearArtPatternLibraryCache()
    clearArtMotifAtomizerCache()
    clearMotifBankCache()
  })

  it('A: same input yields the same DesignIntent', () => {
    const job = jobOf('01-parfum-tuck-luxury')
    const a = buildDesignIntent({ style: 'luxury', sector: 'perfume', cue: 'none', surface: 'box' })
    const b = buildDesignIntent({ style: 'luxury', sector: 'perfume', cue: 'none', surface: 'box' })
    expect(a).toEqual(b)
    expect(planOf(job).designIntent).toEqual(a)
  })

  it('B: same input yields the same principles', () => {
    const job = jobOf('02-kolonya-tuck-classic')
    const a = principlesFor('classic', 'box')
    const b = principlesFor('classic', 'box')
    expect(a).toEqual(b)
    expect(planOf(job).principles).toEqual(a)
  })

  it('C: DesignIntentBlock is not CompositionTargets', () => {
    expectTypeOf<DesignIntentBlock>().not.toEqualTypeOf<CompositionTargets>()
    expectTypeOf<CompositionTargets>().not.toEqualTypeOf<DesignIntentBlock>()
  })

  it('D/E: createPlan carries principles and designIntent', () => {
    const plan = planOf(jobOf('08-zeytinyagi-tuck-luxury'))
    expect(plan.principles.length).toBeGreaterThan(0)
    expect(plan.principles).toEqual(principlesFor('luxury', 'box'))
    expect(plan.designIntent.character).toBe('elegant')
    expect(plan.designIntent.positioning).toBe('luxury')
    expect(plan.designIntent.hierarchyPolicy).toBe('brand')
    expect(plan.designIntent.sector).toBe('food')
    expect(plan.designIntent.restrainExtras).toBe(false)
    expect(plan.visualConcept.id).toBe('earthen-premium')
  })

  it('cue luxury-tighten only remaps existing styleRule fields', () => {
    const brief = briefFrom(jobOf('01-parfum-tuck-luxury'))
    const intent = buildDesignIntent({ style: 'luxury', sector: 'perfume', cue: 'luxury-tighten', surface: 'box' })
    expect(intent.character).toBe('restrained')
    expect(intent.density).toBe('sparse')
    expect(intent.negativeSpace).toBe('high')
    expect(intent.metallic).toBe('restrained')
    expect(intent.restrainExtras).toBe(true)
    const plan = createPlan({ brief, style: 'luxury', cue: 'luxury-tighten', blankCanvas: false })
    expect(plan.designIntent).toEqual(intent)
    expect(plan.visualIntent).toBe('restrained')
    expect(plan.visualLanguage).toEqual(['heraldic', 'quiet-line'])
    expect(plan.principles).toEqual(principlesFor('luxury', 'box'))
  })

  it('F/G: 29 catalog fingerprints stay frozen', () => {
    expect(JOBS).toHaveLength(29)
    expect(Object.keys(CATALOG_FREEZE)).toHaveLength(29)
    for (const job of JOBS) {
      resetArtMemory()
      const plan = planOf(job)
      const freeze = CATALOG_FREEZE[job.slug]
      expect(freeze, job.slug).toBeTruthy()
      expect(plan.visualConcept.id, job.slug).toBe(freeze.concept)
      expect(plan.visualLanguage, job.slug).toEqual(CONCEPT_LANG_FREEZE[freeze.concept])
      expect(plan.visualLanguage, job.slug).toEqual(plan.visualConcept.languages)
      expect(languagesFromConcept(plan), job.slug).toEqual(plan.visualConcept.languages)
      expect(languagesOfConcept(plan), job.slug).toEqual(plan.visualLanguage)
      expect(visualLanguageFor(plan.designIntent, plan.sector, plan.subProduct), job.slug).toEqual(plan.visualLanguage)
      expect(visualLanguageFor(plan.designIntent, plan.sector, plan.subProduct), job.slug).toEqual(
        visualConceptFor(plan.style, plan.sector, 'none', plan.subProduct).languages,
      )
      expect(plan.heroGraphic.family, job.slug).toBe(freeze.hero)
      expect(plan.patternSystem.family, job.slug).toBe(PATTERN_FREEZE[job.slug])
      expect(allowedHeroes(plan.style, plan.sector, undefined, plan.visualLanguage), job.slug).toContain(freeze.hero)
      expect(plan.artDirection.chrome, job.slug).toBe(freeze.chrome)
      expect(plan.composition.lockup, job.slug).toBe(freeze.lockup)
      expect(plan.composition.opticalCenter, job.slug).toBe(freeze.opticalCenter)
      expect(plan.visualConcept.decorationBudget, job.slug).toBe(freeze.budget)
      expect(plan.principles, job.slug).toEqual(principlesFor(plan.style, plan.surface))
      expect(plan.designIntent.character, job.slug).toBe(plan.visualIntent)
      expect(plan.designIntent.density, job.slug).toBe(plan.decor.density)
      expect(plan.designIntent.negativeSpace, job.slug).toBe(plan.composition.negativeSpace)
      expect(plan.designIntent.metallic, job.slug).toBe(plan.color.metallic)
      expect(plan.designIntent.restrainExtras, job.slug).toBe(plan.decor.restrainExtras)
      expect(plan.designIntent.hierarchyPolicy, job.slug).toBe('brand')
      const targets = compositionTargets(plan)
      expect(targets.densityTarget, job.slug).toBeCloseTo(freeze.densityTarget, 8)
      expect(targets.whitespaceTarget, job.slug).toBeCloseTo(freeze.whitespaceTarget, 8)
      expect(targets.symmetryTarget, job.slug).toBeCloseTo(freeze.symmetryTarget, 8)
      expect(targets.decorationLevel, job.slug).toBeCloseTo(freeze.decorationLevel, 8)
      expect(targets.focalStrength, job.slug).toBeCloseTo(freeze.focalStrength, 8)
      expect(targets.balanceTarget, job.slug).toBeCloseTo(freeze.balanceTarget, 8)
      expect(targets.compositionBias, job.slug).toBe(freeze.compositionBias)
      expect(targets.framePreference, job.slug).toBeCloseTo(freeze.framePreference, 8)
      expect(targets.ornamentPreference, job.slug).toBeCloseTo(freeze.ornamentPreference, 8)
    }
  })

  it('compositionTargets reads designIntent.negativeSpace without changing the formula', () => {
    const plan = planOf(jobOf('09-cikolata-tray-playful'))
    expect(plan.designIntent.negativeSpace).toBe(plan.composition.negativeSpace)
    const synced = compositionTargets(plan)
    expect(synced.whitespaceTarget).toBeCloseTo(CATALOG_FREEZE['09-cikolata-tray-playful'].whitespaceTarget, 8)
    const high = compositionTargets({
      ...plan,
      designIntent: { ...plan.designIntent, negativeSpace: 'high' },
    })
    expect(high.whitespaceTarget).toBeGreaterThan(synced.whitespaceTarget)
    expect(high.densityTarget).toBe(synced.densityTarget)
    expect(high.decorationLevel).toBe(synced.decorationLevel)
    expect(high.compositionBias).toBe(synced.compositionBias)
  })

  it('visualLanguage carrier is identity of the concept row and overlay reads the carrier', () => {
    const plan = planOf(jobOf('01-parfum-tuck-luxury'))
    expect(plan.visualLanguage).toEqual(['heraldic'])
    expect(plan.visualConcept.languages).toEqual(['heraldic'])
    expect(languagesOfConcept(plan)).toEqual(['heraldic'])
    expect(chromeForConcept(plan.visualConcept, 'full', plan.visualLanguage)).toBe('full')
    expect(chromeForConcept(plan.visualConcept, 'full')).toBe('full')
    expect(shouldPaintSectorFrame(plan.visualConcept, 'luxury', 'perfume', plan.visualLanguage)).toBe(true)

    const desync = { ...plan, visualLanguage: ['quiet-line' as const] }
    expect(languagesOfConcept(desync)).toEqual(['quiet-line'])
    expect(desync.visualConcept.id).toBe('nocturne-crest')
    expect(desync.visualConcept.languages).toEqual(['heraldic'])
    expect(desync.artDirection.chrome).toBe('full')
    expect(chromeForConcept(desync.visualConcept, 'full', desync.visualLanguage)).toBe('quiet')
    expect(chromeForConcept(desync.visualConcept, 'full')).toBe('full')
    expect(shouldPaintSectorFrame(desync.visualConcept, 'luxury', 'perfume', desync.visualLanguage)).toBe(false)
    expect(shouldPaintSectorFrame(desync.visualConcept, 'luxury', 'perfume')).toBe(true)
  })

  it('visualLanguageFor derives from style×sector, then air/restrained only, and CONCEPTS.languages stays a copy', () => {
    const oil = planOf(jobOf('08-zeytinyagi-tuck-luxury'))
    const perfume = planOf(jobOf('01-parfum-tuck-luxury'))
    const modern = planOf(jobOf('14-kulaklik-tuck-modern'))
    expect(visualLanguageFor(oil.designIntent, oil.sector, oil.subProduct)).toEqual(['botanical', 'organic'])
    expect(visualLanguageFor(perfume.designIntent, perfume.sector, perfume.subProduct)).toEqual(['heraldic'])
    expect(visualLanguageFor(modern.designIntent, modern.sector, modern.subProduct)).toEqual(['linear', 'geometric'])
    expect(baseVisualLanguageFor(oil.style, oil.sector, oil.subProduct)).toEqual(oil.visualLanguage)
    const densityOnly = {
      ...oil.designIntent,
      density: 'sparse' as const,
      negativeSpace: 'high' as const,
      metallic: 'off' as const,
      cue: 'open-air' as const,
    }
    expect(visualLanguageFor(densityOnly, oil.sector, oil.subProduct)).toEqual(oil.visualLanguage)
    expect(visualConceptFor('luxury', 'food', 'none', oil.subProduct).languages).toEqual(['botanical', 'organic'])
    expect(oil.visualConcept.languages).toEqual(oil.visualLanguage)
    expect(oil.visualConcept.id).toBe('earthen-premium')
    expect(perfume.visualConcept.id).toBe('nocturne-crest')
  })

  it('VL-5b: air/restrained append quiet-line once; elegant/warm/graphic/high-contrast do not', () => {
    const perfume = planOf(jobOf('01-parfum-tuck-luxury'))
    const oil = planOf(jobOf('08-zeytinyagi-tuck-luxury'))
    const cream = planOf(jobOf('03-krem-tuck-luxury'))
    const paper = planOf(jobOf('04-serum-tuck-minimal'))
    const basePerfume = baseVisualLanguageFor(perfume.style, perfume.sector, perfume.subProduct)
    expect(basePerfume).toEqual(['heraldic'])
    expect(applyCharacterLanguageModifier(basePerfume, 'elegant')).toEqual(['heraldic'])
    expect(applyCharacterLanguageModifier(basePerfume, 'air')).toEqual(['heraldic', 'quiet-line'])
    expect(applyCharacterLanguageModifier(basePerfume, 'restrained')).toEqual(['heraldic', 'quiet-line'])
    expect(applyCharacterLanguageModifier(['heraldic', 'quiet-line'], 'air')).toEqual(['heraldic', 'quiet-line'])
    expect(applyCharacterLanguageModifier(['heraldic', 'quiet-line'], 'restrained')).toEqual(['heraldic', 'quiet-line'])
    expect(visualLanguageFor({ ...perfume.designIntent, character: 'air' }, perfume.sector)).toEqual([
      'heraldic',
      'quiet-line',
    ])
    expect(visualLanguageFor({ ...perfume.designIntent, character: 'restrained' }, perfume.sector)).toEqual([
      'heraldic',
      'quiet-line',
    ])
    expect(visualLanguageFor({ ...oil.designIntent, character: 'air' }, oil.sector, oil.subProduct)).toEqual([
      'botanical',
      'organic',
      'quiet-line',
    ])
    expect(visualLanguageFor({ ...cream.designIntent, character: 'air' }, cream.sector, cream.subProduct)).toEqual([
      'oval',
      'quiet-line',
    ])
    expect(paper.visualLanguage).toEqual(['quiet-line'])
    expect(visualLanguageFor({ ...paper.designIntent, character: 'air' }, paper.sector, paper.subProduct)).toEqual([
      'quiet-line',
    ])
    for (const character of ['elegant', 'warm', 'graphic', 'high-contrast'] as const) {
      expect(visualLanguageFor({ ...perfume.designIntent, character }, perfume.sector), character).toEqual(['heraldic'])
      expect(visualLanguageFor({ ...oil.designIntent, character }, oil.sector, oil.subProduct), character).toEqual([
        'botanical',
        'organic',
      ])
    }
  })

  it('VL-5b: cue/density/negativeSpace are not language modifiers; character is the only quiet-line authority', () => {
    const perfume = planOf(jobOf('01-parfum-tuck-luxury'))
    const openAir = buildDesignIntent({ style: 'luxury', sector: 'perfume', cue: 'open-air', surface: 'box' })
    expect(openAir.character).toBe('elegant')
    expect(openAir.negativeSpace).toBe('high')
    expect(openAir.density).toBe('sparse')
    expect(visualLanguageFor(openAir, 'perfume')).toEqual(['heraldic'])
    const tighten = buildDesignIntent({ style: 'luxury', sector: 'perfume', cue: 'luxury-tighten', surface: 'box' })
    expect(tighten.character).toBe('restrained')
    expect(visualLanguageFor(tighten, 'perfume')).toEqual(['heraldic', 'quiet-line'])
    const cueWithoutCharacter = { ...tighten, character: 'elegant' as const }
    expect(visualLanguageFor(cueWithoutCharacter, 'perfume')).toEqual(['heraldic'])
    for (const density of ['sparse', 'balanced', 'dense'] as const) {
      expect(visualLanguageFor({ ...perfume.designIntent, density }, perfume.sector), density).toEqual(['heraldic'])
    }
    for (const negativeSpace of ['high', 'med', 'low'] as const) {
      expect(visualLanguageFor({ ...perfume.designIntent, negativeSpace }, perfume.sector), negativeSpace).toEqual([
        'heraldic',
      ])
    }
  })

  it('VL-5b: food luxury does not jump to a perfume language', () => {
    const oil = planOf(jobOf('08-zeytinyagi-tuck-luxury'))
    const perfume = planOf(jobOf('01-parfum-tuck-luxury'))
    expect(visualLanguageFor(oil.designIntent, oil.sector, oil.subProduct)).toEqual(['botanical', 'organic'])
    expect(visualLanguageFor(oil.designIntent, oil.sector, oil.subProduct)).not.toEqual(perfume.visualLanguage)
    expect(visualLanguageFor(perfume.designIntent, 'food', oil.subProduct)).toEqual(['botanical', 'organic'])
    expect(visualLanguageFor(oil.designIntent, 'perfume')).toEqual(['heraldic'])
    expect(visualLanguageFor({ ...oil.designIntent, character: 'air' }, oil.sector, oil.subProduct)).toEqual([
      'botanical',
      'organic',
      'quiet-line',
    ])
    expect(visualLanguageFor({ ...oil.designIntent, character: 'air' }, oil.sector, oil.subProduct)).not.toContain(
      'heraldic',
    )
  })

  it('visualConceptFor language allow-list is a no-op on set-0 keys', () => {
    const oil = planOf(jobOf('08-zeytinyagi-tuck-luxury'))
    const perfume = planOf(jobOf('01-parfum-tuck-luxury'))
    const cologne = planOf(jobOf('02-kolonya-tuck-classic'))
    const withIntent = visualConceptFor('luxury', 'food', 'harvest', 'zeytinyağı', oil.designIntent)
    const without = visualConceptFor('luxury', 'food', 'harvest', 'zeytinyağı')
    expect(withIntent.id).toBe(without.id)
    expect(withIntent.id).toBe('earthen-premium')
    expect(visualConceptFor('luxury', 'perfume', 'crest', undefined, perfume.designIntent).id).toBe('nocturne-crest')
    expect(visualConceptFor('classic', 'perfume', 'crest', undefined, cologne.designIntent).id).toBe('heraldic-crest')
    expect(oil.visualConcept.id).toBe('earthen-premium')
    expect(perfume.visualConcept.id).toBe('nocturne-crest')
    expect(cologne.visualConcept.id).toBe('heraldic-crest')
  })

  it('visualConceptFor reties only inside the language allow-list', () => {
    const perfume = planOf(jobOf('01-parfum-tuck-luxury'))
    const oil = planOf(jobOf('08-zeytinyagi-tuck-luxury'))
    expect(visualConceptFor('minimal', 'perfume', 'none').id).toBe('air-paper')
    const repaired = visualConceptFor('minimal', 'perfume', 'none', undefined, perfume.designIntent)
    expect(repaired.id).toBe('nocturne-crest')
    expect(repaired.languages).toEqual(['heraldic'])
    expect(visualConceptFor('luxury', 'perfume', 'crest', undefined, perfume.designIntent).id).toBe('nocturne-crest')
    const stayHeraldic = visualConceptFor('luxury', 'perfume', 'crest', undefined, oil.designIntent)
    expect(stayHeraldic.id).toBe('nocturne-crest')
    expect(stayHeraldic.languages).toEqual(['heraldic'])
  })

  it('allowedHeroes intersects visual language without changing set-0 heroes', () => {
    expect(allowedHeroes('luxury', 'perfume')).toContain('crest')
    expect(allowedHeroes('luxury', 'perfume', undefined, ['heraldic'])).toContain('crest')
    expect(allowedHeroes('luxury', 'perfume', undefined, ['linear'])).toContain('crest')
    expect(allowedHeroes('eco', 'electronics')).toContain('tech')
    expect(allowedHeroes('eco', 'electronics', undefined, ['quiet-line'])).toEqual(['none'])
    expect(allowedHeroes('eco', 'electronics', undefined, ['linear', 'geometric'])).toContain('tech')
    const perfume = planOf(jobOf('01-parfum-tuck-luxury'))
    expect(allowedHeroes(perfume.style, perfume.sector, undefined, perfume.visualLanguage)).toContain('crest')
    expect(perfume.heroGraphic.family).toBe('crest')
  })

  it('allowedPatterns intersects visual language without changing set-0 patterns', () => {
    const unfiltered = allowedPatterns('luxury', undefined, 'perfume')
    expect(allowedPatterns('luxury', undefined, 'perfume', ['heraldic'])).toEqual(unfiltered)
    expect(allowedPatterns('luxury', undefined, 'perfume', ['linear'])).toEqual(unfiltered)
    const ecoFood = allowedPatterns('eco', undefined, 'food')
    expect(ecoFood).toEqual(['grain', 'ornament', 'weave'])
    expect(allowedPatterns('eco', undefined, 'food', ['quiet-line'])).toEqual(['grain'])
    expect(allowedPatterns('eco', undefined, 'food', ['botanical', 'organic'])).toEqual(ecoFood)
    for (const job of JOBS) {
      const plan = planOf(job)
      expect(plan.patternSystem.family, job.slug).toBe(PATTERN_FREEZE[job.slug])
    }
  })

  it('AD-3: resolve first-pass lockup/goldBar follows intent; applyPlan still wins box lockup', () => {
    for (const job of JOBS) {
      resetArtMemory()
      const brief = briefFrom(job)
      const plan = planOf(job)
      const intent = buildDesignIntent({
        style: plan.style,
        sector: plan.sector,
        cue: 'none',
        surface: plan.surface,
      })
      const resolvedConcept = visualConceptFor(plan.style, plan.sector, 'none', plan.subProduct, intent)
      expect(resolvedConcept.id, job.slug).toBe(plan.visualConcept.id)
      const system = resolveDesignSystem(brief, undefined, { blankCanvas: false })
      const applied = applyPlanToSystem(system, plan)
      expect(applied.lockup, job.slug).toBe(system.lockup)
      expect(applied.goldBar, job.slug).toBe(goldBarForConcept(plan.visualConcept, system.goldBar))
      if (system.grammar !== 'label') {
        expect(system.lockup, job.slug).toBe(lockupForConcept(plan.visualConcept, system.lockup))
        expect(applied.lockup, job.slug).toBe(lockupForConcept(plan.visualConcept, 'air-rule'))
      }
    }
    const perfume = planOf(jobOf('01-parfum-tuck-luxury'))
    const brief = briefFrom(jobOf('01-parfum-tuck-luxury'))
    const wrecked = {
      ...resolveDesignSystem(brief, undefined, { blankCanvas: false }),
      lockup: 'air-rule' as const,
    }
    expect(applyPlanToSystem(wrecked, perfume).lockup).toBe('centered-crest')
    const oilBrief = briefFrom(jobOf('08-zeytinyagi-tuck-luxury'))
    expect(resolveDesignSystem(oilBrief, undefined, { blankCanvas: false }).lockup).toBe('harvest-seal')
    expect(resolveDesignSystem(brief, undefined, { blankCanvas: false }).lockup).toBe('centered-crest')
  })

  it('CS-1: overlay strategies read the language carrier; kit overlay skip stays style-only', () => {
    expect(kitGradeSkipsOverlay('luxury')).toBe(true)
    expect(kitGradeSkipsOverlay('modern')).toBe(true)
    expect(kitGradeSkipsOverlay('minimal')).toBe(true)
    expect(kitGradeSkipsOverlay('classic')).toBe(true)
    expect(kitGradeSkipsOverlay('eco')).toBe(true)
    expect(kitGradeSkipsOverlay('playful')).toBe(false)
    const playful = planOf(jobOf('09-cikolata-tray-playful'))
    expect(allowedStrategies(playful)).toContain('balanced-corners')
    const linearCarrier = { ...playful, visualLanguage: ['linear' as const] }
    expect(languagesOfConcept(linearCarrier)).toEqual(['linear'])
    expect(allowedStrategies(linearCarrier)).not.toContain('balanced-corners')
    expect(kitGradeSkipsOverlay(playful.style)).toBe(false)
    expect(kitGradeSkipsOverlay(planOf(jobOf('01-parfum-tuck-luxury')).style)).toBe(true)
  })

  it('AD-4: chrome/frame/grid already follow plan.visualLanguage', () => {
    const perfume = planOf(jobOf('01-parfum-tuck-luxury'))
    const modern = planOf(jobOf('06-krem-wrap-modern'))
    expect(chromeForConcept(perfume.visualConcept, 'full', perfume.visualLanguage)).toBe('full')
    expect(shouldPaintSectorFrame(perfume.visualConcept, 'luxury', 'perfume', perfume.visualLanguage)).toBe(true)
    expect(chromeForConcept(perfume.visualConcept, 'full', ['quiet-line'])).toBe('quiet')
    expect(shouldPaintSectorFrame(perfume.visualConcept, 'luxury', 'perfume', ['quiet-line'])).toBe(false)
    expect(shouldPaintModernGrid(modern.visualConcept, 'modern', modern.visualLanguage)).toBe(true)
    expect(shouldPaintModernGrid(modern.visualConcept, 'modern', ['quiet-line'])).toBe(false)
  })

  it('language treatment drives painter knobs; catalog targets stay frozen', () => {
    expect(languageTreatmentFor(['heraldic'])).toMatchObject({
      chrome: 'full',
      airBias: false,
      blockCorners: false,
      motifScale: 'regular',
      ornament: 'full',
      frame: 'full',
    })
    expect(languageTreatmentFor(['heraldic', 'quiet-line'])).toMatchObject({
      chrome: 'quiet',
      airBias: true,
      blockCorners: false,
      motifScale: 'regular',
      lineWeight: 'regular',
    })
    expect(languageTreatmentFor(['quiet-line'])).toMatchObject({
      chrome: 'quiet',
      airBias: true,
      lineWeight: 'hair',
      motifScale: 'small',
      ornament: 'none',
    })
    expect(languageTreatmentFor(['linear', 'geometric'])).toMatchObject({
      blockCorners: true,
      mayGrowFill: true,
      motifScale: 'bold',
      lineScale: 1,
      chrome: 'full',
    })
    expect(strokeWidthForLanguage(0.16, ['linear'])).toBe(0.16)
    expect(strokeWidthForLanguage(0.16, ['linear', 'geometric'])).toBe(0.16)
    expect(preferredRolesForLanguages(['oval', 'quiet-line'])).toEqual(['stamp', 'accent', 'corner', 'frame'])
    expect(preferredRolesForLanguages(['organic', 'geometric'])).toEqual(['stamp', 'ornament', 'accent'])
    expect(preferredRolesForLanguages(['heraldic'])).toEqual(preferredRolesForLanguages(['heraldic', 'art-deco']).slice(0, 3))
    const perfume = planOf(jobOf('01-parfum-tuck-luxury'))
    const cream = planOf(jobOf('03-krem-tuck-luxury'))
    const oil = planOf(jobOf('08-zeytinyagi-tuck-luxury'))
    expect(languageTreatmentFor(perfume.visualLanguage).chrome).toBe('full')
    expect(languageTreatmentFor(cream.visualLanguage).chrome).toBe('quiet')
    expect(languageTreatmentFor(oil.visualLanguage).airBias).toBe(false)
    expect(compositionTargets(perfume).whitespaceTarget).toBeCloseTo(CATALOG_FREEZE['01-parfum-tuck-luxury'].whitespaceTarget, 8)
    expect(compositionTargets(cream).whitespaceTarget).toBeCloseTo(CATALOG_FREEZE['03-krem-tuck-luxury'].whitespaceTarget, 8)
    expect(kitGradeSkipsOverlay(perfume.style)).toBe(true)
    expect(kitGradeSkipsOverlay(planOf(jobOf('09-cikolata-tray-playful')).style)).toBe(false)
  })

  it('asset language compiles AD + dialect + lexicon; composition reads it', () => {
    for (const job of JOBS) {
      resetArtMemory()
      const plan = planOf(job)
      const assets = assetLanguageFor(plan)
      expect(assets.languages, job.slug).toEqual(plan.visualLanguage)
      expect(assets.family, job.slug).toBe(plan.visualConcept.family)
      expect(assets.supportFamily, job.slug).toBe(plan.visualConcept.supportFamily)
      expect(assets.lexicon, job.slug).toEqual(plan.visualConcept.motifLexicon ?? [])
      expect(assets.avoid, job.slug).toEqual(plan.visualConcept.avoid ?? [])
      expect(assets.roles, job.slug).toEqual(preferredRolesForLanguages(plan.visualLanguage))
      expect(assets.heroFamily, job.slug).toBe(plan.heroGraphic.family)
      expect(assets.patternFamily, job.slug).toBe(plan.patternSystem.family)
      expect(assets.chrome, job.slug).toBe(plan.artDirection.chrome)
      expect(assets.preferred.roles, job.slug).toEqual(assets.roles)
      expect(assets.preferred.lexicon, job.slug).toEqual(assets.lexicon)
      expect(assets.allowed.languages, job.slug).toEqual(assets.languages)
      expect(assets.forbidden.avoid, job.slug).toEqual(assets.avoid)
      expect(allowedStrategies(plan).some((s) => (assets.forbidden.strategies as string[]).includes(s)), job.slug).toBe(false)
      const targets = compositionTargets(plan)
      expect(targets.languages, job.slug).toEqual(assets.languages)
      expect(targets.avoid, job.slug).toEqual(assets.avoid)
      expect(targets.motifLexicon, job.slug).toEqual(assets.lexicon)
      expect(targets.preferredMotifRoles, job.slug).toEqual(assets.roles)
      expect(targets.densityTarget, job.slug).toBeCloseTo(CATALOG_FREEZE[job.slug].densityTarget, 8)
      expect(targets.whitespaceTarget, job.slug).toBeCloseTo(CATALOG_FREEZE[job.slug].whitespaceTarget, 8)
    }
    const perfume = planOf(jobOf('01-parfum-tuck-luxury'))
    const desync = { ...perfume, visualLanguage: ['quiet-line' as const] }
    expect(assetLanguageFor(desync).languages).toEqual(['quiet-line'])
    expect(assetLanguageFor(desync).family).toBe(perfume.visualConcept.family)
    expect(assetLanguageFor(desync).heroFamily).toBe(perfume.heroGraphic.family)
    expect(assetLanguageFor(desync).roles).toEqual(preferredRolesForLanguages(['quiet-line']))
    expect(kitGradeSkipsOverlay(perfume.style)).toBe(true)
    expect(kitGradeSkipsOverlay(planOf(jobOf('09-cikolata-tray-playful')).style)).toBe(false)
  })


  it('principles are the existing 8 ids only', () => {
    const allowed: PrincipleId[] = [
      'hierarchy-brand-first',
      'negative-space-is-luxury',
      'lockup-is-sacred',
      'one-motif-family',
      'sector-blind-front',
      'marks-not-on-hero',
      'metallic-restraint',
      'legal-belongs-back',
    ]
    for (const job of JOBS) {
      for (const id of planOf(job).principles) {
        expect(allowed).toContain(id)
      }
    }
  })
})
