import type { BriefFields, FieldKey } from '../types'

export const FIELD_ORDER: FieldKey[] = [
  'ambalajTipi',
  'markaAdi',
  'urunAdi',
  'stil',
  'renkler',
  'olculer',
  'metinler',
  'icerik',
  'uyarilar',
  'barkodQr',
  'kategori',
  'logo',
  'gorseller',
  'diger',
]

export const FIELD_LABELS: Record<FieldKey, string> = {
  markaAdi: 'Marka adı',
  urunAdi: 'Ürün adı',
  kategori: 'Kategori',
  ambalajTipi: 'Ambalaj tipi',
  olculer: 'Ölçüler',
  metinler: 'Metinler',
  renkler: 'Renkler',
  stil: 'Stil',
  logo: 'Logo',
  gorseller: 'Görseller',
  icerik: 'İçerik',
  uyarilar: 'Uyarılar',
  barkodQr: 'Barkod / QR',
  diger: 'Diğer',
}

export const CORE_FIELDS: FieldKey[] = ['markaAdi', 'urunAdi', 'ambalajTipi']

export function emptyBrief(): BriefFields {
  return {
    markaAdi: '',
    urunAdi: '',
    kategori: '',
    ambalajTipi: '',
    olculer: '',
    metinler: '',
    renkler: '',
    stil: '',
    logo: '',
    gorseller: '',
    icerik: '',
    uyarilar: '',
    barkodQr: '',
    diger: '',
  }
}

export function filledKeys(brief: BriefFields): FieldKey[] {
  return FIELD_ORDER.filter((key) => brief[key].trim().length > 0)
}

export function mergeBrief(base: BriefFields, patch: Partial<BriefFields>): BriefFields {
  const next = { ...base }
  for (const key of FIELD_ORDER) {
    const value = patch[key]
    if (typeof value === 'string' && value.trim()) {
      next[key] = value.trim()
    }
  }
  return next
}

export function isCoreReady(brief: BriefFields): boolean {
  const brand = brief.markaAdi.trim().length > 0
  const product = brief.urunAdi.trim().length > 0
  const pack = brief.ambalajTipi.trim().length > 0 || brief.kategori.trim().length > 0
  if (brand && product && pack) return true
  if (brand && pack && brief.stil.trim() && brief.renkler.trim()) return true
  return false
}

export function briefSummary(brief: BriefFields): string {
  const parts: string[] = []
  if (brief.markaAdi) parts.push(brief.markaAdi)
  if (brief.urunAdi) parts.push(brief.urunAdi)
  if (brief.ambalajTipi) parts.push(brief.ambalajTipi.toLowerCase())
  else if (brief.kategori) parts.push(brief.kategori.toLowerCase())
  return parts.join(' · ')
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}
