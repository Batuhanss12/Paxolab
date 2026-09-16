"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { Locale } from "@/content/types";

export type PanelNavItem = {
  href: string;
  label: string;
  exact?: boolean;
};

export function PanelShell({
  locale,
  brand,
  kind,
  title,
  nav,
  currentPath,
  topRight,
  children,
}: {
  locale: Locale;
  brand: string;
  kind: "customer" | "admin";
  title: string;
  nav: PanelNavItem[];
  currentPath: string;
  topRight: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const tr = locale !== "en";
  const home = kind === "admin" ? (locale === "en" ? "/en" : "/") : locale === "en" ? "/en" : "/";

  function active(item: PanelNavItem): boolean {
    if (item.exact) return currentPath === item.href;
    return currentPath === item.href || currentPath.startsWith(`${item.href}/`);
  }

  return (
    <div className="flex min-h-screen bg-ink-950 text-cream">
      <aside
        className={`${
          open ? "fixed inset-y-0 left-0 z-40 flex" : "hidden lg:flex"
        } w-64 flex-col border-r border-white/[0.06] bg-ink-975`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Link href={home} className="font-display text-lg text-cream">
            {brand}
          </Link>
          <button
            type="button"
            className="rounded-full px-2 py-1 text-xs text-cream/45 lg:hidden"
            onClick={() => setOpen(false)}
          >
            {tr ? "Kapat" : "Close"}
          </button>
        </div>
        <p className="px-4 pb-3 text-[10px] uppercase tracking-[0.22em] text-copper">
          {kind === "admin" ? (tr ? "Yönetim" : "Admin") : tr ? "Müşteri paneli" : "Customer panel"}
        </p>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-6">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm ${
                active(item) ? "bg-white/[0.08] text-cream" : "text-cream/55 hover:bg-white/[0.04] hover:text-cream"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink-975/60 lg:hidden"
          aria-label={tr ? "Menüyü kapat" : "Close menu"}
          onClick={() => setOpen(false)}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-full border border-white/[0.1] px-3 py-1.5 text-xs text-cream/70 lg:hidden"
              onClick={() => setOpen(true)}
            >
              {tr ? "Menü" : "Menu"}
            </button>
            <h1 className="font-display text-xl text-cream">{title}</h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">{topRight}</div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

export function PanelCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-cream/10 bg-ink-900/50 p-5">
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

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-sm text-cream/45">{children}</p>;
}

export function ErrorText({ children }: { children: ReactNode }) {
  return children ? <p className="text-sm text-red-300/90">{children}</p> : null;
}

export function NoteText({ children }: { children: ReactNode }) {
  return children ? <p className="text-sm text-copper">{children}</p> : null;
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}
