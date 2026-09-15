import type { Attachment, AwaitingKey, DesignBrief, EngineResult } from '../types'
import { pickTemplate } from './catalog/catalog'
import { applyExtraction, sameName } from './extract'
import { askCopy, nextMissing } from './conversationAsk'
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

function generateResult(brief: DesignBrief, ack?: string, text = ''): EngineResult {
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
      `${briefing}${dual} Grapxor motoru dieline ve vektör yüzeyi aynı anda çıkaracak.`,
      'Yönü konuşarak iterasyon: “daha premium”, “logoyu büyüt”, “etiketi de üret”.',
    ],
    shouldGenerate: true,
    showTemplates: false,
    overridePatch: cueOverridePatch(next),
    copyPatch: {},
    note: 'generate',
    feedback: parseFeedback(text),
  }
}

export function runConversation(input: {
  text: string
  attachments: Attachment[]
  brief: DesignBrief
  awaiting: AwaitingKey | null
  hasDesign: boolean
}): EngineResult {
  const text = input.text.trim()

  if (input.hasDesign && wantsCompanionLabel(text) && input.brief.packagingMode !== 'label') {
    const labelBrief = { ...input.brief, packagingMode: 'label' as const, templateId: '' }
    return generateResult(labelBrief, `${directionBriefing(labelBrief)} Şişe etiketini kuruyorum.`, text)
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
    }
  }

  const extracted = applyExtraction(input.brief, text, input.attachments, input.awaiting)
  const brief = withUnderstanding(extracted, text, input.attachments)

  const ready = isCoreReady(brief)
  const missing = nextMissing(brief)
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
    }
  }

  if (missing && missing !== 'templateId') {
    const grew = briefSummary(brief) !== briefSummary(input.brief)
    if (
      input.awaiting === 'productName' &&
      sameName(text, brief.brandName) &&
      !brief.productName.trim()
    ) {
      replies.push(askCopy(brief, 'productName'))
    } else {
      replies.push(`${grew && ack ? `${ack}. ` : ''}${askCopy(brief, missing)}`.trim())
    }
    return {
      brief,
      awaiting: missing,
      replies,
      shouldGenerate: false,
      showTemplates: false,
      overridePatch: cueOverridePatch(brief),
      copyPatch: {},
      note: 'ask',
    }
  }

  if (ready && (brief.templateId || missing === 'templateId' || missing === null)) {
    return generateResult(brief, undefined, text)
  }

  if (ready && !brief.templateId) {
    return generateResult(brief, undefined, text)
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
