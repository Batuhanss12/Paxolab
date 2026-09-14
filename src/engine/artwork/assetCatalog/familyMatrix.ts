/**
 * Config: family aliases, compatibility, concept → allowed families.
 * Not a painter. Hard constraints read this table; scoring does not invent rows.
 */
import type { MotifFamilyId } from '../../brain/DesignPlan'

export const FAMILY_ALIASES: Record<string, MotifFamilyId> = {
  botanical: 'botanical',
  'botanical-premium': 'botanical',
  'botanical-editorial': 'botanical',
  organic: 'botanical',
  'soft-organic': 'botanical',
  'minimal-organic': 'quiet-line',
  natural: 'harvest',
  harvest: 'harvest',
  'geometric-deco': 'geometric-deco',
  geometric: 'geometric-deco',
  'geometric-heavy': 'geometric-deco',
  heraldic: 'heraldic',
  ornamental: 'heraldic',
  crest: 'heraldic',
  'linear-tech': 'linear-tech',
  technical: 'linear-tech',
  tech: 'linear-tech',
  grid: 'linear-tech',
  glyph: 'linear-tech',
  'mineral-frame': 'mineral-frame',
  'quiet-line': 'quiet-line',
  minimal: 'quiet-line',
  abstract: 'quiet-line',
  'ornate-stamp': 'ornate-stamp',
  islamic: 'ornate-stamp',
  'islamic-ornate': 'ornate-stamp',
  vintage: 'ornate-stamp',
}

/** Wanted family → allowed partner families (includes self). */
export const FAMILY_COMPAT: Record<MotifFamilyId, MotifFamilyId[]> = {
  botanical: ['botanical', 'harvest', 'quiet-line'],
  harvest: ['harvest', 'botanical'],
  'geometric-deco': ['geometric-deco', 'heraldic', 'mineral-frame'],
  heraldic: ['heraldic', 'geometric-deco', 'mineral-frame'],
  'linear-tech': ['linear-tech', 'quiet-line', 'mineral-frame'],
  'mineral-frame': ['mineral-frame', 'geometric-deco', 'quiet-line', 'heraldic'],
  'quiet-line': ['quiet-line', 'botanical', 'linear-tech', 'mineral-frame'],
  'ornate-stamp': ['ornate-stamp', 'heraldic'],
}

export type ConceptFamilyRule = {
  primary: MotifFamilyId
  allowed: MotifFamilyId[]
}

export const CONCEPT_FAMILY_RULES: Record<string, ConceptFamilyRule> = {
  'earthen-premium': { primary: 'botanical', allowed: ['botanical', 'harvest', 'quiet-line'] },
  'grove-press': { primary: 'harvest', allowed: ['harvest', 'botanical'] },
  'grove-kraft': { primary: 'botanical', allowed: ['botanical', 'harvest', 'quiet-line'] },
  'nocturne-crest': { primary: 'heraldic', allowed: ['heraldic', 'geometric-deco', 'mineral-frame'] },
  'heraldic-crest': { primary: 'heraldic', allowed: ['heraldic', 'mineral-frame'] },
  'heraldic-cartouche': { primary: 'heraldic', allowed: ['heraldic', 'mineral-frame'] },
  'botanical-night': { primary: 'botanical', allowed: ['botanical', 'quiet-line'] },
  'soft-oval': { primary: 'quiet-line', allowed: ['quiet-line', 'heraldic'] },
  'drop-concentrate': { primary: 'quiet-line', allowed: ['quiet-line', 'linear-tech'] },
  'harvest-press': { primary: 'harvest', allowed: ['harvest', 'botanical'] },
  'harvest-kraft': { primary: 'harvest', allowed: ['harvest', 'botanical'] },
  'signal-plaque': { primary: 'linear-tech', allowed: ['linear-tech', 'quiet-line'] },
  'tech-glyph': { primary: 'linear-tech', allowed: ['linear-tech', 'quiet-line', 'mineral-frame'] },
  'kraft-botanical': { primary: 'botanical', allowed: ['botanical', 'harvest', 'quiet-line'] },
  'capsule-field': { primary: 'ornate-stamp', allowed: ['ornate-stamp', 'harvest'] },
  'index-stripe': { primary: 'linear-tech', allowed: ['linear-tech', 'quiet-line'] },
  'air-paper': { primary: 'quiet-line', allowed: ['quiet-line', 'botanical'] },
  'restrained-foil': { primary: 'geometric-deco', allowed: ['geometric-deco', 'heraldic'] },
}

export function canonicalizeFamily(raw?: string): MotifFamilyId | undefined {
  if (!raw) return undefined
  const key = raw.trim().toLowerCase()
  return FAMILY_ALIASES[key] ?? (FAMILY_COMPAT[key as MotifFamilyId] ? (key as MotifFamilyId) : undefined)
}

export function familiesCompatible(a: MotifFamilyId, b: MotifFamilyId): boolean {
  return FAMILY_COMPAT[a]?.includes(b) ?? a === b
}

export function allowedFamiliesForConcept(
  conceptId: string | undefined,
  family?: MotifFamilyId,
  support?: MotifFamilyId,
): MotifFamilyId[] {
  const rule = conceptId ? CONCEPT_FAMILY_RULES[conceptId] : undefined
  const set = new Set<MotifFamilyId>()
  if (rule) for (const f of rule.allowed) set.add(f)
  if (family) {
    set.add(family)
    for (const f of FAMILY_COMPAT[family] ?? []) set.add(f)
  }
  if (support) set.add(support)
  if (family && rule) {
    return [...set].filter((f) => rule.allowed.includes(f) || f === family || f === support)
  }
  return [...set]
}

export type FamilyMatchLevel = 'EXACT' | 'COMPATIBLE' | 'NONE'

export function familyMatchLevel(
  got: MotifFamilyId | undefined,
  wanted?: MotifFamilyId,
  support?: MotifFamilyId,
): FamilyMatchLevel {
  if (!wanted) return 'NONE'
  if (!got) return 'NONE'
  if (got === wanted) return 'EXACT'
  if (got === support || familiesCompatible(wanted, got)) return 'COMPATIBLE'
  return 'NONE'
}
