/**
 * Faz 2.11–2.15 — LockupId chrome around the existing type stack.
 * Does not move brand/product/tagline. Typography math stays in lockupLayout.
 * Label wrap/stack own grammar-native chrome; they are not remapped to box LockupIds.
 */
import type { Palette, Panel } from '../../../types'
import type { LockupLayout } from '../../designSystem/lockupLayout'
import type { DesignSystem, LockupId } from '../../designSystem/types'

type FrontLayout = LockupLayout

const CRAFTED: ReadonlySet<LockupId> = new Set([
  'harvest-seal',
  'centered-crest',
  'soft-oval',
  'air-rule',
  'tech-grid',
  'serif-cartouche',
  'metal-plaque',
  'stamp-center',
  'left-index',
  'badge-capsule',
  'label-wrap',
  'label-stack',
])

export function lockupOwnsRule(lockup: LockupId): boolean {
  return CRAFTED.has(lockup)
}

function n(v: number): string {
  return v.toFixed(2)
}

function column(layout: FrontLayout, panel: Panel): { cx: number; top: number; bot: number; halfW: number } {
  const brandTop = Math.min(...(layout.brandYs.length ? layout.brandYs : [layout.brandY])) - layout.brandSize * 0.78
  const bot = layout.taglineY + layout.taglineSize * 0.45
  const halfW = Math.min(panel.w * 0.28, Math.max(11, layout.rect.w * 0.34))
  return { cx: layout.ax, top: brandTop, bot, halfW }
}

function harvestRule(cx: number, y: number, half: number, accent: string, left: boolean): string {
  const x1 = left ? cx : cx - half
  const x2 = cx + half
  return `
    <line x1="${n(x1)}" y1="${n(y)}" x2="${n(x2)}" y2="${n(y)}" stroke="${accent}" stroke-width="0.42" />
    <ellipse cx="${n(x1 + 2.2)}" cy="${n(y)}" rx="1.15" ry="1.55" fill="${accent}" fill-opacity="0.85" />
    <ellipse cx="${n(x2 - 2.2)}" cy="${n(y)}" rx="1.15" ry="1.55" fill="${accent}" fill-opacity="0.85" />
  `
}

function harvestSprig(x: number, y: number, accent: string, flip: boolean): string {
  const s = flip ? -1 : 1
  return `
    <path d="M${n(x)} ${n(y - 7.2)} C${n(x + s * 0.8)} ${n(y - 2)} ${n(x - s * 0.6)} ${n(y + 2.4)} ${n(x)} ${n(y + 7.4)}" fill="none" stroke="${accent}" stroke-width="0.38" stroke-linecap="round" />
    <path d="M${n(x)} ${n(y - 3.6)} C${n(x + s * 4.2)} ${n(y - 2.2)} ${n(x + s * 4.6)} ${n(y - 0.2)} ${n(x + s * 1.1)} ${n(y + 0.4)} Z" fill="none" stroke="${accent}" stroke-width="0.32" />
    <path d="M${n(x)} ${n(y + 0.8)} C${n(x + s * 3.8)} ${n(y + 2)} ${n(x + s * 4.2)} ${n(y + 3.8)} ${n(x + s * 1)} ${n(y + 4.4)} Z" fill="none" stroke="${accent}" stroke-width="0.32" />
    <ellipse cx="${n(x + s * 3.1)}" cy="${n(y + 0.2)}" rx="1" ry="1.25" fill="${accent}" />
  `
}

function crestBar(cx: number, y: number, half: number, accent: string, left: boolean): string {
  const x1 = left ? cx : cx - half
  const x2 = cx + half
  return `
    <line x1="${n(x1)}" y1="${n(y - 0.38)}" x2="${n(x2)}" y2="${n(y - 0.38)}" stroke="${accent}" stroke-width="0.28" />
    <line x1="${n(x1)}" y1="${n(y + 0.38)}" x2="${n(x2)}" y2="${n(y + 0.38)}" stroke="${accent}" stroke-width="0.22" />
    <line x1="${n(x1)}" y1="${n(y - 0.92)}" x2="${n(x2)}" y2="${n(y - 0.92)}" stroke="${accent}" stroke-opacity="0.08" stroke-width="0.1" />
    <line x1="${n(x1)}" y1="${n(y + 0.92)}" x2="${n(x2)}" y2="${n(y + 0.92)}" stroke="${accent}" stroke-opacity="0.06" stroke-width="0.1" />
    <path d="M${n(cx)} ${n(y - 1.15)} L${n(cx + 0.85)} ${n(y)} L${n(cx)} ${n(y + 1.15)} L${n(cx - 0.85)} ${n(y)} Z" fill="${accent}" />
    <path d="M${n(x1)} ${n(y - 1.05)} V${n(y + 1.05)}" fill="none" stroke="${accent}" stroke-width="0.28" />
    <path d="M${n(x2)} ${n(y - 1.05)} V${n(y + 1.05)}" fill="none" stroke="${accent}" stroke-width="0.28" />
  `
}


