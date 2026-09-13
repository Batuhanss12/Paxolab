import type { DesignBrief, FormaTemplate, PackagingMode, StructureId } from '../../types'
import raw from './formaTemplateCatalog.json'

export const FORMA_TEMPLATES = raw as FormaTemplate[]

function norm(value: string): string {
  return value.trim().toLocaleLowerCase('tr')
}

export function activeTemplates(includeAdvanced = false): FormaTemplate[] {
  return FORMA_TEMPLATES.filter((t) => t.status === 'active' && (includeAdvanced || t.library !== 'advanced'))
}

export function filterTemplates(brief: DesignBrief, opts?: { includeAdvanced?: boolean }): FormaTemplate[] {
  const sector = norm(brief.sector)
  const sub = norm(brief.subProduct || brief.productName)
  const mode = brief.packagingMode
  const pool = activeTemplates(opts?.includeAdvanced).filter((t) => !mode || t.packagingMode === mode)

  const scored = pool
    .map((t) => {
      let score = 0
      if (sector && t.sectors.some((s) => sector.includes(norm(s)) || norm(s).includes(sector))) score += 4
      if (sub && t.subProducts.some((s) => sub.includes(norm(s)) || norm(s).includes(sub))) score += 5
      if (mode && t.packagingMode === mode) score += 2
      return { t, score }
    })
    .sort((a, b) => b.score - a.score)

  const hits = scored.filter((s) => s.score > 0).map((s) => s.t)
  return hits.length ? hits : pool
}

export function getTemplate(id: string): FormaTemplate | undefined {
  return FORMA_TEMPLATES.find((t) => t.id === id)
}

export function pickTemplate(brief: DesignBrief): FormaTemplate {
  if (brief.templateId) {
    const exact = getTemplate(brief.templateId)
    if (exact) return exact
  }
  return filterTemplates(brief)[0] ?? activeTemplates()[0]
}

export function structureFromTemplate(template: FormaTemplate): StructureId {
  return template.structureId
}

export function modeFromTemplate(template: FormaTemplate): PackagingMode {
  return template.packagingMode
}
