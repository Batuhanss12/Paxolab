/**
 * C6 studio conversation — why / veto / vary on the existing direction resolver.
 * Small deterministic parser. Does not invent a new Design Brain.
 */
import type { DesignBrief, DesignOverrides, StyleType } from '../../types'
import { paletteFor } from '../artwork/languages'
import { resolveSector } from '../designSystem'
import { parseIntent } from '../iterate/parseIntent'
import {
  decideDirection,
  hintsFromBrief,
  type DirectionClaim,
  type DirectionDecision,
} from './direction'
import {
  applyVetoToHints,
  familiesFromUtterance,
  familyOf,
  hintsFromFamily,
  hintsFromVeto,
} from './family'
import type { DirectionHints, StudioFamily, StudioSurface, Temperament } from './types'

export type DirectionTalkKind = 'why' | 'veto' | 'vary' | 'pin'

export type DirectionTalk = {
  kind: DirectionTalkKind
  vetoFamilies: StudioFamily[]
  pinFamily?: StudioFamily
  quieter?: boolean
  note: string
}

const WHY =
  /^(neden|niçin|why)\s*\??$|^(neden|niçin)\s+(bunu|bu\s*(yönü?|tasarımı?|arketipi?)?)?\s*(seçtin|seçtik|tercih|kulland[ıi]n)?\s*\??$|\bwhy\s+(this|did\s+you|the\s+direction)/i

