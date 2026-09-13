import type { Metadata } from "next";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import { getLanguageAlternates, localeFromPath } from "@/lib/i18n";
import type { Locale } from "@/content/types";
import { getContent } from "@/content";

const defaultOgImage = "/og-default.svg";

export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  locale?: Locale;
}): Metadata {
  const locale = opts.locale ?? localeFromPath(opts.path);
  const url = absoluteUrl(opts.path);
  const langs = getLanguageAlternates(opts.path);
  const brand = getContent(locale).brand;

  return {
    title: opts.title,
    description: opts.description,
    alternates: {
      canonical: url,
      languages: {
        "tr-TR": absoluteUrl(langs["tr-TR"]),
        en: absoluteUrl(langs.en),
        "x-default": absoluteUrl(langs["x-default"]),
      },
    },
    openGraph: {
      title: `${opts.title} | ${brand.name}`,
      description: opts.description,
      url,
      siteName: brand.name,
      locale: locale === "en" ? "en_US" : "tr_TR",
      type: "website",
      images: [{ url: absoluteUrl(defaultOgImage), width: 1200, height: 630, alt: brand.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${opts.title} | ${brand.name}`,
      description: opts.description,
      images: [absoluteUrl(defaultOgImage)],
    },
  };
}

export function organizationJsonLd(locale: Locale = "tr") {
  const brand = getContent(locale).brand;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: SITE_URL,
    description: brand.tagline,
    email: brand.email,
  };
}

export function websiteJsonLd(locale: Locale = "tr") {
  const brand = getContent(locale).brand;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    url: locale === "en" ? absoluteUrl("/en") : SITE_URL,
    inLanguage: locale === "en" ? "en" : "tr-TR",
    description: brand.tagline,
  };
}

export function serviceJsonLd(opts: {
  name: string;
  description: string;
  path: string;
  locale?: Locale;
}) {
  const locale = opts.locale ?? localeFromPath(opts.path);
  const brand = getContent(locale).brand;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    provider: {
      "@type": "Organization",
      name: brand.name,
      url: SITE_URL,
    },
    areaServed: locale === "en" ? ["TR", "Worldwide"] : "TR",
    inLanguage: locale === "en" ? "en" : "tr-TR",
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}
