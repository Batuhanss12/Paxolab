/**
 * Copy helpers — product line resolution, spec line, monogram, category.
 * Extracted from copy.ts to isolate utility helpers from copy generation.
 */
import type { CopyLocale, DesignBrief } from '../../types'
import { resolveCopyLocale } from '../copyLocale'
import { categoryFor } from '../designSystem/kits'
import { resolveSector, sectorBlob } from '../designSystem/sector'
import { isGenericProductName, sameName } from '../extract'

/** Catalog / sample SKUs — follow copyLocale. Unique user lines stay as typed. */
const SAMPLE_PRODUCT: Record<string, { tr: string; en: string }> = {
  'night cream': { tr: 'Gece Kremi', en: 'Night Cream' },
  night: { tr: 'Gece', en: 'Night' },
  surface: { tr: 'Yüzey', en: 'Surface' },
  concentrate: { tr: 'Konsantre', en: 'Concentrate' },
  biscuit: { tr: 'Kurabiye', en: 'Biscuit' },
  'keratin repair': { tr: 'Keratin Onarım', en: 'Keratin Repair' },
}

export function localizeSampleProduct(raw: string, locale: CopyLocale): string {
  const hit = SAMPLE_PRODUCT[raw.trim().toLocaleLowerCase('tr')]
  if (!hit) return raw
  return locale === 'en' ? hit.en : hit.tr
}

export function resolveProductLine(brief: DesignBrief, fallback = ''): string {
  const raw = (fallback || brief.productName).trim()
  if (!raw || isGenericProductName(raw) || /^untitled$/i.test(raw)) return ''
  if (sameName(raw, brief.brandName)) return ''
  return localizeSampleProduct(raw, resolveCopyLocale(brief))
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
  return categoryFor(resolveSector(brief), sectorBlob(brief), resolveCopyLocale(brief))
}
