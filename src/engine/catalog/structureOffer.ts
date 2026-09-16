/**
 * Structure offer — name the carton/label grammar in chat.
 * Catalog cards stay; the conversation must not pick them silently without saying so.
 */
import type { DesignBrief, FormaTemplate, PackagingMode, StructureId } from '../../types'
import { activeTemplates, getTemplate, pickTemplate } from './catalog'
import { recommendStructures, type StructureRecommendation } from './structureRecommend'

export const STRUCTURE_LABEL: Record<StructureId, string> = {
  'tuck-end-box': 'düz tuck-end',
  'simple-tray': 'tepsi',
  'flat-label': 'düz etiket',
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
  const why = chosen?.reason ? ` — ${chosen.reason}` : ''
  const others = rec.candidates
    .filter((row) => row.templateId !== tmpl.id)
    .map((row) => {
      const name = STRUCTURE_LABEL[row.structureId] ?? row.title
      return `${name} (${row.reason})`
    })
  const alt = others.length ? ` Ayrıca: ${others.join('; ')}.` : ''
  return `Yapı: ${label} (${tmpl.title})${why}.${alt} Yapıyı değiştirmek için “2. yapı” / “mailer” / “sleeve” yaz.`
}

export { parseOfferChoice, recommendStructures } from './structureRecommend'
