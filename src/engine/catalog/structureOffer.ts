/**
 * Structure offer — name the carton/label grammar in chat.
 * Catalog cards stay; the conversation must not pick them silently without saying so.
 */
import type { DesignBrief, DimensionsMm, FormaTemplate, PackagingMode, StructureId } from '../../types'
import { activeTemplates, getTemplate, pickTemplate, sectorHits } from './catalog'
import { estimateCartonMm } from './volumeCarton'
import { resolveDimensions } from '../dieline/buildDieline'
import { recommendStructures, type StructureRecommendation } from './structureRecommend'

export const STRUCTURE_LABEL: Record<StructureId, string> = {
  'tuck-end-box': 'düz tuck-end',
  'simple-tray': 'tepsi',
  'flat-label': 'düz etiket',
  'round-label': 'yuvarlak etiket (kapak / tin)',
  'oval-label': 'oval etiket (şişe / kavanoz)',
  'hang-tag': 'askı etiketi',
  'insert-card': 'teşekkür / bakım kartı',
  'wrap-label': 'wrap etiket',
  'mailer-box': 'mailer / kargo',
  sleeve: 'sleeve / kılıf',
  'pillow-box': 'yastık kutu',
  'snap-lock-box': 'snap-lock',
  'tray-box': 'yapıştırmalı tepsi',
  'rigid-gift-box': 'sert hediye kutusu',
  'polygon-box': 'poligon kutu',
  'product-carrier-tray': 'taşıyıcı tepsi',
  'reverse-tuck-end-box': 'ters tuck',
  'tuck-top-auto-bottom': 'üst tuck + otomatik dip (A60)',
  'rsc-carton': 'RSC koli',
}

const STRUCTURE_PARSE: Array<{ id: StructureId; re: RegExp }> = [
  { id: 'wrap-label', re: /\bwrap\b|sarıml[ıi]|şişe\s*etiket/i },
  { id: 'flat-label', re: /düz\s*etiket|flat\s*label|kavanoz\s*etiket/i },
  { id: 'tuck-top-auto-bottom', re: /\ba60\b|otomatik\s*dip|auto[\s-]?bottom/i },
  { id: 'reverse-tuck-end-box', re: /ters\s*tuck|reverse\s*tuck/i },
  { id: 'rsc-carton', re: /\brsc\b|koli|oluklu/i },
  { id: 'mailer-box', re: /\bmailer\b|kargo\s*kutu|e-?ticaret\s*kutu/i },
  { id: 'sleeve', re: /\bsleeve\b|kılıf|kimono/i },
  { id: 'snap-lock-box', re: /snap[\s-]?lock|kilitli\s*dip/i },
  { id: 'pillow-box', re: /yastık\s*kutu|\bpillow\b/i },
  { id: 'rigid-gift-box', re: /sert\s*hediye|rigid\s*gift|mıknatıs/i },
  { id: 'polygon-box', re: /poligon|hexagon|altıgen|sekizgen/i },
  { id: 'product-carrier-tray', re: /taşıyıcı|şişe\s*taşı/i },
  { id: 'tray-box', re: /yapıştırmalı\s*tepsi/i },
  { id: 'simple-tray', re: /\btepsi\b|\btray\b/i },
  { id: 'tuck-end-box', re: /düz\s*tuck|\btuck\b|klasik\s*karton/i },
]

export function parseStructureUtterance(text: string): StructureId | null {
  const t = text.trim()
  if (!t) return null
  for (const row of STRUCTURE_PARSE) {
    if (row.re.test(t)) return row.id
  }
  return null
}

export function templateForStructure(structureId: StructureId, mode: PackagingMode): FormaTemplate | undefined {
  return activeTemplates(true).find((t) => t.structureId === structureId && t.packagingMode === mode)
}

export function templateIdFromUtterance(text: string, mode: PackagingMode | ''): string {
  const id = parseStructureUtterance(text)
  if (!id) return ''
  const pack: PackagingMode = id === 'flat-label' || id === 'wrap-label' ? 'label' : 'box'
  const hit = templateForStructure(id, pack) ?? (mode ? templateForStructure(id, mode) : undefined)
  return hit?.id ?? ''
}

