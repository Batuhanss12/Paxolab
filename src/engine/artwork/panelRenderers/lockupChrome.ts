/**
 * Faz 2.11 — LockupId chrome around the existing type stack.
 * Does not move brand/product/tagline. Typography math stays in lockupLayout.
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
    <path d="M${n(cx)} ${n(y - 1.15)} L${n(cx + 0.85)} ${n(y)} L${n(cx)} ${n(y + 1.15)} L${n(cx - 0.85)} ${n(y)} Z" fill="${accent}" />
    <path d="M${n(x1)} ${n(y - 1.05)} V${n(y + 1.05)}" fill="none" stroke="${accent}" stroke-width="0.28" />
    <path d="M${n(x2)} ${n(y - 1.05)} V${n(y + 1.05)}" fill="none" stroke="${accent}" stroke-width="0.28" />
  `
}

function crestArc(cx: number, top: number, accent: string): string {
  return `
    <path d="M${n(cx - 9.2)} ${n(top + 1.4)} C${n(cx - 4)} ${n(top - 3.2)} ${n(cx + 4)} ${n(top - 3.2)} ${n(cx + 9.2)} ${n(top + 1.4)}" fill="none" stroke="${accent}" stroke-width="0.4" stroke-linecap="round" />
    <path d="M${n(cx - 7.2)} ${n(top + 1.5)} C${n(cx - 3.2)} ${n(top - 1.6)} ${n(cx + 3.2)} ${n(top - 1.6)} ${n(cx + 7.2)} ${n(top + 1.5)}" fill="none" stroke="${accent}" stroke-opacity="0.55" stroke-width="0.22" />
    <path d="M${n(cx)} ${n(top - 2.4)} L${n(cx + 1.05)} ${n(top - 0.55)} H${n(cx - 1.05)} Z" fill="${accent}" fill-opacity="0.9" />
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
  if (system.grammar === 'label') return ''
  const lockup = system.lockup
  if (!lockupOwnsRule(lockup)) return ''
  const left = layout.anchor === 'start'
  const { cx, top, bot, halfW } = column(layout, panel)
  const ruleY = layout.ruleY ?? layout.brandY + layout.brandSize * 0.22
  const half = left ? Math.min(panel.w * 0.38, halfW * 1.55) : halfW * 1.15
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
    inner = crestBar(cx, ruleY, half, p.accent, left) + crestArc(cx, top, p.accent)
  } else if (lockup === 'soft-oval') {
    inner = ovalRing(cx, top, bot, halfW, p.accent)
  } else if (lockup === 'air-rule') {
    inner = airRule(cx, ruleY, Math.min(half, panel.w * 0.16), p.fg, left)
  } else if (lockup === 'tech-grid') {
    inner = techPlaque(cx, top, bot, half, ruleY, p.accent, left)
  }
  return inner ? `<g data-lockup-chrome="${lockup}">${inner}</g>` : ''
}
