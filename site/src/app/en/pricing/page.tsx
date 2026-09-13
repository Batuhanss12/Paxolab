import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { PricingView } from "@/components/PricingView";

const { pricing } = getContent("en");

export const metadata = pageMetadata({
  title: pricing.meta.title,
  description: pricing.meta.description,
  path: "/en/pricing",
  locale: "en",
});

export default function Page() {
  return <PricingView locale="en" />;
}
