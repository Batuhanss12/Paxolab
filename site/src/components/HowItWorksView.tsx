import Image from "next/image";
import type { Locale } from "@/content/types";
import { getContent } from "@/content";
import { PageHero } from "@/components/PageHero";
import { StudioLink } from "@/components/StudioLink";

export function HowItWorksView({ locale }: { locale: Locale }) {
  const { howItWorks } = getContent(locale);
  const isEn = locale === "en";

  return (
    <>
      <PageHero title={howItWorks.title} lead={howItWorks.lead}>
        <StudioLink>{howItWorks.cta}</StudioLink>
      </PageHero>

      <figure className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-12">
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/[0.08] sm:rounded-3xl">
          <Image
            src="/brand/06-flow.png"
            alt={isEn ? "Flow" : "Akış"}
            fill
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="object-cover"
            priority
          />
        </div>
        <figcaption className="mt-3 text-center text-sm text-cream/45">
          {isEn ? "Flow" : "Akış"}
        </figcaption>
      </figure>

      <ol className="mx-auto grid max-w-6xl gap-4 px-4 py-14 sm:px-6 md:grid-cols-2">
        {howItWorks.steps.map((s) => (
          <li key={s.n} className="rounded-sm border border-cream/10 bg-ink-900/40 p-6">
            <span className="font-mono text-xs tracking-widest text-copper">{s.n}</span>
            <h2 className="mt-2 font-display text-2xl text-cream">{s.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-cream/60">{s.text}</p>
          </li>
        ))}
      </ol>

      <div className="mx-auto max-w-md px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/[0.08]">
          <Image
            src="/brand/05-studio.png"
            alt={isEn ? "Studio" : "Stüdyo"}
            fill
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover"
          />
        </div>
      </div>
    </>
  );
}
