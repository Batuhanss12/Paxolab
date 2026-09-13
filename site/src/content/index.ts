import type { Locale, SiteContent } from "@/content/types";
import tr from "@/content/tr";
import en from "@/content/en";

export type { Locale, SiteContent, ServicePage, FaqItem } from "@/content/types";

const byLocale: Record<Locale, SiteContent> = { tr, en };

export function getContent(locale: Locale): SiteContent {
  return byLocale[locale] ?? tr;
}

export { tr, en };