function ovalRing(cx: number, top: number, bot: number, halfW: number, accent: string): string {
  const cy = (top + bot) / 2
  const ry = Math.max(10, (bot - top) / 2 + 2.4)
  const rx = Math.max(halfW + 2.8, ry * 0.62)
  return `
    <ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="none" stroke="${accent}" stroke-width="0.42" />
    <ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx - 1.55)}" ry="${n(ry - 1.55)}" fill="none" stroke="${accent}" stroke-opacity="0.5" stroke-width="0.22" />
    <line x1="${n(cx)}" y1="${n(cy - ry)}" x2="${n(cx)}" y2="${n(cy - ry + 1.6)}" stroke="${accent}" stroke-width="0.28" />
    <line x1="${n(cx)}" y1="${n(cy + ry - 1.6)}" x2="${n(cx)}" y2="${n(cy + ry)}" stroke="${accent}" stroke-width="0.28" />
  `
}

function airRule(cx: number, y: number, half: number, fg: string, left: boolean): string {
  const x1 = left ? cx : cx - half
  const x2 = cx + half
  return `
    <line x1="${n(x1)}" y1="${n(y - 0.28)}" x2="${n(x2)}" y2="${n(y - 0.28)}" stroke="${fg}" stroke-width="0.22" />
    <line x1="${n(x1)}" y1="${n(y + 0.32)}" x2="${n(x2)}" y2="${n(y + 0.32)}" stroke="${fg}" stroke-opacity="0.55" stroke-width="0.16" />
    <line x1="${n(x1)}" y1="${n(y - 0.85)}" x2="${n(x1)}" y2="${n(y + 0.9)}" stroke="${fg}" stroke-width="0.2" />
    <line x1="${n(x2)}" y1="${n(y - 0.85)}" x2="${n(x2)}" y2="${n(y + 0.9)}" stroke="${fg}" stroke-width="0.2" />
  `
}

function cartoucheFrame(cx: number, top: number, bot: number, halfW: number, accent: string): string {
  const pad = 3.2
  const x = cx - halfW - pad
  const w = (halfW + pad) * 2
  const y = top - 2.6
  const h = Math.max(16, bot - top + 5.4)
  const rr = Math.min(3.6, h * 0.2)
  const cy = y + h / 2
  return `
    <rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(rr)}" fill="none" stroke="${accent}" stroke-width="0.38" />
    <rect x="${n(x + 1.35)}" y="${n(y + 1.35)}" width="${n(w - 2.7)}" height="${n(h - 2.7)}" rx="${n(Math.max(1.6, rr - 0.7))}" fill="none" stroke="${accent}" stroke-opacity="0.5" stroke-width="0.2" />
    <path d="M${n(x + 0.35)} ${n(cy - 5.2)} C${n(x - 2.4)} ${n(cy - 1.4)} ${n(x - 2.4)} ${n(cy + 1.4)} ${n(x + 0.35)} ${n(cy + 5.2)}" fill="none" stroke="${accent}" stroke-width="0.32" stroke-linecap="round" />
    <path d="M${n(x + w - 0.35)} ${n(cy - 5.2)} C${n(x + w + 2.4)} ${n(cy - 1.4)} ${n(x + w + 2.4)} ${n(cy + 1.4)} ${n(x + w - 0.35)} ${n(cy + 5.2)}" fill="none" stroke="${accent}" stroke-width="0.32" stroke-linecap="round" />
  `
}

