import type { AwaitingKey, DesignBrief, DimensionsMm, FieldProvenance, PackagingMode, StyleType } from '../types'
import { sourceMayOverride } from './briefProvenance'
import { isSectorOrSurfaceName } from './extractHelpers'
import { styleLabel } from './styles'

export const FIELD_LABELS: Partial<Record<AwaitingKey, string>> = {
  brandName: 'Marka',
  productName: 'Ürün',
  sector: 'Sektör',
  subProduct: 'Alt ürün',
  packagingMode: 'Yüzey',
  templateId: 'Şablon',
  dimensionsMm: 'Ölçüler',
  styleType: 'Ruh hali',
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

/**
 * Merge a patch into the brief. Provenance-aware: a weaker source (LLM / knowledge /
 * default) never overwrites a stronger one; patches without provenance keep legacy
 * overwrite behaviour so catalog and template flows are untouched.
 */
export function mergeBrief(base: DesignBrief, patch: Partial<DesignBrief>): DesignBrief {
  const next = { ...base, dimensionsMm: { ...base.dimensionsMm } }
  const incomingProvenance = patch.provenance ?? {}
  const provenance: Partial<Record<string, FieldProvenance>> = { ...(base.provenance ?? {}) }
  const accept = (key: string): boolean => {
    const incoming = incomingProvenance[key]
    if (!sourceMayOverride(provenance[key], incoming)) return false
    if (incoming) provenance[key] = incoming
    return true
  }
  /** Additive arrays always union; provenance keeps the strongest source seen. */
  const acceptUnion = (key: string): void => {
    const incoming = incomingProvenance[key]
    if (incoming && sourceMayOverride(provenance[key], incoming)) provenance[key] = incoming
  }
  for (const [key, value] of Object.entries(patch)) {
    if (key === 'provenance') continue
    if (key === 'dimensionsMm' && value && typeof value === 'object') {
      if (!accept(key)) continue
      next.dimensionsMm = { ...next.dimensionsMm, ...(value as DimensionsMm) }
      continue
    }
    if (typeof value === 'boolean') {
      ;(next as Record<string, unknown>)[key] = value
      continue
    }
    if (key === 'avoidMotifs' && Array.isArray(value)) {
      acceptUnion(key)
      const extra = (value as unknown[]).map((token) => String(token).trim()).filter(Boolean)
      next.avoidMotifs = [...new Set([...(next.avoidMotifs ?? []), ...extra])]
      continue
    }
    if (key === 'deliverables' && Array.isArray(value)) {
      acceptUnion(key)
      const extra = (value as unknown[]).filter((mode): mode is PackagingMode => mode === 'box' || mode === 'label')
      next.deliverables = [...new Set([...(next.deliverables ?? []), ...extra])]
      continue
    }
    if (typeof value === 'string' && value.trim()) {
      if (!accept(key)) continue
      ;(next as Record<string, unknown>)[key] = value.trim()
    }
  }
  // Provenance for keys the patch describes without carrying a value (e.g. dimsDefaulted → dimensionsMm SYSTEM_DEFAULT).
  for (const [key, row] of Object.entries(incomingProvenance)) {
    if (!row || key in patch) continue
    if (sourceMayOverride(provenance[key], row)) provenance[key] = row
  }
  if (Object.keys(provenance).length) next.provenance = provenance
  const brandKey = next.brandName.trim().toLocaleLowerCase('tr')
  if (brandKey) {
    if (isSectorOrSurfaceName(next.brandName)) next.brandName = ''
    else {
      if (next.productName.trim().toLocaleLowerCase('tr') === brandKey) next.productName = ''
      if (next.sector.trim().toLocaleLowerCase('tr') === brandKey) next.sector = ''
      if (next.subProduct.trim().toLocaleLowerCase('tr') === brandKey) next.subProduct = ''
    }
  }
  return next
}

export function isCoreReady(brief: DesignBrief): boolean {
  const brand = brief.brandName.trim().length > 0 && !isSectorOrSurfaceName(brief.brandName)
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
  // "Elite Brew · kahve", not "Elite Brew · gıda": the product family is what the user said.
  const family = brief.subProduct.trim() && !/^(bakım|genel)$/i.test(brief.subProduct) ? brief.subProduct.trim() : brief.sector
  return [brief.brandName, product, family || brief.packagingMode].filter(Boolean).join(' · ')
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

export function avoidsClassicStyle(text: string): boolean {
  const t = text.toLocaleLowerCase('tr')
  return /klasik\s*(görünmesin|olmasın|durmasın)|çok\s*klasik|overly\s*classic(?:al)?|not\s*(too\s*)?classic(?:al)?|too\s*classic(?:al)?|klasik\s*değil/i.test(
    t,
  )
}

export function parseStyle(text: string): StyleType | '' {
  const t = text.toLocaleLowerCase('tr')
  const skipClassic = avoidsClassicStyle(text)
  if (/lüks|luxury|premium|şık|altın\s*çerçeve/.test(t)) return 'luxury'
  if (/minimal|sade/.test(t)) return 'minimal'
  if (/editorial|editöryal|editoryal|contemporary|çağdaş/.test(t)) return 'modern'
  if (/eco|organik|doğal/.test(t)) return 'eco'
  if (/playful|eğlenc|renkli/.test(t)) return 'playful'
  if (!skipClassic && /klasik|classic(?:al)?/.test(t)) return 'classic'
  if (/modern/.test(t)) return 'modern'
  if (skipClassic) return 'modern'
  return ''
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}
