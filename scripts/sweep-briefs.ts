/**
 * The non-golden brief table the Phase 0 instruments share.
 *
 * One representative brief per engine sector, in the words a customer uses, crossed with every
 * mood and both surfaces, and with two opposite personalities. `sweep-two-brands.ts` reads it
 * for the "does the brand change the design" question; `measure-craft-distribution.ts` reads it
 * for "where do ordinary, non-curated faces score" — the number a gate floor has to respect.
 * Exports only; nothing runs on import.
 */
import type { DesignBrief, PackagingMode, StyleType } from '../src/types'
import { pickTemplate } from '../src/engine/catalog/catalog'
import { emptyBrief } from '../src/engine/fields'

export const SWEEP_SECTORS: { sector: string; subProduct: string; volume: string; box: [number, number, number]; label: [number, number] }[] = [
  { sector: 'parfüm', subProduct: 'eau de parfum', volume: '50 ml', box: [70, 35, 140], label: [90, 70] },
  { sector: 'serum', subProduct: 'serum', volume: '30 ml', box: [45, 45, 120], label: [80, 60] },
  { sector: 'krem', subProduct: 'yüz kremi', volume: '50 ml', box: [70, 70, 70], label: [90, 70] },
  { sector: 'bebek', subProduct: 'bebek şampuanı', volume: '250 ml', box: [70, 45, 160], label: [100, 80] },
  { sector: 'sağlık', subProduct: 'vitamin', volume: '60 kapsül', box: [60, 60, 110], label: [120, 70] },
  { sector: 'içecek', subProduct: 'kombucha', volume: '330 ml', box: [65, 65, 200], label: [140, 80] },
  { sector: 'elektronik', subProduct: 'kulaklık', volume: '', box: [90, 45, 90], label: [80, 50] },
  { sector: 'gıda', subProduct: 'bal', volume: '450 gr', box: [70, 70, 140], label: [70, 90] },
  { sector: 'temizlik', subProduct: 'yüzey temizleyici', volume: '500 ml', box: [80, 50, 220], label: [120, 90] },
]

export const SWEEP_MOODS: StyleType[] = ['luxury', 'classic', 'minimal', 'modern', 'eco', 'playful']
export const SWEEP_SURFACES: PackagingMode[] = ['box', 'label']

export const SWEEP_PERSONA = {
  A: { brandName: 'Meridian', productName: 'Aurum', audience: 'kurumsal yöneticiler, 40+', feeling: 'sakin, zarif, dingin', priceTier: 'boutique' as const, channel: 'butik mağaza' },
  B: { brandName: 'Zapp', productName: 'Vivid', audience: '18-25 gençler', feeling: 'gösterişli, enerjik, cesur', priceTier: 'mass' as const, channel: 'online' },
}

export function sweepBrief(
  row: (typeof SWEEP_SECTORS)[number],
  mood: StyleType,
  surface: PackagingMode,
  who: keyof typeof SWEEP_PERSONA,
): DesignBrief {
  const base: DesignBrief = {
    ...emptyBrief(),
    ...SWEEP_PERSONA[who],
    sector: row.sector,
    subProduct: row.subProduct,
    packagingMode: surface,
    styleType: mood,
    volume: row.volume,
    barcode: '8690000000017',
    dimensionsMm: surface === 'box' ? { L: row.box[0], W: row.box[1], H: row.box[2] } : { L: row.label[0], W: 0, H: row.label[1] },
  }
  return { ...base, templateId: pickTemplate(base).id }
}

/** Every brief in the table, in a fixed order. */
export function allSweepBriefs(): { name: string; brief: DesignBrief }[] {
  const out: { name: string; brief: DesignBrief }[] = []
  for (const row of SWEEP_SECTORS) {
    for (const mood of SWEEP_MOODS) {
      for (const surface of SWEEP_SURFACES) {
        for (const who of ['A', 'B'] as const) out.push({ name: `${row.sector}/${mood}/${surface}/${who}`, brief: sweepBrief(row, mood, surface, who) })
      }
    }
  }
  return out
}