function plaquePlate(cx: number, top: number, bot: number, halfW: number, accent: string, left: boolean, panelW: number): string {
  const pad = 2.8
  const w = Math.min(panelW * 0.62, left ? Math.max(halfW * 1.65, 28) : (halfW + pad) * 2)
  const x = left ? cx - 1.1 : cx - w / 2
  const y = top - 2.2
  const h = Math.max(14, bot - top + 4.6)
  const tick = 1.55
  return `
    <rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="1.15" fill="${accent}" fill-opacity="0.05" stroke="${accent}" stroke-width="0.32" />
    <rect x="${n(x + 1.15)}" y="${n(y + 1.15)}" width="${n(w - 2.3)}" height="${n(h - 2.3)}" rx="0.7" fill="none" stroke="${accent}" stroke-opacity="0.4" stroke-width="0.18" />
    <line x1="${n(x + 2.4)}" y1="${n(y + 0.55)}" x2="${n(x + w - 2.4)}" y2="${n(y + 0.55)}" stroke="${accent}" stroke-width="0.2" />
    <line x1="${n(x + 2.4)}" y1="${n(y + h - 0.55)}" x2="${n(x + w - 2.4)}" y2="${n(y + h - 0.55)}" stroke="${accent}" stroke-opacity="0.55" stroke-width="0.16" />
    <line x1="${n(x)}" y1="${n(y)}" x2="${n(x + tick)}" y2="${n(y)}" stroke="${accent}" stroke-width="0.28" />
    <line x1="${n(x)}" y1="${n(y)}" x2="${n(x)}" y2="${n(y + tick)}" stroke="${accent}" stroke-width="0.28" />
    <line x1="${n(x + w)}" y1="${n(y)}" x2="${n(x + w - tick)}" y2="${n(y)}" stroke="${accent}" stroke-width="0.28" />
    <line x1="${n(x + w)}" y1="${n(y)}" x2="${n(x + w)}" y2="${n(y + tick)}" stroke="${accent}" stroke-width="0.28" />
    <line x1="${n(x)}" y1="${n(y + h)}" x2="${n(x + tick)}" y2="${n(y + h)}" stroke="${accent}" stroke-width="0.28" />
    <line x1="${n(x)}" y1="${n(y + h)}" x2="${n(x)}" y2="${n(y + h - tick)}" stroke="${accent}" stroke-width="0.28" />
    <line x1="${n(x + w)}" y1="${n(y + h)}" x2="${n(x + w - tick)}" y2="${n(y + h)}" stroke="${accent}" stroke-width="0.28" />
    <line x1="${n(x + w)}" y1="${n(y + h)}" x2="${n(x + w)}" y2="${n(y + h - tick)}" stroke="${accent}" stroke-width="0.28" />
  `
}

function kraftStamp(cx: number, top: number, ruleY: number, accent: string): string {
  const cy = top - 1.15
  const r = 4.4
  return `
    <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none" stroke="${accent}" stroke-width="0.34" stroke-dasharray="1.15 0.7" />
    <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r - 1.15)}" fill="none" stroke="${accent}" stroke-opacity="0.55" stroke-width="0.18" />
    <line x1="${n(cx)}" y1="${n(cy - r)}" x2="${n(cx)}" y2="${n(cy - r + 1.35)}" stroke="${accent}" stroke-width="0.26" />
    <line x1="${n(cx)}" y1="${n(cy + r - 1.35)}" x2="${n(cx)}" y2="${n(cy + r)}" stroke="${accent}" stroke-width="0.26" />
    <line x1="${n(cx - 7.4)}" y1="${n(ruleY)}" x2="${n(cx + 7.4)}" y2="${n(ruleY)}" stroke="${accent}" stroke-width="0.22" />
  `
}

function leftRail(cx: number, top: number, bot: number, y: number, half: number, accent: string, left: boolean): string {
  const rail = left ? cx - 3.15 : cx - half - 3.4
  const x2 = left ? cx + half : cx + half
  const ticks = [0.18, 0.5, 0.82]
    .map((t) => {
      const yy = top + (bot - top) * t
      return `<line x1="${n(rail - 1.7)}" y1="${n(yy)}" x2="${n(rail)}" y2="${n(yy)}" stroke="${accent}" stroke-width="0.26" />`
    })
    .join('')
  return `
    <line x1="${n(rail)}" y1="${n(top)}" x2="${n(rail)}" y2="${n(bot)}" stroke="${accent}" stroke-width="0.32" />
    <rect x="${n(rail - 0.95)}" y="${n(top - 0.95)}" width="1.9" height="1.9" fill="${accent}" fill-opacity="0.85" />
    <line x1="${n(rail)}" y1="${n(y)}" x2="${n(x2)}" y2="${n(y)}" stroke="${accent}" stroke-width="0.28" />
    ${ticks}
  `
}

