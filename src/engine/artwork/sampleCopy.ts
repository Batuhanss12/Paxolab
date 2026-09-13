/**
 * Sample copy — tagline, volume, ingredients, warnings, CTA + ingredient claim badges.
 * Extracted from copy.ts to isolate copy generation from helpers and back-fill.
 */
import type { DesignBrief } from '../../types'
import { resolveCopyLocale } from '../copyLocale'
import { resolveSector } from '../designSystem/sector'
import { resolveMarkRecipe } from '../marks/MarkMatrix'
import { warningsForLocale } from '../marks/markRecipes'
import { resolveSectorCopy } from './sectorCopyConfig'

export function sampleCopy(brief: DesignBrief): {
  tagline: string
  volume: string
  ingredients: string
  warnings: string
  cta: string
} {
  const sector = resolveSector(brief)
  const locale = resolveCopyLocale(brief)
  const sub = `${brief.subProduct} ${brief.productName}`.toLocaleLowerCase('tr')
  const custom = brief.copyOverrides.trim()
  const surface = brief.packagingMode === 'label' ? 'label' : 'box'
  const markWarn = warningsForLocale(resolveMarkRecipe(sector, surface, brief).requiredTextWarnings, locale).join(' ')
  const template = resolveSectorCopy(sector, sub, locale)

  const warnings = template.extraWarnings ? `${markWarn} ${template.extraWarnings}` : markWarn
  return {
    tagline: custom || template.tagline,
    volume: brief.volume || template.volume,
    ingredients: template.ingredients,
    warnings,
    cta: template.cta,
  }
}

/** Auto-generate ingredient claim badges when the brief doesn't provide them. */
export function defaultIngredientClaims(brief: DesignBrief): string {
  if (brief.ingredientClaims?.trim()) return brief.ingredientClaims.trim()
  const sector = resolveSector(brief)
  const sub = `${brief.subProduct} ${brief.productName}`.toLocaleLowerCase('tr')
  if (sector === 'serum') return 'NIACINAMIDE + HYALURONIC ACID'
  if (sector === 'cream' || /krem|cream/.test(sub)) return 'CERAMIDE + NIACINAMIDE'
  if (/şampuan|shampoo/i.test(sub)) return 'BIOTIN + COLLAGEN + KERATIN'
  if (/saç yağ|hair oil/i.test(sub)) return 'ARGAN + KERATIN'
  if (/maske|masque/i.test(sub)) return 'KERATIN + COLLAGEN'
  return ''
}
