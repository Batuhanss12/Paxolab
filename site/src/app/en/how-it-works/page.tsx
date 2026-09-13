import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { HowItWorksView } from "@/components/HowItWorksView";

const { howItWorks } = getContent("en");

export const metadata = pageMetadata({
  title: howItWorks.meta.title,
  description: howItWorks.meta.description,
  path: "/en/how-it-works",
  locale: "en",
});

export default function Page() {
  return <HowItWorksView locale="en" />;
}
