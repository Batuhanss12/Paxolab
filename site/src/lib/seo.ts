import type { Metadata } from "next";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import { getLanguageAlternates, localeFromPath } from "@/lib/i18n";
import type { Locale } from "@/content/types";
import { getContent } from "@/content";

const defaultOgImage = "/og-default.svg";

/** Slugs with a dedicated static OG SVG under public/og/. */
const OG_SLUGS = new Set([
  "home",
  "gida-ambalaj-tasarimi",
  "serum-krem-kutusu-tasarimi",
  "ai-ambalaj-tasarimi",
  "baskiya-hazir-dieline",
  "etiket-mi-kutu-mu",
  "food-packaging-design",
  "serum-cream-box-design",
  "what-is-ai-packaging-design",
  "print-ready-dieline",
  "label-vs-box",
  "private-label-gida-kutusu-brief",
  "gida-etiket-zorunlu-bilgi-alanlari",
  "atistirmalik-kutu-vs-poset",
  "serum-kutusu-olcu-brief",
  "krem-kavanoz-etiketi",
  "skincare-set-kutusu",
  "ai-vs-grafik-ajans-ambalaj",
  "forma-vektor-motoru-nasil-calisir",
  "ai-ambalaj-mitleri",
  "svg-dieline-matbaaya-nasil-verilir",
  "tuck-end-dieline-okuma",
  "ambalaj-preflight-checklist",
  "etiket-ve-kutu-ne-zaman-birlikte",
  "e-ticaret-kutusu-tasarimi",
  "sise-wrap-etiket",
  "private-label-food-box-brief",
  "food-label-mandatory-info-fields",
  "snack-box-vs-pouch",
  "serum-box-size-brief",
  "cream-jar-label",
  "skincare-set-box",
  "ai-vs-design-agency-packaging",
  "how-forma-vector-engine-works",
  "ai-packaging-myths",
  "how-to-send-svg-dieline-to-printer",
  "reading-a-tuck-end-dieline",
  "packaging-preflight-checklist",
  "when-to-use-label-and-box-together",
  "ecommerce-box-design",
  "bottle-wrap-label",
])

