import type { DesignRating } from '../types'

const KEY = 'forma.ratings'

export const RATING_TAGS = ['premium', 'okunabilir', 'baskıya-hazır', 'zayıf-hiyerarşi', 'renk', 'dieline'] as const

export function loadRatings(): DesignRating[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as DesignRating[]) : []
  } catch {
    return []
  }
}

export function saveRating(rating: Omit<DesignRating, 'at'>): void {
  const all = loadRatings().filter((r) => r.designId !== rating.designId)
  all.unshift({ ...rating, at: Date.now() })
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 80)))
}

export function getRating(designId: string): DesignRating | undefined {
  return loadRatings().find((r) => r.designId === designId)
}
