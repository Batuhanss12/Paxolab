import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { FaqView } from "@/components/FaqView";

const { faq } = getContent("tr");

export const metadata = pageMetadata({
  title: faq.meta.title,
  description: faq.meta.description,
  path: "/sss",
  locale: "tr",
});

export default function FaqPage() {
  return <FaqView locale="tr" />;
}