function badgeCapsule(cx: number, top: number, bot: number, halfW: number, accent: string, left: boolean, panelW: number): string {
  const h = Math.max(13, bot - top + 4.2)
  const w = Math.min(panelW * 0.7, Math.max(halfW * 2.15, 26))
  const x = left ? cx - 2.1 : cx - w / 2
  const y = top - 2.1
  const rr = h / 2
  return `
    <rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(rr)}" fill="none" stroke="${accent}" stroke-width="0.38" />
    <rect x="${n(x + 1.2)}" y="${n(y + 1.2)}" width="${n(w - 2.4)}" height="${n(h - 2.4)}" rx="${n(Math.max(2, rr - 1.2))}" fill="none" stroke="${accent}" stroke-opacity="0.45" stroke-width="0.16" />
  `
}

function seamLimit(panel: Panel): number {
  return panel.x + panel.w - Math.max(12, panel.w * 0.16)
}

/** Left-reading wrap column. Stays off the SEAM reserve. Not an L-bracket pack. */
function wrapColumn(cx: number, top: number, bot: number, y: number, half: number, ink: string, seamX: number): string {
  const rail = cx - 2.7
  const x2 = Math.min(cx + Math.max(11, half * 0.95), seamX - 1.6)
  const x1 = cx
  return `
    <line x1="${n(rail)}" y1="${n(top)}" x2="${n(rail)}" y2="${n(bot)}" stroke="${ink}" stroke-width="0.28" />
    <line x1="${n(rail - 1.55)}" y1="${n(top)}" x2="${n(rail)}" y2="${n(top)}" stroke="${ink}" stroke-width="0.22" />
    <rect x="${n(rail - 0.85)}" y="${n(top - 0.85)}" width="1.7" height="1.7" fill="${ink}" fill-opacity="0.8" />
    <line x1="${n(x1)}" y1="${n(y - 0.28)}" x2="${n(x2)}" y2="${n(y - 0.28)}" stroke="${ink}" stroke-width="0.26" />
    <line x1="${n(x1)}" y1="${n(y + 0.32)}" x2="${n(x2)}" y2="${n(y + 0.32)}" stroke="${ink}" stroke-opacity="0.5" stroke-width="0.16" />
    <line x1="${n(x2)}" y1="${n(y - 0.7)}" x2="${n(x2)}" y2="${n(y + 0.75)}" stroke="${ink}" stroke-width="0.2" />
  `
}

/** Centered jar-stack rules. Not a box cartouche, crest, or kraft seal. */
function stackColumn(cx: number, top: number, _bot: number, y: number, half: number, ink: string): string {
  const x1 = cx - half
  const x2 = cx + half
  return `
    <line x1="${n(x1)}" y1="${n(y - 0.28)}" x2="${n(x2)}" y2="${n(y - 0.28)}" stroke="${ink}" stroke-width="0.26" />
    <line x1="${n(x1)}" y1="${n(y + 0.32)}" x2="${n(x2)}" y2="${n(y + 0.32)}" stroke="${ink}" stroke-opacity="0.5" stroke-width="0.16" />
    <line x1="${n(x1)}" y1="${n(y - 0.75)}" x2="${n(x1)}" y2="${n(y + 0.8)}" stroke="${ink}" stroke-width="0.2" />
    <line x1="${n(x2)}" y1="${n(y - 0.75)}" x2="${n(x2)}" y2="${n(y + 0.8)}" stroke="${ink}" stroke-width="0.2" />
    <line x1="${n(cx - 3.2)}" y1="${n(top - 0.4)}" x2="${n(cx + 3.2)}" y2="${n(top - 0.4)}" stroke="${ink}" stroke-opacity="0.45" stroke-width="0.16" />
    <line x1="${n(cx)}" y1="${n(top - 1.15)}" x2="${n(cx)}" y2="${n(top - 0.4)}" stroke="${ink}" stroke-width="0.2" />
  `
}

