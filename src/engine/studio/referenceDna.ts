/**
 * Reference DNA — the TASARIM REF folder encoded as structured archetypes.
 *
 * Each archetype records what made the reference work (background family, type pairing, frame,
 * lockup, temperament) and where it fits (sector / style / aspect). The direction resolver scores
 * these; the painters read them. Adding a reference = adding a record here + a layout, never a prompt.
 */
import type { StyleType } from '../../types'
import type { SectorId } from '../designSystem/types'
import type {
  BackgroundFamily,
  BoxArchetype,
  FrameStyle,
  LabelArchetype,
  LockupStyle,
  StudioArchetype,
  StudioSurface,
  Temperament,
  TypePairing,
} from './types'

export type ArchetypeDna = {
  id: StudioArchetype
  surface: StudioSurface
  /** Reference it was distilled from (for the process note). */
  reference: string
  backgrounds: BackgroundFamily[]
  typePairing: TypePairing
  temperaments: Temperament[]
  frame: FrameStyle
  lockup: LockupStyle
  /** 0–1 fit per sector; missing = 0.2. */
  sectors: Partial<Record<SectorId, number>>
  /** 0–1 fit per style; missing = 0.3. */
  styles: Partial<Record<StyleType, number>>
  /** Preferred face aspect (h / w). */
  aspect: 'portrait' | 'landscape' | 'any'
  /** Anatomy the layout paints, in reading order (for the process note + tests). */
  anatomy: string[]
  summaryTr: string
}

