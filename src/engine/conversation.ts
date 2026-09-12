import type {
  Attachment,
  BriefFields,
  DesignOverrides,
  DesignSpec,
  EngineResult,
  FieldKey,
} from '../types'
import { applyExtraction } from './extract'
import { briefSummary, isCoreReady } from './fields'

const ASK: Record<FieldKey, string> = {
  ambalajTipi: 'Nasıl bir yüzey tasarlıyoruz — kutu, etiket, yoksa bir landing page mı?',
  markaAdi: 'Markanın adı nedir? Tipografide bunu taşıyacağız.',
  urunAdi: 'Ürünün adı veya hattı nedir?',
  stil: 'Duruş nasıl olsun — daha premium ve sessiz, yoksa temiz ve minimal?',
  renkler: 'Renk paleti var mı? Yoksa markaya göre karanlık bir set kurabilirim.',
  olculer: 'Ölçüler belli mi? Örneğin 80 × 40 × 120 mm.',
  metinler: 'Yüzeyde görünmesini istediğiniz ana metin veya slogan var mı?',
  icerik: 'Hacim veya içerik notu? Kozmetikte genelde 30 ml, 50 ml.',
  uyarilar: 'Yasal uyarı veya INCI satırı ekleyelim mi?',
  barkodQr: 'Barkod veya QR için bir numara var mı?',
  kategori: 'Kategori nedir — kozmetik, gıda, dijital?',
  logo: 'Logo dosyası var mı, yoksa monogram çizeyim?',
  gorseller: 'Referans görsel eklemek ister misiniz?',
  diger: 'Eklemek istediğiniz başka bir not var mı?',
}

const ASK_SEQUENCE: FieldKey[] = [
  'ambalajTipi',
  'markaAdi',
  'urunAdi',
  'stil',
  'renkler',
  'olculer',
]

function nextMissing(brief: BriefFields): FieldKey | null {
  for (const key of ASK_SEQUENCE) {
    if (!brief[key].trim()) return key
  }
  return null
}

function isIteration(text: string): boolean {
  return /logo|premium|minimal|baskı|yazı|metn|renk|daha\s|küçült|büyüt|hazırla|koyu|sıcak|sade|yeniden|tagline|slogan|barkod|qr|altın|gold/i.test(
    text,
  )
}

