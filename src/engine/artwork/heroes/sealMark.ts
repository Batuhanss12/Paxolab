/**
 * P10b — empty octagon/hex/dot seal is retired (user veto).
 * Leftover callers paint a crest so the old geometry never ships.
 */
import { paintCrest } from './crestMark'

export function paintSeal(cx: number, cy: number, r: number, accent: string): string {
  return paintCrest(cx, cy, r, accent, false)
}
