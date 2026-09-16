/**
 * C5 structure recommendation — rank catalog families from brief physics.
 * Does not invent cartons. pickTemplate / kit generate stay on templateId.
 */
import type { DesignBrief, DimensionsMm, FormaTemplate, PackagingMode, StructureId } from '../../types'
import { activeTemplates, getTemplate, productHits, sectorHits } from './catalog'

export type StructureWeights = {
  physical: number
  aspect: number
  product: number
}

export const DEFAULT_STRUCTURE_WEIGHTS: StructureWeights = {
  physical: 0.55,
  aspect: 0.3,
  product: 0.15,
}

export type StructureCandidate = {
  templateId: string
  structureId: StructureId
  title: string
  eligible: boolean
  score: number
  physicalFit: number
  aspectFit: number
  productFit: number
  reason: string
  gate?: string
}

export type StructureRecommendation = {
  candidates: StructureCandidate[]
  all: StructureCandidate[]
  selectedTemplateId: string
  hasPhysics: boolean
}

const PORTRAIT_FAMILIES = new Set<StructureId>([
  'tuck-end-box',
  'reverse-tuck-end-box',
  'sleeve',
  'tuck-top-auto-bottom',
  'snap-lock-box',
  'polygon-box',
])

const LOW_FAMILIES = new Set<StructureId>([
  'mailer-box',
  'simple-tray',
  'tray-box',
  'rigid-gift-box',
  'pillow-box',
  'rsc-carton',
  'product-carrier-tray',
])

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

function relErr(a: number, b: number): number {
  const den = Math.max(Math.abs(a), Math.abs(b), 1)
  return Math.abs(a - b) / den
}

export function hasStructurePhysics(brief: DesignBrief): boolean {
  return brief.dimensionsMm.L > 0 && brief.dimensionsMm.H > 0
}

function physicalFit(user: DimensionsMm, def: DimensionsMm, mode: PackagingMode): number {
  if (user.L <= 0 && user.H <= 0) return 0.5
  if (mode === 'label') return clamp01(1 - (relErr(user.L, def.L) + relErr(user.H, def.H)) / 2)
  const w = user.W > 0 ? user.W : def.W
  return clamp01(1 - (relErr(user.L, def.L) + relErr(w, def.W) + relErr(user.H, def.H)) / 3)
}

function aspectKind(dims: DimensionsMm): 'portrait' | 'low' | 'neutral' {
  if (dims.L <= 0 || dims.H <= 0) return 'neutral'
  if (dims.H >= dims.L * 1.2) return 'portrait'
  if (dims.H <= dims.L * 0.55 || (dims.W > 0 && dims.H <= dims.W)) return 'low'
  return 'neutral'
}

function aspectFit(kind: 'portrait' | 'low' | 'neutral', structureId: StructureId, mode: PackagingMode): number {
  if (mode === 'label' || kind === 'neutral') return 0.5
  const portrait = PORTRAIT_FAMILIES.has(structureId)
  const low = LOW_FAMILIES.has(structureId)
  if (kind === 'portrait') return portrait ? 1 : low ? 0.12 : 0.45
  return low ? 1 : portrait ? 0.12 : 0.45
}

function productFit(brief: DesignBrief, template: FormaTemplate): number {
  const sector = brief.sector ? (sectorHits(template, brief.sector) ? 0.65 : 0.2) : 0.4
  const product = brief.subProduct ? (productHits(template, brief.subProduct) ? 0.35 : 0) : 0.15
  return clamp01(sector + product)
}

/** One catalog card per structure family. Prefer the sector/product match when the brief has one. */
function familyRepresentatives(mode: PackagingMode, brief: DesignBrief): FormaTemplate[] {
  const byStruct = new Map<StructureId, FormaTemplate>()
  for (const tmpl of activeTemplates(true)) {
    const prev = byStruct.get(tmpl.structureId)
    if (!prev) {
      byStruct.set(tmpl.structureId, tmpl)
      continue
    }
    if (tmpl.packagingMode === mode && prev.packagingMode !== mode) {
      byStruct.set(tmpl.structureId, tmpl)
      continue
    }
    if (tmpl.packagingMode !== prev.packagingMode) continue
    if (brief.sector) {
      const hit = sectorHits(tmpl, brief.sector)
      const prevHit = sectorHits(prev, brief.sector)
      if (hit && !prevHit) {
        byStruct.set(tmpl.structureId, tmpl)
        continue
      }
      if (hit === prevHit && brief.subProduct) {
        const prod = productHits(tmpl, brief.subProduct)
        const prevProd = productHits(prev, brief.subProduct)
        if (prod && !prevProd) byStruct.set(tmpl.structureId, tmpl)
      }
    }
  }
  return [...byStruct.values()]
}

