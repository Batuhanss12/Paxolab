import Link from "next/link";
import type { Locale } from "@/content/types";
import { getContent } from "@/content";
import { PageHero } from "@/components/PageHero";
import { StudioLink } from "@/components/StudioLink";
import { JsonLd } from "@/components/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

export function HomePageView({ locale }: { locale: Locale }) {
  const { home } = getContent(locale);
  const howHref = locale === "en" ? "/en/how-it-works" : "/nasil-calisir";

  return (
    <>
      <JsonLd data={organizationJsonLd(locale)} />
      <JsonLd data={websiteJsonLd(locale)} />
      <PageHero eyebrow={home.hero.eyebrow} title={home.hero.title} lead={home.hero.lead}>
        <StudioLink>{home.hero.primaryCta}</StudioLink>
        <Link
          href={howHref}
          className="inline-flex items-center justify-center rounded-sm border border-cream/25 px-5 py-2.5 text-sm text-cream/80 transition hover:border-cream/50"
        >
          {home.hero.secondaryCta}
        </Link>
      </PageHero>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {home.valueProps.map((v) => (
            <Link
              key={v.href}
              href={v.href}
              className="group rounded-sm border border-cream/10 bg-ink-900/40 p-5 transition hover:border-copper/40 hover:bg-ink-900/70"
            >
              <h2 className="font-display text-xl text-cream group-hover:text-copper-bright">
                {v.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-cream/55">{v.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-cream/10 bg-ink-975/80">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl text-cream">{home.hubsTitle}</h2>
          <p className="mt-3 max-w-xl text-sm text-cream/55">{home.hubsLead}</p>
          <ul className="mt-8 flex flex-wrap gap-3">
            {[...home.hubs, ...home.extraHubs].map((h) => (
              <li key={h.href}>
                <Link
                  href={h.href}
                  className="inline-flex rounded-sm border border-cream/15 px-4 py-2 text-sm text-cream/80 transition hover:border-copper/50 hover:text-copper"
                >
                  {h.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-sm border border-copper/30 bg-gradient-to-br from-ink-900 to-ink-975 p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl text-cream">{home.ctaTitle}</h2>
            <p className="mt-2 max-w-lg text-sm text-cream/55">{home.ctaLead}</p>
          </div>
          <StudioLink />
        </div>
      </section>
    </>
  );
}
