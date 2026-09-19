/**
 * Fields the customer labelled in an ordinary sentence.
 *
 * `labeled` in `extractHelpers` needs a colon or a dash — "marka: Noctis". Nobody chats that way.
 * They write "ürün Gece Serisi, 50 ml" or "Noctis diye bir markam var", and until now neither was
 * read: the brand and the product were guessed from *word position* instead. Measured on the four
 * openers a customer actually types, "Noctis markası için parfüm şişesi etiketi, ürün Gece Serisi"
 * came back with the product set to "şişesi" — a word from the middle of the sentence — while the
 * answer sat two clauses later, spelled out in full.
 *
 * Two things this module is careful about, both of which cost a round of debugging:
 *
 *   - **`\b` does not work here.** It is defined against `\w`, which is ASCII, so `\bürün\b` after
 *     a space matches nothing: neither the space nor `ü` is a word character, so there is no
 *     boundary between them. The character class is written out and the boundaries are explicit.
 *   - **Longest label first.** With `marka|markası`, the engine matches `marka`, fails the
 *     following boundary against the `s`, and — depending on how the alternation is ordered — can
 *     give up rather than try the longer form. Sorting by length removes the question.
 */
import { looksLikeName } from './extractHelpers'

/** Word characters, Turkish included. Used to build explicit boundaries. */
const TR_WORD = "\\w\u00C7\u011E\u0130\u00D6\u015E\u00DC\u00E7\u011F\u0131\u00F6\u015F\u00FC"
const TR_BEFORE = `(?:^|[^${TR_WORD}])`
const TR_AFTER = `(?![${TR_WORD}])`

/** Turkish possessive / genitive tails a label may wear: marka, markası, markam, markanın… */
const TAIL = "(?:s\u0131|s\u0131n\u0131n|m|m\u0131z|n\u0131n|n|\u00FCn|\u00FCm|\u00FCm\u00FCz|\u00FC)?"

/**
 * Words that sit between the label and the name without being part of it.
 *
 * "a brand called Luma" read the brand as "called Luma" — the connector became the first word of
 * the name. Turkish has the same shape ("marka adı Noctis"); English adds `called` and `named`.
 * Longest first, so `adının` is not consumed as `adı`.
 */
const CONNECTOR = "adının|adın|adı|isminin|ismi|called|named|olarak"

function boundedAlternation(labels: string[]): string {
  return [...labels].sort((a, b) => b.length - a.length).join('|')
}

/**
 * The value that follows a label, with no punctuation required.
 *
 * Runs until something that cannot be part of a name: a stop word, a category noun, a palette word
 * or punctuation. Three words at most — a brand is not a sentence.
 */
export function spokenField(text: string, labels: string[], stop: (word: string, taken: number) => boolean): string {
  const re = new RegExp(
    `${TR_BEFORE}(?:${boundedAlternation(labels)})${TAIL}${TR_AFTER}\\s*(?:${CONNECTOR})?\\s*[:\uFF1A]?\\s*`,
    'i',
  )
  const hit = re.exec(text)
  if (!hit) return ''
  const rest = text.slice(hit.index + hit[0].length)
  const out: string[] = []
  for (const word of rest.split(/\s+/).slice(0, 4)) {
    const clean = word.replace(/^[«"“'(]+/, '').replace(/[,.;:!?»"”')]+$/, '')
    // `out.length` lets the stop rule tell "the first word of a name" from "a word continuing one".
    if (!clean || stop(clean, out.length) || !looksLikeName(clean)) break
    out.push(clean)
    if (out.length >= 3) break
    /*
     * A comma ends the name.
     *
     * The stop list catches category nouns and palette words, but it is a list, and the sentence
     * this reads is a chain of clauses: "ürün Studio One, antrasit" put **antrasit** inside the
     * product name — `isPaletteName` happens not to know that word, though `extractFields` reads
     * it as a colour three lines later. Widening the list fixes one word; the clause boundary is
     * the actual rule, and the customer already wrote it. A product name does not span a comma.
     */
    if (/[,;.!?]$/.test(word)) break
  }
  return out.join(' ')
}

/**
 * The name before its label — "Noctis diye bir markam var", "Noctis adında bir parfüm markası".
 * Turkish puts it there often enough that reading only left to right loses it. Up to two words may
 * sit between the connector and the label ("diye bir **parfüm** markam").
 */
export function namedBefore(text: string, labels: string[]): string {
  const connector = "diye|ad\u0131nda|adl\u0131|isminde|isimli"
  const re = new RegExp(
    `([A-Za-z\u00C7\u011E\u0130\u00D6\u015E\u00DC\u00E7\u011F\u0131\u00F6\u015F\u00FC][${TR_WORD}'\u2019-]{1,28})\\s+(?:${connector})\\s+(?:\\S+\\s+){0,2}?(?:${boundedAlternation(labels)})${TAIL}${TR_AFTER}`,
    'i',
  )
  return re.exec(text)?.[1]?.trim() ?? ''
}
