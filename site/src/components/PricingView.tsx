import type { Locale } from "@/content/types";
import { getContent } from "@/content";
import { StudioLink } from "@/components/StudioLink";
import { loadPricingCatalog, mergePlans, usageFromCatalog } from "@/lib/pricingCatalog";
import { PricingGrid } from "@/components/PricingGrid";

export async function PricingView({ locale }: { locale: Locale }) {
  const { pricing } = getContent(locale);
  const catalog = await loadPricingCatalog();
  const plans = mergePlans(catalog?.plans, pricing.planCards);
  const usage = usageFromCatalog(catalog, pricing.usage, pricing.creditsUnit);

  return (
    <>
      <PricingGrid locale={locale} plans={plans} />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="rounded-2xl border border-cream/10 bg-ink-975/60 p-6">
          <h2 className="font-display text-xl text-cream">{pricing.usageTitle}</h2>
          <ul className="mt-4 space-y-2">
            {usage.map((u) => (
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
