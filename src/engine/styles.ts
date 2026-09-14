import type { StyleType } from '../types'

export type StyleOption = {
  id: StyleType
  label: string
  hint: string
  swatch: string
}

export const STYLE_OPTIONS: StyleOption[] = [
  { id: 'luxury', label: 'Lüks', hint: 'Sıkı, yüksek kontrast, metalik vurgu — kostüm değil', swatch: '#c9a86c' },
  { id: 'modern', label: 'Modern', hint: 'Keskin sans, seyrek süs', swatch: '#7ec8d4' },
  { id: 'minimal', label: 'Minimal', hint: 'Hava, az motif', swatch: '#d8d4ca' },
  { id: 'eco', label: 'Eco', hint: 'Doğal, botanik eğilim', swatch: '#8a7a4e' },
  { id: 'playful', label: 'Eğlenceli', hint: 'Canlı, rozet eğilimi', swatch: '#e88a4a' },
  { id: 'classic', label: 'Klasik', hint: 'Serif, klasik süs eğilimi', swatch: '#6b1d2a' },
]

export function styleLabel(style: StyleType | ''): string {
  if (!style) return ''
  return STYLE_OPTIONS.find((s) => s.id === style)?.label ?? style
}
