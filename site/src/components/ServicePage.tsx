import Link from "next/link";
import type { Locale, ServicePage as ServicePageData } from "@/content/types";
import { getContent } from "@/content";
import { PageHero } from "@/components/PageHero";
import { StudioLink } from "@/components/StudioLink";
import { JsonLd } from "@/components/JsonLd";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  howToJsonLd,
  serviceBreadcrumbItems,
  serviceJsonLd,
} from "@/lib/seo";

export function ServicePageView({
  data,
  locale = "tr",
  howHref,
}: {
  data: ServicePageData;
  locale?: Locale;
  howHref: string;
}) {
  const { ui } = getContent(locale);
  const servicePath = locale === "en" ? `/en/${data.slug}` : `/${data.slug}`;
  const faqs = data.faqs ?? [];
  const crumbs = serviceBreadcrumbItems({
    locale,
    slug: data.slug,
    pageName: data.serviceName,
  });

  return (
    <>
      <JsonLd
        data={serviceJsonLd({
          name: data.serviceName,
          description: data.meta.description,
          path: servicePath,
          locale,
        })}
      />
      {faqs.length > 0 ? <JsonLd data={faqJsonLd(faqs)} /> : null}
      {data.howto ? (
        <JsonLd
          data={howToJsonLd({
            name: data.howto.name,
            description: data.howto.description,
            path: servicePath,
            steps: data.howto.steps,
            locale,
          })}
        />
      ) : null}
      <JsonLd data={breadcrumbJsonLd({ locale, items: crumbs })} />
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <nav aria-label={locale === "en" ? "Breadcrumb" : "Sayfa yolu"} className="text-xs text-cream/45">
          <ol className="flex flex-wrap items-center gap-2">
            {crumbs.map((c, i) => (
              <li key={c.path} className="flex items-center gap-2">
                {i > 0 ? <span aria-hidden="true" className="text-cream/25">/</span> : null}
                {i === crumbs.length - 1 ? (
                  <span className="text-cream/70">{c.name}</span>
                ) : (
                  <Link href={c.path} className="transition hover:text-copper">
                    {c.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
      <PageHero title={data.hero.title} lead={data.hero.lead}>
        <StudioLink />
        <Link
          href={howHref}
          className="inline-flex items-center justify-center rounded-sm border border-cream/25 px-5 py-2.5 text-sm text-cream/80 transition hover:border-cream/50"
        >
          {ui.howSecondary}
        </Link>
      </PageHero>
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-10">
            {data.sections.map((s) => (
              <section key={s.title}>
                <h2 className="font-display text-2xl text-cream">{s.title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cream/65 sm:text-base">
                  {s.body}
                </p>
              </section>
            ))}
          </div>
          <aside className="h-fit rounded-sm border border-cream/10 bg-ink-900/60 p-6">
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-cream/40">
              {ui.relatedTitle}
            </h2>
            <ul className="mt-4 space-y-2">
              {data.related.map((r) => (
                <li key={r.href}>
                  <Link
                    href={r.href}
                    className="text-sm text-copper transition hover:text-copper-bright"
                  >
                    {r.label} →
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <StudioLink className="w-full" />
            </div>
          </aside>
        </div>
        {faqs.length > 0 ? (
          <section className="mx-auto mt-16 max-w-3xl space-y-4">
            <h2 className="font-display text-2xl text-cream">{ui.faqTitle}</h2>
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-sm border border-cream/10 bg-ink-900/40 open:border-copper/30"
              >
                <summary className="cursor-pointer list-none px-5 py-4 font-medium text-cream marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-4">
                    <span>{item.q}</span>
                    <span className="text-copper transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="border-t border-cream/5 px-5 py-4 text-sm leading-relaxed text-cream/60">
                  {item.a}
                </p>
              </details>
            ))}
          </section>
        ) : null}
      </div>
    </>
  );
}
