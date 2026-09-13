"use client";

import { usePathname } from "next/navigation";
import { getContent } from "@/content";
import { localeFromPath } from "@/lib/i18n";
import { STUDIO_URL, STUDIO_BILLING_URL } from "@/lib/site";

type Props = {
  href?: "studio" | "billing";
  children?: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
};

const variants: Record<NonNullable<Props["variant"]>, string> = {
  primary:
    "inline-flex items-center justify-center rounded-sm bg-copper px-5 py-2.5 text-sm font-medium text-ink-950 shadow-sm transition hover:bg-copper-bright focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper",
  secondary:
    "inline-flex items-center justify-center rounded-sm border border-cream/25 bg-transparent px-5 py-2.5 text-sm font-medium text-cream transition hover:border-cream/50 hover:bg-cream/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream",
  ghost:
    "inline-flex items-center justify-center text-sm font-medium text-copper underline-offset-4 hover:underline",
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
  const url = href === "billing" ? STUDIO_BILLING_URL : STUDIO_URL;
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
