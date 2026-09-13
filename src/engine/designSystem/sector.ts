import type { DesignBrief } from '../../types'
import type { SectorId } from './types'
import { keywordRegex, SECTORS } from './sectorConfig'

export function resolveSector(brief: DesignBrief): SectorId {
  const blob = sectorBlob(brief)
  for (const sector of SECTORS) {
    if (keywordRegex(sector.keywords).test(blob)) return sector.id
  }
  return 'generic'
}

export function sectorBlob(brief: DesignBrief): string {
  return `${brief.sector} ${brief.subProduct} ${brief.productName}`.toLocaleLowerCase('tr')
}
