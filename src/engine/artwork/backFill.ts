/**
 * Back fill — sector-specific back panel blocks and seal text.
 * Extracted from copy.ts to isolate back-panel copy from front-panel copy.
 */
import type { CopyLocale, DesignBrief } from '../../types'
import { resolveCopyLocale } from '../copyLocale'
import { resolveSector, sectorBlob } from '../designSystem/sector'
import type { SectorId } from '../designSystem/types'
import { paoMonthsFromBrief } from '../marks/MarkMatrix'
import type { BackFillBlock } from './copyHelpers'

export function backFill(brief: DesignBrief, volume: string): { blocks: BackFillBlock[]; seal: string } {
  const sector = resolveSector(brief)
  const blob = sectorBlob(brief)
  const vol = volume || brief.volume
  const months = paoMonthsFromBrief(brief, sector === 'perfume' ? '36M' : '12M')
  const locale = resolveCopyLocale(brief)
  return { blocks: fillBlocks(sector, blob, vol, months, locale), seal: fillSeal(sector, blob, vol, months, locale) }
}

function fillBlocks(sector: SectorId, blob: string, vol: string, months: string, locale: CopyLocale): BackFillBlock[] {
  const en = locale === 'en'
  const netLine = vol ? (en ? `Net ${vol}.` : `Net ${vol}.`) : en ? 'Net volume on the front.' : 'Net hacim ön yüzde.'
  const paoMonths = months.replace('M', '')

  if (sector === 'perfume') {
    const cologne = /kolonya/.test(blob)
    return [
      {
        title: cologne ? (en ? 'ORIGIN · FORMULA' : 'MENŞEİ · FORMÜL') : en ? 'ORIGIN · LOT' : 'MENŞEİ · LOT',
        lines: cologne
          ? en
            ? ['Made in TR (sample).', 'Alcohol-based formula.', 'Lot / batch: inner flap.', 'Store at room temperature.']
            : ['Üretim: TR (örnek).', 'Alkol bazlı formül.', 'Lot / parti: iç kanat.', 'Oda sıcaklığında saklayın.']
          : en
            ? ['Made in TR · sample lot.', 'Lot no. on inner flap.', 'Store upright. 15–25°C.', 'Protect from light and moisture.']
            : ['Made in TR · örnek parti.', 'Lot no. iç kanatta.', 'Dikey saklayın. 15–25°C.', 'Işıktan ve nemden koruyun.'],
      },
      {
        title: cologne ? (en ? 'USE' : 'KULLANIM') : en ? 'ALCOHOL · STORE' : 'ALKOL · SAKLAMA',
        lines: cologne
          ? en
            ? ['Apply to skin, do not rub.', netLine, 'Avoid contact with eyes.']
            : ['Cilde sürün, ovalamayın.', netLine, 'Gözle temasından kaçının.']
          : en
            ? ['Alcohol Denat. based.', netLine, 'Keep away from flame and heat.']
            : ['Alcohol Denat. ağırlıklı.', netLine, 'Alevden ve ısıdan uzak tutun.'],
      },
    ]
  }
  if (sector === 'serum') {
    return [
      {
        title: en ? 'HOW TO USE' : 'KULLANIM',
        lines: en
          ? ['2–3 drops, morning and evening.', 'On clean skin, before moisturizer.', 'Avoid direct contact with eyes.']
          : ['2–3 damla, sabah ve akşam.', 'Temiz cilde, nemlendiriciden önce.', 'Gözle doğrudan temastan kaçının.'],
      },
      {
        title: en ? 'PAO · STORE' : 'PAO · SAKLAMA',
        lines: en
          ? [`Use within ${paoMonths} months after opening.`, '5–25°C, away from light.', netLine]
          : [`Açıldıktan sonra ${paoMonths} ay.`, '5–25°C, ışıktan uzak.', netLine],
      },
    ]
  }
  if (sector === 'cream') {
    return [
      {
        title: en ? 'HOW TO USE' : 'KULLANIM',
        lines: en
          ? ['Apply to clean skin at night.', 'Spread in a thin layer.', 'Discontinue if irritation occurs.']
          : ['Temiz cilde, gece uygulayın.', 'İnce tabaka halinde yayın.', 'Tahrişte kullanımı bırakın.'],
      },
      {
        title: en ? 'PAO · STORE' : 'PAO · SAKLAMA',
        lines: en
          ? [`Use within ${paoMonths} months after opening.`, '5–25°C, away from sun.', netLine]
          : [`Açıldıktan sonra ${paoMonths} ay.`, '5–25°C, güneşten uzak.', netLine],
      },
    ]
  }
  if (sector === 'food') {
    const oil = /yağ|zeytin/.test(blob)
    return oil
      ? [
          {
            title: en ? 'HARVEST · TRACE' : 'HASAT · İZ',
            lines: en
              ? ['Cold pressed. Single grove.', 'Acidity ≤ 0.8%. Harvest year sample.', 'Lot / EXP on cap or neck.']
              : ['Soğuk sıkım. Tek bahçe.', 'Asit ≤ 0,8%. Hasat yılı örnek.', 'Lot / SKT kapakta veya yakada.'],
          },
          {
            title: en ? 'STORE' : 'SAKLAMA',
            lines: en
              ? ['Cool and dark. 10–18°C.', 'Use within 3 months after opening.', netLine]
              : ['Serin ve karanlık. 10–18°C.', 'Açıldıktan sonra 3 ay içinde.', netLine],
          },
        ]
      : [
          {
            title: en ? 'NET · TRACE' : 'NET · İZ',
            lines: en
              ? [vol ? `Net ${vol}.` : 'Net weight on the front.', 'Lot / EXP on pack.', 'Made in TR (sample).']
              : [vol ? `Net ${vol}.` : 'Net ağırlık ön yüzde.', 'Lot / SKT ambalaj üzeri.', 'Üretim yeri: TR (örnek).'],
          },
          {
            title: en ? 'STORE' : 'SAKLAMA',
            lines: en
              ? ['Store cool and dry.', 'Allergen information in the block above.', 'Consume after opening as directed.']
              : ['Serin, kuru yerde saklayın.', 'Alerjen bilgisi üst blokta.', 'Açıldıktan sonra tüketiniz.'],
          },
        ]
  }
  if (sector === 'electronics') {
    const buds = /kulaklık|earbuds|audio/i.test(blob)
    return [
      {
        title: 'COMPLIANCE',
        lines: buds
          ? en
            ? ['CE (sample mark) · RoHS.', 'WEEE: separate collection.', 'IP and battery values above.']
            : ['CE (örnek işaret) · RoHS.', 'WEEE: ayrı toplama.', 'IP ve batarya değerleri üstte.']
          : en
            ? ['CE (sample mark) · RoHS.', 'WEEE: separate collection.', 'Use only the stated input voltage.']
            : ['CE (örnek işaret) · RoHS.', 'WEEE: ayrı toplama.', 'Yalnız belirtilen giriş gerilimi.'],
      },
      {
        title: en ? 'SUPPORT' : 'DESTEK',
        lines: en
          ? ['24-month warranty (sample).', 'Authorized service: TR.', buds ? 'Store with the case.' : 'Do not strain or kink the cable.']
          : ['24 ay garanti (örnek).', 'Yetkili servis ağı: TR.', buds ? 'Kılıf ile birlikte saklayın.' : 'Kabloyu zorlamayın / bükmayın.'],
      },
    ]
  }
  if (sector === 'cleaning') {
    return [
      {
        title: en ? 'USE' : 'KULLANIM',
        lines: en
          ? ['Read the label before use.', 'Ventilate. Gloves recommended.', 'Do not mix with other chemicals.']
          : ['Kullanmadan önce etiketi okuyun.', 'Havalandırın. Eldiven önerilir.', 'Başka kimyasallarla karıştırmayın.'],
      },
      {
        title: en ? 'STORE' : 'SAKLAMA',
        lines: en
          ? ['Away from children, locked.', 'Do not freeze. Room temperature.', netLine]
          : ['Çocuklardan uzak, kilitli.', 'Dondurmayın. Oda sıcaklığı.', netLine],
      },
    ]
  }
  return [
    {
      title: en ? 'ORIGIN' : 'MENŞEİ',
      lines: en
        ? ['Manufacturer on the lower band.', 'Lot / batch: inner flap.', vol ? `Net ${vol}.` : '']
        : ['Üretici bilgisi alt bantta.', 'Lot / parti: iç kanat.', vol ? `Net ${vol}.` : ''],
    },
  ]
}

function fillSeal(sector: SectorId, blob: string, vol: string, months: string, locale: CopyLocale): string {
  const en = locale === 'en'
  if (sector === 'perfume') return /kolonya/.test(blob) ? 'ALC. · COLOGNE' : `ALC. DENAT. · ${months}`
  if (sector === 'serum') return en ? `CONCENTRATE · ${months}` : `KONSANTRE · ${months}`
  if (sector === 'cream') return en ? `FACE CARE · ${months}` : `YÜZ BAKIMI · ${months}`
  if (sector === 'food') {
    if (/yağ|zeytin/.test(blob)) return en ? 'COLD PRESSED' : 'SOĞUK SIKIM'
    return vol ? `NET ${vol.toUpperCase()}` : en ? 'NET WT.' : 'NET'
  }
  if (sector === 'electronics') return /kulaklık|earbuds/.test(blob) ? 'CE · RoHS · AUDIO' : 'CE · RoHS'
  if (sector === 'cleaning') return en ? 'SURFACE CARE' : 'YÜZEY BAKIMI'
  return 'FORMA'
}
