"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getContent } from "@/content";
import { localeFromPath } from "@/lib/i18n";

export function Footer() {
  const pathname = usePathname() || "/";
  const locale = localeFromPath(pathname);
  const { brand, footer, nav } = getContent(locale);
  const year = new Date().getFullYear();
  const contactHref = locale === "en" ? "/en/contact" : "/iletisim";

  return (
    <footer className="mt-auto border-t border-cream/10 bg-ink-975">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-2xl text-cream">{brand.name}</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-cream/55">
            {footer.blurb}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-cream/40">
            {footer.product}
          </p>
          <ul className="mt-4 space-y-2">
            {nav.links.slice(0, 8).map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-cream/70 transition hover:text-copper"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-cream/40">
            {footer.legal}
          </p>
          <ul className="mt-4 space-y-2">
            {footer.legalLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-cream/70 transition hover:text-copper"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={contactHref}
                className="text-sm text-cream/70 transition hover:text-copper"
              >
                {footer.contactLabel}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-cream/40 sm:px-6">
          {footer.copyright(year)}
        </p>
      </div>
    </footer>
  );
}
