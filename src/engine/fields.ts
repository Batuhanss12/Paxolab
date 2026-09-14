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
  paoMonths: 'PAO',
  barcode: 'Barkod',
  manufacturerName: 'Üretici',
  manufacturerAddress: 'Adres',
  logo: 'Logo',
  references: 'Referans',
  copyOverrides: 'Metin',
  story: 'Hikâye',
  scentNotes: 'Notalar',
  copyLocale: 'Dil',
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
    manufacturerName: '',
    manufacturerAddress: '',
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
    if (typeof value === 'boolean') {
      ;(next as Record<string, unknown>)[key] = value
      continue
    }
    if (typeof value === 'string' && value.trim()) {
      ;(next as Record<string, unknown>)[key] = value.trim()
    }
  }
  const brandKey = next.brandName.trim().toLocaleLowerCase('tr')
  if (brandKey) {
    if (next.productName.trim().toLocaleLowerCase('tr') === brandKey) next.productName = ''
    if (next.sector.trim().toLocaleLowerCase('tr') === brandKey) next.sector = ''
    if (next.subProduct.trim().toLocaleLowerCase('tr') === brandKey) next.subProduct = ''
  }
  return next
}

export function isCoreReady(brief: DesignBrief): boolean {
  const brand = brief.brandName.trim().length > 0
  const surface = brief.packagingMode !== '' || brief.sector.trim().length > 0
  return brand && surface
}

export function acceptedProductSkip(brief: DesignBrief): boolean {
  return !!brief.productSkipped
}

export function hasUserVolume(brief: DesignBrief): boolean {
  return brief.volume.trim().length > 0
}

export function hasUserDims(brief: DesignBrief): boolean {
  return brief.dimensionsMm.L > 0 && brief.dimensionsMm.H > 0
}

export function acceptedVolumeDefault(brief: DesignBrief): boolean {
  return !!brief.volumeDefaulted
}

export function acceptedDimsDefault(brief: DesignBrief): boolean {
  return !!brief.dimsDefaulted
}

export function hasUserBarcode(brief: DesignBrief): boolean {
  return brief.barcode.trim().length > 0
}

export function acceptedBarcodeDefault(brief: DesignBrief): boolean {
  return !!brief.barcodeDefaulted
}

export function hasUserManufacturer(brief: DesignBrief): boolean {
  return brief.manufacturerName.trim().length > 0
}

export function acceptedManufacturerDefault(brief: DesignBrief): boolean {
  return !!brief.manufacturerDefaulted
}

export function hasUserAddress(brief: DesignBrief): boolean {
  return brief.manufacturerAddress.trim().length > 0
}

export function acceptedAddressDefault(brief: DesignBrief): boolean {
  return !!brief.addressDefaulted
}

export function briefSummary(brief: DesignBrief): string {
  const product =
    brief.productName.trim() &&
    brief.productName.trim().toLocaleLowerCase('tr') !== brief.brandName.trim().toLocaleLowerCase('tr')
      ? brief.productName
      : ''
  return [brief.brandName, product, brief.sector || brief.packagingMode].filter(Boolean).join(' · ')
}

export type FilledEntry = {
  key: string
  label: string
  value: string
  sample?: boolean
}

export function filledEntries(
  brief: DesignBrief,
  extras?: { sampleVolume?: string; sampleDims?: string },
): FilledEntry[] {
  const rows: FilledEntry[] = []
  const push = (key: AwaitingKey, value: string, sample = false) => {
    if (!value.trim()) return
    rows.push({ key, label: FIELD_LABELS[key] || key, value, sample })
  }
  push('brandName', brief.brandName)
  if (brief.productName.trim() && brief.productName.trim().toLocaleLowerCase('tr') !== brief.brandName.trim().toLocaleLowerCase('tr')) {
    push('productName', brief.productName)
  }
  push('sector', brief.sector)
  push('subProduct', brief.subProduct)
  push('packagingMode', brief.packagingMode)
  push('templateId', brief.templateId)
  push('styleType', styleLabel(brief.styleType) || brief.styleType)
  const userDims = formatDimensions(brief.dimensionsMm)
  if (userDims) push('dimensionsMm', userDims, !!brief.dimsFromVolume || !!brief.dimsDefaulted)
  else if (extras?.sampleDims) push('dimensionsMm', extras.sampleDims, true)
  push('colors', brief.colors)
  if (hasUserVolume(brief)) push('volume', brief.volume)
  else if (extras?.sampleVolume) push('volume', extras.sampleVolume, true)
  if (brief.paoMonths) push('paoMonths', brief.paoMonths)
  push('barcode', brief.barcode, !!brief.barcodeDefaulted)
  push('manufacturerName', brief.manufacturerName, !!brief.manufacturerDefaulted)
  push('manufacturerAddress', brief.manufacturerAddress, !!brief.addressDefaulted)
  push('logo', brief.logo)
  push('references', brief.references)
  push('copyOverrides', brief.copyOverrides)
  if (brief.story) push('story', brief.story)
  if (brief.scentNotes) push('scentNotes', brief.scentNotes)
  if (brief.copyLocale) push('copyLocale', brief.copyLocale === 'en' ? 'English' : 'Türkçe')
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
