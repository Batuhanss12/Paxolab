import type { DesignBrief } from '../types'

/** Optional FORMA-owned LLM extract. Heuristic engine stays the default. */
export async function extractBriefWithLlm(text: string): Promise<Partial<DesignBrief> | null> {
  const url = import.meta.env.VITE_FORMA_LLM_URL
  if (!url) return null
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
    signal: AbortSignal.timeout(8000),
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Extract a FORMA DesignBrief JSON only. Keys: brandName, productName, sector, subProduct, packagingMode (box|label), styleType (luxury|modern|minimal|eco|playful|classic), colors, volume, barcode, manufacturerName, manufacturerAddress, copyLocale (tr|en). Leave barcode empty if the user did not give digits. Leave copyLocale empty unless the user asked for Turkish or English copy. Do not set productName to generic sector words (Parfüm, Krem, Serum). Leave productName empty if the user only named the category or only gave a brand. Never copy brandName into productName. For labels, do not invent manufacturer or box L×W×H. No image generation.',
        },
        { role: 'user', content: text },
      ],
    }),
  })
  if (!res.ok) return null
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const content = data.choices?.[0]?.message?.content
  if (!content) return null
  const parsed = JSON.parse(content) as Partial<DesignBrief>
  const brand = parsed.brandName?.trim() ?? ''
  const brandKey = brand.toLocaleLowerCase('tr')
  if (brandKey && parsed.productName?.trim().toLocaleLowerCase('tr') === brandKey) delete parsed.productName
  if (brandKey && parsed.sector?.trim().toLocaleLowerCase('tr') === brandKey) delete parsed.sector
  if (brandKey && parsed.subProduct?.trim().toLocaleLowerCase('tr') === brandKey) delete parsed.subProduct
  if (parsed.sector && !/kozmetik|gıda|içecek|sağlık|takviye|bebek|elektronik|parfüm|parfum|krem|serum|yağ|temizlik/i.test(parsed.sector)) {
    delete parsed.sector
  }
  return parsed
}
