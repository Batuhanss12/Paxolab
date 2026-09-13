import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { FaqView } from "@/components/FaqView";

const { faq } = getContent("en");

export const metadata = pageMetadata({
  title: faq.meta.title,
  description: faq.meta.description,
  path: "/en/faq",
  locale: "en",
});

export default function Page() {
  return <FaqView locale="en" />;
}
