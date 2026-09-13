"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { getContent } from "@/content";
import { getAlternatePath, localeFromPath } from "@/lib/i18n";
import { StudioLink } from "@/components/StudioLink";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/";
  const locale = localeFromPath(pathname);
  const { brand, nav } = getContent(locale);
  const trHref = getAlternatePath(pathname, "tr");
  const enHref = getAlternatePath(pathname, "en");

  return (
    <header className="sticky top-0 z-50 border-b border-cream/10 bg-ink-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href={locale === "en" ? "/en" : "/"} className="group flex items-baseline gap-2">
          <span className="font-display text-xl tracking-tight text-cream sm:text-2xl">
            {brand.name}
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.2em] text-cream/40 sm:inline">
            {brand.engine}
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label={locale === "en" ? "Main menu" : "Ana menü"}
        >
          {nav.primary.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-sm px-2.5 py-1.5 text-sm text-cream/70 transition hover:bg-cream/5 hover:text-cream"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1 rounded-sm border border-cream/15 px-1.5 py-0.5 text-xs"
            role="navigation"
            aria-label="Language"
          >
            <Link
              href={trHref}
              className={`rounded-sm px-1.5 py-0.5 transition ${
                locale === "tr" ? "bg-cream/10 text-cream" : "text-cream/45 hover:text-cream"
              }`}
              hrefLang="tr-TR"
              lang="tr"
            >
              TR
            </Link>
            <span className="text-cream/25" aria-hidden>
              |
            </span>
            <Link
              href={enHref}
              className={`rounded-sm px-1.5 py-0.5 transition ${
                locale === "en" ? "bg-cream/10 text-cream" : "text-cream/45 hover:text-cream"
              }`}
              hrefLang="en"
              lang="en"
            >
              EN
            </Link>
          </div>
          <StudioLink className="hidden sm:inline-flex" />
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-sm border border-cream/20 p-2 text-cream lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{nav.menu}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-nav"
          className="border-t border-cream/10 bg-ink-950 px-4 py-4 lg:hidden"
        >
          <nav
            className="flex flex-col gap-1"
            aria-label={locale === "en" ? "Mobile menu" : "Mobil menü"}
          >
            {nav.links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-sm px-3 py-2 text-sm text-cream/80 hover:bg-cream/5"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 sm:hidden">
              <StudioLink className="w-full" />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
