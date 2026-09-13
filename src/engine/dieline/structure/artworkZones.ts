import type { DesignBrief, DielineModel, Panel, Point } from '../../../types'
import type { ArtworkZone, BleedConfig } from './types'

function offsetBox(panel: Panel, delta: number): Point[] {
  const x = panel.x - delta
  const y = panel.y - delta
  const w = Math.max(0.5, panel.w + delta * 2)
  const h = Math.max(0.5, panel.h + delta * 2)
  if (delta < 0) {
    const inset = -delta
    return [
      { x: panel.x + inset, y: panel.y + inset },
      { x: panel.x + panel.w - inset, y: panel.y + inset },
      { x: panel.x + panel.w - inset, y: panel.y + panel.h - inset },
      { x: panel.x + inset, y: panel.y + panel.h - inset },
    ]
  }
  return [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ]
}

function faceOf(panel: Panel): ArtworkZone['face'] {
  const id = panel.id.toLowerCase()
  if (panel.kind === 'hero-front' || id === 'front' || id === 'label' || id === 'trayfront') return 'front'
  if (panel.kind === 'legal-back' || id === 'back') return 'back'
  if (id.includes('left')) return 'left'
  if (id.includes('right')) return 'right'
  if (id.includes('top') || id.includes('lid')) return 'top'
  if (id.includes('bottom')) return 'bottom'
  return 'other'
}

function innerRect(panel: Panel, inset: number, y0: number, y1: number): Point[] {
  const x = panel.x + inset
  const w = Math.max(1, panel.w - inset * 2)
  const y = panel.y + inset + (panel.h - inset * 2) * y0
  const h = Math.max(1, (panel.h - inset * 2) * (y1 - y0))
  return [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ]
}

function sectorKey(brief?: DesignBrief): 'cosmetics' | 'food' | 'pharma' | 'other' {
  const s = `${brief?.sector ?? ''} ${brief?.subProduct ?? ''}`.toLocaleLowerCase('tr')
  if (/ilaç|pharma|eczane/.test(s)) return 'pharma'
  if (/gıda|food|yiyecek/.test(s)) return 'food'
  if (/kozmetik|parfüm|perfume|krem|serum/.test(s)) return 'cosmetics'
  return 'other'
}

export function artworkZonesFromModel(
  model: DielineModel,
  bleed: BleedConfig,
  safeInset: number,
  brief?: DesignBrief,
): ArtworkZone[] {
  const sector = sectorKey(brief)
  const zones: ArtworkZone[] = []
  for (const panel of model.panels) {
    if (panel.kind === 'glue' || model.glueIds.includes(panel.id)) continue
    if (panel.kind === 'device-overlay' || panel.kind === 'product-window') continue
    const face = faceOf(panel)
    const printable = offsetBox(panel, 0)
    const zone: ArtworkZone = {
      panelId: panel.id,
      face,
      printablePolygon: printable,
      bleedPolygon: offsetBox(panel, bleed.amount),
      safePolygon: offsetBox(panel, -safeInset),
    }

    const placeholder =
      !!brief?.barcodeDefaulted || !!brief?.manufacturerDefaulted || !!brief?.addressDefaulted

    if (face === 'back') {
      if (brief?.barcode || brief?.barcodeDefaulted) zone.barcodeZone = innerRect(panel, safeInset + 1, 0.72, 0.96)
      if (brief?.manufacturerName) zone.manufacturerZone = innerRect(panel, safeInset + 1, 0.48, 0.7)
    }
    if (face === 'left' || face === 'right') {
      if (sector === 'cosmetics' || sector === 'food' || sector === 'pharma') {
        zone.ingredientsZone = innerRect(panel, safeInset + 0.8, 0.12, 0.55)
        zone.warningZone = innerRect(panel, safeInset + 0.8, 0.58, 0.88)
      }
    }
    if (face === 'front' && brief?.volume) {
      zone.netWeightZone = innerRect(panel, safeInset + 1, 0.82, 0.96)
    }
    if (placeholder) zone.placeholder = true
    zones.push(zone)
  }
  return zones
}
