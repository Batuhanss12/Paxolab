import Link from "next/link";
import type { Locale } from "@/content/types";
import { getContent } from "@/content";
import { StudioLink } from "@/components/StudioLink";
import { JsonLd } from "@/components/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { STUDIO_URL } from "@/lib/site";

function ProductStage({
  locale,
  placeholder,
  hint,
}: {
  locale: Locale;
  placeholder: string;
  hint: string;
}) {
  return (
    <div className="relative mx-auto mt-16 w-full max-w-4xl sm:mt-20">
      <div className="glow-stage-ring pointer-events-none absolute -inset-x-8 -inset-y-12 sm:-inset-x-16" aria-hidden />
      <div className="glow-stage relative overflow-hidden rounded-2xl border border-white/[0.08] glass-panel sm:rounded-3xl">
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
          <p className="text-[11px] tracking-wide text-cream/35">
            Grapxor Studio
          </p>
          <span className="w-10" aria-hidden />
        </div>

        <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
          {/* Composer / chat side */}
          <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:p-6 md:border-b-0 md:border-r">
            <div className="space-y-3">
              <div className="max-w-[90%] rounded-2xl rounded-tl-md bg-white/[0.04] px-4 py-3 text-sm text-cream/70">
                {locale === "en"
                  ? "Serum box, matte black, copper foil — tuck-end, print-ready dieline."
                  : "Serum kutusu, mat siyah, bakır foil — tuck-end, baskıya hazır dieline."}
              </div>
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md border border-copper/25 bg-copper/10 px-4 py-3 text-sm text-cream/85">
                {locale === "en"
                  ? "Grapxor drafted structure + vector art. Review the preview →"
                  : "Grapxor yapı + vektör yüzeyi hazırladı. Önizlemeyi inceleyin →"}
              </div>
            </div>

            <div className="mt-auto flex items-center gap-2 rounded-full border border-white/[0.1] bg-ink-975/80 px-2 py-1.5 pl-4 shadow-inner">
              <span className="flex-1 truncate text-sm text-cream/35">{placeholder}</span>
              <a
                href={STUDIO_URL}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-ink-975 transition hover:bg-cream-soft"
                aria-label={locale === "en" ? "Open studio" : "Stüdyoyu aç"}
                rel="noopener noreferrer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Preview / play side */}
          <div className="relative flex min-h-[220px] flex-col items-center justify-center gap-4 bg-gradient-to-b from-white/[0.02] to-transparent p-6 sm:min-h-[280px]">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              aria-hidden
              style={{
                backgroundImage:
                  "radial-gradient(circle at 50% 40%, rgba(196,149,94,0.18), transparent 55%)",
              }}
            />

            {/* Box / dieline silhouette */}
            <div className="relative">
              <svg
                width="160"
                height="140"
                viewBox="0 0 160 140"
                className="text-cream/25"
                aria-hidden
              >
                {/* Open dieline net */}
                <path
                  d="M40 30h40v20H40V30zm40 0h40v20H80V30zM20 50h40v60H20V50zm40 0h40v60H60V50zm40 0h40v60h-40V50zM60 110h40v20H60v-20z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinejoin="round"
                />
                <path
                  d="M60 50v60M100 50v60M60 70h40M60 90h40"
                  stroke="currentColor"
                  strokeWidth="0.75"
                  strokeDasharray="3 3"
                  opacity="0.7"
                />
              </svg>

              {/* Play affordance */}
              <a
                href={STUDIO_URL}
                className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-ink-950/80 text-cream shadow-[0_0_24px_rgba(196,149,94,0.35)] backdrop-blur transition hover:border-copper/50 hover:text-copper-bright"
                aria-label={locale === "en" ? "Try in studio" : "Stüdyoda dene"}
                rel="noopener noreferrer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5.5v13l11-6.5L8 5.5z" />
                </svg>
              </a>
            </div>

            <p className="relative text-[11px] uppercase tracking-[0.2em] text-cream/40">
              {hint}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomePageView({ locale }: { locale: Locale }) {
  const { home } = getContent(locale);
  const howHref = locale === "en" ? "/en/how-it-works" : "/nasil-calisir";

  return (
    <>
      <JsonLd data={organizationJsonLd(locale)} />
      <JsonLd data={websiteJsonLd(locale)} />

      {/* Custom Framer-style hero — bypasses PageHero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(196,149,94,0.12), transparent 55%), radial-gradient(ellipse 40% 30% at 80% 20%, rgba(180,200,255,0.04), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-20 sm:px-6 sm:pb-10 sm:pt-28">
          <p className="mb-5 text-center text-xs font-medium uppercase tracking-[0.28em] text-copper">
            {home.hero.eyebrow}
          </p>
          <h1 className="hero-headline mx-auto max-w-4xl text-center text-cream">
            {home.hero.title}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-center text-base leading-relaxed text-cream/50 sm:text-lg">
            {home.hero.lead}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <StudioLink className="px-7 py-3 text-[15px]">
              {home.hero.primaryCta}
            </StudioLink>
            <Link
              href={howHref}
              className="inline-flex items-center justify-center rounded-full border border-cream/20 bg-ink-900/80 px-7 py-3 text-[15px] font-medium text-cream/90 transition hover:border-cream/40 hover:bg-ink-850"
            >
              {home.hero.secondaryCta}
            </Link>
          </div>

          <ProductStage
            locale={locale}
            placeholder={home.hero.askPlaceholder}
            hint={home.hero.stageHint}
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {home.valueProps.map((v) => (
            <Link
              key={v.href}
              href={v.href}
              className="group rounded-2xl border border-white/[0.07] bg-ink-900/50 p-6 transition hover:border-copper/35 hover:bg-ink-850/80"
            >
              <h2 className="text-lg font-semibold tracking-tight text-cream group-hover:text-copper-bright">
                {v.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-cream/45">{v.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-ink-975">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <h2 className="section-headline text-cream">{home.hubsTitle}</h2>
          <p className="mt-4 max-w-xl text-base text-cream/45">{home.hubsLead}</p>
          <ul className="mt-10 flex flex-wrap gap-2.5">
            {[...home.hubs, ...home.extraHubs].map((h) => (
              <li key={h.href}>
                <Link
                  href={h.href}
                  className="inline-flex rounded-full border border-white/[0.1] bg-ink-900/40 px-4 py-2 text-sm text-cream/70 transition hover:border-copper/45 hover:text-copper-bright"
                >
                  {h.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-ink-850 to-ink-975 p-8 sm:p-12">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-30"
            aria-hidden
            style={{
              background:
                "radial-gradient(circle, rgba(196,149,94,0.35), transparent 70%)",
            }}
          />
          <div className="relative flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
            <div>
              <h2 className="section-headline text-cream">{home.ctaTitle}</h2>
              <p className="mt-3 max-w-lg text-base text-cream/45">{home.ctaLead}</p>
            </div>
            <StudioLink className="shrink-0 px-7 py-3 text-[15px]" />
          </div>
        </div>
      </section>
    </>
  );
}
