/**
 * Design commands — the words a customer uses to move a face, mapped onto the direction's closed
 * vocabulary.
 *
 * Until F-5 the iteration parser knew five direction words (koyu, mermer, botanik, dalga, klinik)
 * and nothing about the axes the direction had learned to decide. "Çerçeveyi kaldır", "daha
 * sade süs", "aralıklı serif" or "plaka gibi" were understood as nothing — the reply said
 * "isteği uyguluyorum" and repainted the same face. Every command here lands on a `DirectionHints`
 * key that `materializeDirection` already honours, so nothing new has to be painted for the words
 * to work; the archetype may still refuse a value it does not list, in which case the hint is
 * dropped there, not here.
 */
import type { DesignBrief } from '../../types'
import type { DirectionHints, FrameStyle, LockupStyle, OrnamentLevel, TypePairing } from '../studio/types'

export type DesignCommands = {
  direction: DirectionHints
  briefPatch: Partial<DesignBrief>
  notes: string[]
}

const FRAMES: [RegExp, FrameStyle, string][] = [
  [/çerçeve(?:yi|si)?\s*(?:kaldır|olmasın|yok|istemiyorum)|çerçevesiz|\bno\s*frame\b|frameless/i, 'none', 'Çerçeveyi kaldırdım.'],
  [/ince\s*(?:çift\s*)?çerçeve|çift\s*çizgi|thin\s*(?:double\s*)?frame|hairline\s*frame/i, 'thin-double', 'İnce çift çerçeve.'],
  [/bant\s*çerçeve|plaka\s*kenar|band\s*frame|kalın\s*kenar/i, 'band-hairline', 'Bant + saç teli kenar.'],
  [/köşe\s*süs|fleuron|taç\s*süs|köşe\s*motif/i, 'fleuron-crown', 'Köşe süsleri ve taç.'],
  [/köşe\s*parantez|corner\s*bracket/i, 'corner-brackets', 'Köşe parantezleri.'],
  [/\bjant\b|\bbezel\b|metalik\s*kenar/i, 'bezel', 'Metalik jant (yuvarlak / oval kesimde).'],
]

const ORNAMENTS: [RegExp, OrnamentLevel, string][] = [
  [/süs(?:ü|leri)?\s*(?:azalt|kaldır|az\s*olsun)|daha\s*az\s*(?:süs|doku|desen)|sessiz\s*zemin|zemini\s*sakinleştir|less\s*ornament|quieter/i, 'quiet', 'Süsü kıstım — iskelet aynı.'],
  [/süs(?:ü|leri)?\s*(?:artır|çoğalt)|daha\s*(?:zengin|dokulu|süslü|desenli)|zemini\s*zenginleştir|more\s*ornament|richer/i, 'rich', 'Süsü zenginleştirdim — iskelet aynı.'],
  [/ölçülü\s*süs|süs(?:ü)?\s*orta|measured\s*ornament/i, 'measured', 'Süsü ölçülü tuttum.'],
]

const PAIRINGS: [RegExp, TypePairing, string][] = [
  [/aralıklı\s*serif|tracked\s*serif|harf\s*aralığı\s*(?:açık|geniş)\s*serif|spaced\s*serif/i, 'spaced-serif/spaced-sans', 'Aralıklı serif marka, aralıklı sans ürün.'],
  [/serif\s*(?:başlık|marka)|başlık\s*serif|serif\s*display/i, 'serif-display/sans-meta', 'Serif başlık, sans künye.'],
  [/el\s*yazısı|\bscript\b|kaligrafi|imza\s*yazı/i, 'script-accent/sans-heavy', 'El yazısı vurgu, kalın sans ürün.'],
  [/(?:ince|light)\s*(?:ve|\+)?\s*(?:kalın|bold)\s*sans|sans\s*(?:yap|olsun|tip)|serifsiz|modern\s*tip(?:ografi)?/i, 'sans-light/sans-heavy', 'İnce + kalın sans.'],
  // Phase 4 systems.
  [/dar\s*serif|condensed\s*serif|sıkışık\s*serif/i, 'condensed-serif/mono', 'Dar serif başlık, mono künye.'],
  [/dar\s*(?:grotesk|sans)|condensed\s*(?:sans|grotesk)|sıkışık\s*sans/i, 'condensed-grotesk/sans-light', 'Dar grotesk başlık.'],
  [/yuvarlak\s*(?:başlık|yazı|tip|harf)|retro\s*(?:başlık|yazı)|rounded/i, 'rounded/sans', 'Yuvarlak retro başlık.'],
  [/(?:aşırı|çok|dev)\s*büyük\s*(?:serif|başlık|marka)|oversized/i, 'display-serif-oversized/sans-meta', 'Aşırı büyük serif başlık.'],
  [/ağır\s*grotesk|kalın\s*blok|blok\s*(?:başlık|yazı|dizgi)|heavy\s*grotesk/i, 'heavy-grotesk-block/sans', 'Ağır grotesk blok.'],
  [/(?:çok|geniş)\s*aralıklı\s*(?:ince|sans|başlık)|ince\s*geometrik|wide\s*tracking/i, 'light-geometric/wide', 'İnce geometrik, geniş aralık.'],
]

