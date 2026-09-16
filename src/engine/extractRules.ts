/**
 * Extraction rules — data-driven mode and sector detection from Turkish prompts.
 * Extracted from extract.ts to isolate the rule tables from the parsing logic.
 *
 * MODE_RULES: detect packaging mode (box/label) + optional sector/sub-product.
 * SECTOR_RULES: detect sector + sub-product from product keywords.
 *
 * Order matters: first match wins. More specific rules first.
 */
import type { PackagingMode } from '../types'

export type ModeRule = { re: RegExp; mode: PackagingMode; sector?: string; sub?: string }
export type SectorRule = { re: RegExp; sector: string; sub?: string }

export const MODE_RULES: ModeRule[] = [
  {
    re: /kutu\s*(ve|ile|\+)\s*(şişe\s*)?(etiket|label)|(etiket|label)\s*(ve|ile|\+)\s*kutu|\bbox\s*(and|\+|&)\s*(bottle\s*)?label|\blabel\s*(and|\+|&)\s*box/i,
    mode: 'box',
  },
  { re: /kozmetik\s*kutusu|parfüm\s*kut/i, mode: 'box', sector: 'kozmetik', sub: 'parfüm' },
  { re: /gıda\s*ambalaj|gıda\s*kut/i, mode: 'box', sector: 'gıda' },
  { re: /elektronik\s*kut|kulaklık/i, mode: 'box', sector: 'elektronik', sub: 'kulaklık' },
  { re: /takviye\s*kut|vitamin\s*kut|ilaç\s*kut/i, mode: 'box', sector: 'sağlık', sub: 'takviye' },
  { re: /bebek\s*(ürün|bakım).*kut/i, mode: 'box', sector: 'bebek', sub: 'bakım' },
  { re: /içecek\s*(etiket|şişe)|kombucha|meyve suyu/i, mode: 'label', sector: 'içecek' },
  { re: /kutu\s*ambalaj|\bkutu(?:su|sunu|sun|ya|yu|da|dan)?\b|\bbox(?:es)?\b/i, mode: 'box' },
  { re: /etiket|label|wrap/i, mode: 'label' },
]

export const SECTOR_RULES: SectorRule[] = [
  { re: /parfüm|perfume|eau de/i, sector: 'kozmetik', sub: 'parfüm' },
  /** "krem ve koyu yeşil" / "cream and dark green" is a colour, not a product. */
  { re: /krem(?!\s*(?:ve|and|,|·|\+|rengi|tonu|tonlar))|cream(?!\s*(?:and|,|·|\+|tone|colou?r))/i, sector: 'kozmetik', sub: 'krem' },
  { re: /serum/i, sector: 'kozmetik', sub: 'serum' },
  { re: /şampuan|shampoo|saç\s*(bakım|kremi|maskesi)|conditioner|keratin/i, sector: 'kozmetik', sub: 'şampuan' },
  { re: /sabun|soap|duş\s*jeli|shower\s*gel|vücut\s*losyon|body\s*lotion/i, sector: 'kozmetik', sub: 'sabun' },
  { re: /kozmetik|cilt\s*bakım|skincare/i, sector: 'kozmetik' },
  { re: /zeytinyağ|yağ\b|olive\s*oil/i, sector: 'gıda', sub: 'yağ' },
  { re: /atıştırmalık|çikolata|kurabiye|chocolate|cookie|dondurma|ice\s*cream/i, sector: 'gıda', sub: 'atıştırmalık' },
  { re: /kahve|coffee|espresso|cold\s*brew/i, sector: 'gıda', sub: 'kahve' },
  { re: /\bbal\b|honey/i, sector: 'gıda', sub: 'bal' },
  { re: /\bçay\b|\btea\b/i, sector: 'gıda', sub: 'çay' },
  { re: /\byem\b|hayvan\s*(yemi|besin)|pet\s*food|mama\b/i, sector: 'gıda', sub: 'yem' },
  { re: /gıda|reçel|food/i, sector: 'gıda' },
  { re: /içecek|beverage|meyve suyu|soda|gazoz|kombucha|şarap|bira/i, sector: 'içecek' },
  { re: /ilaç|pharma|eczane|takviye|supplement|vitamin|probiyotik|mineral/i, sector: 'sağlık', sub: 'takviye' },
  { re: /bebek|baby|yenidoğan|newborn|çocuk bakım/i, sector: 'bebek', sub: 'bakım' },
  { re: /deterjan|temizlik|temizleyici|dezenfektan|çamaşır|bulaşık|yüzey\s*(temizle|bakım)|cleaner|detergent/i, sector: 'temizlik' },
  { re: /kulaklık|earbuds/i, sector: 'elektronik', sub: 'kulaklık' },
  { re: /kablo|şarj/i, sector: 'elektronik', sub: 'kablo' },
  { re: /elektronik|teknoloji/i, sector: 'elektronik' },
]

