/**
 * Copy helpers — product line resolution, spec line, monogram, category.
 * Extracted from copy.ts to isolate utility helpers from copy generation.
 */
import type { DesignBrief } from '../../types'
import { categoryFor } from '../designSystem/kits'
import { resolveSector, sectorBlob } from '../designSystem/sector'
import { isGenericProductName, sameName } from '../extract'

export function resolveProductLine(brief: DesignBrief, fallback = ''): string {
  const raw = (fallback || brief.productName).trim()
  if (!raw || isGenericProductName(raw) || /^untitled$/i.test(raw)) return ''
  if (sameName(raw, brief.brandName)) return ''
  return raw
}

export function frontSpecLine(ingredients: string): string {
  const first = ingredients.split(/[·.|]/)[0]?.trim() ?? ''
  return first.length > 42 ? `${first.slice(0, 40)}…` : first
}

export type BackFillBlock = { title: string; lines: string[] }

export function monogram(brand: string): string {
  const parts = brand.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'F'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function categoryLine(brief: DesignBrief): string {
  return categoryFor(resolveSector(brief), sectorBlob(brief))
}
