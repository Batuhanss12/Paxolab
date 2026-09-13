import type { Locale } from "@/content/types";
import { getContent } from "@/content";
import { PageHero } from "@/components/PageHero";
import { StudioLink } from "@/components/StudioLink";

export function ExamplesView({ locale }: { locale: Locale }) {
  const { examples } = getContent(locale);
  return (
    <>
      <PageHero title={examples.title} lead={examples.lead}>
        <StudioLink />
      </PageHero>
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-14 sm:px-6 md:grid-cols-2">
        {examples.items.map((item) => (
          <article
            key={item.title}
            className="rounded-sm border border-cream/10 bg-ink-900/40 p-6"
          >
            <div className="flex items-center gap-2">
              <span className="rounded-sm bg-copper/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-copper">
                {examples.badge}
              </span>
              <span className="text-xs text-cream/40">{item.category}</span>
            </div>
            <h2 className="mt-3 font-display text-xl text-cream">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-cream/60">{item.text}</p>
          </article>
        ))}
      </div>
    </>
  );
}