export const LABEL_DNA: Record<LabelArchetype, ArchetypeDna> = {
  'card-on-art': {
    id: 'card-on-art',
    surface: 'label',
    reference: 'woo.originals — Restorative Shampoo / Care Cream',
    backgrounds: ['botanical', 'wave'],
    typePairing: 'script-accent/sans-heavy',
    temperaments: ['vivid-mono'],
    frame: 'rounded-card',
    lockup: 'top-right-pill',
    sectors: { cream: 1, serum: 0.25, baby: 0.25, cleaning: 0.2, health: 0.4, food: 0.3, beverage: 0.3, generic: 0.5 },
    styles: { playful: 1, modern: 0.9, eco: 0.7, minimal: 0.4, luxury: 0.3, classic: 0.2 },
    aspect: 'any',
    anatomy: ['tone-on-tone botanical', 'brand pill', 'legal column', 'title card', 'claim band', 'benefit line', 'pictogram row', 'net quantity'],
    summaryTr: 'Tek renk tonunda botanik zemin, beyaz başlık kartı, koyu iddia bandı, sol legal kolon.',
  },
  'marble-frame': {
    id: 'marble-frame',
    surface: 'label',
    reference: 'Elite Brew — Mocha Frappe / Cold Brew / Iced Espresso',
    backgrounds: ['marble'],
    typePairing: 'script-accent/sans-heavy',
    temperaments: ['light-luxe', 'dark-luxe'],
    frame: 'corner-brackets',
    lockup: 'stacked-center',
    sectors: { beverage: 1, food: 0.8, perfume: 0.6, cream: 0.5, serum: 0.5, generic: 0.6 },
    styles: { luxury: 1, classic: 0.8, modern: 0.6, minimal: 0.5, eco: 0.2, playful: 0.2 },
    aspect: 'portrait',
    anatomy: ['marble field', 'brand mark', 'corner brackets', 'brand lockup', 'script prefix', 'product name', 'net quantity'],
    summaryTr: 'Mermer doku, köşe parantezli marka kilidi, altta el yazısı ön ek + kalın ürün adı.',
  },
  'diagonal-split': {
    id: 'diagonal-split',
    surface: 'label',
    reference: 'Capelli Fellici — Purifying Shampoo / Brazilian Keratin',
    backgrounds: ['diagonal'],
    typePairing: 'sans-light/sans-heavy',
    temperaments: ['dark-luxe', 'tech-dark'],
    frame: 'none',
    lockup: 'monogram-right',
    sectors: { cream: 1, serum: 0.8, electronics: 0.7, cleaning: 0.5, perfume: 0.5, health: 0.4, generic: 0.5 },
    styles: { luxury: 0.9, modern: 1, minimal: 0.6, classic: 0.4, playful: 0.2, eco: 0.1 },
    aspect: 'landscape',
    anatomy: ['diagonal metallic blocks', 'left title column', 'step chip', 'legal column', 'monogram', 'centered title', 'quality badge', 'net quantity'],
    summaryTr: 'Koyu zemin üstünde diyagonal metalik bloklar; solda ürün + legal kolon, sağda monogram ve merkez başlık.',
  },
  'line-scene': {
    id: 'line-scene',
    surface: 'label',
    reference: 'DNA Pharma — Sea Protection',
    backgrounds: ['line-scene'],
    typePairing: 'sans-light/sans-heavy',
    temperaments: ['clean-clinical', 'vivid-mono'],
    frame: 'rounded-card',
    lockup: 'stacked-center',
    sectors: { health: 1, baby: 1, serum: 1, cream: 0.35, cleaning: 0.2, generic: 0.5 },
    styles: { minimal: 1, playful: 0.8, modern: 0.8, eco: 0.5, classic: 0.3, luxury: 0.2 },
    aspect: 'portrait',
    anatomy: ['brand mark', 'two-tone title', 'spaced subtitle', 'line-drawn scene', 'net quantity'],
    summaryTr: 'Beyaz zemin, iki tonlu başlık, alt yarıda tek renk çizgi illüstrasyon.',
  },
  'landscape-badge': {
    id: 'landscape-badge',
    surface: 'label',
    reference: 'Anadolu Bal — Dağ Çiçeği Balı',
    backgrounds: ['landscape-meadow', 'paper'],
    typePairing: 'serif-display/sans-meta',
    temperaments: ['natural-warm'],
    frame: 'thin-double',
    lockup: 'stacked-center',
    sectors: { food: 1, beverage: 0.7, health: 0.3, generic: 0.4 },
    styles: { classic: 1, eco: 0.9, luxury: 0.7, modern: 0.3, minimal: 0.2, playful: 0.2 },
    aspect: 'portrait',
    anatomy: ['thin double frame', 'mountain mark', 'brand lockup', 'landscape window', 'product badge', 'benefit chips', 'net quantity'],
    summaryTr: 'Krem kâğıt, ince çift çerçeve, kemerli manzara penceresi ve koyu ürün rozeti.',
  },
  'ink-panel': {
    id: 'ink-panel',
    surface: 'label',
    reference: 'Rebull Noir — Eau de Parfum',
    backgrounds: ['ink-wash'],
    typePairing: 'spaced-serif/spaced-sans',
    temperaments: ['light-luxe', 'dark-luxe'],
    frame: 'thin-double',
    lockup: 'stacked-center',
    sectors: { perfume: 1, serum: 0.7, cream: 0.6, beverage: 0.5, generic: 0.5 },
    styles: { luxury: 1, classic: 0.7, minimal: 0.6, modern: 0.5, eco: 0.2, playful: 0.1 },
    aspect: 'portrait',
    anatomy: ['ink wash', 'metallic veins', 'thin frame', 'brand lockup', 'product name', 'category line', 'stacked tagline', 'net quantity'],
    summaryTr: 'Krem panel, köşeden yükselen mürekkep akışı ve metalik damarlar; aralıklı serif marka.',
  },
  'wave-panel': {
    id: 'wave-panel',
    surface: 'label',
    reference: 'FERAH / surface-care wave system',
    backgrounds: ['wave'],
    typePairing: 'sans-light/sans-heavy',
    temperaments: ['clean-clinical', 'vivid-mono', 'natural-warm'],
    frame: 'none',
    lockup: 'stacked-center',
    sectors: { cleaning: 1, cream: 0.35, baby: 0.3, generic: 0.4 },
    styles: { eco: 1, modern: 0.8, minimal: 0.8, playful: 0.4, luxury: 0.2, classic: 0.2 },
    aspect: 'any',
    anatomy: ['wave bands', 'brand lockup', 'category line', 'product stack', 'net quantity'],
    summaryTr: 'Yatay dalga bantları, istif sans marka, altta ürün ve net miktar.',
  },
}

