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
}

/** 1-based index into the current direction offer, or null if the utterance is not a pick. */
export function parseDirectionChoice(text: string, count: number): number | null {
  const t = text.trim().toLocaleLowerCase('tr')
  if (!t || count < 1) return null
  const named = t.match(/\b(birinci|ilk|ikinci|üçüncü|ucuncu)\b/)
  if (named && /yön|arketip|yüz/.test(t)) {
    const n = ORDINAL[named[1] ?? '']
    return n && n <= count ? n : null
  }
  const num = t.match(/\b([123])\s*[.)]?\s*(yön|arketip|yüz)/)
  if (num) {
    const n = Number(num[1])
    return n >= 1 && n <= count ? n : null
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
