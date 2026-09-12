import type { Attachment, BriefFields, FieldKey } from '../types'
import { mergeBrief } from './fields'

const PACK_RULES: { re: RegExp; ambalaj: string; kategori?: string }[] = [
  { re: /kozmetik\s*kutusu/i, ambalaj: 'Kozmetik kutusu', kategori: 'Kozmetik' },
  { re: /kutu\s*ambalaj/i, ambalaj: 'Kutu ambalaj' },
  { re: /landing\s*page|iniş\s*sayfas|web\s*sayfa|web\s*sitesi/i, ambalaj: 'Landing page', kategori: 'Dijital' },
  { re: /\betiket\b/i, ambalaj: 'Etiket' },
  { re: /\bşişe\b|\bflakon\b/i, ambalaj: 'Şişe', kategori: 'Kozmetik' },
  { re: /\btüp\b/i, ambalaj: 'Tüp' },
  { re: /\bkutu\b/i, ambalaj: 'Kutu' },
]

const CATEGORY_RULES: { re: RegExp; value: string }[] = [
  { re: /kozmetik|cilt\s*bakım|serum|krem|parfüm|ruj|maskara/i, value: 'Kozmetik' },
  { re: /gıda|yiyecek|zeytinyağ|çay|kahve|çikolata/i, value: 'Gıda' },
  { re: /içecek|şarap|su\b|soda/i, value: 'İçecek' },
  { re: /ilaç|eczane|supplement|vitamin/i, value: 'Sağlık' },
  { re: /moda|giyim|tekstil/i, value: 'Moda' },
  { re: /teknoloji|elektronik/i, value: 'Teknoloji' },
]

const COLOR_WORDS: [RegExp, string][] = [
  [/quiet\s*luxury|sessiz\s*lüks/i, 'Siyah · Altın · Krem'],
  [/\bsiyah\b|\bblack\b/i, 'Siyah'],
  [/\bbeyaz\b|\bwhite\b/i, 'Beyaz'],
  [/\baltın\b|\bgold\b/i, 'Altın'],
  [/\bgümüş\b|\bsilver\b/i, 'Gümüş'],
  [/\bkrem\b|\bcream\b|\bbej\b/i, 'Krem'],
  [/\bnude\b/i, 'Nude'],
  [/\bpembe\b|\brose\b|\bblush\b/i, 'Pembe'],
  [/\bbordo\b|\bburgundy\b/i, 'Bordo'],
  [/\bkırmızı\b|\bred\b/i, 'Kırmızı'],
  [/\byeşil\b|\bolive\b|\bzeytin\b/i, 'Yeşil'],
  [/\bmavi\b|\bnavy\b|\blacivert\b/i, 'Lacivert'],
  [/\bmor\b|\bviolet\b/i, 'Mor'],
  [/\bterracotta\b|\bterakota\b/i, 'Terracotta'],
  [/\bkahve\b|\bbronze\b|\bbronz\b/i, 'Bronz'],
  [/\bşampanya\b|\bchampagne\b/i, 'Şampanya'],
]

const STYLE_RULES: [RegExp, string][] = [
  [/quiet\s*luxury|sessiz\s*lüks/i, 'Sessiz lüks'],
  [/premium|lüks|luxury|şık/i, 'Premium'],
  [/minimal|sade|yalın/i, 'Minimal'],
  [/organik|doğal|natürel/i, 'Organik'],
  [/klinik|clean|steril/i, 'Klinik'],
  [/modern/i, 'Modern'],
  [/klasik|art\s*deco/i, 'Klasik'],
  [/soft|feminen|feminine/i, 'Yumuşak'],
  [/maskülen|masculine|brutal/i, 'Maskülen'],
  [/vintage|retro/i, 'Vintage'],
  [/japandi|wabi/i, 'Japandi'],
]

function labeled(text: string, keys: string[]): string {
  const joined = keys.join('|')
  const re = new RegExp(
    `(?:${joined})\\s*(?:adı|adımız|adın)?\\s*[:\\-–]\\s*["'“”]?([^,.;\\n"“”]+)`,
    'i',
  )
  const match = text.match(re)
  return match?.[1]?.trim() ?? ''
}

