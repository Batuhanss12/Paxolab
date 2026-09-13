import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../types'
import { lookupVocabulary, resolveSubProduct } from './brain'
import { resolveSector, sectorBlob } from './designSystem/sector'
import { extractFields } from './extract'
import { emptyBrief } from './fields'

function brief(sector: string, subProduct: string, productName: string): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'PAXO',
    productName,
    sector,
    subProduct,
    packagingMode: 'box',
  }
}

describe('expanded sector model', () => {
  it.each([
    ['içecek', 'kombucha', 'Ginger Kombucha', 'beverage', 'beverage:beverage'],
    ['sağlık', 'takviye', 'Daily D3', 'health', 'health:health'],
    ['bebek', 'bakım', 'Gentle Wash', 'baby', 'baby:baby'],
  ])('resolves %s without falling back to generic', (sector, subProduct, product, expected, vocabularyId) => {
    const input = brief(sector, subProduct, product)
    const resolved = resolveSector(input)
    const vocabulary = lookupVocabulary(resolved, resolveSubProduct(resolved, sectorBlob(input)))

    expect(resolved).toBe(expected)
    expect(vocabulary.id).toBe(vocabularyId)
  })

  it('extracts new sector vocabulary from Turkish prompts', () => {
    expect(extractFields('Luma için 330 ml kombucha şişe etiketi', []).sector).toBe('içecek')
    expect(extractFields('Vita için D3 vitamin takviye kutusu', []).sector).toBe('sağlık')
    expect(extractFields('Mino için hassas bebek bakım kutusu', []).sector).toBe('bebek')
  })
})
