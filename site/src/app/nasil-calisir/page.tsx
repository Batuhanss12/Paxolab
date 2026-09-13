import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { HowItWorksView } from "@/components/HowItWorksView";

const { howItWorks } = getContent("tr");

export const metadata = pageMetadata({
  title: howItWorks.meta.title,
  description: howItWorks.meta.description,
  path: "/nasil-calisir",
  locale: "tr",
});

export default function HowPage() {
  return <HowItWorksView locale="tr" />;
}