/**
 * Canonical sector / product nouns for typo tolerance. "Elektornik kutu" is a mistyped
 * category, not a brand. Tokens within a small edit distance of one of these nouns are
 * normalised before mode / sector detection and brand extraction.
 */
export const SECTOR_LEXICON: string[] = [
  'elektronik',
  'kozmetik',
  'parfüm',
  'şampuan',
  'kahve',
  'gıda',
  'içecek',
  'takviye',
  'vitamin',
  'temizlik',
  'deterjan',
  'çikolata',
  'zeytinyağı',
  'kulaklık',
  'serum',
  'bebek',
  'etiket',
  'kutusu',
  'ambalaj',
  'teknoloji',
  'sağlık',
]

/** Optimal string alignment distance (Levenshtein + adjacent transposition). */
export function editDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = 0; i <= m; i++) d[i][0] = i
  for (let j = 0; j <= n; j++) d[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }
  return d[m][n]
}

/** Canonical noun for a mistyped token, or '' when the token is not a near-miss. */
export function fuzzySectorNoun(token: string): string {
  const t = token.toLocaleLowerCase('tr').replace(/[^a-zçğıöşü]/g, '')
  if (t.length < 5) return ''
  for (const noun of SECTOR_LEXICON) {
    if (t === noun) return ''
    // Short tokens: same length, one substitution / transposition ("Kahvem" stays a brand).
    // Long tokens: up to two edits, length may drift by one ("Elektornik" → elektronik).
    const long = t.length >= 8
    if (long ? Math.abs(noun.length - t.length) > 1 : noun.length !== t.length) continue
    if (editDistance(t, noun) <= (long ? 2 : 1)) return noun
  }
  return ''
}

/** Replace near-miss category tokens with their canonical noun ("Elektornik kutu" → "elektronik kutu"). */
export function normaliseSectorTypos(text: string): string {
  return text.replace(/[A-Za-zÇĞİÖŞÜçğıöşü]{5,}/g, (word) => fuzzySectorNoun(word) || word)
}

/** Skip-utterance tokens that mean "no answer / use default". */
export const SKIP_UTTERANCE = /^(şablon|varsayılan|örnek|geç|fark\s*etmez|farketmez|olsun|bilmiyorum|tamam|ok)$/i

/** Palette name tokens — not valid brand/product names. */
export const PALETTE_TOKEN =
  /^(siyah|black|beyaz|white|altın|gold|gümüş|silver|krem|kraft|navy|lacivert)(?:[-\s·]+(siyah|black|beyaz|white|altın|gold|gümüş|silver|krem|kraft))?$/i

/** Sector noun detection — used to validate extracted sector strings. */
export const SECTOR_NOUN_RE =
  /kozmetik|gıda|içecek|sağlık|takviye|bebek|elektronik|parfüm|parfum|perfume|krem|serum|yağ|temizlik|deterjan|kahve|coffee|food|beverage|health|baby|cosmetic|tech|şampuan|shampoo|sabun|\bbal\b|honey|\bçay\b|çikolata|zeytinyağ|kulaklık|vitamin|dondurma|reçel|\byem\b/i

/** Generic product name tokens — not valid SKU names. */
export const GENERIC_PRODUCT_RE =
  /^(parfüm|parfum|perfume|krem|cream|serum|içecek|beverage|takviye|supplement|bebek|baby|etiket|kutu|kutusu|ambalaj|kozmetik|gıda|sağlık|şişe|kahve|coffee|elektronik|elektornik|elektronik|wrap|label)$/i

/** Stop words for brand/product name extraction. */
export const NAME_STOP_RE =
  /^(için|bir|ve|ile|adı|adın|adını|olsun|marka|brand|ürün|product|kozmetik|kutusu|kutu|ambalaj|etiket|gıda|elektronik|luxury|modern|minimal|eco|playful|classic|daha|premium|lüks|parfüm|perfume|krem|serum|yeni|istiyorum|biraz|çok|henüz|emin|değilim|yapmak|çıktı|doğal|içerikli|yüz|tonlarında|editorial|contemporary|special|series|kahve|coffee|şampuan|shampoo|sabun|temizlik|deterjan|takviye|vitamin|bebek|içecek|teknoloji|tasarım|tasarla|lazım|gerek|istiyoruz|etiketi|kutusunu)$/i
