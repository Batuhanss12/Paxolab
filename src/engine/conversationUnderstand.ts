/**
 * Conversation Understanding Layer — every user turn updates an internal brief.
 * The user never sees this object. Maps onto DesignBrief + existing director cues.
 * Character is not a visualLanguageFor key; editorial/restrained → luxury-tighten.
 */
import type { Attachment, AwaitingKey, DesignBrief, DesignOverrides, FieldProvenance, PackagingMode } from '../types'
import type { DirectorCue } from './brain/DesignPlan'
import { confidenceNumber } from './briefProvenance'
import { extractFields } from './extractFields'
import { nextMissing } from './conversationAsk'
import { mergeBrief } from './fields'

export type FieldConfidence = 'high' | 'medium' | 'low'

export type DesignUnderstanding = {
  patch: Partial<DesignBrief>
  confidence: Partial<Record<string, FieldConfidence>>
  missingCritical: AwaitingKey[]
  deliverables: PackagingMode[]
  avoided: string[]
  directorCue: DirectorCue | ''
}

const DUAL_SURFACE =
  /kutu\s*(ve|ile|\+)\s*(şişe\s*)?(etiket|label)|(etiket|label)\s*(ve|ile|\+)\s*kutu|\bbox\s*(and|\+|&)\s*(bottle\s*)?label|\blabel\s*(and|\+|&)\s*box/i

export function parseDirectorCue(text: string): DirectorCue | '' {
  const t = text.toLocaleLowerCase('tr')
  if (/editorial|editöryal|editoryal|restrained|sakin dur|çok klasik görünmesin|\bcalm\b|\bquiet\b/.test(t)) {
    return 'luxury-tighten'
  }
  if (/daha\s*(sade|minimal)|bol\s*hava/.test(t)) return 'open-air'
  if (/daha\s*eco|sıcak\s*doğal/.test(t)) return 'warm-natural'
  if (/daha\s*(cesur|grafik|modern)|contemporary|çağdaş/.test(t) && /grafik|cesur|push/.test(t)) {
    return 'graphic-push'
  }
  return ''
}

export function deliverablesOf(text: string, packagingMode: PackagingMode | ''): PackagingMode[] {
  if (DUAL_SURFACE.test(text)) return ['box', 'label']
  if (packagingMode === 'label' || /etiket|label/i.test(text)) return ['label']
  if (packagingMode === 'box' || /\bkutu\b|\bbox\b/i.test(text)) return ['box']
  return packagingMode ? [packagingMode] : []
}

function avoidedOf(text: string): string[] {
  const t = text.toLocaleLowerCase('tr')
  const out: string[] = []
  if (
    /klasik\s*(görünmesin|olmasın|durmasın)|çok\s*klasik|overly\s*classic(?:al)?|not\s*(too\s*)?classic(?:al)?|too\s*classic(?:al)?|klasik\s*değil/.test(
      t,
    )
  ) {
    out.push('classic')
  }
  if (/ucuz\s*(da\s*)?durmasın|cheap|jenerik|generic/.test(t)) out.push('cheap')
  return out
}

/** English brand phrasing: "for Luma", "a brand called Luma", "named Luma". Capitalised token only. */
function englishBrandOf(text: string): string {
  const m =
    text.match(/\bbrand\s+(?:called|named)\s+["“]?([A-Z][\w'’-]{1,28})["”]?/) ||
    text.match(/\b(?:called|named)\s+["“]?([A-Z][\w'’-]{1,28})["”]?/) ||
    text.match(/\bfor\s+["“]?([A-Z][\w'’-]{1,28})["”]?(?=[\s.,;!]|$)/)
  if (!m) return ''
  const name = m[1].trim()
  if (/^(Modern|Minimal|Luxury|Premium|Classic|Eco|Playful|Cream|Gold|Black|White|Green|Serum|Box|Label|The|And|Not)$/i.test(name)) return ''
  return name
}

function provenanceFor(patch: Partial<DesignBrief>, confidence: DesignUnderstanding['confidence'], inferred: string[]): Partial<Record<string, FieldProvenance>> {
  const out: Partial<Record<string, FieldProvenance>> = {}
  for (const [key, value] of Object.entries(patch)) {
    if (key === 'provenance' || value === undefined || value === '' || (Array.isArray(value) && !value.length)) continue
    if (inferred.includes(key)) {
      out[key] = { source: 'HEURISTIC_INFERRED', confidence: 0.8 }
      continue
    }
    out[key] = { source: 'USER_EXPLICIT', confidence: confidenceNumber(confidence[key]) }
  }
  return out
}

/** Human avoid labels → Asset Language motif tokens. Catalog briefs never set these. */
export function motifAvoidTokens(avoided: readonly string[]): string[] {
  const tokens: string[] = []
  if (avoided.includes('classic')) tokens.push('generic-corners', 'heavy-frame')
  if (avoided.includes('cheap')) tokens.push('generic-ticks', 'dense-pattern')
  return [...new Set(tokens)]
}