function parseIteration(text: string): {
  overridePatch: Partial<DesignOverrides>
  copyPatch: Partial<DesignSpec['copy']>
  note: string
} {
  const t = text.toLowerCase()
  const overridePatch: Partial<DesignOverrides> = {}
  const copyPatch: Partial<DesignSpec['copy']> = {}
  const notes: string[] = []

  if (/logoyu\s*büyüt|logo\s*büyüt|logoyu\s*büyük/i.test(text)) {
    overridePatch.logoScale = 1.35
    notes.push('Logo ölçeğini büyüttüm.')
  } else if (/logoyu\s*küçült|logo\s*küçült/i.test(text)) {
    overridePatch.logoScale = 0.72
    notes.push('Logo ölçeğini küçülttüm.')
  }

  if (/yazıyı\s*büyüt|tipografiyi\s*büyüt|başlığı\s*büyüt/i.test(text)) {
    overridePatch.titleScale = 1.28
    notes.push('Başlık tipografisini açtım.')
  } else if (/yazıyı\s*küçült|tipografiyi\s*küçült/i.test(text)) {
    overridePatch.titleScale = 0.82
    notes.push('Başlığı daha sessiz hale getirdim.')
  }

  if (/daha\s*premium|daha\s*lüks|daha\s*şık|gold|altın/i.test(text)) {
    overridePatch.premium = true
    overridePatch.paletteShift = 'gold'
    notes.push('Paleti sessiz lüks — siyah, altın, krem — yönüne çektim.')
  } else if (/daha\s*minimal|sadeleştir|daha\s*sade/i.test(text)) {
    overridePatch.premium = false
    overridePatch.paletteShift = 'minimal'
    notes.push('Yüzeyi sadeleştirdim, tek aksan kaldı.')
  } else if (/daha\s*koyu|daha\s*karanlık|darker/i.test(text)) {
    overridePatch.paletteShift = 'dark'
    notes.push('Zemin daha derin siyah, kontrastı yükselttim.')
  } else if (/daha\s*sıcak|warm|terracotta/i.test(text)) {
    overridePatch.paletteShift = 'warm'
    notes.push('Paleti sıcak — krem ve bronz — tarafa aldım.')
  }

  if (/baskıya\s*hazırla|üretime\s*gönder|print\s*ready|baskı\s*hazır/i.test(text)) {
    overridePatch.printReady = true
    notes.push('Taşma, güvenli alan ve CMYK notlarını üretim bilgisine işledim.')
  }

  if (/barkod.*kaldır|qr.*kaldır/i.test(text)) {
    overridePatch.barcodeVisible = false
    notes.push('Barkodu yüzeyden kaldırdım.')
  } else if (/barkod|qr\s*ekle/i.test(text)) {
    overridePatch.barcodeVisible = true
    notes.push('Barkodu ön yüze aldım.')
  }

  const tagline = text.match(
    /(?:sloganı|tagline['’]?i|metni|iddia[yı]?)\s+(?:olarak\s+)?["“']?([^"”']+?)["”']?\s*(?:yap|olsun|değiştir)/i,
  )
  if (tagline?.[1]) {
    const value = tagline[1].trim()
    overridePatch.customTagline = value
    copyPatch.tagline = value
    notes.push(`Sloganı “${value}” olarak güncelledim.`)
  }

  const product = text.match(
    /(?:ürün(?:ün)?\s*adın[ıi]|ürünü)\s+(?:olarak\s+)?["“']?([^"”']+?)["”']?\s*(?:yap|olsun)/i,
  )
  if (product?.[1]) {
    copyPatch.product = product[1].trim()
    notes.push(`Ürün adını “${product[1].trim()}” yaptım.`)
  }

  const brand = text.match(
    /(?:marka(?:yı|nın\s*adın[ıi])?)\s+(?:olarak\s+)?["“']?([^"”']+?)["”']?\s*(?:yap|olsun)/i,
  )
  if (brand?.[1]) {
    copyPatch.brand = brand[1].trim()
    notes.push(`Markayı “${brand[1].trim()}” olarak güncelledim.`)
  }

  if (/yeniden\s*üret|regenerate|baştan/i.test(t) && notes.length === 0) {
    notes.push('Motoru aynı brief ile yeniden çalıştırdım.')
  }

  if (notes.length === 0) {
    notes.push('İsteği motora ilettim, yüzeyi güncelledim.')
  }

  return { overridePatch, copyPatch, note: notes.join(' ') }
}

function acknowledge(brief: BriefFields): string {
  const summary = briefSummary(brief)
  return summary ? `${summary}.` : ''
}

export function runConversation(input: {
  text: string
  attachments: Attachment[]
  brief: BriefFields
  awaiting: FieldKey | null
  hasDesign: boolean
}): EngineResult {
  const text = input.text.trim()
  const brief = applyExtraction(input.brief, text, input.attachments, input.awaiting)

  if (input.hasDesign && isIteration(text)) {
    const parsed = parseIteration(text)
    return {
      brief,
      awaiting: null,
      replies: [parsed.note],
      shouldGenerate: true,
      overridePatch: parsed.overridePatch,
      copyPatch: parsed.copyPatch,
      note: parsed.note,
    }
  }

  const ready = isCoreReady(brief)
  const missing = nextMissing(brief)
  const ack = acknowledge(brief)
  const replies: string[] = []

  if (input.hasDesign) {
    const grew = JSON.stringify(brief) !== JSON.stringify(input.brief)
    if (grew) {
      return {
        brief,
        awaiting: null,
        replies: [ack ? `${ack} Yüzeyi bu brief ile yeniliyorum.` : 'Yüzeyi güncelledim.'],
        shouldGenerate: true,
        overridePatch: {},
        copyPatch: {},
        note: 'update',
      }
    }
    return {
      brief,
      awaiting: null,
      replies: [
        'İterasyon için “logoyu büyüt”, “daha premium”, “baskıya hazırla” yazın. Ölçü, renk veya slogan da verebilirsiniz.',
      ],
      shouldGenerate: false,
      overridePatch: {},
      copyPatch: {},
      note: 'hint',
    }
  }

  if (input.attachments.length) {
    const names = input.attachments.map((a) => a.name).join(', ')
    replies.push(
      input.attachments.some((a) => a.kind === 'logo')
        ? `Logoyu aldım (${names}). Monogram yerine bunu yerleştireceğim.`
        : `Referansı kaydettim: ${names}.`,
    )
  }

  if (ready && !input.hasDesign) {
    const lead = ack || 'Brief yeterli.'
    replies.push(
      `${lead} Tasarım motorunu çalıştırıyorum — 2D vektör, 3D hacim ve üretim kontrolü aynı anda çıkacak.`,
    )
    replies.push(
      'Hazır olunca soldan konuşarak iterasyon yapabilirsiniz: “logoyu büyüt”, “daha premium”, “baskıya hazırla”.',
    )
    return {
      brief,
      awaiting: null,
      replies,
      shouldGenerate: true,
      overridePatch: {},
      copyPatch: {},
      note: 'generate',
    }
  }

  if (missing) {
    const grew = briefSummary(brief) !== briefSummary(input.brief)
    const prefix = grew && ack ? `${ack} ` : ''
    replies.push(`${prefix}${ASK[missing]}`.trim())
    return {
      brief,
      awaiting: missing,
      replies,
      shouldGenerate: false,
      overridePatch: {},
      copyPatch: {},
      note: 'ask',
    }
  }

  if (ready) {
    replies.push(
      ack
        ? `${ack} Yüzeyi bu brief ile yeniliyorum.`
        : 'Yüzeyi güncelledim.',
    )
    return {
      brief,
      awaiting: null,
      replies,
      shouldGenerate: true,
      overridePatch: {},
      copyPatch: {},
      note: 'update',
    }
  }

  replies.push(ASK.ambalajTipi)
  return {
    brief,
    awaiting: 'ambalajTipi',
    replies,
    shouldGenerate: false,
    overridePatch: {},
    copyPatch: {},
    note: 'fallback',
  }
}

export function openingReply(text: string): string {
  const t = text.toLowerCase()
  if (/landing/.test(t)) {
    return 'Bir landing page — markanın ilk duruşu. İsmi nedir?'
  }
  if (/etiket/.test(t)) {
    return 'Etiket, en dar yüzey; her harf görünür. Marka adı nedir?'
  }
  if (/kozmetik/.test(t)) {
    return 'Kozmetik kutusu — ambalajın en net yüzeyi. Markanın adı nedir? Tipografide bunu taşıyacağız.'
  }
  if (/kutu/.test(t)) {
    return 'Kutu ambalaj. Markanın adı nedir?'
  }
  return ''
}
