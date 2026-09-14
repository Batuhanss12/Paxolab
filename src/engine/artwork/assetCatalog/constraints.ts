import type { DesignPlan, MotifFamilyId } from '../../brain/DesignPlan'
import type { MotifMetaHost } from '../artMotifMeta'
import { motifFamilyOf } from '../artMotifFamily'
import { lookupAssetRecordForAtom } from './catalog'
import { allowedFamiliesForConcept, canonicalizeFamily, familyMatchLevel } from './familyMatrix'

export function wantedFamilies(plan: Pick<DesignPlan, 'visualConcept'>): string[] {
  const family = plan.visualConcept.family
  if (!family) return []
  return allowedFamiliesForConcept(plan.visualConcept.id, family, plan.visualConcept.supportFamily)
}

export function slotFamilyAllowed(atom: MotifMetaHost, plan: Pick<DesignPlan, 'visualConcept'>): boolean {
  const family = plan.visualConcept.family
  if (!family) return true
  return wantedFamilies(plan).includes(motifFamilyOf(atom))
}

export function familyConsistencyScore(
  atoms: MotifMetaHost[],
  plan: Pick<DesignPlan, 'visualConcept'>,
): number {
  const family = plan.visualConcept.family
  if (!family || !atoms.length) return 70
  let min = 100
  for (const atom of atoms) {
    const level = familyMatchLevel(motifFamilyOf(atom), family, plan.visualConcept.supportFamily)
    if (level === 'EXACT') min = Math.min(min, 100)
    else if (level === 'COMPATIBLE') min = Math.min(min, 50)
    else return 0
  }
  return min
}

export function incompatibleAtoms(atoms: MotifMetaHost[], plan: Pick<DesignPlan, 'visualConcept'>): MotifMetaHost[] {
  return atoms.filter((a) => !slotFamilyAllowed(a, plan))
}

export function motifFamiliesInMarkup(markup: string): string[] {
  const tagged = [...markup.matchAll(/data-motif-family="([^"]*)"/g)].map((m) => m[1]).filter(Boolean)
  if (tagged.length) return tagged
  return [...markup.matchAll(/data-motif-atom="([^"]+)"/g)].map((m) => {
    const id = m[1]
    if (/islamic/.test(id)) return 'ornate-stamp'
    const rec = lookupAssetRecordForAtom('', id)
    return rec?.family ?? ''
  }).filter(Boolean)
}

export function markupFamilyGate(
  markup: string,
  plan: Pick<DesignPlan, 'visualConcept'>,
): { ok: boolean; detail: string; families: string[]; fallback: 'none' | 'typography-only' } {
  const wanted = plan.visualConcept.family
  const families = motifFamiliesInMarkup(markup)
  if (!wanted) return { ok: true, detail: 'family yok', families, fallback: 'none' }
  if (!families.length) {
    return { ok: true, detail: 'typography-only — uyumlu asset yok, sade yüzey', families, fallback: 'typography-only' }
  }
  const allowed = new Set(wantedFamilies(plan))
  const bad = families.filter((f) => !allowed.has(canonicalizeFamily(f) ?? (f as MotifFamilyId)))
  if (bad.length) {
    return {
      ok: false,
      detail: `HARD CONSTRAINT FAILURE: ${wanted} yüzünde ${bad.join(', ')}`,
      families,
      fallback: 'none',
    }
  }
  return { ok: true, detail: `family ${families.join(', ')}`, families, fallback: 'none' }
}
