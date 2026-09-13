import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { PricingView } from "@/components/PricingView";

const { pricing } = getContent("tr");

export const metadata = pageMetadata({
  title: pricing.meta.title,
  description: pricing.meta.description,
  path: "/fiyatlandirma",
  locale: "tr",
});

export default function PricingPage() {
  return <PricingView locale="tr" />;
}
