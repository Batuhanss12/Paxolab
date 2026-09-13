"use client";

import { usePathname } from "next/navigation";
import type { Locale } from "@/content/types";
import { localeFromPath } from "@/lib/i18n";

export function useLocale(): Locale {
  const pathname = usePathname() || "/";
  return localeFromPath(pathname);
}
