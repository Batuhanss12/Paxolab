import type { Locale } from "@/content/types";

type BoardProps = { locale: Locale };

export function PaletteBoard({ locale }: BoardProps) {
  const isEn = locale === "en";
  const swatches = [
    { name: "Ink", hex: "#050505", bg: "#050505" },
    { name: "Cream", hex: "#F5F0E6", bg: "#F5F0E6" },
    { name: "Copper", hex: "#C4955E", bg: "#C4955E" },
  ] as const;
  return (
    <article className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-ink-900/50 p-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-copper">
        {isEn ? "01 · Color" : "01 · Renk"}
      </p>
      <h3 className="mt-3 font-display text-xl text-cream">
        {isEn ? "Quiet contrast" : "Sakin kontrast"}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-cream/50">
        {isEn
          ? "Ink, cream, and copper — enough for hierarchy without noise."
          : "Mürekkep, krem ve bakır — hiyerarşi için yeterli, gürültüsüz."}
      </p>
      <div className="mt-8 grid grid-cols-3 gap-3">
        {swatches.map((s) => (
          <div key={s.name} className="min-w-0">
            <div
              className="h-14 rounded-lg border border-white/[0.08]"
              style={{ backgroundColor: s.bg }}
            />
            <p className="mt-2.5 text-xs font-medium text-cream/80">{s.name}</p>
            <p className="mt-0.5 font-mono text-[10px] text-cream/35">{s.hex}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

export function TypeBoard({ locale }: BoardProps) {
  const isEn = locale === "en";
  return (
    <article className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-ink-900/50 p-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-copper">
        {isEn ? "02 · Type" : "02 · Tipografi"}
      </p>
      <h3 className="mt-3 font-display text-xl text-cream">
        {isEn ? "Clear hierarchy" : "Net hiyerarşi"}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-cream/50">
        {isEn
          ? "Sans for interface. Serif for emphasis and brand moments."
          : "Arayüzde sans. Marka ve vurgu anlarında serif."}
      </p>
      <div className="mt-8 space-y-3 border-t border-white/[0.06] pt-6">
        <p className="font-display text-3xl leading-none tracking-tight text-cream">
          Grapxor
        </p>
        <p className="text-sm text-cream/55">
          {isEn ? "Aa Bb Cc · 0123456789" : "Aa Bb Cc · 0123456789"}
        </p>
        <p className="text-xs text-cream/35">
          {isEn ? "UI sans · display serif" : "UI sans · vurgu serifi"}
        </p>
      </div>
    </article>
  );
}

export function PromiseBoard({ locale }: BoardProps) {
  const isEn = locale === "en";
  const steps = isEn
    ? ["Brief", "Dieline", "Print-ready vector"]
    : ["Brief", "Dieline", "Baskıya hazır vektör"];
  return (
    <article className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-ink-900/50 p-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-copper">
        {isEn ? "03 · Output" : "03 · Çıktı"}
      </p>
      <h3 className="mt-3 font-display text-xl text-cream">
        {isEn ? "Built for production" : "Üretime uygun"}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-cream/50">
        {isEn
          ? "From a short brief to exportable structure — not a mood board."
          : "Kısa brief’ten dışa aktarılabilir yapıya — mood board değil."}
      </p>
      <ol className="mt-8 space-y-3 border-t border-white/[0.06] pt-6">
        {steps.map((step, i) => (
          <li key={step} className="flex items-baseline gap-3">
            <span className="font-mono text-[11px] text-copper">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-sm text-cream/85">{step}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}

export function LocaleBoard({ locale }: BoardProps) {
  const isEn = locale === "en";
  return (
    <article className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-ink-900/50 p-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-copper">
        {isEn ? "04 · Language" : "04 · Dil"}
      </p>
      <h3 className="mt-3 font-display text-xl text-cream">
        {isEn ? "Turkish first" : "Önce Türkçe"}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-cream/50">
        {isEn
          ? "Primary experience in Turkish, with a full English path when you need it."
          : "Ana deneyim Türkçe; gerektiğinde tam İngilizce yol."}
      </p>
      <div className="mt-8 flex flex-wrap gap-2 border-t border-white/[0.06] pt-6">
        <span className="inline-flex items-center rounded-full border border-cream/20 bg-cream px-3 py-1.5 text-xs font-semibold text-ink-975">
          TR
        </span>
        <span className="inline-flex items-center rounded-full border border-white/15 bg-transparent px-3 py-1.5 text-xs font-semibold text-cream/70">
          EN
        </span>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-cream/35">
        {isEn
          ? "Separate routes, matching hreflang."
          : "Ayrı rotalar, uyumlu hreflang."}
      </p>
    </article>
  );
}

export function FlowBoard({ locale = "tr" }: { locale?: Locale }) {
  const isEn = locale === "en";
  const cells = isEn
    ? [
        { n: "1", title: "Talk", sub: "chat brief" },
        { n: "2", title: "Motor", sub: "vector engine" },
        { n: "3", title: "Refine", sub: "iteration" },
        { n: "4", title: "Export", sub: "SVG · DXF" },
      ]
    : [
        { n: "1", title: "Konuş", sub: "sohbet brief" },
        { n: "2", title: "Motor", sub: "vektör motor" },
        { n: "3", title: "Düzenle", sub: "iterasyon" },
        { n: "4", title: "Export", sub: "SVG · DXF" },
      ];
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-ink-900/50 p-5 sm:p-6">
      <div className="mb-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-copper">
          {isEn ? "06 · Flow" : "06 · Akış"}
        </p>
        <span className="mt-1 block h-px w-10 bg-copper" />
      </div>
      <div className="grid grid-cols-2 border border-copper/35">
        {cells.map((c, i) => (
          <div
            key={c.n}
            className={`min-h-[96px] p-4 sm:min-h-[112px] sm:p-5 ${
              i % 2 === 0 ? "border-r border-copper/35" : ""
            } ${i < 2 ? "border-b border-copper/35" : ""}`}
          >
            <p className="text-sm text-copper">{c.n}</p>
            <p className="mt-1 text-lg font-semibold uppercase tracking-wide text-cream sm:text-xl">
              {c.title}
            </p>
            <p className="mt-1 text-xs text-cream/45">{c.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
