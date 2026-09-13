import type { Attachment, AwaitingKey, DesignBrief, EngineResult } from '../types'
import { applyExtraction, sameName } from './extract'
import {
  acceptedAddressDefault,
  acceptedBarcodeDefault,
  acceptedDimsDefault,
  acceptedManufacturerDefault,
  acceptedProductSkip,
  acceptedVolumeDefault,
  briefSummary,
  hasUserAddress,
  hasUserBarcode,
  hasUserDims,
  hasUserManufacturer,
  hasUserVolume,
  isCoreReady,
} from './fields'
import { isIteration, parseIntent } from './iterate/parseIntent'
import { parseIntentWithLlm } from './llm'

const ASK: Partial<Record<AwaitingKey, string>> = {
  packagingMode: 'Kutu mu tasarlıyoruz, yoksa etiket mi?',
  sector: 'Sektör nedir — kozmetik, gıda, elektronik?',
  brandName: 'Markanın adı nedir? Tipografide bunu taşıyacağız.',
  productName: 'Ürün hattı veya SKU adı nedir? Marka adı değil — örneğin Noir. Yoksa “örnek” yazın; lockup’ta yalnız marka kalır.',
  volume: 'Hacim nedir — örneğin 50 ml? Bilmiyorsanız “örnek” yazın; Girdiler’de varsayılan diye işaretlerim.',
  dimensionsMm:
    'Ölçüler nedir (L×W×H mm)? Yazmazsanız şablon varsayılanını kullanırım — “şablon” yazmanız yeterli.',
  barcode:
    'Barkod / GTIN nedir? Yazmazsanız örnek bir barkod çizerim — Girdiler’de örnek diye işaretlenir, gerçek GS1 değildir.',
  manufacturerName: 'Üretici veya ithalatçı unvanı nedir? Bilmiyorsanız “örnek” yazın.',
  manufacturerAddress: 'Üretici adresi nedir (ilçe, şehir, ülke)? Bilmiyorsanız “örnek” yazın.',
  styleType: 'Soldaki stil çiplerinden seçin: Lüks, Modern, Minimal, Eco, Eğlenceli, Klasik.',
  templateId: 'Sağdaki şablon kartlarından birini seçin — dieline canlı güncellenir.',
}

const ASK_LABEL: Partial<Record<AwaitingKey, string>> = {
  productName: 'Ön etiket hattı nedir (markadan farklı — örn. Noir)? Yoksa “örnek” yazın.',
  volume: 'Ön yüzde hacim yazılsın mı — örneğin 50 ml? “örnek” veya “yok” yazabilirsiniz.',
  dimensionsMm: 'Etiket ölçüsü nedir (genişlik × yükseklik mm)? “şablon” yazmanız yeterli.',
}

const ASK_BOX: AwaitingKey[] = [
  'packagingMode',
  'sector',
  'brandName',
  'productName',
  'volume',
  'dimensionsMm',
  'barcode',
  'manufacturerName',
  'manufacturerAddress',
]

const ASK_LABEL_SEQ: AwaitingKey[] = [
  'packagingMode',
  'sector',
  'brandName',
  'productName',
  'volume',
  'dimensionsMm',
]

function askCopy(brief: DesignBrief, key: AwaitingKey): string {
  if (brief.packagingMode === 'label' && ASK_LABEL[key]) return ASK_LABEL[key] as string
  return ASK[key] ?? ''
}

export function nextMissing(brief: DesignBrief): AwaitingKey | null {
  const sequence = brief.packagingMode === 'label' ? ASK_LABEL_SEQ : ASK_BOX
  for (const key of sequence) {
    if (key === 'packagingMode' && !brief.packagingMode) return key
    if (key === 'sector' && !brief.sector.trim()) return key
    if (key === 'brandName' && !brief.brandName.trim()) return key
    if (key === 'productName' && !brief.productName.trim() && !acceptedProductSkip(brief)) return key
    if (key === 'volume' && !hasUserVolume(brief) && !acceptedVolumeDefault(brief)) return key
    if (key === 'dimensionsMm' && !hasUserDims(brief) && !acceptedDimsDefault(brief)) return key
    if (key === 'barcode' && !hasUserBarcode(brief) && !acceptedBarcodeDefault(brief)) return key
    if (key === 'manufacturerName' && !hasUserManufacturer(brief) && !acceptedManufacturerDefault(brief)) return key
    if (key === 'manufacturerAddress' && !hasUserAddress(brief) && !acceptedAddressDefault(brief)) return key
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
      overridePatch: {},
      copyPatch: {},
      note: 'ask',
    }
  }

  if (ready && brief.templateId) {
    replies.push(
      `${ack || 'Brief yeterli.'} FORMA tasarım motorunu çalıştırıyorum — dieline, vektör artwork ve üretim kapısı aynı anda çıkacak.`,
    )
    replies.push('Stil çiplerinden duruşu değiştirin veya yazın: “luxury yap”, “eco’ya geç”, “logoyu büyüt”, “daha premium”.')
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
  if (/etiket/.test(t)) return 'Etiket — en dar yüzey. Marka adı nedir?'
  if (/gıda/.test(t)) return 'Gıda ambalajı. Markanın adı nedir?'
  if (/elektronik/.test(t)) return 'Elektronik kutusu. Markanın adı nedir?'
  if (/kozmetik|parfüm/.test(t)) return 'Kozmetik — ambalajın en net yüzeyi. Markanın adı nedir?'
  if (/kutu/.test(t)) return 'Kutu. Markanın adı nedir?'
  return ''
}

/**
 * Async conversation runner — tries LLM intent parsing first, falls back to local.
 * Only used for iteration commands (when hasDesign && isIteration).
 * Brief extraction flow stays synchronous via runConversation.
 */
export async function runConversationAsync(input: {
  text: string
  attachments: Attachment[]
  brief: DesignBrief
  awaiting: AwaitingKey | null
  hasDesign: boolean
}): Promise<EngineResult> {
  const text = input.text.trim()

  if (input.hasDesign && isIteration(text)) {
    const llmResult = await parseIntentWithLlm(text, input.brief.styleType, input.brief)
    if (llmResult) {
      return {
        brief: { ...input.brief, ...llmResult.briefPatch },
        awaiting: null,
        replies: [llmResult.note],
        shouldGenerate: true,
        showTemplates: false,
        overridePatch: llmResult.overridePatch,
        copyPatch: llmResult.copyPatch,
        note: llmResult.note,
      }
    }
  }

  return runConversation(input)
}
