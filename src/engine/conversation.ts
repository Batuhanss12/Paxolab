import type { Attachment, AwaitingKey, DesignBrief, DesignOverrides, EngineResult } from '../types'
import { getTemplate, pickTemplate } from './catalog/catalog'
import { describeStructureOffer, STRUCTURE_LABEL, templateIdFromUtterance } from './catalog/structureOffer'
import { parseOfferChoice, recommendStructures } from './catalog/structureRecommend'
import { applyExtraction, sameName } from './extract'
import { askCopy, askRetryCopy, nextMissing } from './conversationAsk'
import {
  acceptDefaultFor,
  canDefault,
  emptyConversationState,
  noteAnswered,
  noteAsked,
  noteDeclined,
  noteTurn,
  shouldAsk,
  timesAsked,
  type ConversationState,
} from './conversationState'
import { SKIP_UTTERANCE } from './extractRules'
import {
  cueOverridePatch,
  directionBriefing,
  isDualDeliverable,
  understandUtterance,
  wantsCompanionLabel,
} from './conversationUnderstand'
import { briefSummary, isCoreReady, isSurfaceOnlySummary, mergeBrief } from './fields'
import { parseFeedback } from './iterate/feedbackParser'
import { isIteration, parseIntent } from './iterate/parseIntent'
import { hintsFromFamily } from './studio/family'

export { askCopy, nextMissing } from './conversationAsk'

function studioGeneratePatch(brief: DesignBrief): Partial<DesignOverrides> {
  const patch = cueOverridePatch(brief)
  const surface = brief.packagingMode === 'label' ? 'label' : 'box'
  const family = hintsFromFamily(brief.studioFamily, surface)
  if (family) patch.direction = { ...patch.direction, ...family }
  return patch
}

function withUnderstanding(brief: DesignBrief, text: string, attachments: Attachment[]): DesignBrief {
  const understanding = understandUtterance(text, brief, attachments)
  return mergeBrief(brief, understanding.patch)
}

function generateResult(brief: DesignBrief, ack?: string, text = '', state?: ConversationState): EngineResult {
  const offer = recommendStructures(brief)
  const tmpl =
    (brief.templateId ? getTemplate(brief.templateId) : undefined) ??
    (offer.candidates[0] ? getTemplate(offer.candidates[0].templateId) : undefined) ??
    pickTemplate(brief)
  const next = {
    ...brief,
    templateId: tmpl.id,
    packagingMode: brief.packagingMode || tmpl.packagingMode,
  }
  const pinned = { ...offer, selectedTemplateId: tmpl.id }
  const briefing = (ack ?? '').trim() || directionBriefing(next)
  const dual =
    isDualDeliverable(next) && next.packagingMode !== 'label'
      ? ' Kutu ve etiket istedin; önce kutuyu çiziyorum. Etiket için “etiketi de üret” yaz.'
      : ''
  const structure = describeStructureOffer(next, tmpl, pinned)
  return {
    brief: next,
    awaiting: null,
    replies: [
      `${briefing}${dual} ${structure} Referans stüdyo anatomisiyle (TASARIM REF) dieline ve vektör yüzeyi birlikte çıkarılıyor.`,
      'Yönü konuşarak iterasyon: “daha premium”, “daha modern”, “logoyu büyüt”, “etiketi de üret”.',
    ],
    shouldGenerate: true,
    showTemplates: false,
    overridePatch: studioGeneratePatch(next),
    copyPatch: {},
    note: 'generate',
    feedback: parseFeedback(text),
    state,
    structureOffer: pinned,
  }
}

/** Core brief is complete — show ranked structures. Design starts only after the user picks. */
function offerStructureResult(brief: DesignBrief, ack?: string, state?: ConversationState): EngineResult {
  const offer = recommendStructures(brief)
  const next = { ...brief, packagingMode: brief.packagingMode || 'box' }
  const lines = offer.candidates.map((row, i) => {
    const label = STRUCTURE_LABEL[row.structureId] ?? row.title
    return `${i + 1}. ${label} — ${row.reason}`
  })
  const top = offer.candidates[0]
  const topLabel = top ? (STRUCTURE_LABEL[top.structureId] ?? top.title) : ''
  const briefing = ((ack ?? '').trim() || directionBriefing(next)).replace(/ İlk yüzeyi hazırlıyorum\.$/, '')
  const dual =
    isDualDeliverable(next) && next.packagingMode !== 'label'
      ? ' Kutu ve etiket istedin; önce kutuyu çizeceğim. Etiket için “etiketi de üret” yaz.'
      : ''
  return {
    brief: next,
    awaiting: 'templateId',
    replies: [
      `${briefing}${dual} Brief hazır. Uygun yapılar sağda — birini seç, sonra tasarım başlar.`,
      top ? `Yapı: önerilen ${topLabel}.` : '',
      lines.join('\n'),
    ].filter(Boolean),
    shouldGenerate: false,
    showTemplates: true,
    overridePatch: studioGeneratePatch(next),
    copyPatch: {},
    note: 'offer',
    state: noteAsked(state ?? emptyConversationState(), 'templateId'),
    structureOffer: offer,
  }
}

