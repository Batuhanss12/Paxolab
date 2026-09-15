/**
 * Asset language — Art Direction × Visual Language compiled into
 * preferred / allowed / forbidden for composition. Does not paint SVG.
 */
import type {
  ArtDirectionBlock,
  ConceptLanguageId,
  HeroFamily,
  HeroGraphicBlock,
  MotifFamilyId,
  PatternBlock,
  PatternFamily,
  VisualConceptBlock,
} from '../brain/DesignPlan'
import { allowedFamiliesForConcept } from './assetCatalog/familyMatrix'
import { atomHasFamilyFile } from './assetCatalog/catalog'
import { selectFamilyPool } from './artMotifFamily'
import { resolvedMotifRole, type MotifMetaHost, type MotifRole } from './artMotifMeta'
import { languageTreatmentFor } from './languageTreatment'
import {
  atomAvoided,
  atomLexiconHit,
  atomMatchesAnyLanguage,
  conceptFidelityOf,
  earliestUnusedLexiconIndex,
  languagesOfConcept,
  lexiconOf,
  avoidOf,
  preferredRolesForLanguages,
  unusedLexiconHits,
  type VisualLanguage,
} from './visualLanguage'

export type AssetLanguage = {
  conceptId: string
  languages: VisualLanguage[]
  family?: MotifFamilyId
  supportFamily?: MotifFamilyId
  lexicon: string[]
  avoid: string[]
  roles: MotifRole[]
  heroFamily: HeroFamily
  patternFamily: PatternFamily
  chrome: 'full' | 'quiet'
  preferred: { roles: MotifRole[]; lexicon: string[] }
  allowed: { families: MotifFamilyId[]; languages: VisualLanguage[] }
  forbidden: { avoid: string[]; strategies: AssetBlockedStrategy[] }
}

export type AssetBlockedStrategy = 'framed-content' | 'balanced-corners' | 'pattern-field'

export type AssetLanguageHost = {
  visualConcept: VisualConceptBlock
  visualLanguage?: ConceptLanguageId[] | VisualLanguage[] | string[]
  heroGraphic?: Pick<HeroGraphicBlock, 'family'>
  patternSystem?: Pick<PatternBlock, 'family'>
  artDirection?: Pick<ArtDirectionBlock, 'chrome'>
}

export type AssetPickPolicy = Pick<AssetLanguage, 'languages' | 'lexicon' | 'avoid' | 'roles'>

type AtomHost = MotifMetaHost & { id?: string; sheetId?: string }

/** Avoid tokens → blocked overlay strategies. Same rules as allowedStrategies. */
export function forbiddenStrategiesFor(
  avoid: readonly string[],
  langs: readonly string[],
): AssetBlockedStrategy[] {
  const blocked: AssetBlockedStrategy[] = []
  if (avoid.includes('heavy-frame')) blocked.push('framed-content')
  if (avoid.includes('dense-pattern')) blocked.push('pattern-field')
  if (avoid.includes('generic-corners') || avoid.includes('sharp-corner') || languageTreatmentFor(langs).blockCorners) {
    blocked.push('balanced-corners')
  }
  return blocked
}

/** Compile AD + dialect + concept lexicon into a decision policy. */
export function assetLanguageFor(plan: AssetLanguageHost): AssetLanguage {
  const languages = languagesOfConcept(plan)
  const lexicon = lexiconOf(plan)
  const avoid = avoidOf(plan)
  const roles = preferredRolesForLanguages(languages)
  const family = plan.visualConcept.family
  const supportFamily = plan.visualConcept.supportFamily
  const conceptId = plan.visualConcept.id
  return {
    conceptId,
    languages,
    family,
    supportFamily,
    lexicon,
    avoid,
    roles,
    heroFamily: plan.heroGraphic?.family ?? 'none',
    patternFamily: plan.patternSystem?.family ?? 'none',
    chrome: plan.artDirection?.chrome ?? 'full',
    preferred: { roles, lexicon },
    allowed: {
      families: family ? allowedFamiliesForConcept(conceptId, family, supportFamily) : [],
      languages,
    },
    forbidden: {
      avoid,
      strategies: forbiddenStrategiesFor(avoid, languages),
    },
  }
}

export function atomForbidden(atom: AtomHost, assets: AssetPickPolicy): boolean {
  return atomAvoided(atom, assets.avoid)
}

export function atomLanguageAllowed(atom: AtomHost, assets: AssetPickPolicy): boolean {
  if (!assets.languages.length) return true
  return atomMatchesAnyLanguage(atom, assets.languages)
}

export function atomPreferredLexicon(atom: AtomHost, assets: AssetPickPolicy): boolean {
  return atomLexiconHit(atom, assets.lexicon)
}

