import type { StyleType } from '../types'

export type StyleOption = {
  id: StyleType
  label: string
  hint: string
  swatch: string
}

export const STYLE_OPTIONS: StyleOption[] = [
  { id: 'luxury', label: 'Lüks', hint: 'Siyah–altın', swatch: '#c9a86c' },
  { id: 'modern', label: 'Modern', hint: 'Soğuk çizgi', swatch: '#7ec8d4' },
  { id: 'minimal', label: 'Minimal', hint: 'Hava', swatch: '#d8d4ca' },
  { id: 'eco', label: 'Eco', hint: 'Kraft', swatch: '#8a7a4e' },
  { id: 'playful', label: 'Eğlenceli', hint: 'Rozet', swatch: '#e88a4a' },
  { id: 'classic', label: 'Klasik', hint: 'Serif', swatch: '#6b1d2a' },
]

export function styleLabel(style: StyleType | ''): string {
  if (!style) return ''
  return STYLE_OPTIONS.find((s) => s.id === style)?.label ?? style
}
