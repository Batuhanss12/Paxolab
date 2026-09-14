/**
 * Motif visual families — catalog first, then filename heuristics.
 * Compatible fallback is explicit matrix only. Never invent a family to fill a hole.
 */
import type { MotifFamilyId } from '../brain/DesignPlan'
import type { DesignPlan } from '../brain/DesignPlan'
import { resolveMotifDesign, type MotifMetaHost } from './artMotifMeta'
import { lookupAssetRecordForAtom } from './assetCatalog/catalog'
import {
  allowedFamiliesForConcept,
  canonicalizeFamily,
  familiesCompatible as matrixCompatible,
  familyMatchLevel,
  type FamilyMatchLevel,
} from './assetCatalog/familyMatrix'

export { familiesCompatible } from './assetCatalog/familyMatrix'
export type { FamilyMatchLevel }

function heuristicFamily(atom: MotifMetaHost): MotifFamilyId {
  const meta = resolveMotifDesign(atom)
  const blob = `${atom.sourceName} ${(atom as { sheetId?: string }).sheetId ?? ''} ${atom.tags.join(' ')} ${(meta.styleTags ?? []).join(' ')}`.toLowerCase()
  if (/islamic/.test(blob)) return 'ornate-stamp'
  if (/leaf|botanic|olive|palm|organic|flower|stem|monstera/.test(blob) && !/artdeco|art-deco/.test(blob)) return 'botanical'
  if (/harvest|wreath|grain|wheat|press/.test(blob)) return 'harvest'
  if (/artdeco|art[-_]?deco|geometric/.test(blob)) return 'geometric-deco'
  if (/crest|herald|seal|cartouche|badge/.test(blob)) return 'heraldic'
  if (/tech|grid|circuit|lattice|index/.test(blob)) return 'linear-tech'
  if (/frame|border|rule|mineral/.test(blob)) return 'mineral-frame'
  if (/stamp|ornament|vintage/.test(blob)) return 'ornate-stamp'
  if (/minimal|line|quiet|paper/.test(blob)) return 'quiet-line'
  if ((meta.styleTags ?? []).some((t) => t === 'eco' || t === 'botanic')) return 'botanical'
  if ((meta.styleTags ?? []).some((t) => t === 'artdeco' || t === 'art_deco')) return 'geometric-deco'
  return 'ornate-stamp'
}

export function motifFamilyOf(atom: MotifMetaHost): MotifFamilyId {
  const explicit = canonicalizeFamily(atom.design?.family)
  if (explicit) return explicit
  const rec = lookupAssetRecordForAtom(
    (atom as { sheetId?: string }).sheetId ?? '',
    (atom as { id?: string }).id,
    atom.sourceName,
  )
  if (rec?.family) return rec.family
  return heuristicFamily(atom)
}

export function motifSubfamilyOf(atom: MotifMetaHost): string | undefined {
  if (atom.design?.subfamily) return atom.design.subfamily
  const rec = lookupAssetRecordForAtom(
    (atom as { sheetId?: string }).sheetId ?? '',
    (atom as { id?: string }).id,
    atom.sourceName,
  )
  return rec?.subfamily
}

export function atomFitsConceptFamily(
  atom: MotifMetaHost,
  family?: MotifFamilyId,
  support?: MotifFamilyId,
): boolean {
  if (!family) return true
  const got = motifFamilyOf(atom)
  return familyMatchLevel(got, family, support) !== 'NONE'
}

export function atomAllowedForPlan(atom: MotifMetaHost, plan: Pick<DesignPlan, 'visualConcept'>): boolean {
  const wanted = plan.visualConcept.family
  if (!wanted) return true
  const allowed = allowedFamiliesForConcept(plan.visualConcept.id, wanted, plan.visualConcept.supportFamily)
  return allowed.includes(motifFamilyOf(atom))
}

export function matchLevelForAtom(
  atom: MotifMetaHost,
  family?: MotifFamilyId,
  support?: MotifFamilyId,
): FamilyMatchLevel {
  return familyMatchLevel(motifFamilyOf(atom), family, support)
}

export type FamilyPoolPick<T extends MotifMetaHost> = {
  atoms: T[]
  level: FamilyMatchLevel
  fallbackMode: 'none' | 'compatible-family' | 'typography-only'
}

/** Level 1 exact → Level 2 compatible → Level 3 empty. Never returns a foreign family. */
export function selectFamilyPool<T extends MotifMetaHost>(
  atoms: T[],
  family?: MotifFamilyId,
  support?: MotifFamilyId,
  conceptId?: string,
): FamilyPoolPick<T> {
  if (!family) return { atoms, level: 'NONE', fallbackMode: 'none' }
  const allowed = new Set(allowedFamiliesForConcept(conceptId, family, support))
  const scoped = atoms.filter((a) => allowed.has(motifFamilyOf(a)))
  const exact = scoped.filter((a) => motifFamilyOf(a) === family)
  if (exact.length) return { atoms: exact, level: 'EXACT', fallbackMode: 'none' }
  if (scoped.length) return { atoms: scoped, level: 'COMPATIBLE', fallbackMode: 'compatible-family' }
  return { atoms: [], level: 'NONE', fallbackMode: 'typography-only' }
}

export { matrixCompatible }
