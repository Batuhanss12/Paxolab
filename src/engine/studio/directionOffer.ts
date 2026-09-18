/**
 * D3 direction offer — name the ranked DesignDirection pool in chat.
 * Same pattern as C5 structure offer: user picks, critic does not.
 */
import { familyTalk } from './family'
import type { StudioDirectionOffer } from './types'

const ORDINAL: Record<string, number> = {
  birinci: 1,
  ilk: 1,
  ikinci: 2,
  üçüncü: 3,
  ucuncu: 3,
  dördüncü: 4,
  dorduncu: 4,
  beşinci: 5,
  besinci: 5,
  altıncı: 6,
  altinci: 6,
  yedinci: 7,
  sekizinci: 8,
  /** Resolved against the live offer length rather than a fixed position. */
  sonuncu: -1,
}

/** 1-based index into the current direction offer, or null if the utterance is not a pick. */
export function parseDirectionChoice(text: string, count: number): number | null {
  const t = text.trim().toLocaleLowerCase('tr')
  if (!t || count < 1) return null
  /*
   * Both lists run to the offer's real length. They stopped at four and were never widened when
   * the offer grew, so "6. yön" — a card on screen that the chat had just named by that number —
   * parsed as nothing and the customer got a shrug.
   */
  const named = t.match(
    /\b(birinci|ilk|ikinci|üçüncü|ucuncu|dördüncü|dorduncu|beşinci|besinci|altıncı|altinci|yedinci|sekizinci|sonuncu)\b/,
  )
  if (named && /yön|arketip|yüz|tasarım|tasarim/.test(t)) {
    const n = ORDINAL[named[1] ?? '']
    if (n === -1) return count
    return n && n <= count ? n : null
  }
  const num = t.match(/(?:^|[^0-9])(10|[1-9])\s*[.)]?\s*(yön|arketip|yüz|tasarım|tasarim|numara|seçenek)/)
  if (num) {
    const n = Number(num[1])
    return n >= 1 && n <= count ? n : null
  }
  // A bare number, when the strip is on screen — the same reading `parseOfferChoice` does for the
  // structure list, and for the same reason: reading a numbered list and typing `2` is the first
  // thing anyone does, and it used to match nothing.
  const lone = t.match(/^(10|[1-9])\s*[.)]?$/)
  if (lone) {
    const n = Number(lone[1])
    return n <= count ? n : null
  }
  return null
}

export function describeDirectionOffer(offer: StudioDirectionOffer): string {
  if (!offer.candidates.length) return ''
  if (offer.candidates.length === 1) {
    const only = offer.candidates[0]!
    return `Bu yüzey ${familyTalk(only.family)}.`
  }
  const current = offer.candidates.find((row) => row.selected) ?? offer.candidates[0]!
  const rest = offer.candidates.filter((row) => !row.selected)
  const alts = rest.map((row) => `${row.index}. ${familyTalk(row.family)}`).join(', ')
  return `Şu an ${familyTalk(current.family)}. Alternatif: ${alts}.`
}

export function directionOfferLine(offer: StudioDirectionOffer | undefined): string {
  if (!offer || offer.candidates.length < 2) return ''
  const current = offer.candidates.find((row) => row.selected)
  const rest = offer.candidates.filter((row) => !row.selected)
  return `Şu an ${familyTalk(current?.family)}. Beğenmezsen “${rest[0]?.index}. yön” yaz.`
}
