"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/content/types";

export function ConsoleShell({
  locale,
  title,
  lead,
  kind,
  studioHref,
  children,
}: {
  locale: Locale;
  title: string;
  lead: string;
  kind: "customer" | "admin";
  studioHref: string;
  children: ReactNode;
}) {
  const tr = locale !== "en";
  const panelHref = locale === "en" ? "/en/account" : "/hesap";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-copper">Grapxor</p>
          <h1 className="mt-2 font-display text-3xl text-cream sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-cream/50">{lead}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {kind === "admin" ? (
            <Link
              href={panelHref}
              className="rounded-full border border-cream/15 px-4 py-2 text-sm text-cream/70 hover:text-cream"
            >
              {tr ? "Panele dön" : "Back to panel"}
            </Link>
          ) : null}
          <a
            href={studioHref}
            className="rounded-full bg-cream px-4 py-2 text-sm font-semibold text-ink-975 hover:bg-cream-soft"
            rel="noopener noreferrer"
          >
            {tr ? "Stüdyo" : "Studio"}
          </a>
        </div>
      </div>
      <div className="mt-8 space-y-6">{children}</div>
    </div>
  );
}

export function ConsoleCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-cream/10 bg-ink-900/50 p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg text-cream">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatGrid({ items }: { items: { label: string; value: string | number }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-cream/10 bg-ink-975/60 px-4 py-3">
          <div className="font-display text-2xl text-cream">{item.value}</div>
          <div className="mt-1 text-[11px] uppercase tracking-wider text-cream/40">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