function techPlaque(cx: number, top: number, bot: number, halfW: number, y: number, accent: string, left: boolean): string {
  const x1 = left ? cx : cx - halfW
  const x2 = cx + halfW
  const ticks = [0.2, 0.5, 0.8]
    .map((t) => {
      const yy = top + (bot - top) * t
      return `<line x1="${n(x1 - 2.1)}" y1="${n(yy)}" x2="${n(x1 - 0.4)}" y2="${n(yy)}" stroke="${accent}" stroke-width="0.28" />`
    })
    .join('')
  return `
    <line x1="${n(x1)}" y1="${n(y - 0.35)}" x2="${n(x2)}" y2="${n(y - 0.35)}" stroke="${accent}" stroke-width="0.34" />
    <line x1="${n(x1)}" y1="${n(y + 0.4)}" x2="${n(x2)}" y2="${n(y + 0.4)}" stroke="${accent}" stroke-opacity="0.5" stroke-width="0.2" />
    ${left ? '' : `<rect x="${n(x1 - 1.15)}" y="${n(y - 1.15)}" width="2.3" height="2.3" fill="none" stroke="${accent}" stroke-width="0.28" />`}
    <rect x="${n(x2 - 1.15)}" y="${n(y - 1.15)}" width="2.3" height="2.3" fill="none" stroke="${accent}" stroke-width="0.28" />
    ${ticks}
  `
}

/** Chrome sits behind type. Same LockupId, no layout mutation. */
export function paintLockupChrome(layout: FrontLayout, panel: Panel, system: DesignSystem, p: Palette): string {
  const lockup = system.lockup
  if (!lockupOwnsRule(lockup)) return ''
  const left = layout.anchor === 'start'
  const { cx, top, bot, halfW } = column(layout, panel)
  const ruleY = layout.ruleY ?? layout.brandY + layout.brandSize * 0.22
  const half = left ? Math.min(panel.w * 0.38, halfW * 1.55) : halfW * 1.15
  const ink = system.style === 'minimal' ? p.fg : p.accent
  let inner = ''
  if (lockup === 'harvest-seal') {
    inner = harvestRule(cx, ruleY, half, p.accent, left)
    if (!left) {
      const lx = Math.max(panel.x + 2.4, cx - halfW - 5.2)
      const rx = Math.min(panel.x + panel.w - 2.4, cx + halfW + 5.2)
      const mid = (top + bot) / 2
      inner += harvestSprig(lx, mid, p.accent, false) + harvestSprig(rx, mid, p.accent, true)
    }
  } else if (lockup === 'centered-crest') {
    inner = crestBar(cx, ruleY, half, p.accent, left)
  } else if (lockup === 'soft-oval') {
    inner = ovalRing(cx, top, bot, halfW, p.accent)
  } else if (lockup === 'air-rule') {
    inner = airRule(cx, ruleY, Math.min(half, panel.w * 0.16), p.fg, left)
  } else if (lockup === 'tech-grid') {
    inner = techPlaque(cx, top, bot, half, ruleY, p.accent, left)
  } else if (lockup === 'serif-cartouche') {
    inner = cartoucheFrame(cx, top, bot, halfW, p.accent)
  } else if (lockup === 'metal-plaque') {
    inner = plaquePlate(cx, top, bot, halfW, p.accent, left, panel.w)
  } else if (lockup === 'stamp-center') {
    inner = kraftStamp(cx, top, ruleY, p.accent)
  } else if (lockup === 'left-index') {
    inner = leftRail(cx, top, bot, ruleY, half, p.accent, left)
  } else if (lockup === 'badge-capsule') {
    inner = badgeCapsule(cx, top, bot, halfW, p.accent, left, panel.w)
  } else if (lockup === 'label-wrap') {
    inner = wrapColumn(cx, top, bot, ruleY, half, ink, seamLimit(panel))
  } else if (lockup === 'label-stack') {
    inner = stackColumn(cx, top, bot, ruleY, Math.min(halfW * 1.05, panel.w * 0.22), ink)
  }
  return inner ? `<g data-lockup-chrome="${lockup}">${inner}</g>` : ''
}