/**
 * Family hard → forbidden drop (empty fallback) → language allow (empty fallback).
 * Family miss stays empty (typography-only).
 */
export function constrainAssetPool<T extends MotifMetaHost>(atoms: T[], assets: AssetLanguage): T[] {
  const family = selectFamilyPool(atoms, assets.family, assets.supportFamily, assets.conceptId).atoms
  const droppedAvoid = family.filter((atom) => !atomForbidden(atom, assets))
  const afterAvoid = droppedAvoid.length ? droppedAvoid : family
  const lang = afterAvoid.filter((atom) => atomLanguageAllowed(atom, assets))
  return lang.length ? lang : afterAvoid
}

/** quiet-line ornament none → one custom slot. Catalog playful is restrained (5). */
export function customSlotCap(assets: AssetLanguage): number {
  return languageTreatmentFor(assets.languages).ornament === 'none' ? 1 : 5
}

export function compareAssetPick<T extends AtomHost>(
  a: T,
  b: T,
  assets: AssetPickPolicy,
  usedTokens: Iterable<string>,
): number {
  const va = atomForbidden(a, assets) ? 1 : 0
  const vb = atomForbidden(b, assets) ? 1 : 0
  if (va !== vb) return va - vb
  const novA = unusedLexiconHits(a, assets.lexicon, usedTokens).length
  const novB = unusedLexiconHits(b, assets.lexicon, usedTokens).length
  const fa = atomHasFamilyFile(a) ? 1 : 0
  const fb = atomHasFamilyFile(b) ? 1 : 0
  if (fa !== fb && (novA > 0 || novB > 0)) return fb - fa
  if (novA !== novB) return novB - novA
  const ia = earliestUnusedLexiconIndex(a, assets.lexicon, usedTokens)
  const ib = earliestUnusedLexiconIndex(b, assets.lexicon, usedTokens)
  if (ia !== ib) return ia - ib
  const ha = atomLanguageAllowed(a, assets) ? 1 : 0
  const hb = atomLanguageAllowed(b, assets) ? 1 : 0
  if (ha !== hb) return hb - ha
  if (assets.roles.length) {
    const ra = assets.roles.includes(resolvedMotifRole(a)) ? 1 : 0
    const rb = assets.roles.includes(resolvedMotifRole(b)) ? 1 : 0
    if (ra !== rb) return rb - ra
  }
  return 0
}

function slotHitsPreferredRole(
  slot: { atom: AtomHost; role?: MotifRole },
  preferred: readonly MotifRole[],
): boolean {
  if (slot.role && preferred.includes(slot.role)) return true
  return preferred.includes(resolvedMotifRole(slot.atom))
}

/** 0–100. Empty preferred roles stay neutral (50). Distinct from language/lexicon fit. */
export function roleFitOf(
  slots: { atom: AtomHost; role?: MotifRole }[],
  preferred: readonly MotifRole[],
): number {
  if (!preferred.length) return 50
  if (!slots.length) return 50
  const hits = slots.filter((slot) => slotHitsPreferredRole(slot, preferred)).length
  return Math.round((hits / slots.length) * 100)
}

/** 0–100. Empty roles stay neutral (50). */
export function atomAssetFit(atom: AtomHost, assets: AssetLanguage, role?: MotifRole): number {
  let score = 50
  if (assets.languages.length) score += atomLanguageAllowed(atom, assets) ? 24 : -18
  if (assets.lexicon.length) score += atomPreferredLexicon(atom, assets) ? 18 : -8
  if (assets.roles.length) {
    score += slotHitsPreferredRole({ atom, role }, assets.roles) ? 20 : -16
  }
  if (score < 0) return 0
  if (score > 100) return 100
  return score
}

export function assetCompatibilityOf(
  slots: { atom: AtomHost; role?: MotifRole }[],
  assets: AssetLanguage,
  preferredRoles: readonly MotifRole[] = assets.roles,
): number {
  if (!slots.length) return 50
  const langLex = { ...assets, roles: [] as MotifRole[] }
  const alFit = slots.reduce((n, slot) => n + atomAssetFit(slot.atom, langLex, slot.role), 0) / slots.length
  if (!preferredRoles.length) return Math.round(alFit)
  return Math.round(alFit * 0.7 + roleFitOf(slots, preferredRoles) * 0.3)
}

export function conceptFidelityForAssets(
  slots: Parameters<typeof conceptFidelityOf>[0],
  assets: AssetLanguage,
  kitLexiconUsed: string[] = [],
): number {
  return conceptFidelityOf(
    slots,
    {
      visualConcept: {
        id: assets.conceptId,
        tags: [],
        family: assets.family,
        languages: assets.languages,
        avoid: assets.avoid,
        motifLexicon: assets.lexicon,
      },
      visualLanguage: assets.languages,
    },
    kitLexiconUsed,
  )
}
