import type { DesignBrief } from '../types'

/** Optional FORMA-owned LLM extract. Heuristic engine stays the default. */
export async function extractBriefWithLlm(text: string): Promise<Partial<DesignBrief> | null> {
  const key = import.meta.env.VITE_FORMA_LLM_KEY
  const url = import.meta.env.VITE_FORMA_LLM_URL
  if (!key || !url) return null
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Extract a FORMA DesignBrief JSON only. Keys: brandName, productName, sector, subProduct, packagingMode (box|label), styleType (luxury|modern|minimal|eco|playful|classic), colors, volume, barcode. Never invent a barcode. No image generation.',
        },
        { role: 'user', content: text },
      ],
    }),
  })
  if (!res.ok) return null
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const content = data.choices?.[0]?.message?.content
  if (!content) return null
  return JSON.parse(content) as Partial<DesignBrief>
}
