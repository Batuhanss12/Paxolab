import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Localhost / preview hosts stay noindex until a real production SITE_URL is set. */
function isNonProductionHost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".local") ||
      host.endsWith(".vercel.app")
    );
  } catch {
    return true;
  }
}

export default function robots(): MetadataRoute.Robots {
  const nonProd = isNonProductionHost(SITE_URL);
  return {
    rules: nonProd
      ? { userAgent: "*", disallow: "/" }
      : { userAgent: "*", allow: "/" },
    sitemap: nonProd ? undefined : `${SITE_URL}/sitemap.xml`,
  };
}
