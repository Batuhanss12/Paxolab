import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { getContent } from "@/content";
import { SITE_URL } from "@/lib/site";
import { SiteChrome } from "@/components/SiteChrome";
import "./globals.css";

const brand = getContent("tr").brand;

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s | ${brand.name}`,
  },
  description: brand.tagline,
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: brand.name,
    title: brand.name,
    description: brand.tagline,
  },
  twitter: {
    card: "summary_large_image",
    title: brand.name,
    description: brand.tagline,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${outfit.variable} ${fraunces.variable} flex min-h-screen flex-col antialiased`}
      >
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
