import type { AwaitingKey, DesignBrief, DimensionsMm, StyleType } from '../types'
import { styleLabel } from './styles'

export const FIELD_LABELS: Partial<Record<AwaitingKey, string>> = {
  brandName: 'Marka',
  productName: 'Ürün',
  sector: 'Sektör',
  subProduct: 'Alt ürün',
  packagingMode: 'Yüzey',
  templateId: 'Şablon',
  dimensionsMm: 'Ölçüler',
  styleType: 'Stil',
  colors: 'Renkler',
  volume: 'Hacim',
  barcode: 'Barkod',
  logo: 'Logo',
  references: 'Referans',
  copyOverrides: 'Metin',
}

export function emptyBrief(): DesignBrief {
  return {
    brandName: '',
    productName: '',
    sector: '',
    subProduct: '',
    packagingMode: '',
    templateId: '',
    dimensionsMm: { L: 0, W: 0, H: 0 },
    styleType: '',
    colors: '',
    volume: '',
    barcode: '',
    logo: '',
    references: '',
    copyOverrides: '',
  }
}

export function formatDimensions(d: DimensionsMm): string {
  if (!d.L && !d.H) return ''
  if (!d.W) return `${d.L} × ${d.H} mm`
  return `${d.L} × ${d.W} × ${d.H} mm`
}

export function parseDimensions(text: string): DimensionsMm | null {
  const m = text.match(
    /(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)(?:\s*[x×]\s*(\d+(?:[.,]\d+)?))?/i,
  )
  if (!m) return null
  const a = Number(m[1].replace(',', '.'))
  const b = Number(m[2].replace(',', '.'))
  const c = m[3] ? Number(m[3].replace(',', '.')) : 0
  if (c) return { L: a, W: b, H: c }
  return { L: a, W: 0, H: b }
}

export function mergeBrief(base: DesignBrief, patch: Partial<DesignBrief>): DesignBrief {
  const next = { ...base, dimensionsMm: { ...base.dimensionsMm } }
  for (const [key, value] of Object.entries(patch)) {
    if (key === 'dimensionsMm' && value && typeof value === 'object') {
      next.dimensionsMm = { ...next.dimensionsMm, ...(value as DimensionsMm) }
      continue
    }
    if (typeof value === 'string' && value.trim()) {
      ;(next as Record<string, unknown>)[key] = value.trim()
    }
  }
  return next
}

export function isCoreReady(brief: DesignBrief): boolean {
  const brand = brief.brandName.trim().length > 0
  const product = brief.productName.trim().length > 0
  const surface = brief.packagingMode !== '' || brief.sector.trim().length > 0
  return brand && product && surface
}

export function briefSummary(brief: DesignBrief): string {
  return [brief.brandName, brief.productName, brief.sector || brief.packagingMode].filter(Boolean).join(' · ')
}

export function filledEntries(brief: DesignBrief): { key: string; label: string; value: string }[] {
  const rows: { key: string; label: string; value: string }[] = []
  const push = (key: AwaitingKey, value: string) => {
    if (!value.trim()) return
    rows.push({ key, label: FIELD_LABELS[key] || key, value })
  }
  push('brandName', brief.brandName)
  push('productName', brief.productName)
  push('sector', brief.sector)
  push('subProduct', brief.subProduct)
  push('packagingMode', brief.packagingMode)
  push('templateId', brief.templateId)
  push('styleType', styleLabel(brief.styleType) || brief.styleType)
  push('dimensionsMm', formatDimensions(brief.dimensionsMm))
  push('colors', brief.colors)
  push('volume', brief.volume)
  push('barcode', brief.barcode)
  push('logo', brief.logo)
  push('references', brief.references)
  push('copyOverrides', brief.copyOverrides)
  return rows
}

export function parseStyle(text: string): StyleType | '' {
  const t = text.toLocaleLowerCase('tr')
  if (/lüks|luxury|premium|şık|altın\s*çerçeve/.test(t)) return 'luxury'
  if (/minimal|sade/.test(t)) return 'minimal'
  if (/eco|organik|doğal/.test(t)) return 'eco'
  if (/playful|eğlenc|renkli/.test(t)) return 'playful'
  if (/klasik|classic/.test(t)) return 'classic'
  if (/modern/.test(t)) return 'modern'
  return ''
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}