function groundedReason(
  brief: DesignBrief,
  row: { structureId: StructureId; title: string; defaultsMm: DimensionsMm },
  fits: { physical: number; aspect: number; product: number },
  kind: 'portrait' | 'low' | 'neutral',
  mode: PackagingMode,
): string {
  const label = row.title
  const d = brief.dimensionsMm
  if (mode === 'label') {
    if (hasStructurePhysics(brief) && (d.L || d.H)) {
      return `Etiket ${d.L}×${d.H} mm — ${label} varsayılanı ${row.defaultsMm.L}×${row.defaultsMm.H} mm.`
    }
    if (brief.subProduct && fits.product >= 0.7) return `${brief.subProduct} için katalogda ${label} ailesi var.`
    if (brief.sector && fits.product >= 0.5) return `${brief.sector} yüzeyinde ${label} aktif katalog yapısı.`
    return `${label} etiket yüzeyinde aktif.`
  }
  if (hasStructurePhysics(brief)) {
    if (kind === 'portrait' && PORTRAIT_FAMILIES.has(row.structureId)) {
      return `${d.H} mm yüksekliğindeki dar form (${d.L}×${d.W || '—'}×${d.H} mm) için dikey ön yüz; ${label} katalog varsayılanı ${row.defaultsMm.L}×${row.defaultsMm.W}×${row.defaultsMm.H} mm.`
    }
    if (kind === 'low' && LOW_FAMILIES.has(row.structureId)) {
      return `${d.L}×${d.W || '—'} mm geniş taban, ${d.H} mm alçak gövde — yatay / sevkiyat formu; ${label} varsayılanı ${row.defaultsMm.L}×${row.defaultsMm.W}×${row.defaultsMm.H} mm.`
    }
    if (fits.physical >= 0.7) {
      return `Ölçü ${d.L}×${d.W || '—'}×${d.H} mm, ${label} varsayılanına (${row.defaultsMm.L}×${row.defaultsMm.W}×${row.defaultsMm.H} mm) yakın.`
    }
    return `Ölçü ${d.L}×${d.W || '—'}×${d.H} mm; ${label} bu yüzeyde aktif (${row.defaultsMm.L}×${row.defaultsMm.W}×${row.defaultsMm.H} mm).`
  }
  if (brief.subProduct && fits.product >= 0.7) {
    return `${brief.subProduct} için katalogda ${label} ailesi var.`
  }
  if (brief.sector && fits.product >= 0.5) {
    return `${brief.sector} yüzeyinde ${label} aktif katalog yapısı.`
  }
  return mode === 'label' ? `${label} etiket yüzeyinde aktif.` : `${label} kutu yüzeyinde aktif katalog yapısı.`
}

function compareCandidates(a: StructureCandidate, b: StructureCandidate): number {
  return b.score - a.score || a.structureId.localeCompare(b.structureId) || a.templateId.localeCompare(b.templateId)
}

export function evaluateStructures(brief: DesignBrief, weights: StructureWeights = DEFAULT_STRUCTURE_WEIGHTS): StructureCandidate[] {
  const mode: PackagingMode = brief.packagingMode || 'box'
  const kind = aspectKind(brief.dimensionsMm)
  const wsum = Math.max(0.0001, weights.physical + weights.aspect + weights.product)
  const physW = weights.physical / wsum
  const aspW = weights.aspect / wsum
  const prodW = weights.product / wsum
  const pool = familyRepresentatives(mode, brief)
  const rows: StructureCandidate[] = pool.map((tmpl) => {
    const eligible = tmpl.packagingMode === mode
    const physical = physicalFit(brief.dimensionsMm, tmpl.defaultsMm, mode)
    const aspect = aspectFit(kind, tmpl.structureId, mode)
    const product = productFit(brief, tmpl)
    const score = eligible ? physical * physW + aspect * aspW + product * prodW : -1
    return {
      templateId: tmpl.id,
      structureId: tmpl.structureId,
      title: tmpl.title,
      eligible,
      score,
      physicalFit: physical,
      aspectFit: aspect,
      productFit: product,
      reason: groundedReason(brief, tmpl, { physical, aspect, product }, kind, mode),
      gate: eligible ? undefined : `packagingMode ${mode} ≠ ${tmpl.packagingMode}`,
    }
  })
  return rows.sort(compareCandidates)
}

export function recommendStructures(brief: DesignBrief, weights: StructureWeights = DEFAULT_STRUCTURE_WEIGHTS): StructureRecommendation {
  const all = evaluateStructures(brief, weights)
  const eligible = all.filter((row) => row.eligible)
  const sectorRows =
    brief.sector
      ? eligible.filter((row) => {
          const tmpl = getTemplate(row.templateId)
          return tmpl ? sectorHits(tmpl, brief.sector) : row.productFit >= 0.65
        })
      : eligible
  const pool = sectorRows.length ? sectorRows : eligible
  const candidates = pool.slice(0, 3)
  const pinned = brief.templateId && eligible.some((row) => row.templateId === brief.templateId) ? brief.templateId : ''
  return {
    all,
    candidates,
    selectedTemplateId: pinned || candidates[0]?.templateId || '',
    hasPhysics: hasStructurePhysics(brief),
  }
}

const ORDINAL: Record<string, number> = {
  birinci: 1,
  ilk: 1,
  ikinci: 2,
  üçüncü: 3,
  ucuncu: 3,
}

/** 1-based index into the current offer, or null if the utterance is not a pick. */
export function parseOfferChoice(text: string, count: number): number | null {
  const t = text.trim().toLocaleLowerCase('tr')
  if (!t || count < 1) return null
  const named = t.match(/\b(birinci|ilk|ikinci|üçüncü|ucuncu)\b/)
  if (named && /yapı|öneri|kart|seç/.test(t)) {
    const n = ORDINAL[named[1] ?? '']
    return n && n <= count ? n : null
  }
  const num = t.match(/\b([123])\s*[.)]?\s*(yapı|öneri|kart)/)
  if (num) {
    const n = Number(num[1])
    return n >= 1 && n <= count ? n : null
  }
  return null
}