function quoted(text: string): string[] {
  return [...text.matchAll(/["“”']([^"“”']{2,40})["“”']/g)].map((m) => m[1].trim())
}

function extractColors(text: string): string {
  const found: string[] = []
  const hex = text.match(/#([0-9a-fA-F]{3,8})/g)
  if (hex) found.push(...hex)
  for (const [re, label] of COLOR_WORDS) {
    if (re.test(text) && !found.includes(label)) found.push(label)
  }
  const labeledColor = labeled(text, ['renk', 'renkler', 'palet', 'palette'])
  if (labeledColor) found.unshift(labeledColor)
  return [...new Set(found)].join(' · ')
}

function extractDimensions(text: string): string {
  const m = text.match(
    /(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)(?:\s*[x×]\s*(\d+(?:[.,]\d+)?))?\s*(mm|cm|px)?/i,
  )
  if (!m) {
    const single = text.match(/(\d+(?:[.,]\d+)?)\s*(mm|cm)\b/i)
    return single ? `${single[1]} ${single[2].toLowerCase()}` : ''
  }
  const unit = (m[4] || 'mm').toLowerCase()
  const parts = [m[1], m[2], m[3]].filter(Boolean).join(' × ')
  return `${parts} ${unit}`
}

function extractVolume(text: string): string {
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*(ml|cl|l|gr|g|kg)\b/i)
  return m ? `${m[1]} ${m[2].toLowerCase()}` : ''
}

function looksLikeName(value: string): boolean {
  if (!value) return false
  if (value.length > 48) return false
  if (/[?]/.test(value)) return false
  return /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(value)
}


const KEYWORD_RE = /^(kozmetik|kutusu|kutu|ambalaj|etiket|landing|page|sayfa|şişe|flakon|tüp|siyah|beyaz|altın|gold|gümüş|krem|cream|nude|pembe|bordo|kırmızı|yeşil|mavi|lacivert|mor|premium|lüks|luxury|minimal|sade|organik|doğal|klinik|modern|klasik|soft|mm|cm|ml|gr|kg|px|renk|palet|stil|duruş|web|dijital|siyah-altın)$/i

const SKIP_RE = /^(için|bir|ve|ile|veya|daha|olarak|istiyorum|tasarlamak|lütfen|bana|adlı)$/i

