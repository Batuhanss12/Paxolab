import type { Attachment, AwaitingKey, DesignBrief, EngineResult } from '../types'
import { applyExtraction } from './extract'
import { briefSummary, isCoreReady } from './fields'
import { isIteration, parseIntent } from './iterate/parseIntent'

const ASK: Partial<Record<AwaitingKey, string>> = {
  packagingMode: 'Kutu mu tasarlıyoruz, yoksa etiket mi?',
  sector: 'Sektör nedir — kozmetik, gıda, elektronik?',
  brandName: 'Markanın adı nedir? Tipografide bunu taşıyacağız.',
  productName: 'Ürünün adı veya hattı nedir?',
  styleType: 'Duruş: luxury, modern, minimal, eco, playful, classic?',
  templateId: 'Sağdaki şablon kartlarından birini seçin — dieline canlı güncellenir.',
}

const ASK_SEQUENCE: AwaitingKey[] = ['packagingMode', 'sector', 'brandName', 'productName', 'styleType']

function nextMissing(brief: DesignBrief): AwaitingKey | null {
  for (const key of ASK_SEQUENCE) {
    if (key === 'packagingMode' && !brief.packagingMode) return key
    if (key === 'sector' && !brief.sector.trim()) return key
    if (key === 'brandName' && !brief.brandName.trim()) return key
    if (key === 'productName' && !brief.productName.trim()) return key
    if (key === 'styleType' && !brief.styleType) return key
  }
  if (!brief.templateId) return 'templateId'
  return null
}

export function runConversation(input: {
  text: string
  attachments: Attachment[]
  brief: DesignBrief
  awaiting: AwaitingKey | null
  hasDesign: boolean
}): EngineResult {
  const text = input.text.trim()
  const brief = applyExtraction(input.brief, text, input.attachments, input.awaiting)

  if (input.hasDesign && isIteration(text)) {
    const parsed = parseIntent(text)
    return {
      brief: { ...brief, ...parsed.briefPatch },
      awaiting: null,
      replies: [parsed.note],
      shouldGenerate: true,
      showTemplates: false,
      overridePatch: parsed.overridePatch,
      copyPatch: parsed.copyPatch,
      note: parsed.note,
    }
  }

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
      replies: ['İterasyon: “logoyu büyüt”, “daha premium”, “metni … yap”, “baskıya hazırla”.'],
      shouldGenerate: false,
      showTemplates: false,
      overridePatch: {},
      copyPatch: {},
      note: 'hint',
    }
  }

  if (ready && brief.templateId) {
    replies.push(
      `${ack || 'Brief yeterli.'} FORMA tasarım motorunu çalıştırıyorum — dieline, vektör artwork ve üretim kapısı aynı anda çıkacak.`,
    )
    replies.push('İterasyon için soldan yazın: “logoyu büyüt”, “daha premium”, “baskıya hazırla”.')
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
      `${ack ? `${ack}. ` : ''}Sektöre uygun şablonları sağda açtım. Kart seçin; ölçüleri düzenleyebilir, dieline’ı canlı görebilirsiniz.`,
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

  if (missing && missing !== 'templateId') {
    const grew = briefSummary(brief) !== briefSummary(input.brief)
    replies.push(`${grew && ack ? `${ack}. ` : ''}${ASK[missing]}`.trim())
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

  replies.push(ASK.packagingMode ?? '')
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
  if (/etiket/.test(t)) return 'Etiket — en dar yüzey. Marka adı nedir?'
  if (/gıda/.test(t)) return 'Gıda ambalajı. Markanın adı nedir?'
  if (/elektronik/.test(t)) return 'Elektronik kutusu. Markanın adı nedir?'
  if (/kozmetik|parfüm/.test(t)) return 'Kozmetik — ambalajın en net yüzeyi. Markanın adı nedir?'
  if (/kutu/.test(t)) return 'Kutu. Markanın adı nedir?'
  return ''
}
