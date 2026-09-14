/**
 * Perfume back story + TOP / HEART / BASE notes.
 * Sample lines are design placeholders, not brand formulas.
 */
import type { CopyLocale, DesignBrief, Palette } from '../../types'
import { resolveCopyLocale } from '../copyLocale'
import { escapeSvg as esc, wrapSvgLines as wrapLines } from './svgGeometry'

export type PerfumeNotes = {
  top: string
  heart: string
  base: string
}

export function notesNoneFlag(raw: string): boolean {
  const n = raw.trim().toLocaleLowerCase('tr')
  return n === 'none' || n === 'notes:none' || n === 'notes=none' || n === 'not:yok'
}

export function perfumeNotesHidden(brief: DesignBrief): boolean {
  return notesNoneFlag(brief.scentNotes ?? '')
}

export function resolvePerfumeStory(brief: DesignBrief, locale: CopyLocale = resolveCopyLocale(brief)): string {
  const owned = brief.story?.trim()
  if (owned) return owned
  const ov = brief.copyOverrides.trim()
  if (/^story:/i.test(ov)) return ov.replace(/^story:\s*/i, '').trim()
  if (ov.length >= 36 && /[.!?]/.test(ov)) return ov
  const cologne = /kolonya|cologne/.test(`${brief.subProduct} ${brief.productName}`.toLocaleLowerCase('tr'))
  if (locale === 'en') {
    return cologne
      ? 'A clean opening that stays bright. It leaves the room lighter than it found it.'
      : 'A quiet trace that opens on skin. It stays in the room, in no hurry.'
  }
  return cologne
    ? 'Ferah bir açılış. Temiz bir kapanış — odayı bulunduğu yerden daha açık bırakır.'
    : 'Tenle açılan sessiz bir iz. Odada kalır, acele etmez.'
}

export function resolvePerfumeNotes(brief: DesignBrief, locale: CopyLocale = resolveCopyLocale(brief)): PerfumeNotes | null {
  if (perfumeNotesHidden(brief)) return null
  const parsed = parseScentNotes(brief.scentNotes ?? '')
  if (parsed) return parsed
  const cologne = /kolonya|cologne/.test(`${brief.subProduct} ${brief.productName}`.toLocaleLowerCase('tr'))
  if (locale === 'en') {
    return cologne
      ? { top: 'Lemon · Bergamot', heart: 'Lavender · Rosemary', base: 'Cedar · Musk' }
      : { top: 'Bergamot · Lemon', heart: 'Rose · Jasmine', base: 'Amber · Cedar' }
  }
  return cologne
    ? { top: 'Limon · Bergamot', heart: 'Lavanta · Biberiye', base: 'Sedir · Misk' }
    : { top: 'Bergamot · Limon', heart: 'Gül · Yasemin', base: 'Amber · Sedir' }
}

export function parseScentNotes(raw: string): PerfumeNotes | null {
  const text = raw.trim()
  if (!text || notesNoneFlag(text)) return null
  const parts = text.split(/\s*[/|]\s*|;\s*/).map((s) => s.replace(/^(top|üst|heart|kalp|base|taban)\s*[:\-–]\s*/i, '').trim()).filter(Boolean)
  if (parts.length < 3) return null
  return { top: parts[0]!, heart: parts[1]!, base: parts[2]! }
}

export function perfumeNotesBlock(
  x: number,
  y: number,
  w: number,
  notes: PerfumeNotes,
  p: Palette,
  locale: CopyLocale,
): { markup: string; height: number } {
  const colW = w / 3
  const heads = locale === 'en'
    ? [
        { primary: 'TOP', secondary: 'ÜST' },
        { primary: 'HEART', secondary: 'KALP' },
        { primary: 'BASE', secondary: 'TABAN' },
      ]
    : [
        { primary: 'ÜST', secondary: 'TOP' },
        { primary: 'KALP', secondary: 'HEART' },
        { primary: 'TABAN', secondary: 'BASE' },
      ]
  const cells = [notes.top, notes.heart, notes.base]
  let markup = `<g data-art="perfume-notes">`
  markup += `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke="${p.accent}" stroke-opacity="0.35" stroke-width="0.16" />`
  heads.forEach((head, i) => {
    const cx = x + colW * i + colW / 2
    markup += `<text x="${cx}" y="${y + 3.1}" text-anchor="middle" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-weight="600" font-size="1.55" letter-spacing="0.85">${head.primary}</text>`
    markup += `<text x="${cx}" y="${y + 5.2}" text-anchor="middle" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="1.2" letter-spacing="0.55">${head.secondary}</text>`
    wrapLines(cells[i] ?? '', Math.max(8, Math.floor(colW / 1.55)), 2).forEach((line, li) => {
      markup += `<text x="${cx}" y="${y + 8.0 + li * 2.35}" text-anchor="middle" fill="${p.fg}" font-family="Georgia, 'Times New Roman', serif" font-weight="400" font-size="1.7">${esc(line)}</text>`
    })
  })
  markup += `<line x1="${x}" y1="${y + 13.6}" x2="${x + w}" y2="${y + 13.6}" stroke="${p.accent}" stroke-opacity="0.22" stroke-width="0.14" />`
  markup += `</g>`
  return { markup, height: 15.2 }
}

export function perfumeStoryBlock(
  x: number,
  y: number,
  w: number,
  story: string,
  p: Palette,
  serif: boolean,
): { markup: string; height: number } {
  const lines = wrapLines(story, Math.max(18, Math.floor(w / 1.72)), 3)
  const font = serif ? "Georgia, 'Times New Roman', serif" : 'Inter, Arial, sans-serif'
  let markup = `<g data-art="perfume-story">`
  lines.forEach((line, i) => {
    markup += `<text x="${x}" y="${y + i * 2.7}" fill="${p.fg}" font-family="${font}" font-weight="400" font-size="2.05" font-style="italic">${esc(line)}</text>`
  })
  markup += `</g>`
  return { markup, height: lines.length * 2.7 + 1.6 }
}