export const BOX_DNA: Record<BoxArchetype, ArchetypeDna> = {
  'dark-landscape': {
    id: 'dark-landscape',
    surface: 'box',
    reference: 'GUESS Sauvage — Eau de Parfum carton',
    backgrounds: ['landscape-moon', 'marble'],
    typePairing: 'serif-display/sans-meta',
    temperaments: ['dark-luxe'],
    frame: 'none',
    lockup: 'stacked-center',
    sectors: { perfume: 1, beverage: 0.7, serum: 0.6, cream: 0.5, electronics: 0.4, generic: 0.5 },
    styles: { luxury: 1, classic: 0.7, modern: 0.5, minimal: 0.4, eco: 0.1, playful: 0.1 },
    aspect: 'portrait',
    anatomy: ['brand lockup', 'product name', 'category line', 'moonlit landscape', 'tagline', 'net quantity', 'marble spines', 'stacked manifesto', 'story back', 'pictograms + barcode'],
    summaryTr: 'Siyah + altın; ön yüzde zemine karışan ay ışığı manzarası, yanlarda mermer ve dikey manifesto.',
  },
  'ink-wash': {
    id: 'ink-wash',
    surface: 'box',
    reference: 'Rebull Noir — Eau de Parfum carton',
    backgrounds: ['ink-wash'],
    typePairing: 'spaced-serif/spaced-sans',
    temperaments: ['light-luxe'],
    frame: 'thin-double',
    lockup: 'stacked-center',
    sectors: { perfume: 1, serum: 0.8, cream: 0.7, beverage: 0.6, health: 0.4, generic: 0.5 },
    styles: { luxury: 1, classic: 0.8, minimal: 0.7, modern: 0.5, eco: 0.2, playful: 0.1 },
    aspect: 'portrait',
    anatomy: ['cream front', 'ink wash + veins', 'thin frame', 'brand lockup', 'product name', 'category line', 'stacked tagline', 'net quantity', 'navy spines', 'monogram', 'notes table back'],
    summaryTr: 'Krem ön yüz, köşeden gelen mürekkep ve altın damar; lacivert yanlar, monogram, arka nota tablosu.',
  },
  'landscape-window': {
    id: 'landscape-window',
    surface: 'box',
    reference: 'Anadolu Bal — Dağ Çiçeği Balı carton',
    backgrounds: ['landscape-meadow'],
    typePairing: 'serif-display/sans-meta',
    temperaments: ['natural-warm'],
    frame: 'thin-double',
    lockup: 'stacked-center',
    sectors: { food: 1, beverage: 0.8, health: 0.5, baby: 0.4, generic: 0.5 },
    styles: { classic: 1, eco: 0.9, luxury: 0.7, modern: 0.3, minimal: 0.2, playful: 0.3 },
    aspect: 'portrait',
    anatomy: ['thin double frame', 'mountain mark', 'brand lockup', 'arched landscape window', 'product badge', 'net quantity', 'benefit column sides', 'nutrition table back', 'QR + barcode'],
    summaryTr: 'Krem kâğıt ve ince altın çerçeve; kemerli manzara penceresi, yanlarda ikonlu fayda kolonu, arkada besin tablosu.',
  },
  'marble-frame': {
    id: 'marble-frame',
    surface: 'box',
    reference: 'Elite Brew marble system on a carton',
    backgrounds: ['marble'],
    typePairing: 'script-accent/sans-heavy',
    temperaments: ['light-luxe', 'dark-luxe'],
    frame: 'corner-brackets',
    lockup: 'stacked-center',
    sectors: { beverage: 1, food: 0.7, perfume: 0.6, cream: 0.5, generic: 0.6 },
    styles: { luxury: 0.9, classic: 0.7, modern: 0.7, minimal: 0.5, eco: 0.2, playful: 0.3 },
    aspect: 'any',
    anatomy: ['marble field', 'corner brackets', 'brand mark', 'brand lockup', 'script prefix', 'product name', 'net quantity', 'marble spines', 'story back'],
    summaryTr: 'Mermer zemin, köşe parantezli kilit; altta el yazısı ön ek ve kalın ürün adı.',
  },
  'botanical-card': {
    id: 'botanical-card',
    surface: 'box',
    reference: 'woo.originals botanical system on a carton',
    backgrounds: ['botanical', 'wave'],
    typePairing: 'script-accent/sans-heavy',
    temperaments: ['vivid-mono'],
    frame: 'rounded-card',
    lockup: 'top-right-pill',
    sectors: { cream: 1, serum: 0.25, baby: 0.25, cleaning: 0.2, health: 0.5, food: 0.4, generic: 0.5 },
    styles: { playful: 1, modern: 0.9, eco: 0.7, minimal: 0.4, luxury: 0.2, classic: 0.2 },
    aspect: 'any',
    anatomy: ['tone-on-tone botanical', 'brand pill', 'title card', 'claim band', 'benefit line', 'net quantity', 'benefit sides', 'legal back'],
    summaryTr: 'Canlı tek ton botanik zemin, beyaz başlık kartı ve koyu iddia bandı.',
  },
  'diagonal-tech': {
    id: 'diagonal-tech',
    surface: 'box',
    reference: 'Capelli Fellici diagonal system on a carton',
    backgrounds: ['diagonal', 'circuit'],
    typePairing: 'sans-light/sans-heavy',
    temperaments: ['tech-dark', 'dark-luxe'],
    frame: 'none',
    lockup: 'left-column',
    sectors: { electronics: 1, cream: 0.7, cleaning: 0.6, serum: 0.5, health: 0.4, generic: 0.5 },
    styles: { modern: 1, minimal: 0.7, luxury: 0.6, classic: 0.2, playful: 0.3, eco: 0.1 },
    aspect: 'any',
    anatomy: ['diagonal blocks', 'left title column', 'spec chips', 'monogram', 'quality badge', 'net quantity', 'spec sides', 'spec back'],
    summaryTr: 'Antrasit zemin, diyagonal metalik bloklar; solda hafif + kalın başlık, spec çipleri.',
  },
  'line-scene': {
    id: 'line-scene',
    surface: 'box',
    reference: 'DNA Pharma — Sea Protection carton',
    backgrounds: ['line-scene', 'paper'],
    typePairing: 'sans-light/sans-heavy',
    temperaments: ['clean-clinical', 'vivid-mono'],
    frame: 'none',
    lockup: 'stacked-center',
    sectors: { health: 1, baby: 1, serum: 1, cream: 0.35, generic: 0.4 },
    styles: { minimal: 1, modern: 0.8, playful: 0.6, eco: 0.4, luxury: 0.2, classic: 0.2 },
    aspect: 'portrait',
    anatomy: ['white field', 'brand mark', 'two-tone title', 'line-drawn scene', 'net quantity', 'legal back'],
    summaryTr: 'Beyaz klinik zemin, iki tonlu başlık, alt yarıda tek çizgi illüstrasyon.',
  },
  'wave-panel': {
    id: 'wave-panel',
    surface: 'box',
    reference: 'FERAH / surface-care wave system on a carton',
    backgrounds: ['wave'],
    typePairing: 'sans-light/sans-heavy',
    temperaments: ['clean-clinical', 'vivid-mono', 'natural-warm'],
    frame: 'none',
    lockup: 'stacked-center',
    sectors: { cleaning: 1, cream: 0.3, baby: 0.25, generic: 0.4 },
    styles: { eco: 1, modern: 0.8, minimal: 0.7, playful: 0.4, luxury: 0.15, classic: 0.2 },
    aspect: 'any',
    anatomy: ['wave bands', 'brand lockup', 'category line', 'product stack', 'net quantity', 'spec sides', 'legal back'],
    summaryTr: 'Dalga bantlı zemin, istif sans marka; temizlik ve ev bakım.',
  },
}

