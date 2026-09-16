/**
 * Revision classification: maps natural-language user feedback to a
 * design operation ID from the credit catalog.
 *
 * The LLM may interpret intent, but it must NOT directly manipulate
 * credit balances. This module provides the deterministic classification
 * interface that the conversation layer uses to determine the operation
 * (and thus the credit cost) before reserving.
 *
 * Classification priority (smallest valid operation first):
 *   1. micro_revision      — tiny text/typo/color tweaks
 *   2. focused_revision    — single-area focus (color only, typography only)
 *   3. structural_revision  — composition/hierarchy changes
 *   4. creative_revision    — partial creative direction change
 *   5. full_art_direction_revision — full art direction redo
 *   6. new_direction        — completely different concept
 *   7. alternative_design   — controlled alternative
 *   8. initial_design        — first design (no prior)
 */

export type ClassificationResult = {
  operationId: string
  confidence: number
  matchedKeywords: string[]
  rationale: string
}

type Rule = {
  operationId: string
  keywords: string[]
  negativeKeywords?: string[]
  rationale: string
}

// Ordered from most specific (cheapest) to most general (most expensive).
// The first matching rule wins.
const RULES: Rule[] = [
  {
    operationId: 'micro_revision',
    keywords: ['biraz', 'hafif', 'küçük', 'az', 'birazcık', 'hafifçe', 'tamamla', 'düzelt'],
    rationale: 'Küçük düzeltme isteği',
  },
  {
    operationId: 'color_refinement',
    keywords: ['renk', 'palet', 'ton', 'koyulaştır', 'açıklaştır', 'renkleri', 'yeşil', 'mavi', 'kırmızı', 'sarı', 'pastel', 'canlı', 'sönük'],
    rationale: 'Renk odaklı iyileştirme',
  },
  {
    operationId: 'typography_refinement',
    keywords: ['yazı', 'font', 'tipografi', 'harf', 'karakter', 'premium yaz', 'daha okunaklı', 'fontu', 'tipi'],
    rationale: 'Tipografi iyileştirme',
  },
  {
    operationId: 'composition_refinement',
    keywords: ['kompozisyon', 'düzen', 'hizala', 'ortala', 'konum', 'yerleşim', 'boşluk', 'denge'],
    rationale: 'Kompozisyon iyileştirme',
  },
  {
    operationId: 'asset_refinement',
    keywords: ['görsel', 'ikon', 'logo', 'hero', 'motif', 'dekor', 'çizim', 'şekil', 'vektör'],
    rationale: 'Görsel öğe iyileştirme',
  },
  {
    operationId: 'focused_revision',
    keywords: ['sadece', 'yalnızca', 'tek', 'şunu değiştir', 'şurayı', 'spesifik'],
    rationale: 'Tek alana odaklı revizyon',
  },
  {
    operationId: 'structural_revision',
    keywords: ['logo yukarı', 'büyüt', 'küçült', 'hiyerarşi', 'yapı', 'alanı büyüt', 'kutuyu değiştir', 'düzeneği', 'layout', 'yer değiştir'],
    rationale: 'Yapısal/kompozisyon değişikliği',
  },
  {
    operationId: 'creative_revision',
    keywords: ['daha modern', 'daha klasik', 'daha premium', 'daha editorial', 'daha minimalist', 'daha lüks', 'daha çiğ', 'tarzı değiştir', 'editoryal', 'farklı bir yaklaşım'],
    rationale: 'Yaratıcı yön değişikliği',
  },
  {
    operationId: 'full_art_direction_revision',
    keywords: ['tamamen yeniden', 'baştan tasarla', 'tüm sanat yönü', 'tamamen farklı', 'bambaşka', 'sıfırdan'],
    rationale: 'Tam sanat yönü revizyonu',
  },
  {
    operationId: 'new_direction',
    keywords: ['yeni konsept', 'yeni bir konsept', 'tamamen başka', 'başka bir konsept', 'yeni yön', 'farklı bir konsept', 'yeni bir dünya'],
    rationale: 'Yeni kreatif yön',
  },
  {
    operationId: 'alternative_design',
    keywords: ['alternatif', 'başka bir seçenek', 'seçenek', 'varyasyon', 'variant', 'başka nasıl olur'],
    rationale: 'Kontrollü alternatif',
  },
]

/**
 * Classify user feedback text into a design operation.
 * Returns the smallest valid operation that can fulfill the request.
 */
export function classifyFeedback(text: string): ClassificationResult {
  const lower = text.toLowerCase().trim()
  if (!lower) {
    return {
      operationId: 'focused_revision',
      confidence: 0.3,
      matchedKeywords: [],
      rationale: 'Boş geri bildirim — varsayılan odaklı revizyon',
    }
  }

  for (const rule of RULES) {
    const matched: string[] = []
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) matched.push(kw)
    }
    if (matched.length > 0) {
      const confidence = Math.min(1, 0.5 + matched.length * 0.15)
      return {
        operationId: rule.operationId,
        confidence,
        matchedKeywords: matched,
        rationale: rule.rationale,
      }
    }
  }

  // Default: focused revision (cheapest valid revision)
  return {
    operationId: 'focused_revision',
    confidence: 0.4,
    matchedKeywords: [],
    rationale: 'Eşleşme yok — varsayılan odaklı revizyon',
  }
}

/**
 * Determine if this is a new design (no prior) vs a revision.
 * If no prior design exists, the operation should be 'initial_design'.
 */
export function classifyOperation(
  text: string,
  hasPriorDesign: boolean,
): ClassificationResult {
  if (!hasPriorDesign) {
    return {
      operationId: 'initial_design',
      confidence: 1,
      matchedKeywords: [],
      rationale: 'Önceki tasarım yok — ilk tasarım',
    }
  }
  return classifyFeedback(text)
}

/**
 * Map a classification result to a legacy operation ID for backward
 * compatibility with the existing reserve endpoint.
 */
export function toLegacyOperation(operationId: string): 'generate' | 'revise' {
  const creationOps = ['initial_design', 'design_exploration', 'alternative_design', 'new_direction']
  return creationOps.includes(operationId) ? 'generate' : 'revise'
}