function slugFromPath(path: string): string {
  if (path === "/" || path === "/en") return "home";
  return path.replace(/^\/en\//, "").replace(/^\//, "");
}

export function resolveOgImage(path: string, ogImage?: string): string {
  if (ogImage) return ogImage.startsWith("/") ? ogImage : `/${ogImage}`;
  const slug = slugFromPath(path);
  if (OG_SLUGS.has(slug)) return `/og/${slug}.svg`;
  return defaultOgImage;
}

export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  locale?: Locale;
  /** Path under public/, e.g. /og/gida-ambalaj-tasarimi.svg. Defaults to slug SVG or /og-default.svg. */
  ogImage?: string;
}): Metadata {
  const locale = opts.locale ?? localeFromPath(opts.path);
  const url = absoluteUrl(opts.path);
  const langs = getLanguageAlternates(opts.path);
  const brand = getContent(locale).brand;
  const ogPath = resolveOgImage(opts.path, opts.ogImage);

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
      images: [{ url: absoluteUrl(ogPath), width: 1200, height: 630, alt: opts.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${opts.title} | ${brand.name}`,
      description: opts.description,
      images: [absoluteUrl(ogPath)],
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

/** Parent hub slug for spoke pages (locale-agnostic content slug → hub slug). */
export const SPOKE_PARENT: Record<string, { tr: string; en: string; trName: string; enName: string }> = {
  "private-label-gida-kutusu-brief": { tr: "gida-ambalaj-tasarimi", en: "food-packaging-design", trName: "Gıda ambalaj tasarımı", enName: "Food packaging design" },
  "gida-etiket-zorunlu-bilgi-alanlari": { tr: "gida-ambalaj-tasarimi", en: "food-packaging-design", trName: "Gıda ambalaj tasarımı", enName: "Food packaging design" },
  "atistirmalik-kutu-vs-poset": { tr: "gida-ambalaj-tasarimi", en: "food-packaging-design", trName: "Gıda ambalaj tasarımı", enName: "Food packaging design" },
  "serum-kutusu-olcu-brief": { tr: "serum-krem-kutusu-tasarimi", en: "serum-cream-box-design", trName: "Serum ve krem kutusu", enName: "Serum & cream box" },
  "krem-kavanoz-etiketi": { tr: "serum-krem-kutusu-tasarimi", en: "serum-cream-box-design", trName: "Serum ve krem kutusu", enName: "Serum & cream box" },
  "skincare-set-kutusu": { tr: "serum-krem-kutusu-tasarimi", en: "serum-cream-box-design", trName: "Serum ve krem kutusu", enName: "Serum & cream box" },
  "ai-vs-grafik-ajans-ambalaj": { tr: "ai-ambalaj-tasarimi", en: "what-is-ai-packaging-design", trName: "AI ambalaj tasarımı", enName: "AI packaging design" },
  "forma-vektor-motoru-nasil-calisir": { tr: "ai-ambalaj-tasarimi", en: "what-is-ai-packaging-design", trName: "AI ambalaj tasarımı", enName: "AI packaging design" },
  "ai-ambalaj-mitleri": { tr: "ai-ambalaj-tasarimi", en: "what-is-ai-packaging-design", trName: "AI ambalaj tasarımı", enName: "AI packaging design" },
  "svg-dieline-matbaaya-nasil-verilir": { tr: "baskiya-hazir-dieline", en: "print-ready-dieline", trName: "Baskıya hazır dieline", enName: "Print-ready dieline" },
  "tuck-end-dieline-okuma": { tr: "baskiya-hazir-dieline", en: "print-ready-dieline", trName: "Baskıya hazır dieline", enName: "Print-ready dieline" },
  "ambalaj-preflight-checklist": { tr: "baskiya-hazir-dieline", en: "print-ready-dieline", trName: "Baskıya hazır dieline", enName: "Print-ready dieline" },
  "etiket-ve-kutu-ne-zaman-birlikte": { tr: "etiket-mi-kutu-mu", en: "label-vs-box", trName: "Etiket mi kutu mu?", enName: "Label or box?" },
  "e-ticaret-kutusu-tasarimi": { tr: "etiket-mi-kutu-mu", en: "label-vs-box", trName: "Etiket mi kutu mu?", enName: "Label or box?" },
  "sise-wrap-etiket": { tr: "etiket-mi-kutu-mu", en: "label-vs-box", trName: "Etiket mi kutu mu?", enName: "Label or box?" },
  // EN slug keys too
  "private-label-food-box-brief": { tr: "gida-ambalaj-tasarimi", en: "food-packaging-design", trName: "Gıda ambalaj tasarımı", enName: "Food packaging design" },
  "food-label-mandatory-info-fields": { tr: "gida-ambalaj-tasarimi", en: "food-packaging-design", trName: "Gıda ambalaj tasarımı", enName: "Food packaging design" },
  "snack-box-vs-pouch": { tr: "gida-ambalaj-tasarimi", en: "food-packaging-design", trName: "Gıda ambalaj tasarımı", enName: "Food packaging design" },
  "serum-box-size-brief": { tr: "serum-krem-kutusu-tasarimi", en: "serum-cream-box-design", trName: "Serum ve krem kutusu", enName: "Serum & cream box" },
  "cream-jar-label": { tr: "serum-krem-kutusu-tasarimi", en: "serum-cream-box-design", trName: "Serum ve krem kutusu", enName: "Serum & cream box" },
  "skincare-set-box": { tr: "serum-krem-kutusu-tasarimi", en: "serum-cream-box-design", trName: "Serum ve krem kutusu", enName: "Serum & cream box" },
  "ai-vs-design-agency-packaging": { tr: "ai-ambalaj-tasarimi", en: "what-is-ai-packaging-design", trName: "AI ambalaj tasarımı", enName: "AI packaging design" },
  "how-forma-vector-engine-works": { tr: "ai-ambalaj-tasarimi", en: "what-is-ai-packaging-design", trName: "AI ambalaj tasarımı", enName: "AI packaging design" },
  "ai-packaging-myths": { tr: "ai-ambalaj-tasarimi", en: "what-is-ai-packaging-design", trName: "AI ambalaj tasarımı", enName: "AI packaging design" },
  "how-to-send-svg-dieline-to-printer": { tr: "baskiya-hazir-dieline", en: "print-ready-dieline", trName: "Baskıya hazır dieline", enName: "Print-ready dieline" },
  "reading-a-tuck-end-dieline": { tr: "baskiya-hazir-dieline", en: "print-ready-dieline", trName: "Baskıya hazır dieline", enName: "Print-ready dieline" },
  "packaging-preflight-checklist": { tr: "baskiya-hazir-dieline", en: "print-ready-dieline", trName: "Baskıya hazır dieline", enName: "Print-ready dieline" },
  "when-to-use-label-and-box-together": { tr: "etiket-mi-kutu-mu", en: "label-vs-box", trName: "Etiket mi kutu mu?", enName: "Label or box?" },
  "ecommerce-box-design": { tr: "etiket-mi-kutu-mu", en: "label-vs-box", trName: "Etiket mi kutu mu?", enName: "Label or box?" },
  "bottle-wrap-label": { tr: "etiket-mi-kutu-mu", en: "label-vs-box", trName: "Etiket mi kutu mu?", enName: "Label or box?" },
};

export function breadcrumbJsonLd(opts: {
  locale?: Locale;
  items: { name: string; path: string }[];
}) {
  const locale = opts.locale ?? "tr";
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: opts.items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function serviceBreadcrumbItems(opts: {
  locale: Locale;
  slug: string;
  pageName: string;
}): { name: string; path: string }[] {
  const home = opts.locale === "en"
    ? { name: "Home", path: "/en" }
    : { name: "Ana sayfa", path: "/" };
  const parent = SPOKE_PARENT[opts.slug];
  const pagePath = opts.locale === "en" ? `/en/${opts.slug}` : `/${opts.slug}`;
  if (!parent) {
    return [home, { name: opts.pageName, path: pagePath }];
  }
  const hubSlug = opts.locale === "en" ? parent.en : parent.tr;
  const hubName = opts.locale === "en" ? parent.enName : parent.trName;
  const hubPath = opts.locale === "en" ? `/en/${hubSlug}` : `/${hubSlug}`;
  return [home, { name: hubName, path: hubPath }, { name: opts.pageName, path: pagePath }];
}

export function howToJsonLd(opts: {
  name: string;
  description: string;
  path: string;
  steps: { name: string; text: string }[];
  locale?: Locale;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    inLanguage: (opts.locale ?? "tr") === "en" ? "en" : "tr-TR",
    step: opts.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

