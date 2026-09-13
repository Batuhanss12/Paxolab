import type { Locale } from "@/content/types";
import { getContent } from "@/content";
import { PageHero } from "@/components/PageHero";
import { StudioLink } from "@/components/StudioLink";

export function PricingView({ locale }: { locale: Locale }) {
  const { pricing, ui } = getContent(locale);
  return (
    <>
      <PageHero title={pricing.title} lead={pricing.lead}>
        <StudioLink href="billing">{pricing.studioCta}</StudioLink>
      </PageHero>
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {pricing.packs.map((p) => (
            <div
              key={p.id}
              className={`rounded-sm border p-6 ${
                p.featured ? "border-copper/50 bg-ink-900/80" : "border-cream/10 bg-ink-900/40"
              }`}
            >
              <h2 className="font-display text-2xl text-cream">{p.label}</h2>
              <p className="mt-1 text-sm text-cream/45">{p.hint}</p>
              <p className="mt-6 font-display text-4xl text-copper">
                {p.priceTry}
                <span className="ml-1 text-base text-cream/50">{ui.tryMonth}</span>
              </p>
              <p className="mt-1 text-xs text-cream/40">
                {p.credits} {pricing.creditsUnit}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-sm border border-cream/10 bg-ink-975/60 p-6">
          <h2 className="font-display text-xl text-cream">{pricing.usageTitle}</h2>
          <ul className="mt-4 space-y-2">
            {pricing.usage.map((u) => (
              <li
                key={u.action}
                className="flex justify-between gap-4 border-b border-cream/5 py-2 text-sm text-cream/70 last:border-0"
              >
                <span>{u.action}</span>
                <span className="text-copper">{u.cost}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-cream/40">{pricing.note}</p>
          <div className="mt-6">
            <StudioLink href="billing">{pricing.studioCta}</StudioLink>
          </div>
        </div>
      </div>
    </>
  );
}
