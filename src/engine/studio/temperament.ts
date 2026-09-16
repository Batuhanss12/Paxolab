/**
 * Studio temperament — the StyleBar chips on the studio path.
 * Kit still uses STYLE_OPTIONS (luxury/modern/eco); this is palette role, not a costume kit.
 */
import type { Temperament } from './types'

export type TemperamentOption = {
  id: Temperament
  label: string
  hint: string
  swatch: string
}

export const TEMPERAMENT_OPTIONS: TemperamentOption[] = [
  { id: 'dark-luxe', label: 'Koyu lüks', hint: 'Koyu zemin, metalik vurgu', swatch: '#1a1410' },
  { id: 'light-luxe', label: 'Açık lüks', hint: 'Krem zemin, derin mürekkep', swatch: '#f3ead8' },
  { id: 'vivid-mono', label: 'Canlı', hint: 'Doygun tek ton, ton-üstü-ton', swatch: '#2bb7b3' },
  { id: 'natural-warm', label: 'Doğal', hint: 'Krem kâğıt, altın, kahve', swatch: '#c4a574' },
  { id: 'clean-clinical', label: 'Klinik', hint: 'Beyaz zemin, tek mürekkep', swatch: '#f7f4ee' },
  { id: 'tech-dark', label: 'Teknik', hint: 'Antrasit, soğuk vurgu', swatch: '#15181d' },
]

export const TEMPERAMENT_TALK: Record<Temperament, string> = {
  'dark-luxe': 'koyu lüks',
  'light-luxe': 'açık lüks',
  'vivid-mono': 'canlı',
  'natural-warm': 'doğal',
  'clean-clinical': 'klinik',
  'tech-dark': 'teknik',
}

export function temperamentTalk(id: Temperament | string | undefined): string {
  if (id && id in TEMPERAMENT_TALK) return TEMPERAMENT_TALK[id as Temperament]
  return 'bu ruh'
}

export function temperamentOption(id: Temperament): TemperamentOption {
  return TEMPERAMENT_OPTIONS.find((row) => row.id === id) ?? TEMPERAMENT_OPTIONS[0]!
}