/** Was the awaited field answered (filled or declined) by this turn? */
function settleAwaiting(state: ConversationState, awaiting: AwaitingKey | null, text: string, before: DesignBrief, after: DesignBrief): ConversationState {
  if (!awaiting) return state
  if (SKIP_UTTERANCE.test(text) || /^(yok|yoktur)$/i.test(text)) return noteDeclined(noteAnswered(state, awaiting), awaiting)
  const changed = JSON.stringify((before as Record<string, unknown>)[awaiting]) !== JSON.stringify((after as Record<string, unknown>)[awaiting])
  return changed || !nextMissingIs(after, awaiting) ? noteAnswered(state, awaiting) : state
}

function nextMissingIs(brief: DesignBrief, key: AwaitingKey): boolean {
  return nextMissing(brief) === key
}

/**
 * Pick the next blocking question. A field asked MAX_ASK times (or declined) that has
 * a deterministic default is defaulted instead of asked again; brand / sector / surface
 * have no safe default and stay questions.
 */
function resolveMissing(brief: DesignBrief, state: ConversationState): { brief: DesignBrief; missing: AwaitingKey | null } {
  let current = brief
  for (let guard = 0; guard < 4; guard++) {
    const missing = nextMissing(current)
    if (!missing || missing === 'templateId') return { brief: current, missing }
    if (shouldAsk(state, missing) || !canDefault(missing)) return { brief: current, missing }
    current = acceptDefaultFor(current, missing)
  }
  return { brief: current, missing: nextMissing(current) }
}

