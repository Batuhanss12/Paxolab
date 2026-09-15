import type { Attachment, AwaitingKey, DesignBrief, EngineResult } from '../types'
import { pickTemplate } from './catalog/catalog'
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
import { briefSummary, isCoreReady, mergeBrief } from './fields'
import { parseFeedback } from './iterate/feedbackParser'
import { isIteration, parseIntent } from './iterate/parseIntent'

export { askCopy, nextMissing } from './conversationAsk'

function withUnderstanding(brief: DesignBrief, text: string, attachments: Attachment[]): DesignBrief {
  const understanding = understandUtterance(text, brief, attachments)
  return mergeBrief(brief, understanding.patch)
}

function generateResult(brief: DesignBrief, ack?: string, text = '', state?: ConversationState): EngineResult {
  const tmpl = pickTemplate(brief)
  const next = {
    ...brief,
    templateId: tmpl.id,
    packagingMode: brief.packagingMode || tmpl.packagingMode,
  }
  const briefing = (ack ?? '').trim() || directionBriefing(next)
  const dual =
    isDualDeliverable(next) && next.packagingMode !== 'label'
      ? ' Kutu ve etiket istedin; önce kutuyu çiziyorum. Etiket için “etiketi de üret” yaz.'
      : ''
  return {
    brief: next,
    awaiting: null,
    replies: [
      `${briefing}${dual} Referans stüdyo anatomisiyle (TASARIM REF) dieline ve vektör yüzeyi birlikte çıkarılıyor.`,
      'Yönü konuşarak iterasyon: “daha premium”, “daha modern”, “logoyu büyüt”, “etiketi de üret”.',
    ],
    shouldGenerate: true,
    showTemplates: false,
    overridePatch: cueOverridePatch(next),
    copyPatch: {},
    note: 'generate',
    feedback: parseFeedback(text),
    state,
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
    else replies.push(`${grew && ack ? `${ack}. ` : ''}${askCopy(brief, missing)}`.trim())
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

  if (ready && (brief.templateId || missing === 'templateId' || missing === null)) {
    return generateResult(brief, undefined, text, state)
  }

  if (ready && !brief.templateId) {
    return generateResult(brief, undefined, text, state)
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
    return 'Anlatman yeterli. Kutu, etiket, ürün, marka, renk — nasıl durmasını istediğini yaz.'
  }
  if (/kutu\s*\+|kutu.+(etiket|label)|(etiket|label).+kutu/i.test(t)) {
    return 'Kutu ve etiket. Önce kutuyu kuracağım. Markanın adı nedir?'
  }
  if (/etiket/.test(t)) return 'Etiket — en dar yüzey. Marka adı nedir?'
  if (/gıda/.test(t)) return 'Gıda ambalajı. Markanın adı nedir?'
  if (/elektronik/.test(t)) return 'Elektronik kutusu. Markanın adı nedir?'
  if (/kozmetik|parfüm/.test(t)) return 'Kozmetik — ambalajın en net yüzeyi. Markanın adı nedir?'
  if (/kutu/.test(t)) return 'Kutu. Markanın adı nedir?'
  return ''
}

/** Async facade used by the workspace. Same local engine; no LLM coordinates. */
export async function runConversationAsync(
  input: Parameters<typeof runConversation>[0],
): Promise<EngineResult> {
  return runConversation(input)
}
