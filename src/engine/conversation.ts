/**
 * conversation — facade re-exporting the decomposed conversation modules.
 * ASK data + nextMissing live in conversationAsk.ts.
 * This file preserves the public API: runConversation, runConversationAsync, openingReply, nextMissing.
 */
import type { Attachment, AwaitingKey, DesignBrief, EngineResult } from '../types'
import { applyExtraction, sameName } from './extract'
import { briefSummary, isCoreReady } from './fields'
import { isIteration, parseIntent } from './iterate/parseIntent'
import { askCopy, nextMissing } from './conversationAsk'

export { nextMissing } from './conversationAsk'

export function runConversation(input: {
  text: string
  attachments: Attachment[]
  brief: DesignBrief
  awaiting: AwaitingKey | null
  hasDesign: boolean
}): EngineResult {
  const text = input.text.trim()

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
    }
  }

  const brief = applyExtraction(input.brief, text, input.attachments, input.awaiting)

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
        overridePatch: {},
        copyPatch: {},
        note: 'update',
      }
    }
    return {
      brief,
      awaiting: null,
      replies: ['İterasyon: ruh hali çipi, “lüks istiyorum / eco’ya geç”, renk hex, “logoyu büyüt”, “daha premium”, “metni … yap”, “baskıya hazırla”.'],
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
      overridePatch: {},
      copyPatch: {},
      note: 'ask',
    }
  }

  if (ready && brief.templateId) {
    replies.push(
      `${ack || 'Brief yeterli.'} Forxa tasarım motorunu çalıştırıyorum — dieline, vektör artwork ve üretim kapısı aynı anda çıkacak.`,
    )
    replies.push('Ruh hali çipleri ipucu (kostüm değil). Renk verirseniz palet ondan kurulur: “luxury yap”, “eco’ya geç”, “logoyu büyüt”, “daha premium”.')
    return {
      brief,
      awaiting: null,
      replies,
      shouldGenerate: true,
      showTemplates: false,
      overridePatch: {},
      copyPatch: {},
      note: 'generate',
    }
  }

  if (ready && !brief.templateId) {
    replies.push(
      `${ack ? `${ack}. ` : ''}Bu sektörün kutularını sağda açtım. Kart seçin; ml varsa ölçü tahmini dolu gelir, düzeltebilirsiniz.`,
    )
    return {
      brief,
      awaiting: 'templateId',
      replies,
      shouldGenerate: false,
      showTemplates: true,
      overridePatch: {},
      copyPatch: {},
      note: 'templates',
    }
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

export function runConversationAsync(input: {
  text: string
  attachments: Attachment[]
  brief: DesignBrief
  awaiting: AwaitingKey | null
  hasDesign: boolean
}): Promise<EngineResult> {
  return Promise.resolve(runConversation(input))
}

export function openingReply(text: string): string {
  const t = text.toLowerCase()
  if (/etiket/.test(t)) return 'Etiket — en dar yüzey. Marka adı nedir?'
  if (/gıda/.test(t)) return 'Gıda ambalajı. Markanın adı nedir?'
  if (/elektronik/.test(t)) return 'Elektronik kutusu. Markanın adı nedir?'
  if (/kozmetik|parfüm/.test(t)) return 'Kozmetik — ambalajın en net yüzeyi. Markanın adı nedir?'
  if (/kutu/.test(t)) return 'Kutu. Markanın adı nedir?'
  return ''
}
