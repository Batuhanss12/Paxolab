import type { Locale } from "@/content/types";
import { getContent } from "@/content";
import { PageHero } from "@/components/PageHero";
import { StudioLink } from "@/components/StudioLink";

export function HowItWorksView({ locale }: { locale: Locale }) {
  const { howItWorks } = getContent(locale);
  return (
    <>
      <PageHero title={howItWorks.title} lead={howItWorks.lead}>
        <StudioLink>{howItWorks.cta}</StudioLink>
      </PageHero>
      <ol className="mx-auto grid max-w-6xl gap-4 px-4 py-14 sm:px-6 md:grid-cols-2">
        {howItWorks.steps.map((s) => (
          <li key={s.n} className="rounded-sm border border-cream/10 bg-ink-900/40 p-6">
            <span className="font-mono text-xs tracking-widest text-copper">{s.n}</span>
            <h2 className="mt-2 font-display text-2xl text-cream">{s.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-cream/60">{s.text}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
