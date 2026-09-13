import Link from "next/link";
import type { Locale, ServicePage as ServicePageData } from "@/content/types";
import { getContent } from "@/content";
import { PageHero } from "@/components/PageHero";
import { StudioLink } from "@/components/StudioLink";
import { JsonLd } from "@/components/JsonLd";
import { serviceJsonLd } from "@/lib/seo";

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
      </div>
    </>
  );
}