export function runConversation(input: {
  text: string
  attachments: Attachment[]
  brief: DesignBrief
  awaiting: AwaitingKey | null
  hasDesign: boolean
  /** Asked / answered ledger. Omit for stateless callers (tests, template pick). */
  state?: ConversationState
}): EngineResult {
  const text = input.text.trim()
  let state = noteTurn(input.state ?? emptyConversationState())

  const previewOffer = recommendStructures(input.brief)
  const offerPick = parseOfferChoice(text, previewOffer.candidates.length)
  if (offerPick && (input.hasDesign || input.awaiting === 'templateId' || isCoreReady(input.brief))) {
    const hit = previewOffer.candidates[offerPick - 1]
    if (hit) {
      const next = {
        ...input.brief,
        templateId: hit.templateId,
        packagingMode: input.brief.packagingMode || (hit.structureId.includes('label') ? ('label' as const) : ('box' as const)),
      }
      if (input.hasDesign || isCoreReady(next)) {
        return generateResult(next, directionBriefing(next), text, state)
      }
    }
  }

  const structureId = templateIdFromUtterance(text, input.brief.packagingMode)
  if (structureId && (input.hasDesign || input.awaiting === 'templateId' || isCoreReady(input.brief))) {
    const next = {
      ...input.brief,
      templateId: structureId,
      packagingMode: input.brief.packagingMode || (structureId.includes('label') ? 'label' as const : 'box' as const),
    }
    if (input.hasDesign || isCoreReady(next)) {
      return generateResult(next, directionBriefing(next), text, state)
    }
  }

  if (input.awaiting === 'templateId' && SKIP_UTTERANCE.test(text) && isCoreReady(input.brief)) {
    return generateResult(input.brief, 'Önerdiğim yapıyla devam ediyorum.', text, state)
  }

  if (input.hasDesign && wantsCompanionLabel(text) && input.brief.packagingMode !== 'label') {
    const labelBrief = { ...input.brief, packagingMode: 'label' as const, templateId: '' }
    return generateResult(labelBrief, `${directionBriefing(labelBrief)} Şişe etiketini kuruyorum.`, text, state)
  }

  if (input.hasDesign && isIteration(text)) {
    const parsed = parseIntent(text, input.brief.styleType)
    return {
      brief: { ...input.brief, ...parsed.briefPatch },
      awaiting: null,
      replies: [parsed.note],
      shouldGenerate: true,
      showTemplates: false,
      overridePatch: parsed.overridePatch,
      copyPatch: parsed.copyPatch,
      note: parsed.note,
      feedback: parseFeedback(text),
      state,
    }
  }

  const extracted = applyExtraction(input.brief, text, input.attachments, input.awaiting)
  const understood = withUnderstanding(extracted, text, input.attachments)
  state = settleAwaiting(state, input.awaiting, text, input.brief, understood)
  const resolvedMissing = resolveMissing(understood, state)
  const brief = resolvedMissing.brief

  const ready = isCoreReady(brief)
  const missing = resolvedMissing.missing
  const ack = briefSummary(brief)
  const replies: string[] = []

  if (input.attachments.length) {
    replies.push(
      input.attachments.some((a) => a.kind === 'logo')
        ? 'Logoyu aldım. Monogram yerine bunu yerleştireceğim.'
        : 'Referansı kaydettim.',
    )
  }

  if (input.hasDesign) {
    const grew = JSON.stringify(brief) !== JSON.stringify(input.brief)
    if (grew) {
      return {
        brief,
        awaiting: null,
        replies: [ack ? `${ack}. Yüzeyi bu brief ile yeniliyorum.` : 'Yüzeyi güncelledim.'],
        shouldGenerate: true,
        showTemplates: false,
        overridePatch: cueOverridePatch(brief),
        copyPatch: {},
        note: 'update',
        feedback: parseFeedback(text),
        state,
      }
    }
    return {
      brief,
      awaiting: null,
      replies: ['İterasyon: stil çipi, “luxury yap / eco’ya geç”, “logoyu büyüt”, “daha premium”, “metni … yap”, “baskıya hazırla”.'],
      shouldGenerate: false,
      showTemplates: false,
      overridePatch: {},
      copyPatch: {},
      note: 'hint',
      state,
    }
  }

  if (missing && missing !== 'templateId') {
    const grew = briefSummary(brief) !== briefSummary(input.brief)
    const askKey: AwaitingKey =
      input.awaiting === 'productName' && sameName(text, brief.brandName) && !brief.productName.trim() ? 'productName' : missing
    // Same field, second time, nothing learned from the answer → rephrase, never repeat verbatim.
    const retry = input.awaiting === askKey && timesAsked(state, askKey) >= 1 && !grew
    if (askKey === 'productName') replies.push(askCopy(brief, 'productName'))
    else if (retry) replies.push(askRetryCopy(brief, askKey, text))
    else replies.push(`${grew && ack && !isSurfaceOnlySummary(ack) ? `${ack}. ` : ''}${askCopy(brief, missing)}`.trim())
    return {
      brief,
      awaiting: askKey,
      replies,
      shouldGenerate: false,
      showTemplates: false,
      overridePatch: cueOverridePatch(brief),
      copyPatch: {},
      note: 'ask',
      state: noteAsked(state, askKey),
    }
  }

  if (ready && brief.templateId && input.awaiting === 'templateId') {
    return generateResult(brief, undefined, text, state)
  }

  if (ready) {
    return offerStructureResult({ ...brief, templateId: '' }, undefined, state)
  }

  replies.push(askCopy(brief, 'packagingMode'))
  return {
    brief,
    awaiting: 'packagingMode',
    replies,
    shouldGenerate: false,
    showTemplates: false,
    overridePatch: {},
    copyPatch: {},
    note: 'fallback',
    state: noteAsked(state, 'packagingMode'),
  }
}

export function openingReply(text: string): string {
  const t = text.toLowerCase()
  if (/henüz\s*emin|emin değilim/i.test(t)) {
    return 'Anlatman yeterli. Kutu mu etiket mi, hangi ürün, marka, renk, nasıl dursun — eksikleri ben sorarım.'
  }
  if (/kutu\s*\+|kutu.+(etiket|label)|(etiket|label).+kutu/i.test(t)) {
    return 'Kutu ve etiket. Önce kutuyu kuracağım.'
  }
  if (/etiket/.test(t)) return 'Etiket yüzeyi.'
  if (/kutu/.test(t)) return 'Kutu yüzeyi.'
  return ''
}

/** Async facade used by the workspace. Same local engine; no LLM coordinates. */
export async function runConversationAsync(
  input: Parameters<typeof runConversation>[0],
): Promise<EngineResult> {
  return runConversation(input)
}