export function describeStructureOffer(brief: DesignBrief, template?: FormaTemplate, offer?: StructureRecommendation): string {
  const rec = offer ?? recommendStructures(brief)
  const tmpl = template ?? (brief.templateId ? getTemplate(brief.templateId) : undefined) ?? (rec.selectedTemplateId ? getTemplate(rec.selectedTemplateId) : undefined) ?? pickTemplate(brief)
  const chosen = rec.candidates.find((row) => row.templateId === tmpl.id) ?? rec.candidates[0]
  const label = STRUCTURE_LABEL[tmpl.structureId] ?? tmpl.title
  const why = chosen?.reason ? ` — ${chosen.reason.replace(/\.$/, '')}` : ''
  const others = rec.candidates
    .filter((row) => row.templateId !== tmpl.id)
    .map((row) => {
      const name = STRUCTURE_LABEL[row.structureId] ?? row.title
      return `${name} (${row.reason})`
    })
  const alt = others.length ? ` Ayrıca: ${others.join('; ')}.` : ''
  if (tmpl.packagingMode === 'label') {
    return `Format: ${label} (${tmpl.title})${why}.${alt} Sarımlı veya düz yazarak değiştirebilirsin.`
  }
  return `Yapı: ${label} (${tmpl.title})${why}.${alt} Yapıyı değiştirmek için “2. yapı” / “mailer” / “sleeve” yaz.`
}

export function formatTemplateLabel(templateId: string): string {
  const tmpl = getTemplate(templateId)
  if (!tmpl) return templateId
  const grammar = STRUCTURE_LABEL[tmpl.structureId] ?? tmpl.structureId
  return `${grammar} — ${tmpl.title}`
}

export { parseOfferChoice, recommendStructures } from './structureRecommend'

/**
 * The size a structure card should show, for this brief.
 *
 * Sibling of the defect `structureKeepsDims.test.ts` covers. That one was "picking a structure must
 * not throw away the size the user gave"; this is "the card must not *offer* a size it will not
 * build". Measured 2026-09-17: a brief of 70×45×150 produced cards reading 100×50×150, 80×40×80 and
 * 70×35×120 — and since each card draws its own net from these numbers, the customer was comparing
 * three boxes of the wrong *shape*, while the large preview beside them showed the size they had
 * actually typed. Two answers to one question, on one screen.
 *
 * So a typed size goes through the engine's own resolver and every card shows what will be built.
 * With nothing typed there is no instruction to honour, and each structure's own characteristic
 * size is more use than one shared fallback repeated across the row.
 */
export function structureCardDims(brief: DesignBrief, template: FormaTemplate): DimensionsMm {
  const typed = brief.dimensionsMm.L > 0 || brief.dimensionsMm.H > 0
  if (typed) return resolveDimensions({ ...brief, templateId: template.id })
  return estimateCartonMm(brief.volume, brief, template) ?? template.defaultsMm
}

/**
 * The structure cards to offer, in the order the engine ranks them.
 *
 * There used to be two lists on one screen. The chat named the engine's top three — for a cream
 * brief: A60 tuck-top, *Krem kutusu*, ters tuck — while the cards came from `pickerTemplates`,
 * which dedupes by structure keeping whichever template sits first in the catalogue. "Parfüm
 * tuck-end" and "Krem kutusu" share the `tuck-end` structure, so the perfume box won on file order
 * and the cream box — the engine's own second choice — never appeared at all. What the customer saw
 * instead was a hexagon gift box and a pillow box.
 *
 * `evaluateStructures` already picks the right representative per structure (mode, then sector,
 * then sub-product) and already scores them, so the cards are simply that list. One question, one
 * answer.
 */
export function structureCards(brief: DesignBrief, opts?: { includeAll?: boolean }): FormaTemplate[] {
  const eligible = recommendStructures(brief).all.filter((row) => row.eligible)
  const templates = eligible
    .map((row) => getTemplate(row.templateId))
    .filter((tmpl): tmpl is FormaTemplate => Boolean(tmpl))
  if (opts?.includeAll || !brief.sector) return templates
  const onSector = templates.filter((tmpl) => sectorHits(tmpl, brief.sector))
  return onSector.length ? onSector : templates
}
