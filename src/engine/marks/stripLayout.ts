import type { MarkId, MarkRecipe } from './types'

export const STRIP_FLOOR_MM = 5.2
export const STRIP_TINY_MM = 36

/** Visual weight — diamond / WEEE read larger than a line icon. */
const WEIGHT: Partial<Record<MarkId, number>> = {
  flammable: 1.08,
  weee: 1.06,
  pao: 1.04,
  glassfork: 1.03,
}

export type OpticalStrip = {
  ids: MarkId[]
  size: number
  gap: number
  xs: number[]
}

function cell(id: MarkId, size: number): number {
  return size * (WEIGHT[id] ?? 1)
}

function spanOf(ids: MarkId[], size: number, gap: number): number {
  if (!ids.length) return 0
  return ids.reduce((sum, id) => sum + cell(id, size), 0) + gap * (ids.length - 1)
}

/** Center a mark strip in a band. Drops icons or shrinks before overlapping. */
export function opticalStrip(
  ids: MarkId[],
  bandW: number,
  recipe: Pick<MarkRecipe, 'placement'>,
  sizeHint?: number,
): OpticalStrip {
  const unique: MarkId[] = []
  for (const id of ids) {
    if (!unique.includes(id)) unique.push(id)
  }
  const max = Math.max(0, recipe.placement.maxIcons)
  let next = unique.slice(0, max)
  if (!next.length || bandW < STRIP_FLOOR_MM) return { ids: [], size: 0, gap: 0, xs: [] }

  const gap = recipe.placement.gapMm
  let size = sizeHint ?? recipe.placement.minMm
  while (next.length && spanOf(next, size, gap) > bandW + 0.05) {
    if (size > STRIP_FLOOR_MM) {
      size = Math.max(STRIP_FLOOR_MM, size - 0.35)
      continue
    }
    next = next.slice(0, -1)
  }
  if (!next.length) return { ids: [], size: 0, gap: 0, xs: [] }

  const total = spanOf(next, size, gap)
  let cursor = (bandW - total) / 2
  const xs = next.map((id) => {
    const x = cursor
    cursor += cell(id, size) + gap
    return x
  })
  return { ids: next, size, gap, xs }
}
