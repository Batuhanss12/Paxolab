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
  { re: /kutu\s*(ve|ile|\+)\s*(şişe\s*)?(etiket|label)|(etiket|label)\s*(ve|ile|\+)\s*kutu/i, mode: 'box' },
  { re: /kozmetik\s*kutusu|parfüm\s*kut/i, mode: 'box', sector: 'kozmetik', sub: 'parfüm' },
  { re: /gıda\s*ambalaj|gıda\s*kut/i, mode: 'box', sector: 'gıda' },
  { re: /elektronik\s*kut|kulaklık/i, mode: 'box', sector: 'elektronik', sub: 'kulaklık' },
  { re: /takviye\s*kut|vitamin\s*kut|ilaç\s*kut/i, mode: 'box', sector: 'sağlık', sub: 'takviye' },
  { re: /bebek\s*(ürün|bakım).*kut/i, mode: 'box', sector: 'bebek', sub: 'bakım' },
  { re: /içecek\s*(etiket|şişe)|kombucha|meyve suyu/i, mode: 'label', sector: 'içecek' },
  { re: /kutu\s*ambalaj|\bkutu\b/i, mode: 'box' },
  { re: /etiket|label|wrap/i, mode: 'label' },
]

export const SECTOR_RULES: SectorRule[] = [
  { re: /parfüm|perfume|eau de/i, sector: 'kozmetik', sub: 'parfüm' },
  { re: /krem|cream/i, sector: 'kozmetik', sub: 'krem' },
  { re: /serum/i, sector: 'kozmetik', sub: 'serum' },
  { re: /kozmetik|cilt\s*bakım/i, sector: 'kozmetik' },
  { re: /zeytinyağ|yağ\b/i, sector: 'gıda', sub: 'yağ' },
  { re: /atıştırmalık|çikolata|kurabiye/i, sector: 'gıda', sub: 'atıştırmalık' },
  { re: /kahve|coffee|espresso/i, sector: 'gıda', sub: 'kahve' },
  { re: /gıda|reçel|bal|çay/i, sector: 'gıda' },
  { re: /içecek|beverage|meyve suyu|soda|gazoz|kombucha|şarap|bira/i, sector: 'içecek' },
  { re: /ilaç|pharma|eczane|takviye|supplement|vitamin|probiyotik|mineral/i, sector: 'sağlık', sub: 'takviye' },
  { re: /bebek|baby|yenidoğan|newborn|çocuk bakım/i, sector: 'bebek', sub: 'bakım' },
  { re: /kulaklık|earbuds/i, sector: 'elektronik', sub: 'kulaklık' },
  { re: /kablo|şarj/i, sector: 'elektronik', sub: 'kablo' },
  { re: /elektronik|teknoloji/i, sector: 'elektronik' },
]

/** Skip-utterance tokens that mean "no answer / use default". */
export const SKIP_UTTERANCE = /^(şablon|varsayılan|örnek|geç|fark\s*etmez|farketmez|olsun|bilmiyorum|tamam|ok)$/i

/** Palette name tokens — not valid brand/product names. */
export const PALETTE_TOKEN =
  /^(siyah|black|beyaz|white|altın|gold|gümüş|silver|krem|kraft|navy|lacivert)(?:[-\s·]+(siyah|black|beyaz|white|altın|gold|gümüş|silver|krem|kraft))?$/i

/** Sector noun detection — used to validate extracted sector strings. */
export const SECTOR_NOUN_RE =
  /kozmetik|gıda|içecek|sağlık|takviye|bebek|elektronik|parfüm|parfum|perfume|krem|serum|yağ|temizlik|kahve|coffee|food|beverage|health|baby|cosmetic|tech/i

/** Generic product name tokens — not valid SKU names. */
export const GENERIC_PRODUCT_RE =
  /^(parfüm|parfum|perfume|krem|cream|serum|içecek|beverage|takviye|supplement|bebek|baby|etiket|kutu|kutusu|ambalaj|kozmetik|gıda|sağlık|şişe|kahve|coffee|wrap|label)$/i

/** Stop words for brand/product name extraction. */
export const NAME_STOP_RE =
  /^(için|bir|ve|ile|adı|adın|adını|olsun|marka|brand|ürün|product|kozmetik|kutusu|kutu|ambalaj|etiket|gıda|elektronik|luxury|modern|minimal|eco|playful|classic|daha|premium|lüks|parfüm|perfume|krem|serum|yeni|istiyorum|biraz|çok|henüz|emin|değilim|yapmak|çıktı|doğal|içerikli|yüz|tonlarında|editorial|contemporary|special|series|kahve|coffee)$/i
