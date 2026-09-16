/**
 * FAZ 5 — heuristic structured feedback.
 * Classifies revision talk. Does not override Design Brain; parseIntent still patches.
 */
import type { FeedbackStrength, StructuredFeedback } from '../brain/DesignDecisionLog'

function strengthOf(text: string): FeedbackStrength {
  if (/çok|fazla|aşırı|too\s+|way\s+too/i.test(text)) return 'high'
  if (/biraz|slightly|hafif/i.test(text)) return 'low'
  return 'medium'
}

function push(out: StructuredFeedback[], item: StructuredFeedback): void {
  if (out.some((row) => row.type === item.type && row.target === item.target && row.direction === item.direction)) return
  out.push(item)
}

/** Map a user utterance onto typed feedback. Empty when there is no visual criticism. */
export function parseFeedback(text: string): StructuredFeedback[] {
  const t = text.toLocaleLowerCase('tr').trim()
  if (!t) return []
  const strength = strengthOf(t)
  const out: StructuredFeedback[] = []
  const raw = text.trim()

  if (/logo.{0,32}(aşağı|below|down)|lockup.{0,24}(aşağı|zayıf|weak)/i.test(t)) {
    push(out, { type: 'hierarchy', target: 'brand_lockup', direction: 'move_up', strength, raw })
  }
  if (/logo.{0,32}(yukarı|above|up)|çok\s*yüksek/i.test(t) && /logo|lockup|marka/i.test(t)) {
    push(out, { type: 'hierarchy', target: 'brand_lockup', direction: 'move_down', strength, raw })
  }
  if (/logoyu?\s*büyüt|logo\s*büyüt/i.test(t)) {
    push(out, { type: 'hierarchy', target: 'brand_lockup', direction: 'increase', strength, raw })
  }
  if (/logoyu?\s*küçült|logo\s*küçült/i.test(t)) {
    push(out, { type: 'hierarchy', target: 'brand_lockup', direction: 'decrease', strength, raw })
  }

  if (/çok\s*boş|too\s*(empty|sparse)|boş\s*kalmış/i.test(t)) {
    push(out, { type: 'composition', target: 'density', direction: 'increase', strength, raw })
  }
  if (/çok\s*(dolu|sıkışık|kalabalık|yoğun)|fazla\s*(dolu|sıkışık|kalabalık|yoğun)|too\s*(busy|dense|crowded)|(?:yön|yüzey|tasarım).{0,16}yoğun/i.test(t)) {
    push(out, { type: 'composition', target: 'density', direction: 'decrease', strength, raw })
  }
  if (/çok\s*hava|too\s*much\s*air|whitespace/i.test(t) && /azalt|less|düşür/i.test(t)) {
    push(out, { type: 'whitespace', target: 'air', direction: 'decrease', strength, raw })
  }

  if (/çok\s*klasik|too\s*classic|fazla\s*klasik|klasik\s*(görünmesin|kalmış|durmasın)/i.test(t)) {
    push(out, { type: 'visual_language', target: 'dialect', direction: 'modernize', strength, raw })
  } else if (/daha\s*modern|modernize|çağdaş/i.test(t)) {
    push(out, { type: 'visual_language', target: 'dialect', direction: 'modernize', strength, raw })
  } else if (/daha\s*klasik|daha\s*olgun/i.test(t)) {
    push(out, { type: 'visual_language', target: 'dialect', direction: 'classicize', strength, raw })
  }

  if (/yazıyı?\s*büyüt|başlığı?\s*büyüt|okunmuyor|çok\s*küçük/i.test(t)) {
    push(out, { type: 'typography', target: 'product_name', direction: 'increase', strength, raw })
  }
  if (/yazıyı?\s*küçült|başlığı?\s*küçült/i.test(t)) {
    push(out, { type: 'typography', target: 'product_name', direction: 'decrease', strength, raw })
  }

  if (/altın\s*istemiyorum|gold\s*(olmasın|yok)|no\s*gold/i.test(t)) {
    push(out, { type: 'color', target: 'gold', direction: 'avoid', strength, raw })
  } else if (/daha\s*koyu|darker/i.test(t)) {
    push(out, { type: 'color', target: 'palette', direction: 'darken', strength, raw })
  } else if (/daha\s*sıcak|warm/i.test(t)) {
    push(out, { type: 'color', target: 'palette', direction: 'warm', strength, raw })
  } else if (/\brenk\b|palet|colour|color/i.test(t) && /değiş|sevmedim|yanlış/i.test(t)) {
    push(out, { type: 'color', target: 'palette', direction: 'change', strength, raw })
  }

  if (/motif|arma|heraldic|çerçeve|frame|desen/i.test(t) && /fazla|çok|olmasın|avoid|kaldır/i.test(t)) {
    push(out, { type: 'motif', target: 'decor', direction: 'decrease', strength, raw })
  }

  if (/sektör|skincare|gıda|food|parfüm/i.test(t) && /uyumsuz|yanlış|olmaz/i.test(t)) {
    push(out, { type: 'sector_fit', target: 'sector', direction: 'fix', strength, raw })
  }
  if (/marka\s*(durmuyor|zayıf)|brand\s*fit|lüks\s*durmuyor/i.test(t)) {
    push(out, { type: 'brand_fit', target: 'character', direction: 'strengthen', strength, raw })
  }
  if (/baskı|preflight|taşma|bleed|çarpışma/i.test(t)) {
    push(out, { type: 'technical', target: 'preflight', direction: 'fix', strength, raw })
  }
  if (/konsept|concept\s*(değiş|yanlış)/i.test(t)) {
    push(out, { type: 'concept', target: 'visual_concept', direction: 'change', strength, raw })
  }

  return out
}
