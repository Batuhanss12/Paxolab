/**
 * Spoken packaging copy — slogan / claim / story from a user utterance.
 * Feeds existing DesignBrief.copyOverrides and DesignBrief.story.
 * Not a second copy engine: extract only.
 */
import { labeled } from './extractHelpers'

const BRIEF_NOISE =
  /kutu|etiket|istiyorum|marka\s*ad|ölçü|şablon|\bmm\b|tasarla|packaging|yüzey seç|chip/i
const AVOID_TALK = /görünmesin|durmasın|ucuz da|tonlarında|biraz editorial/i
const TAGLINE_CUE =
  /kavrum|aroma|geceye|günlük\s*kullanım|doğal\s*içerik|sessiz|yoğunluk|imza|yavaş|ferah|kalıcı|konsantre|özel\s+kavrum/i
const STORY_CUE = /doğdu|hik[aâ]ye|yıllardır|partiler\s+halinde|kavrulan|kuruldu|ilham/i

function stripWrap(text: string): string {
  return text.trim().replace(/^["“”']+|["“”']+$/g, '').trim()
}

export function isSpokenTagline(text: string): boolean {
  const t = stripWrap(text)
  if (t.length < 12 || t.length > 90) return false
  if (BRIEF_NOISE.test(t) || AVOID_TALK.test(t)) return false
  const words = t.split(/\s+/).filter(Boolean)
  if (words.length < 3 || words.length > 14) return false
  return TAGLINE_CUE.test(t)
}

export function isSpokenStory(text: string): boolean {
  const t = stripWrap(text)
  if (t.length < 40) return false
  const words = t.split(/\s+/).filter(Boolean)
  if (words.length < 8) return false
  if (BRIEF_NOISE.test(t) && !STORY_CUE.test(t)) return false
  return STORY_CUE.test(t)
}

export function extractSpokenCopy(raw: string): { copyOverrides?: string; story?: string } {
  const out: { copyOverrides?: string; story?: string } = {}
  const labeledStory = labeled(raw, ['hikaye', 'hikâye', 'story', 'anlatı'])
  if (labeledStory.length > 8) out.story = labeledStory
  const labeledSlogan = labeled(raw, ['slogan', 'tagline', 'metin', 'claim'])
  if (labeledSlogan) out.copyOverrides = labeledSlogan

  const chunks = raw
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => stripWrap(s))
    .filter(Boolean)
  const considered = chunks.length ? chunks : [stripWrap(raw)]
  for (const chunk of considered) {
    if (!out.story && isSpokenStory(chunk)) out.story = chunk
    if (!out.copyOverrides && isSpokenTagline(chunk) && !isSpokenStory(chunk)) out.copyOverrides = chunk
  }
  return out
}
