"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { getContent } from "@/content";
import { getAlternatePath, localeFromPath } from "@/lib/i18n";
import { AuthModal, type AuthModalMode } from "@/components/AuthModal";

export function Header() {
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthModalMode>("login");
  const pathname = usePathname() || "/";
  const locale = localeFromPath(pathname);
  const { brand, nav } = getContent(locale);
  const trHref = getAlternatePath(pathname, "tr");
  const enHref = getAlternatePath(pathname, "en");

  function openAuth(mode: AuthModalMode) {
    setAuthMode(mode);
    setAuthOpen(true);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 isolate border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link
          href={locale === "en" ? "/en" : "/"}
          className="group flex items-baseline gap-2"
        >
          <span className="text-lg font-semibold tracking-tight text-cream sm:text-xl">
            {brand.name}
          </span>
          {brand.engine !== brand.name && (
            <span className="hidden text-[10px] uppercase tracking-[0.22em] text-cream/35 sm:inline">
              {brand.engine}
            </span>
          )}
        </Link>

        <nav
          className="hidden items-center gap-0.5 lg:flex"
          aria-label={locale === "en" ? "Main menu" : "Ana menü"}
        >
          {nav.primary.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-[13px] text-cream/55 transition hover:bg-white/[0.04] hover:text-cream"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="flex items-center gap-0.5 rounded-full border border-white/[0.08] px-1 py-0.5 text-[11px]"
            role="navigation"
            aria-label="Language"
          >
            <Link
              href={trHref}
              className={`rounded-full px-2 py-0.5 transition ${
                locale === "tr"
                  ? "bg-white/[0.08] text-cream"
                  : "text-cream/40 hover:text-cream"
              }`}
              hrefLang="tr-TR"
              lang="tr"
            >
              TR
            </Link>
            <Link
              href={enHref}
              className={`rounded-full px-2 py-0.5 transition ${
                locale === "en"
                  ? "bg-white/[0.08] text-cream"
                  : "text-cream/40 hover:text-cream"
              }`}
              hrefLang="en"
              lang="en"
            >
              EN
            </Link>
          </div>

          <button
            type="button"
            onClick={() => openAuth("login")}
            className="relative z-10 hidden cursor-pointer px-2 py-1.5 text-[13px] font-medium text-cream/60 transition hover:text-cream sm:inline-flex"
          >
            {nav.logIn}
          </button>
          <button
            type="button"
            onClick={() => openAuth("register")}
            className="relative z-10 hidden cursor-pointer rounded-full bg-cream px-4 py-1.5 text-[13px] font-semibold text-ink-975 transition hover:bg-cream-soft sm:inline-flex"
          >
            {nav.signUp}
          </button>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-white/[0.1] p-2 text-cream lg:hidden"
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
          className="border-t border-white/[0.06] bg-ink-950 px-4 py-4 lg:hidden"
        >
          <nav
            className="flex flex-col gap-1"
            aria-label={locale === "en" ? "Mobile menu" : "Mobil menü"}
          >
            {nav.links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-2.5 text-sm text-cream/75 hover:bg-white/[0.04]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-white/[0.06] pt-3 sm:hidden">
              <button
                type="button"
                className="rounded-full border border-white/[0.12] px-4 py-2.5 text-center text-sm text-cream/80"
                onClick={() => openAuth("login")}
              >
                {nav.logIn}
              </button>
              <button
                type="button"
                className="rounded-full bg-cream px-4 py-2.5 text-center text-sm font-semibold text-ink-975"
                onClick={() => openAuth("register")}
              >
                {nav.signUp}
              </button>
            </div>
          </nav>
        </div>
      )}

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onModeChange={setAuthMode}
        locale={locale}
      />
    </header>
  );
}
