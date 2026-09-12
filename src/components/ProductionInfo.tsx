import type { DesignSpec } from '../types'

type Item = {
  id: string
  label: string
  detail: string
  ready: (d: DesignSpec) => boolean
}

const ITEMS: Item[] = [
  {
    id: 'brand',
    label: 'Marka kimliği',
    detail: 'İsim ve monogram / logo yerleşimi',
    ready: (d) => !!d.copy.brand,
  },
  {
    id: 'product',
    label: 'Ürün adı',
    detail: 'Ön yüz hiyerarşisi',
    ready: (d) => !!d.copy.product,
  },
  {
    id: 'size',
    label: 'Net ölçü',
    detail: 'Bıçak izi için kutu / etiket boyutu',
    ready: (d) => d.kind === 'landing' || d.layout.widthMm > 0,
  },
  {
    id: 'palette',
    label: 'Renk seti',
    detail: 'Spot + proses karşılıkları',
    ready: (d) => !!d.brief.renkler || d.overrides.paletteShift !== 'default',
  },
  {
    id: 'copy',
    label: 'Metin kilidi',
    detail: 'Slogan, hacim, yasal satır',
    ready: (d) => !!d.copy.tagline,
  },
  {
    id: 'barcode',
    label: 'Barkod / QR',
    detail: 'EAN-13 sessiz alanı',
    ready: (d) => d.overrides.barcodeVisible && !!d.copy.barcode,
  },
  {
    id: 'bleed',
    label: 'Taşma payı 3 mm',
    detail: 'Kesim dışı güvenli taşma',
    ready: (d) => d.overrides.printReady,
  },
  {
    id: 'safe',
    label: 'Güvenli alan',
    detail: 'Tipografi kesimden 5 mm içeride',
    ready: (d) => d.overrides.printReady,
  },
  {
    id: 'dieline',
    label: 'Kesim bıçağı',
    detail: 'Dieline + crease kat izleri',
    ready: (d) => d.overrides.printReady && d.kind !== 'landing',
  },
  {
    id: 'cmyk',
    label: 'CMYK dönüşümü',
    detail: 'RGB önizleme → proses renk',
    ready: (d) => d.overrides.printReady,
  },
  {
    id: 'stock',
    label: 'Malzeme',
    detail: '350 gsm kuşe + mat selefon',
    ready: (d) => d.overrides.printReady && d.kind === 'packaging',
  },
  {
    id: 'warn',
    label: 'Uyarı metinleri',
    detail: 'INCI / yasal zorunlu satırlar',
    ready: (d) => !!d.copy.warnings || d.kind === 'landing',
  },
]

type ProductionInfoProps = {
  design: DesignSpec
}

export function ProductionInfo({ design }: ProductionInfoProps) {
  const done = ITEMS.filter((i) => i.ready(design)).length
  const print = design.overrides.printReady

  return (
    <div className="prod">
      <header className="prod__head">
        <div>
          <p className="eyebrow">Üretim bilgisi</p>
          <h2>
            {design.copy.brand} · {design.copy.product}
          </h2>
        </div>
        <div className="prod__score">
          <strong>{done}</strong>
          <span>/{ITEMS.length} hazır</span>
        </div>
      </header>

      <p className="prod__lead">
        {print
          ? 'Baskıya hazır profil açık. Taşma, güvenli alan ve CMYK notları kilitlendi. Ofset için PDF/X-4 dışa aktarılabilir.'
          : 'Tasarım motoru ön yüzü üretti. “baskıya hazırla” yazarak checklist’i kapatabilirsiniz.'}
      </p>

      <ul className="prod__list">
        {ITEMS.map((item) => {
          const ok = item.ready(design)
          return (
            <li key={item.id} className={ok ? 'is-ready' : ''}>
              <span className="check">{ok ? '●' : '○'}</span>
              <div>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </div>
            </li>
          )
        })}
      </ul>

      <dl className="prod__spec">
        <div>
          <dt>Format</dt>
          <dd>
            {design.kind === 'landing'
              ? 'Web · 1440×900'
              : `${design.layout.widthMm} × ${design.layout.depthMm || '—'} × ${design.layout.heightMm} mm`}
          </dd>
        </div>
        <div>
          <dt>Renk</dt>
          <dd>
            {design.palette.bg} / {design.palette.accent}
          </dd>
        </div>
        <div>
          <dt>Barkod</dt>
          <dd>{design.copy.barcode}</dd>
        </div>
        <div>
          <dt>Revizyon</dt>
          <dd>{design.revision}</dd>
        </div>
      </dl>
    </div>
  )
}
