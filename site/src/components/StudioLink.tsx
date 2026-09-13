"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getContent } from "@/content";
import { localeFromPath } from "@/lib/i18n";
import { loadAuth, studioHandoffUrl } from "@/lib/auth";
import { STUDIO_URL, STUDIO_BILLING_URL } from "@/lib/site";

type Props = {
  href?: "studio" | "billing";
  children?: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
};

const variants: Record<NonNullable<Props["variant"]>, string> = {
  primary:
    "inline-flex items-center justify-center rounded-full bg-cream px-6 py-2.5 text-sm font-semibold text-ink-975 shadow-[0_0_0_1px_rgba(245,240,230,0.12)] transition hover:bg-cream-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream",
  secondary:
    "inline-flex items-center justify-center rounded-full border border-cream/20 bg-ink-900/80 px-6 py-2.5 text-sm font-medium text-cream/90 transition hover:border-cream/40 hover:bg-ink-850 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream",
  ghost:
    "inline-flex items-center justify-center text-sm font-medium text-cream/70 transition hover:text-cream",
};

export function StudioLink({
  href = "studio",
  children,
  className = "",
  variant = "primary",
}: Props) {
  const pathname = usePathname() || "/";
  const locale = localeFromPath(pathname);
  const label = getContent(locale).ui.openStudio;
  const fallback = href === "billing" ? STUDIO_BILLING_URL : STUDIO_URL;
  const [url, setUrl] = useState(fallback);

  useEffect(() => {
    const auth = loadAuth();
    if (auth?.token) {
      const base = studioHandoffUrl();
      setUrl(href === "billing" ? `${base}#billing` : base);
    } else {
      setUrl(fallback);
    }
  }, [href, fallback]);

  return (
    <a
      href={url}
      className={`${variants[variant]} ${className}`}
      rel="noopener noreferrer"
    >
      {children ?? label}
    </a>
  );
}
