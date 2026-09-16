import type { DesignBrief, FormaTemplate, PackagingMode, StructureId } from '../../types'
import raw from './formaTemplateCatalog.json'

export const FORMA_TEMPLATES = raw as FormaTemplate[]

function norm(value: string): string {
  return value.trim().toLocaleLowerCase('tr')
}

const GENERIC_QUERY = new Set(['genel', 'kutu', 'kutusu', 'ambalaj', 'box', 'paket', 'ürün', 'urun', 'pack'])

const SECTOR_KEYS: Record<string, string[]> = {
  kozmetik: ['kozmetik', 'cosmetic', 'cosmetics', 'parfüm', 'parfum', 'perfume'],
  parfüm: ['parfüm', 'parfum', 'perfume', 'kozmetik'],
  parfum: ['parfüm', 'parfum', 'perfume', 'kozmetik'],
  perfume: ['parfüm', 'parfum', 'perfume', 'kozmetik'],
  gıda: ['gıda', 'gida', 'food'],
  gida: ['gıda', 'gida', 'food'],
  food: ['gıda', 'gida', 'food'],
  içecek: ['içecek', 'icecek', 'beverage'],
  icecek: ['içecek', 'icecek', 'beverage'],
  elektronik: ['elektronik', 'teknoloji', 'tech'],
  teknoloji: ['elektronik', 'teknoloji', 'tech'],
  'e-ticaret': ['e-ticaret', 'eticaret', 'kargo'],
  kargo: ['e-ticaret', 'kargo'],
  hediye: ['hediye', 'gift'],
  ev: ['ev', 'home'],
  ilaç: ['ilaç', 'ilac', 'sağlık', 'saglik'],
  sağlık: ['sağlık', 'saglik', 'ilaç', 'ilac'],
}

const PRODUCT_KEYS: Record<string, string[]> = {
  parfüm: ['parfüm', 'parfum', 'perfume', 'edp', 'eau de parfum', 'kolonya'],
  parfum: ['parfüm', 'parfum', 'perfume', 'edp', 'eau de parfum', 'kolonya'],
  perfume: ['parfüm', 'parfum', 'perfume', 'edp', 'eau de parfum', 'kolonya'],
  edp: ['parfüm', 'parfum', 'perfume', 'edp', 'eau de parfum'],
  krem: ['krem', 'cream', 'night cream'],
  cream: ['krem', 'cream', 'night cream'],
  serum: ['serum', 'ampul'],
  yağ: ['yağ', 'zeytinyağı', 'sos'],
  zeytinyağı: ['yağ', 'zeytinyağı'],
  sos: ['sos', 'yağ', 'dökme', 'akışkan'],
  atıştırmalık: ['atıştırmalık', 'çikolata', 'kurabiye'],
  çikolata: ['atıştırmalık', 'çikolata'],
  kulaklık: ['kulaklık', 'earbuds'],
  earbuds: ['kulaklık', 'earbuds'],
  kablo: ['kablo', 'şarj'],
  şarj: ['kablo', 'şarj'],
  askı: ['askı', 'euroslot', 'blister'],
  euroslot: ['askı', 'euroslot', 'blister'],
}

function keysFor(table: Record<string, string[]>, value: string): string[] {
  const n = norm(value)
  return table[n] ?? [n]
}

function overlap(a: string[], b: string[]): boolean {
  const set = new Set(b.map(norm))
  return a.some((x) => set.has(norm(x)))
}

export function sectorHits(template: FormaTemplate, sector: string): boolean {
  const query = keysFor(SECTOR_KEYS, sector)
  return template.sectors.some((s) => overlap(query, keysFor(SECTOR_KEYS, s)))
}

export function productHits(template: FormaTemplate, product: string): boolean {
  const query = keysFor(PRODUCT_KEYS, product)
  return template.subProducts.some((s) => {
    if (GENERIC_QUERY.has(norm(s))) return false
    return overlap(query, keysFor(PRODUCT_KEYS, s))
  })
}

export function activeTemplates(includeAdvanced = false): FormaTemplate[] {
  return FORMA_TEMPLATES.filter((t) => t.status === 'active' && (includeAdvanced || t.library !== 'advanced'))
}

/**
 * Right-rail cards: every active carton in that sector, including ECMA/aux.
 * Packaging mode filters box vs label. Product only sorts, it does not hide siblings.
 */
export function filterTemplates(brief: DesignBrief): FormaTemplate[] {
  const mode = brief.packagingMode
  const sector = norm(brief.sector)
  const product = norm(brief.subProduct)
  const hasProduct = !!product && !GENERIC_QUERY.has(product)
  const pool = activeTemplates(true).filter((t) => !mode || t.packagingMode === mode)
  const sectorPool = sector ? pool.filter((t) => sectorHits(t, sector)) : pool
  if (!sectorPool.length) return []
  if (!hasProduct) return sectorPool
  return [...sectorPool].sort((a, b) => Number(productHits(b, product)) - Number(productHits(a, product)))
}

/** One card per structure family for the current surface. Sector only sorts, it does not hide mailer/sleeve. */
export function pickerTemplates(brief: DesignBrief): FormaTemplate[] {
  const mode = brief.packagingMode || 'box'
  const pool = activeTemplates(true).filter((t) => t.packagingMode === mode)
  const ranked = brief.sector
    ? [...pool].sort((a, b) => Number(sectorHits(b, brief.sector)) - Number(sectorHits(a, brief.sector)))
    : pool
  const byStruct = new Map<string, FormaTemplate>()
  for (const t of ranked) {
    if (!byStruct.has(t.structureId)) byStruct.set(t.structureId, t)
  }
  return [...byStruct.values()]
}

export function getTemplate(id: string): FormaTemplate | undefined {
  return FORMA_TEMPLATES.find((t) => t.id === id)
}

export function pickTemplate(brief: DesignBrief): FormaTemplate {
  if (brief.templateId) {
    const exact = getTemplate(brief.templateId)
    if (exact) return exact
  }
  const matched = filterTemplates(brief)[0]
  if (matched) return matched
  // Sector without a dedicated carton (bebek, sağlık, temizlik…): stay on the requested
  // surface instead of falling back to a perfume box for a label brief.
  const mode = brief.packagingMode || 'box'
  const universal = getTemplate(mode === 'label' ? 'fm-label-universal' : 'fm-box-tuck-universal')
  return universal ?? activeTemplates(true).find((t) => t.packagingMode === mode) ?? activeTemplates(true)[0]
}

export function structureFromTemplate(template: FormaTemplate): StructureId {
  return template.structureId
}

export function modeFromTemplate(template: FormaTemplate): PackagingMode {
  return template.packagingMode
}
