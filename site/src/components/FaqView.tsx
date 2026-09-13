import type { Locale } from "@/content/types";
import { getContent } from "@/content";
import { faqJsonLd } from "@/lib/seo";
import { PageHero } from "@/components/PageHero";
import { JsonLd } from "@/components/JsonLd";

export function FaqView({ locale }: { locale: Locale }) {
  const { faq } = getContent(locale);
  return (
    <>
      <JsonLd data={faqJsonLd(faq.items)} />
      <PageHero title={faq.title} lead={faq.lead} />
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-14 sm:px-6">
        {faq.items.map((item) => (
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
      </div>
    </>
  );
}