const LOCKUPS: [RegExp, LockupStyle, string][] = [
  [/ortala|merkeze\s*al|centered\s*lockup|ortada\s*dursun/i, 'stacked-center', 'Lockup ortada.'],
  [/sol(?:a)?\s*(?:hizala|yasla|kolon)|left\s*(?:align|column)/i, 'left-column', 'Lockup sol kolonda.'],
  [/monogram\s*sağ|sağda\s*monogram|monogram\s*right/i, 'monogram-right', 'Monogram sağda.'],
  [/rozet\s*(?:üst|sağ\s*üst)|pill\s*(?:top|üst)|sağ\s*üstte\s*marka/i, 'top-right-pill', 'Marka rozeti sağ üstte.'],
]

const TIERS: [RegExp, keyof DesignBrief, (m: RegExpMatchArray) => string][] = [
  [/\b(edt|eau\s*de\s*toilette|edp|eau\s*de\s*parfum|extrait(?:\s*de\s*parfum)?|eau\s*de\s*cologne|kolonya)\b\s*(?:olsun|yaz|olarak)/i, 'concentration', (m) => m[1]],
  // "No. 07" carries a full stop, so the capture excludes only quotes and clause punctuation.
  [/(?:edisyon|edition)[\s:]*["“']?([^"”',;]{2,40}?)["”']?\s*(?:olsun|yaz|olarak)|["“']?([^"”',;]{2,40}?)\s*(?:limited\s*edition|sınırlı\s*(?:üretim|edisyon))/i, 'edition', (m) => (m[1] ?? `${m[2]} Limited Edition`).trim()],
  [/(?:imza|attribution|by\s*line)[\s:]*["“']?([^"”'.,;]{2,50})["”']?\s*(?:olsun|yaz|olarak)/i, 'attribution', (m) => m[1].trim()],
  [/(?:menşei?|origin|köken)[\s:]*["“']?([^"”'.,;]{2,40})["”']?\s*(?:olsun|yaz|olarak)/i, 'origin', (m) => m[1].trim()],
]

/*
 * Family words ("plaka gibi", "arma ekle", "daha teknik") are deliberately *not* handled here.
 * `parseDirectionTalk` already owns them, with the semantics a sentence needs — "ink tasarımından
 * daha teknik" names two families, one to leave and one to go to — and a first attempt to pin the
 * first alias found here took the sentence to `ink` and vetoed it in the same turn. The new
 * families reach that parser through their aliases in `family.ts`.
 */

export function parseDesignCommands(text: string): DesignCommands {
  const cmds: DesignCommands = { direction: {}, briefPatch: {}, notes: [] }
  const rationale: string[] = []
  for (const [re, frame, note] of FRAMES) {
    if (re.test(text)) {
      cmds.direction.frame = frame
      rationale.push(`Kullanıcı: çerçeve ${frame}.`)
      cmds.notes.push(note)
      break
    }
  }
  for (const [re, ornament, note] of ORNAMENTS) {
    if (re.test(text)) {
      cmds.direction.ornament = ornament
      rationale.push(`Kullanıcı: süs ${ornament}.`)
      cmds.notes.push(note)
      break
    }
  }
  for (const [re, pairing, note] of PAIRINGS) {
    if (re.test(text)) {
      cmds.direction.typePairing = pairing
      rationale.push(`Kullanıcı: tip ${pairing}.`)
      cmds.notes.push(note)
      break
    }
  }
  for (const [re, lockup, note] of LOCKUPS) {
    if (re.test(text)) {
      cmds.direction.lockup = lockup
      rationale.push(`Kullanıcı: lockup ${lockup}.`)
      cmds.notes.push(note)
      break
    }
  }
  for (const [re, key, pick] of TIERS) {
    const m = text.match(re)
    if (!m) continue
    const value = pick(m)
    if (!value) continue
    ;(cmds.briefPatch as Record<string, unknown>)[key] = value
    cmds.notes.push(`${key === 'concentration' ? 'Konsantrasyon' : key === 'edition' ? 'Edisyon' : key === 'attribution' ? 'İmza' : 'Menşe'} satırını “${value}” yaptım.`)
  }
  if (rationale.length) cmds.direction.rationale = rationale
  if (Object.keys(cmds.direction).length) cmds.direction.source = 'user'
  return cmds
}

/** The words this parser answers to — `isIteration` unions them so a command is never read as a fresh brief. */
export const DESIGN_COMMAND_WORDS =
  /çerçeve|frame|süs|doku|desen|ornament|jant|bezel|bant|plaka|arma|arabesk|madalyon|serif|sans|script|el\s*yazısı|kaligrafi|ortala|hizala|monogram|rozet|lockup|\bedt\b|\bedp\b|extrait|kolonya|edisyon|edition|imza|menşe|köken|atölye|atelier|fleuron|taç|parantez|çizim|specimen|manzara|mürekkep|teknik|diyagonal|karanlık\s*lüks/i
