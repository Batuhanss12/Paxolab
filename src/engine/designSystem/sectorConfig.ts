/**
 * Sector configuration — data-driven sector and sub-product definitions.
 * Add a new sector by appending to SECTORS; no code changes needed in
 * resolveSector / resolveSubProduct / extractFields.
 *
 * Order matters: more specific sectors (perfume, serum) must be checked
 * before generic ones (cosmetics, food). The array order is preserved
 * by resolveSector — first match wins.
 */
import type { SectorId } from './types'

export type SectorKeywordDef = {
  id: SectorId
  /** Turkish + English keywords for sector detection. */
  keywords: string[]
  /** Sub-product definitions for this sector. */
  subProducts: SubProductDef[]
  /** Fallback sub-product when no keyword matches. */
  defaultSubProduct: string
}

export type SubProductDef = {
  id: string
  keywords: string[]
}

export const SECTORS: SectorKeywordDef[] = [
  {
    id: 'perfume',
    keywords: ['parfüm', 'parfum', 'perfume', 'eau de', 'edp', 'kolonya', 'cologne'],
    defaultSubProduct: 'parfum',
    subProducts: [
      { id: 'cologne', keywords: ['kolonya', 'cologne'] },
      { id: 'parfum', keywords: ['parfüm', 'parfum', 'perfume', 'eau de', 'edp'] },
    ],
  },
  {
    id: 'serum',
    keywords: ['serum', 'ampul'],
    defaultSubProduct: 'serum',
    subProducts: [{ id: 'serum', keywords: ['serum', 'ampul'] }],
  },
  {
    id: 'cream',
    keywords: ['krem', 'cream', 'kozmetik', 'cilt'],
    defaultSubProduct: 'cream',
    subProducts: [{ id: 'cream', keywords: ['krem', 'cream', 'kozmetik', 'cilt'] }],
  },
  {
    id: 'baby',
    keywords: ['bebek', 'baby', 'yenidoğan', 'newborn', 'çocuk bakım'],
    defaultSubProduct: 'baby',
    subProducts: [{ id: 'baby', keywords: ['bebek', 'baby', 'yenidoğan', 'newborn', 'çocuk bakım'] }],
  },
  {
    id: 'health',
    keywords: ['ilaç', 'pharma', 'eczane', 'takviye', 'supplement', 'vitamin', 'probiyotik', 'mineral', 'sağlık'],
    defaultSubProduct: 'health',
    subProducts: [{ id: 'health', keywords: ['ilaç', 'pharma', 'eczane', 'takviye', 'supplement', 'vitamin', 'probiyotik', 'mineral', 'sağlık'] }],
  },
  {
    id: 'beverage',
    keywords: ['içecek', 'beverage', 'meyve suyu', 'soda', 'gazoz', 'kombucha', 'şarap', 'wine', 'bira', 'beer', 'su şişe'],
    defaultSubProduct: 'beverage',
    subProducts: [{ id: 'beverage', keywords: ['içecek', 'beverage', 'meyve suyu', 'soda', 'gazoz', 'kombucha', 'şarap', 'wine', 'bira', 'beer', 'su şişe'] }],
  },
  {
    id: 'electronics',
    keywords: ['elektronik', 'teknoloji', 'kulaklık', 'kablo', 'cihaz', 'earbuds', 'şarj'],
    defaultSubProduct: 'elec-generic',
    subProducts: [
      { id: 'audio', keywords: ['kulaklık', 'earbuds', 'audio'] },
      { id: 'cable', keywords: ['kablo', 'şarj', 'cable'] },
      { id: 'elec-generic', keywords: ['elektronik', 'teknoloji', 'cihaz'] },
    ],
  },
  {
    id: 'food',
    keywords: ['gıda', 'yağ', 'çay', 'atıştırmalık', 'reçel', 'bal', 'çikolata', 'zeytin', 'sızma', 'kahve', 'coffee'],
    defaultSubProduct: 'food-generic',
    subProducts: [
      { id: 'honey', keywords: ['bal', 'honey'] },
      { id: 'oil', keywords: ['yağ', 'zeytin', 'oil', 'sızma'] },
      { id: 'snack', keywords: ['atıştırmalık', 'çikolata', 'snack'] },
      { id: 'bakery', keywords: ['kurabiye', 'ekmek', 'bak'] },
      { id: 'coffee', keywords: ['kahve', 'coffee', 'espresso'] },
      { id: 'beverage', keywords: ['çay', 'içecek', 'meyve suyu', 'beverage'] },
      { id: 'food-generic', keywords: ['gıda', 'reçel'] },
    ],
  },
  {
    id: 'cleaning',
    keywords: ['temizlik', 'cleaning', 'deterjan', 'yüzey bakım', 'dezenfektan'],
    defaultSubProduct: 'cleaning',
    subProducts: [{ id: 'cleaning', keywords: ['temizlik', 'cleaning', 'deterjan', 'yüzey bakım', 'dezenfektan'] }],
  },
]

/** Build a regex from a keyword list (case-insensitive, Turkish locale). */
export function keywordRegex(keywords: string[]): RegExp {
  const escaped = keywords
    .sort((a, b) => b.length - a.length) // longer first to avoid partial matches
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  return new RegExp(escaped, 'i')
}

/** All sector IDs in order. */
export const SECTOR_IDS: SectorId[] = SECTORS.map((s) => s.id).concat('generic')