export function dnaFor(archetype: StudioArchetype, surface: StudioSurface): ArchetypeDna {
  if (surface === 'label') {
    return LABEL_DNA[archetype as LabelArchetype] ?? LABEL_DNA['marble-frame']
  }
  return BOX_DNA[archetype as BoxArchetype] ?? BOX_DNA['dark-landscape']
}

export function archetypesFor(surface: StudioSurface): ArchetypeDna[] {
  return surface === 'label' ? Object.values(LABEL_DNA) : Object.values(BOX_DNA)
}

export const ALL_ARCHETYPES: StudioArchetype[] = [
  ...(Object.keys(LABEL_DNA) as LabelArchetype[]),
  ...(Object.keys(BOX_DNA) as BoxArchetype[]).filter((id) => !(id in LABEL_DNA)),
]

export const ALL_BACKGROUNDS: BackgroundFamily[] = [
  'marble',
  'botanical',
  'diagonal',
  'landscape-moon',
  'landscape-meadow',
  'ink-wash',
  'line-scene',
  'paper',
  'wave',
  'circuit',
]

export const ALL_TEMPERAMENTS: Temperament[] = ['dark-luxe', 'light-luxe', 'vivid-mono', 'natural-warm', 'clean-clinical', 'tech-dark']

export const ALL_TYPE_PAIRINGS: TypePairing[] = [
  'serif-display/sans-meta',
  'script-accent/sans-heavy',
  'sans-light/sans-heavy',
  'spaced-serif/spaced-sans',
]

export function isArchetype(value: unknown, surface?: StudioSurface): value is StudioArchetype {
  if (typeof value !== 'string') return false
  if (surface === 'label') return value in LABEL_DNA
  if (surface === 'box') return value in BOX_DNA
  return value in LABEL_DNA || value in BOX_DNA
}

export function isBackground(value: unknown): value is BackgroundFamily {
  return typeof value === 'string' && (ALL_BACKGROUNDS as string[]).includes(value)
}

export function isTemperament(value: unknown): value is Temperament {
  return typeof value === 'string' && (ALL_TEMPERAMENTS as string[]).includes(value)
}

export function isTypePairing(value: unknown): value is TypePairing {
  return typeof value === 'string' && (ALL_TYPE_PAIRINGS as string[]).includes(value)
}
