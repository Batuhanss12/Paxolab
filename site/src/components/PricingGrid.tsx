"use client";

import type { Locale } from "@/content/types";
import { getContent } from "@/content";
import { StudioLink } from "@/components/StudioLink";
import type { DisplayPlan, PlanCardCopy } from "@/lib/pricingCatalog";

function formatInt(n: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "tr-TR", {
    maximumFractionDigits: 0,
  }).format(n);
}

function formatUnit(n: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function cardClass(highlight: PlanCardCopy["highlight"]): string {
  if (highlight === "popular") {
    return "border-copper/70 bg-gradient-to-b from-copper/20 via-ink-900 to-ink-900 shadow-[0_0_0_1px_rgba(196,149,94,0.35),0_24px_60px_-28px_rgba(196,149,94,0.55)]";
  }
  if (highlight === "value") {
    return "border-cream/25 bg-gradient-to-b from-cream/[0.07] via-ink-900 to-ink-900";
  }
  if (highlight === "enterprise") {
    return "border-copper/35 bg-gradient-to-b from-ink-850 via-ink-900 to-ink-975";
  }
  return "border-cream/12 bg-ink-900/80";
}

function ctaClass(highlight: PlanCardCopy["highlight"]): string {
  if (highlight === "popular" || highlight === "enterprise") {
    return "bg-copper text-ink-975 hover:bg-copper-bright";
  }
  if (highlight === "value") {
    return "bg-cream text-ink-975 hover:bg-cream-soft";
  }
  return "border border-cream/20 bg-transparent text-cream hover:border-cream/40 hover:bg-white/[0.04]";
}

export function PricingGrid({
  locale,
  plans,
}: {
  locale: Locale;
  plans: DisplayPlan[];
}) {
  const { pricing } = getContent(locale);

  return (
    <section className="relative overflow-hidden border-b border-white/[0.06] px-4 py-16 sm:px-6 sm:py-20">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(196,149,94,0.10), transparent 58%)",
        }}
      />
      <div className="relative mx-auto max-w-[88rem] text-center">
        <h1 className="font-display text-[clamp(2.1rem,4vw,3.4rem)] font-semibold tracking-[-0.03em] text-cream">
          {pricing.chooseTitle}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-cream/55 sm:text-lg">{pricing.lead}</p>

        <div
          className="mx-auto mt-8 inline-flex rounded-full border border-white/[0.1] bg-ink-975/70 p-1 text-sm"
          role="group"
          aria-label={pricing.periodMonthly}
        >
          <span className="rounded-full bg-cream px-4 py-1.5 font-semibold text-ink-975">
            {pricing.periodMonthly}
          </span>
          <span
            className="rounded-full px-4 py-1.5 text-cream/35"
            title={pricing.periodYearlySoon}
          >
            {pricing.periodYearly}
            <span className="ml-1.5 text-[10px] uppercase tracking-wider">{pricing.periodYearlySoon}</span>
          </span>
        </div>

        <div className="mt-12 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`relative flex flex-col rounded-3xl border p-6 text-left ${cardClass(plan.copy.highlight)} ${
                plan.copy.highlight === "popular" ? "xl:-mt-3 xl:mb-[-12px] xl:py-7" : ""
              }`}
            >
              {plan.copy.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-copper px-3 py-0.5 text-[11px] font-semibold text-ink-975">
                  {plan.copy.badge}
                </span>
              )}
              <h2 className="font-display text-2xl text-cream">{plan.label}</h2>
              <p className="mt-5 font-display text-[2.15rem] leading-none tracking-tight text-cream">
                {formatInt(plan.priceTry, locale)}
                <span className="ml-1 text-base font-sans font-medium text-cream/45">TL</span>
              </p>
              <p className="mt-1 text-sm text-cream/40">{pricing.perMonth}</p>
              <p className="mt-2 text-sm text-copper">
                {plan.unlimited ? (
                  pricing.unlimitedLabel
                ) : (
                  <>
                    {formatUnit(plan.unitPriceTry ?? 0, locale)} {pricing.perCredit}
                  </>
                )}
              </p>
              {plan.unlimited && plan.unitPriceTry != null && (
                <p className="mt-1 text-xs text-cream/40">
                  {formatUnit(plan.unitPriceTry, locale)} {pricing.perCredit}
                </p>
              )}
              {!plan.unlimited && (
                <p className="mt-1 text-xs text-cream/40">
                  {formatInt(plan.monthlyCredits, locale)} {pricing.creditsUnit}
                </p>
              )}

              <div className="mt-6">
                <StudioLink
                  href="billing"
                  variant="none"
                  className={`w-full rounded-full px-4 py-2.5 text-sm font-semibold ${ctaClass(plan.copy.highlight)}`}
                >
                  {plan.copy.cta}
                </StudioLink>
              </div>

              <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/35">
                {pricing.includedTitle}
              </p>
              <ul className="mt-3 space-y-2.5">
                {plan.copy.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm leading-snug text-cream/70">
                    <span className="mt-0.5 text-copper" aria-hidden>
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
