import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { EN_ROUTES, LOCALE_PAIRS, getLanguageAlternates } from "@/lib/i18n";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();

  for (const pair of LOCALE_PAIRS) {
    for (const path of [pair.tr, pair.en]) {
      if (seen.has(path)) continue;
      seen.add(path);
      const langs = getLanguageAlternates(path);
      const isHome = path === "/" || path === "/en";
      const isHub =
        path.includes("ambalaj") ||
        path.includes("kutu") ||
        path.includes("packaging") ||
        path.includes("box-design");
      entries.push({
        url: absoluteUrl(path),
        lastModified: now,
        changeFrequency: isHome ? "weekly" : "monthly",
        priority: isHome ? 1 : isHub ? 0.9 : 0.7,
        alternates: {
          languages: {
            "tr-TR": absoluteUrl(langs["tr-TR"]),
            en: absoluteUrl(langs.en),
            "x-default": absoluteUrl(langs["x-default"]),
          },
        },
      });
    }
  }

  // Ensure all EN routes are present (defensive)
  for (const path of EN_ROUTES) {
    if (seen.has(path)) continue;
    seen.add(path);
    const langs = getLanguageAlternates(path);
    entries.push({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: {
        languages: {
          "tr-TR": absoluteUrl(langs["tr-TR"]),
          en: absoluteUrl(langs.en),
          "x-default": absoluteUrl(langs["x-default"]),
        },
      },
    });
  }

  return entries;
}