function extractLeadingNames(text: string): { brand: string; product: string } {
  const icin = text.match(/^["“']?([A-Za-zÇĞİÖŞÜçğıöşü0-9][\wÇĞİÖŞÜçğıöşü&.'’-]{1,32})["”']?\s+için\b/i)
  const cut = text.split(/[,.;]/)[0] ?? text
  const words = cut.split(/\s+/).filter(Boolean)
  const kept: string[] = []
  for (const word of words) {
    const bare = word.replace(/^["""']+|["""',.;:]+$/g, '')
    if (!bare) continue
    if (SKIP_RE.test(bare)) {
      if (kept.length) break
      continue
    }
    if (KEYWORD_RE.test(bare) || /^\d/.test(bare) || bare.startsWith('#')) break
    if (bare.length > 28) break
    kept.push(bare)
    if (kept.length >= 4) break
  }
  if (icin && looksLikeName(icin[1]) && kept[0]?.toLowerCase() === icin[1].toLowerCase()) {
    return { brand: icin[1], product: kept.slice(1).join(' ') }
  }
  if (kept.length === 0) return { brand: '', product: '' }
  if (kept.length === 1) return { brand: kept[0], product: '' }
  return { brand: kept[0], product: kept.slice(1).join(' ') }
}

export function extractFields(text: string, attachments: Attachment[]): Partial<BriefFields> {
  const patch: Partial<BriefFields> = {}
  const raw = text.trim()

  for (const rule of PACK_RULES) {
    if (rule.re.test(raw)) {
      patch.ambalajTipi = rule.ambalaj
      if (rule.kategori) patch.kategori = rule.kategori
      break
    }
  }

  if (!patch.kategori) {
    for (const rule of CATEGORY_RULES) {
      if (rule.re.test(raw)) {
        patch.kategori = rule.value
        break
      }
    }
  }

  const brand = labeled(raw, ['marka', 'brand'])
  if (looksLikeName(brand)) patch.markaAdi = brand

  const product = labeled(raw, ['ürün', 'product', 'hat'])
  if (looksLikeName(product)) patch.urunAdi = product

  const quotes = quoted(raw)
  if (!patch.markaAdi && quotes[0] && looksLikeName(quotes[0])) patch.markaAdi = quotes[0]
  if (!patch.urunAdi && quotes[1] && looksLikeName(quotes[1])) patch.urunAdi = quotes[1]

  const compound = !!(patch.ambalajTipi || patch.renkler || patch.stil || patch.olculer)
  if (compound && (!patch.markaAdi || !patch.urunAdi)) {
    const leading = extractLeadingNames(raw)
    if (!patch.markaAdi && looksLikeName(leading.brand)) patch.markaAdi = leading.brand
    if (!patch.urunAdi && looksLikeName(leading.product)) patch.urunAdi = leading.product
  }

  const colors = extractColors(raw)
  if (colors) patch.renkler = colors

  for (const [re, label] of STYLE_RULES) {
    if (re.test(raw)) {
      patch.stil = label
      break
    }
  }

  const dims = extractDimensions(raw)
  if (dims) patch.olculer = dims

  const volume = extractVolume(raw)
  if (volume) patch.icerik = volume

  const texts = labeled(raw, ['metin', 'metinler', 'slogan', 'tagline', 'iddia'])
  if (texts) patch.metinler = texts

  const warn = labeled(raw, ['uyarı', 'uyarılar', 'warning'])
  if (warn) patch.uyarilar = warn
  else if (/geri\s*dönüş|çevre|alerjen|çocukların/i.test(raw)) {
    patch.uyarilar = 'Standart yasal uyarılar'
  }

  if (/\bbarkod\b|\bqr\b|\bean[\s-]?13\b/i.test(raw)) {
    const digits = raw.match(/\b\d{8,14}\b/)
    patch.barkodQr = digits ? digits[0] : 'Barkod isteniyor'
  }

  const styleLabeled = labeled(raw, ['stil', 'duruş', 'yön'])
  if (styleLabeled) patch.stil = styleLabeled

  if (attachments.length) {
    const logos = attachments.filter((a) => a.kind === 'logo')
    const refs = attachments.filter((a) => a.kind === 'referans')
    if (logos.length) patch.logo = logos.map((a) => a.name).join(', ')
    if (refs.length) patch.gorseller = refs.map((a) => a.name).join(', ')
    if (!patch.logo && attachments[0]) patch.logo = attachments[0].name
  }

  const extra = labeled(raw, ['not', 'diğer', 'ek'])
  if (extra) patch.diger = extra

  return patch
}

export function assignAwaiting(text: string, awaiting: FieldKey | null): Partial<BriefFields> {
  if (!awaiting) return {}
  const cleaned = text
    .replace(/^[\s\-–:]+/, '')
    .replace(/[?.!]+$/, '')
    .trim()
  if (!cleaned || cleaned.length > 80) return {}
  if (/^(evet|hayır|ok|tamam|olur|yok|bilmiyorum)$/i.test(cleaned)) {
    if (awaiting === 'renkler' && /yok|bilmiyorum|hayır/i.test(cleaned)) {
      return { renkler: 'Motordan önerilen palet' }
    }
    if (awaiting === 'olculer' && /yok|bilmiyorum/i.test(cleaned)) {
      return { olculer: 'Standart format' }
    }
    return {}
  }
  return { [awaiting]: cleaned }
}

export function applyExtraction(
  brief: BriefFields,
  text: string,
  attachments: Attachment[],
  awaiting: FieldKey | null,
): BriefFields {
  const extracted = extractFields(text, attachments)
  const assigned = assignAwaiting(text, awaiting)
  // Prefer explicit extraction over raw assignment when both exist
  return mergeBrief(mergeBrief(brief, assigned), extracted)
}