function confidenceFor(text: string, patch: Partial<DesignBrief>): DesignUnderstanding['confidence'] {
  const confidence: DesignUnderstanding['confidence'] = {}
  if (/(?:marka(?:nın)?\s+)?(?:adı|adın|adını)\s+\S+\s+olsun/i.test(text) || /["“]/.test(text)) {
    if (patch.brandName) confidence.brandName = 'high'
  } else if (/\biçin\b/i.test(text) && patch.brandName) {
    confidence.brandName = 'high'
  } else if (patch.brandName) {
    confidence.brandName = 'medium'
  }
  if (patch.sector) confidence.sector = 'high'
  if (patch.packagingMode) confidence.packagingMode = 'high'
  if (patch.styleType) confidence.styleType = /editorial|premium|lüks|contemporary/i.test(text) ? 'high' : 'medium'
  if (patch.colors) confidence.colors = 'high'
  if (patch.dimensionsMm) confidence.dimensionsMm = 'high'
  return confidence
}

export function understandUtterance(
  text: string,
  brief: DesignBrief,
  attachments: Attachment[] = [],
): DesignUnderstanding {
  const extracted = extractFields(text, attachments)
  const directorCue = parseDirectorCue(text) || (brief.directorCue as DirectorCue | undefined) || ''
  const patch: Partial<DesignBrief> = { ...extracted }
  const inferred: string[] = []
  if (!patch.brandName && !brief.brandName) {
    const english = englishBrandOf(text)
    if (english) patch.brandName = english
  }
  if (!brief.packagingMode && !patch.packagingMode && DUAL_SURFACE.test(text)) patch.packagingMode = 'box'
  if (
    !brief.packagingMode &&
    !patch.packagingMode &&
    (patch.sector || patch.subProduct) &&
    !/etiket|label|wrap/i.test(text)
  ) {
    patch.packagingMode = 'box'
  }
  if (directorCue && !patch.directorCue) {
    patch.directorCue = directorCue
    inferred.push('directorCue')
  }
  const avoided = avoidedOf(text)
  const avoidMotifs = motifAvoidTokens(avoided)
  if (avoidMotifs.length) {
    patch.avoidMotifs = avoidMotifs
    inferred.push('avoidMotifs')
  }
  if (patch.styleType && !/lüks|luxury|premium|minimal|sade|eco|organik|playful|eğlenc|\bmodern\b|klasik|classic/i.test(text)) {
    inferred.push('styleType')
  }
  const merged = mergeBrief(brief, patch)
  const deliverables = deliverablesOf(text, merged.packagingMode)
  if (deliverables.length) patch.deliverables = deliverables
  const confidence = confidenceFor(text, patch)
  patch.provenance = provenanceFor(patch, confidence, inferred)
  const resolved = mergeBrief(brief, patch)
  const missing = nextMissing(resolved)
  return {
    patch,
    confidence,
    missingCritical: missing ? [missing] : [],
    deliverables: deliverables.length ? deliverables : resolved.packagingMode ? [resolved.packagingMode] : [],
    avoided,
    directorCue: (patch.directorCue as DirectorCue | undefined) || '',
  }
}

/** Spoken design direction. User never sees JSON. */
export function directionBriefing(brief: DesignBrief): string {
  const brand = brief.brandName.trim() || 'Marka'
  const product = (brief.subProduct || brief.productName || brief.sector).trim()
  const bits: string[] = []
  if (brief.styleType === 'luxury') bits.push('premium')
  if (brief.styleType === 'modern') bits.push('çağdaş')
  if (brief.styleType === 'playful') bits.push('canlı')
  if (brief.directorCue === 'luxury-tighten') bits.push('editorial ve sakin')
  if (brief.colors.trim()) bits.push(`${brief.colors.trim()} paleti`)
  if ((brief.avoidMotifs ?? []).some((t) => t === 'heavy-frame' || t === 'generic-corners')) {
    bits.push('klasik çerçeveye kaçmadan')
  }
  const mood = bits.length ? bits.join(', ') : 'net bir yön'
  const who = product ? `${brand} · ${product}` : brand
  return `${who} için ${mood} oluşturdum. İlk yüzeyi hazırlıyorum.`
}

export function wantsCompanionLabel(text: string): boolean {
  return /etiketi?\s*(de\s*)?(üret|çiz|yap|hazırla)|şişe\s*etiket|label\s*(too|as well)/i.test(text)
}

export function isDualDeliverable(brief: DesignBrief): boolean {
  const d = brief.deliverables ?? []
  return d.includes('box') && d.includes('label')
}

export function cueOverridePatch(brief: DesignBrief): Partial<DesignOverrides> {
  const patch: Partial<DesignOverrides> = { studio: true }
  if (brief.directorCue) patch.directorCue = brief.directorCue
  if (brief.styleType === 'luxury') patch.premium = true
  return patch
}