const VETO =
  /(istemiyorum|istemem|vazgeç(tim|iyoruz)?|beğenmedim|sevmedim|olmasın|kaçın|i\s+don['’]?t\s+want)/i

const REPLACE =
  /başka\s+(bir\s+)?(şey|yön|arketip)\s*(dene|deneyelim|olsun|istedim)?/i

const KEEP_FAMILY = /(kalsın|koru|bu\s+yön\s+iyi|farklılaştır|varyasyon|daha\s+az\s+yoğun)/i

const QUIETER = /daha\s+(sakin|sessiz|editorial)|daha\s+az\s+yoğun|luxury-tighten/i

const PIN_FAMILY = /yönünü?\s*(seç|olsun|yap|istedim)|yönü\s+seç|family\s*(to|=)|make\s+it/i

export function parseDirectionTalk(text: string, current?: StudioFamily): DirectionTalk | null {
  const t = text.trim()
  if (!t) return null
  const named = familiesFromUtterance(t)

  if (WHY.test(t)) {
    return { kind: 'why', vetoFamilies: [], note: 'Mevcut yönü açıklıyorum.' }
  }

  if (KEEP_FAMILY.test(t) || (QUIETER.test(t) && !VETO.test(t) && !REPLACE.test(t))) {
    return {
      kind: 'vary',
      vetoFamilies: [],
      quieter: QUIETER.test(t),
      note: QUIETER.test(t)
        ? 'Aileyi koruyorum; yönü daha sakin bir varyasyona alıyorum.'
        : 'Aileyi koruyorum; aynı yönün kontrollü varyasyonunu uyguluyorum.',
    }
  }

  if (VETO.test(t) || REPLACE.test(t)) {
    const namedOnly = /istemi|olmasın|don't\s+want/i.test(t) && !/vazgeç/i.test(t)
    const pinFamily =
      !namedOnly && named.find((family) => family !== current)
    const vetoFamilies = namedOnly
      ? named
      : current && pinFamily !== current
        ? [current]
        : named.length
          ? named
          : current
            ? [current]
            : []
    return {
      kind: 'veto',
      vetoFamilies,
      pinFamily,
      note: pinFamily
        ? `${vetoFamilies[0] ?? 'mevcut yön'} dışlandı; ${pinFamily} ailesine geçiyorum.`
        : `${vetoFamilies[0] ?? named[0] ?? current ?? 'mevcut yön'} dışlandı; yeni yön seçiyorum.`,
    }
  }

  if (named.length && (PIN_FAMILY.test(t) || /^daha\s+\S+/.test(t.toLocaleLowerCase('tr')))) {
    const pinFamily = named[0]
    return {
      kind: 'pin',
      vetoFamilies: [],
      pinFamily,
      note: `Görsel aileyi ${pinFamily} olarak kilitledim.`,
    }
  }

  return null
}

export function assembleStudioHints(
  brief: DesignBrief,
  surface: StudioSurface,
  extras: DirectionHints[] = [],
): DirectionHints[] {
  const sector = resolveSector(brief)
  const vetoed = brief.avoidStudioFamilies ?? []
  const veto = hintsFromVeto(vetoed)
  const family =
    brief.studioFamily && !vetoed.includes(brief.studioFamily) ? hintsFromFamily(brief.studioFamily, surface) : null
  return [hintsFromBrief(brief, sector, surface), ...(veto ? [veto] : []), ...extras, ...(family ? [family] : [])]
}

export function inspectStudioDirection(brief: DesignBrief, extras: DirectionHints[] = []): DirectionDecision {
  const surface: StudioSurface = brief.packagingMode === 'label' ? 'label' : 'box'
  const sector = resolveSector(brief)
  const style = (brief.styleType || 'luxury') as StyleType
  const palette = paletteFor(brief, style, style === 'luxury')
  return decideDirection({
    brief,
    sector,
    style,
    surface,
    faceW: brief.dimensionsMm.L || 80,
    faceH: brief.dimensionsMm.H || 120,
    palette,
    locale: brief.copyLocale ?? 'tr',
    variationIndex: brief.directionVariation ?? 0,
    copy: {
      brand: brief.brandName,
      product: brief.productName,
      tagline: brief.copyOverrides,
      volume: brief.volume,
    },
    hints: assembleStudioHints(brief, surface, extras),
  })
}

export function explainStudioDirection(brief: DesignBrief, extras: DirectionHints[] = []): {
  text: string
  claims: DirectionClaim[]
  decision: DirectionDecision
} {
  const decision = inspectStudioDirection(brief, extras)
  const d = decision.direction
  const family = familyOf(d.archetype, brief.studioFamily) ?? d.archetype
  const real = decision.claims.filter((c) => c.authority === 'REAL')
  const grounded = real.length
    ? real.map((c) => c.text.replace(/\.$/, '')).join('; ')
    : d.rationale[0] ?? d.archetype
  const text = `Bu yön ${family} (${d.archetype}): ${grounded}. ${d.temperament} temperament · ${d.background} doku — yüksek kontrastlı tipografi ürün adını öne çıkarıyor.`
  return { text, claims: real, decision }
}

export function applyDirectionTalk(brief: DesignBrief, talk: DirectionTalk, text: string): {
  brief: DesignBrief
  overridePatch: Partial<DesignOverrides>
  note: string
} {
  let next: DesignBrief = { ...brief }
  const avoid = [...(next.avoidStudioFamilies ?? [])]
  if (talk.kind === 'veto') {
    let targets = talk.vetoFamilies
    if (!targets.length) {
      const current = familyOf(inspectStudioDirection(next).direction.archetype, next.studioFamily)
      if (current) targets = [current]
    }
    for (const family of targets) {
      if (!avoid.includes(family)) avoid.push(family)
    }
    next = { ...next, avoidStudioFamilies: avoid }
    if (next.studioFamily && avoid.includes(next.studioFamily)) {
      next = { ...next, studioFamily: undefined }
    }
  }
  if (talk.pinFamily && !avoid.includes(talk.pinFamily)) {
    next = { ...next, studioFamily: talk.pinFamily }
  }
  if (talk.kind === 'vary') {
    next = { ...next, directionVariation: (next.directionVariation ?? 0) + 1 }
  }

  const intent = parseIntent(text, next.styleType)
  if (intent.briefPatch.studioFamily && talk.kind === 'vary') {
    delete intent.briefPatch.studioFamily
  }
  next = { ...next, ...intent.briefPatch, avoidStudioFamilies: next.avoidStudioFamilies, directionVariation: next.directionVariation }
  if (talk.kind === 'veto' && next.studioFamily && (next.avoidStudioFamilies ?? []).includes(next.studioFamily)) {
    next = { ...next, studioFamily: undefined }
  }

  const surface: StudioSurface = next.packagingMode === 'label' ? 'label' : 'box'
  const vetoHint = hintsFromVeto(next.avoidStudioFamilies)
  const familyHint =
    next.studioFamily && !(next.avoidStudioFamilies ?? []).includes(next.studioFamily)
      ? hintsFromFamily(next.studioFamily, surface)
      : null
  let direction: DirectionHints = {
    ...vetoHint,
    ...intent.overridePatch.direction,
    ...familyHint,
    source: 'user',
  }
  direction = applyVetoToHints(direction, next.avoidStudioFamilies)
  if (talk.quieter) {
    const quieter: Temperament = 'light-luxe'
    direction = { ...direction, temperament: quieter, source: 'user', rationale: [...(direction.rationale ?? []), 'Kullanıcı: daha sakin varyasyon.'] }
  }

  const overridePatch: Partial<DesignOverrides> = {
    studio: true,
    ...intent.overridePatch,
    variationIndex: next.directionVariation ?? intent.overridePatch.variationIndex,
    direction,
    directorCue: talk.quieter ? intent.overridePatch.directorCue || 'luxury-tighten' : intent.overridePatch.directorCue,
  }

  return { brief: next, overridePatch, note: talk.note }
}
