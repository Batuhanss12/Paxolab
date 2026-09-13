import type { Metadata } from "next";
import { HtmlLang } from "@/components/HtmlLang";
import { getContent } from "@/content";

const { brand } = getContent("en");

export const metadata: Metadata = {
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s | ${brand.name}`,
  },
  description: brand.tagline,
  openGraph: {
    locale: "en_US",
    siteName: brand.name,
  },
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HtmlLang lang="en" />
      {children}
    </>
  );
}
