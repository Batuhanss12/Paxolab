/**
 * ArtBox — shared bbox type for front-panel decor elements.
 * P1-A: extends collision detection beyond lockup to claim strip, badges, volume, NET.
 */
export type ArtBox = {
  id: string
  x: number
  y: number
  w: number
  h: number
}

/** Check if two ArtBoxes overlap (with optional padding). */
export function boxesOverlap(a: ArtBox, b: ArtBox, pad = 0): boolean {
  return !(
    a.x + a.w + pad < b.x ||
    b.x + b.w + pad < a.x ||
    a.y + a.h + pad < b.y ||
    b.y + b.h + pad < a.y
  )
}

/** Pairwise gap between two ArtBoxes (negative = overlap). */
export function boxGap(a: ArtBox, b: ArtBox): number {
  const dx = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w))
  const dy = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h))
  return Math.min(dx, dy)
}
