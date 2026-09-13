/**
 * Type faces — per-style type family selection for Display/Product/Meta/Legal roles.
 * Extracted from languages.ts to isolate type config from palette/style data.
 */
import type { StyleType } from '../../types'

export type TypeFaceRole = {
  display: 'serif' | 'sans'
  product: 'serif' | 'sans'
  meta: 'sans'
  legal: 'sans'
}

/** Per-style type families for Display / Product / Meta / Legal. */
export function typeFaces(style: StyleType): TypeFaceRole {
  if (style === 'luxury' || style === 'classic') {
    return { display: 'serif', product: 'sans', meta: 'sans', legal: 'sans' }
  }
  if (style === 'eco') {
    return { display: 'serif', product: 'serif', meta: 'sans', legal: 'sans' }
  }
  return { display: 'sans', product: 'sans', meta: 'sans', legal: 'sans' }
}

export function fontStack(
  face: 'serif' | 'sans',
  opts: { role?: 'display' | 'product' | 'meta' | 'legal'; style?: StyleType; sector?: string } = {},
): string {
  const { role, style, sector } = opts
  if (face === 'serif') {
    if (sector === 'perfume' && (style === 'luxury' || style === 'classic')) {
      return "Palatino Linotype, Palatino, Georgia, 'Times New Roman', serif"
    }
    if (sector === 'cream' || sector === 'serum') {
      return "Palatino Linotype, Palatino, Georgia, 'Times New Roman', serif"
    }
    if (sector === 'food' || sector === 'beverage') {
      return "'Cambria', Palatino, Georgia, 'Times New Roman', serif"
    }
    if (sector === 'baby' || sector === 'health') {
      return "Garamond, Palatino, Georgia, 'Times New Roman', serif"
    }
    if (style === 'eco') {
      return "Georgia, 'Cambria', Palatino, 'Times New Roman', serif"
    }
    if (style === 'classic') {
      return "Constantia, Palatino, Georgia, 'Times New Roman', serif"
    }
    return "Georgia, 'Times New Roman', serif"
  }
  if (style === 'modern' || sector === 'electronics') {
    return 'Segoe UI, Inter, Corbel, Arial, sans-serif'
  }
  if (style === 'playful' && role === 'display') {
    return 'Trebuchet MS, Verdana, Inter, Arial, sans-serif'
  }
  if (style === 'minimal') {
    return "Inter, 'Segoe UI', Helvetica, Arial, sans-serif"
  }
  return "Inter, 'Segoe UI', Arial, sans-serif"
}
