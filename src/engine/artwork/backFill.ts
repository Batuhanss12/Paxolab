/**
 * Back fill — sector-specific back panel blocks and seal text.
 * Extracted from copy.ts to isolate back-panel copy from front-panel copy.
 */
import type { DesignBrief } from '../../types'
import { resolveSector, sectorBlob } from '../designSystem/sector'
import type { SectorId } from '../designSystem/types'
import { paoMonthsFromBrief } from '../marks/MarkMatrix'
import type { BackFillBlock } from './copyHelpers'

export function backFill(brief: DesignBrief, volume: string): { blocks: BackFillBlock[]; seal: string } {
  const sector = resolveSector(brief)
  const blob = sectorBlob(brief)
  const vol = volume || brief.volume
  const months = paoMonthsFromBrief(brief, sector === 'perfume' ? '36M' : '12M')
  return { blocks: fillBlocks(sector, blob, vol, months), seal: fillSeal(sector, blob, vol, months) }
}

function fillBlocks(sector: SectorId, blob: string, vol: string, months: string): BackFillBlock[] {
  if (sector === 'perfume') {
    const cologne = /kolonya/.test(blob)
    return [
      {
        title: cologne ? 'ORIGIN · FORMULA' : 'ORIGIN · LOT',
        lines: cologne
          ? ['Üretim: TR (örnek).', 'Alkol bazlı formül.', 'Lot / parti: iç kanat.', 'Oda sıcaklığında saklayın.']
          : ['Made in TR · örnek parti.', 'Lot no. iç kanatta.', 'Dikey saklayın. 15–25°C.', 'Işıktan ve nemden koruyun.'],
      },
      {
        title: cologne ? 'USE' : 'ALCOHOL · STORE',
        lines: cologne
          ? ['Cilde sürün, ovalamayın.', vol ? `Net ${vol}.` : 'Net hacim ön yüzde.', 'Gözle temasından kaçının.']
          : ['Alcohol Denat. ağırlıklı.', vol ? `Net ${vol}.` : 'Net hacim ön yüzde.', 'Alevden ve ısıdan uzak tutun.'],
      },
    ]
  }
  if (sector === 'serum') {
    return [
      {
        title: 'HOW TO USE',
        lines: ['2–3 damla, sabah ve akşam.', 'Temiz cilde, nemlendiriciden önce.', 'Gözle doğrudan temastan kaçının.'],
      },
      {
        title: 'PAO · STORE',
        lines: [`Açıldıktan sonra ${months.replace('M', '')} ay.`, '5–25°C, ışıktan uzak.', vol ? `Net ${vol}.` : 'Net hacim ön yüzde.'],
      },
    ]
  }
  if (sector === 'cream') {
    return [
      {
        title: 'HOW TO USE',
        lines: ['Temiz cilde, gece uygulayın.', 'İnce tabaka halinde yayın.', 'Tahrişte kullanımı bırakın.'],
      },
      {
        title: 'PAO · STORE',
        lines: [`Açıldıktan sonra ${months.replace('M', '')} ay.`, '5–25°C, güneşten uzak.', vol ? `Net ${vol}.` : 'Net hacim ön yüzde.'],
      },
    ]
  }
  if (sector === 'food') {
    const oil = /yağ|zeytin/.test(blob)
    return oil
      ? [
          {
            title: 'HARVEST · TRACE',
            lines: ['Soğuk sıkım. Tek bahçe.', 'Asit ≤ 0,8%. Hasat yılı örnek.', 'Lot / SKT kapakta veya yakada.'],
          },
          {
            title: 'STORE',
            lines: ['Serin ve karanlık. 10–18°C.', 'Açıldıktan sonra 3 ay içinde.', vol ? `Net ${vol}.` : 'Net hacim ön yüzde.'],
          },
        ]
      : [
          {
            title: 'NET · TRACE',
            lines: [vol ? `Net ${vol}.` : 'Net ağırlık ön yüzde.', 'Lot / SKT ambalaj üzeri.', 'Üretim yeri: TR (örnek).'],
          },
          {
            title: 'STORE',
            lines: ['Serin, kuru yerde saklayın.', 'Alerjen bilgisi üst blokta.', 'Açıldıktan sonra tüketiniz.'],
          },
        ]
  }
  if (sector === 'electronics') {
    const buds = /kulaklık|earbuds|audio/i.test(blob)
    return [
      {
        title: 'COMPLIANCE',
        lines: buds
          ? ['CE (örnek işaret) · RoHS.', 'WEEE: ayrı toplama.', 'IP ve batarya değerleri üstte.']
          : ['CE (örnek işaret) · RoHS.', 'WEEE: ayrı toplama.', 'Yalnız belirtilen giriş gerilimi.'],
      },
      {
        title: 'SUPPORT',
        lines: ['24 ay garanti (örnek).', 'Yetkili servis ağı: TR.', buds ? 'Kılıf ile birlikte saklayın.' : 'Kabloyu zorlamayın / bükmayın.'],
      },
    ]
  }
  if (sector === 'cleaning') {
    return [
      {
        title: 'USE',
        lines: ['Kullanmadan önce etiketi okuyun.', 'Havalandırın. Eldiven önerilir.', 'Başka kimyasallarla karıştırmayın.'],
      },
      {
        title: 'STORE',
        lines: ['Çocuklardan uzak, kilitli.', 'Dondurmayın. Oda sıcaklığı.', vol ? `Net ${vol}.` : 'Net hacim ön yüzde.'],
      },
    ]
  }
  return [
    {
      title: 'ORIGIN',
      lines: ['Üretici bilgisi alt bantta.', 'Lot / parti: iç kanat.', vol ? `Net ${vol}.` : ''],
    },
  ]
}

function fillSeal(sector: SectorId, blob: string, vol: string, months: string): string {
  if (sector === 'perfume') return /kolonya/.test(blob) ? 'ALC. · COLOGNE' : `ALC. DENAT. · ${months}`
  if (sector === 'serum') return `CONCENTRATE · ${months}`
  if (sector === 'cream') return `FACE CARE · ${months}`
  if (sector === 'food') return /yağ|zeytin/.test(blob) ? 'COLD PRESSED' : vol ? `NET ${vol.toUpperCase()}` : 'NET WT.'
  if (sector === 'electronics') return /kulaklık|earbuds/.test(blob) ? 'CE · RoHS · AUDIO' : 'CE · RoHS'
  if (sector === 'cleaning') return 'SURFACE CARE'
  return 'FORMA'
}
