/**
 * Curated single-ink marks, ported one by one from the studio's own motif library
 * (`assets/motif-families`, in-house vectors), for the heraldic members the reference set uses:
 * the cartouche arc over a wordmark, the ribbon corners, the double-line corner, the crest spot
 * and the olive wreath (R20, R29, R30). Each is the file's own paths, stroke in `currentColor`,
 * inlined here rather than imported at build time so the engine reads the same in the SPA, in
 * vite-node and under the server's tsx — no bundler feature in the way of a print file.
 *
 * A motif is placed by `paintMotif`: scaled from its own viewBox into a box, its colour the
 * caller's, its stroke weight scaled with it so a hairline stays a hairline at any size. It draws
 * paths only — no references, no text — which is the export contract every other studio element
 * keeps.
 */
export type MotifKind = 'cartouche-arc' | 'ribbon-corner' | 'double-line-corner' | 'crest-spot' | 'olive-wreath'

type Motif = { w: number; h: number; strokeWidth: number; linecap: 'round' | 'square'; body: string }

const MOTIFS: Record<MotifKind, Motif> = {
  'cartouche-arc': {
    w: 100,
    h: 48,
    strokeWidth: 1.35,
    linecap: 'round',
    body:
      '<path d="M8 34 C28 10 72 10 92 34"/><path d="M16 34 C32 16 68 16 84 34"/><path d="M8 34 C4 28 6 22 12 24"/><path d="M92 34 C96 28 94 22 88 24"/>' +
      '<path d="M20 34 H80" opacity="0.5"/><path d="M50 14 L53 20 H47 Z"/><path d="M12 34 V38" opacity="0.55"/><path d="M88 34 V38" opacity="0.55"/>',
  },
  'ribbon-corner': {
    w: 80,
    h: 56,
    strokeWidth: 1.4,
    linecap: 'round',
    body:
      '<path d="M6 34 C18 16 30 12 40 20 C50 12 62 16 74 34"/><path d="M16 32 C26 42 34 46 40 46 C46 46 54 42 64 32"/>' +
      '<path d="M22 30 C28 36 36 38 40 38 C44 38 52 36 58 30" opacity="0.55"/><path d="M10 34 L4 44 L16 38"/><path d="M70 34 L76 44 L64 38"/>' +
      '<path d="M36 20 L40 16 L44 20"/><path d="M32 44 H48" opacity="0.5"/>',
  },
  'double-line-corner': {
    w: 48,
    h: 48,
    strokeWidth: 1.35,
    linecap: 'square',
    body: '<path d="M7 41 V7 H41"/><path d="M12 41 V12 H41" opacity="0.6"/><path d="M7 7 L12 12"/><path d="M7 18 H14"/><path d="M18 7 V14"/><path d="M7 7 L4 4 M7 7 L10 4 M7 7 L4 10" opacity="0.45"/>',
  },
  'crest-spot': {
    w: 72,
    h: 88,
    strokeWidth: 1.45,
    linecap: 'round',
    body:
      '<path d="M36 8 L60 26 V56 C60 70 36 82 36 82 C36 82 12 70 12 56 V26 Z"/><path d="M36 16 L52 28 V54 C52 64 36 74 36 74 C36 74 20 64 20 54 V28 Z" opacity="0.85"/>' +
      '<path d="M24 12 H48"/><path d="M28 8 H44 L36 4 Z"/><path d="M36 32 L42 42 H30 Z"/><path d="M36 24 V70" opacity="0.45"/><path d="M26 38 H46" opacity="0.45"/>' +
      '<path d="M18 78 C26 72 46 72 54 78 C46 84 26 84 18 78 Z"/><path d="M26 78 H46" opacity="0.55"/>',
  },
  'olive-wreath': {
    w: 100,
    h: 100,
    strokeWidth: 1.55,
    linecap: 'round',
    body:
      '<path d="M50 88 C28 80 16 62 18 42 C20 24 34 14 50 12"/><path d="M50 88 C72 80 84 62 82 42 C80 24 66 14 50 12"/>' +
      '<path d="M24 70 C18 62 20 52 28 48 C24 56 24 64 24 70 Z"/><path d="M28 52 C22 46 24 36 32 32 C28 40 28 48 28 52 Z"/><path d="M34 36 C30 28 34 20 42 18 C36 26 34 32 34 36 Z"/>' +
      '<path d="M76 70 C82 62 80 52 72 48 C76 56 76 64 76 70 Z"/><path d="M72 52 C78 46 76 36 68 32 C72 40 72 48 72 52 Z"/><path d="M66 36 C70 28 66 20 58 18 C64 26 66 32 66 36 Z"/>' +
      '<path d="M42 22 C46 16 54 16 58 22" opacity="0.7"/><ellipse cx="30" cy="58" rx="2.1" ry="2.7" fill="currentColor" stroke="none"/><ellipse cx="70" cy="58" rx="2.1" ry="2.7" fill="currentColor" stroke="none"/>' +
      '<ellipse cx="50" cy="20" rx="1.8" ry="2.3" fill="currentColor" stroke="none"/><path d="M50 12 V22" opacity="0.55"/>',
  },
}

const f = (n: number) => (Math.round(n * 1000) / 1000).toString()

/** The motif's own proportions, for a caller sizing a box to it. */
export function motifAspect(kind: MotifKind): number {
  const m = MOTIFS[kind]
  return m.h / m.w
}

/**
 * Draw a motif fitted into `boxW × boxH` at `(x, y)` (top-left), keeping its proportions and
 * centring it in the box. `flipX` mirrors it about its own centre — the corners come as one
 * drawing and are reflected into place. The stroke scales with the drawing and never drops below
 * a printable hairline.
 */
export function paintMotif(
  kind: MotifKind,
  x: number,
  y: number,
  boxW: number,
  boxH: number,
  color: string,
  opts: { opacity?: number; flipX?: boolean; flipY?: boolean } = {},
): string {
  const m = MOTIFS[kind]
  const scale = Math.min(boxW / m.w, boxH / m.h)
  const dx = x + (boxW - m.w * scale) / 2
  const dy = y + (boxH - m.h * scale) / 2
  const sw = Math.max(0.16 / scale, m.strokeWidth)
  const flip = opts.flipX || opts.flipY ? ` translate(${f(opts.flipX ? m.w : 0)} ${f(opts.flipY ? m.h : 0)}) scale(${opts.flipX ? -1 : 1} ${opts.flipY ? -1 : 1})` : ''
  const opacity = opts.opacity != null && opts.opacity < 1 ? ` opacity="${f(opts.opacity)}"` : ''
  return (
    `<g data-art="motif" data-motif="${kind}" transform="translate(${f(dx)} ${f(dy)}) scale(${f(scale)})${flip}" fill="none" stroke="${color}" stroke-width="${f(sw)}" stroke-linecap="${m.linecap}" stroke-linejoin="round"${opacity}>` +
    m.body.replace(/currentColor/g, color) +
    `</g>`
  )
}
