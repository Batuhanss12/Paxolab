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
    <footer className="mt-auto border-t border-white/[0.06] bg-ink-975">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-xl font-semibold tracking-tight text-cream">{brand.name}</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/45">
            {footer.blurb}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-cream/35">
            {footer.product}
          </p>
          <ul className="mt-5 space-y-2.5">
            {nav.links.slice(0, 8).map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-cream/55 transition hover:text-copper-bright"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-cream/35">
            {footer.legal}
          </p>
          <ul className="mt-5 space-y-2.5">
            {footer.legalLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-cream/55 transition hover:text-copper-bright"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={contactHref}
                className="text-sm text-cream/55 transition hover:text-copper-bright"
              >
                {footer.contactLabel}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/[0.06]">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-cream/30 sm:px-6">
          {footer.copyright(year)}
        </p>
      </div>
    </footer>
  );
}
