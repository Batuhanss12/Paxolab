import type { DesignBrief } from '../../types'
import type { SectorId } from './types'

export function resolveSector(brief: DesignBrief): SectorId {
  const blob = `${brief.sector} ${brief.subProduct} ${brief.productName}`.toLocaleLowerCase('tr')
  if (/parfüm|parfum|perfume|eau de|edp|kolonya/.test(blob)) return 'perfume'
  if (/serum|ampul/.test(blob)) return 'serum'
  if (/krem|cream/.test(blob)) return 'cream'
  if (/bebek|baby|yenidoğan|newborn|çocuk bakım/.test(blob)) return 'baby'
  if (/ilaç|pharma|eczane|takviye|supplement|vitamin|probiyotik|mineral/.test(blob)) return 'health'
  if (/içecek|beverage|meyve suyu|soda|gazoz|kombucha|şarap|wine|bira|beer|su şişe/.test(blob)) return 'beverage'
  if (/elektronik|teknoloji|kulaklık|kablo|cihaz|earbuds|şarj/.test(blob)) return 'electronics'
  if (/gıda|yağ|çay|atıştırmalık|reçel|bal|çikolata|zeytin|sızma/.test(blob)) return 'food'
  if (/temizlik|cleaning|deterjan|yüzey bakım|dezenfektan/.test(blob)) return 'cleaning'
  if (/kozmetik|cilt/.test(blob)) return 'cream'
  return 'generic'
}

export function sectorBlob(brief: DesignBrief): string {
  return `${brief.sector} ${brief.subProduct} ${brief.productName}`.toLocaleLowerCase('tr')
}
