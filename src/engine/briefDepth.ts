/**
 * Brief depth — the questions a designer asks before drawing, read off what the customer said.
 *
 * The chat collected five facts (surface, sector, brand, product, barcode) and then painted. A
 * studio asks more: who buys it, where it sells, what it costs, what it must not look like, how it
 * should feel. None of these is worth a blocking question — the customer who does not say is
 * served by the sector defaults — but when they *are* said, in passing, they must not fall on the
 * floor. Everything here is a heuristic on the utterance; the LLM extract carries the same keys
 * with lower provenance, and `mergeBrief` keeps the stronger source.
 */
import type { DesignBrief, PriceTier } from '../types'

export type BriefDepth = Partial<Pick<DesignBrief, 'audience' | 'channel' | 'priceTier' | 'avoidLike' | 'feeling'>>

/*
 * Turkish word matching. `\b` is ASCII-only in a JavaScript regex: "genç" has no boundary after
 * the ç, so `genç\b` never matches — measured, "Genç kadınlara" came back as "kadın" alone. The
 * stems here are fenced by Unicode letters instead, and may carry a Turkish case or plural
 * suffix ("eczanede", "kadınlara"), so a stem is not left behind by its own grammar.
 */
const SUFFIX = '(?:lar|ler|larda|lerde|lara|lere|ları|leri|dan|den|tan|ten|da|de|ta|te|ya|ye|a|e|ı|i|u|ü|nın|nin|nun|nün)?'
const stem = (alts: string): RegExp => new RegExp(`(?<!\\p{L})(?:${alts})${SUFFIX}(?!\\p{L})`, 'iu')

const AUDIENCE: [RegExp, string][] = [
  [stem('genç|gen ?z|z kuşağı'), 'genç'],
  [stem('kadın|women|feminen'), 'kadın'],
  [stem('erkek|men|maskülen'), 'erkek'],
  [stem('unisex'), 'unisex'],
  [stem('çocuk|kids?'), 'çocuk'],
  [stem('bebek|ebeveyn'), 'bebek / ebeveyn'],
  [stem('profesyonel|kuaför|salon kullanım'), 'profesyonel'],
  [stem('sporcu|fitness'), 'sporcu'],
  [/(?<!\p{L})olgun(?!\p{L})|(?:40|50)\s*\+|yaş\s*üstü/iu, 'olgun'],
]

const CHANNEL: [RegExp, string][] = [
  [/e-?ticaret|online|internet(?:ten)?\s*satış|trendyol|hepsiburada|amazon|shopify|etsy/iu, 'e-ticaret'],
  [stem('raf|market|zincir market|süpermarket'), 'raf'],
  [stem('butik|concept store'), 'butik'],
  [stem('eczane|pharmacy'), 'eczane'],
  [stem('kuaför|salon|berber'), 'salon'],
  [stem('hediye|hediyelik|gift'), 'hediye'],
  [stem('otel|spa|hotel'), 'otel / spa'],
  [stem('ihracat|export'), 'ihracat'],
]

const PRICE: [RegExp, PriceTier][] = [
  [/(?<!\p{L})(?:butik|niş\s*parfüm|el\s*yapımı|küçük\s*seri|artisan|boutique|çok\s*pahalı)/iu, 'boutique'],
  [/(?<!\p{L})(?:premium|pahalı|üst\s*segment|lüks\s*segment|high[\s-]*end)/iu, 'premium'],
  [/(?<!\p{L})(?:ucuz|ekonomik|uygun\s*fiyat|market\s*ürünü|mass|halk\s*tipi|bütçe\s*dostu)/iu, 'mass'],
  [/(?<!\p{L})(?:orta\s*segment|orta\s*fiyat|mid[\s-]*range|makul\s*fiyat)/iu, 'mid'],
]

const FEELING: [RegExp, string][] = [
  [stem('sakin|huzur|huzurlu|dingin|calm'), 'sakin'],
  [stem('sıcak|samimi|warm|cozy'), 'sıcak'],
  [stem('güçlü|cesur|bold|sert'), 'güçlü'],
  [/(?<!\p{L})(?:taze|ferah|fresh|temiz\s*his)/iu, 'taze'],
  [stem('zarif|incelikli|elegant|rafine'), 'zarif'],
  [/(?<!\p{L})(?:gösterişli|şaşaalı|opulent|zengin\s*his)/iu, 'gösterişli'],
  [stem('eğlenceli|neşeli|playful|şen'), 'eğlenceli'],
  [/güven(?:ilir)?\s*his|(?<!\p{L})ciddi|klinik\s*his|trust/iu, 'güvenilir'],
]

/**
 * "X gibi olmasın", "X'e benzemesin", "not like X" — the reference as the customer said it.
 *
 * Up to four words before the marker, cut back to what follows the last conjunction. A bare
 * adjective ("ucuz gibi olmasın") is a price or feeling statement, not a reference, and is
 * skipped so that a later "Chanel gibi olmasın" in the same sentence is the one recorded.
 */
const NOT_A_REFERENCE = /^(?:ucuz|klasik|jenerik|generic|cheap|sıradan|basit|eski|ağır|kalabalık|abartılı|ciddi|sade)$/iu
function avoidLikeOf(text: string): string {
  const markers = [
    /((?:\S+\s+){0,3}\S+)\s*(?:gibi|tarzı(?:nda)?)\s*(?:olmasın|durmasın|görünmesin|istemiyorum)/giu,
    /((?:\S+\s+){0,3}\S+?)['’]?[ea]\s*benzemesin/giu,
    /(?<!\p{L})not\s+like\s+((?:\S+\s+){0,3}\S+)/giu,
  ]
  for (const re of markers) {
    for (const m of text.matchAll(re)) {
      const phrase = m[1]
        .replace(/^.*(?:^|\s)(?:ama|fakat|ve|but|and)\s+/iu, '')
        .replace(/^[,;:]+\s*/u, '')
        .trim()
      if (phrase.length < 3 || NOT_A_REFERENCE.test(phrase)) continue
      return phrase
    }
  }
  return ''
}

export function depthFieldsOf(text: string): BriefDepth {
  const out: BriefDepth = {}
  const audience = AUDIENCE.filter(([re]) => re.test(text)).map(([, label]) => label)
  if (audience.length) out.audience = [...new Set(audience)].join(' · ')
  const channel = CHANNEL.filter(([re]) => re.test(text)).map(([, label]) => label)
  if (channel.length) out.channel = [...new Set(channel)].join(' · ')
  const price = PRICE.find(([re]) => re.test(text))
  if (price) out.priceTier = price[1]
  const feeling = FEELING.filter(([re]) => re.test(text)).map(([, label]) => label)
  if (feeling.length) out.feeling = [...new Set(feeling)].slice(0, 3).join(' · ')
  const avoid = avoidLikeOf(text)
  if (avoid) out.avoidLike = avoid
  return out
}

export const PRICE_TIERS: PriceTier[] = ['mass', 'mid', 'premium', 'boutique']

export function isPriceTier(value: unknown): value is PriceTier {
  return typeof value === 'string' && (PRICE_TIERS as string[]).includes(value)
}
