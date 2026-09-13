import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { ContactPageView } from "@/components/ContactPageView";

const { contact } = getContent("tr");

export const metadata = pageMetadata({
  title: contact.meta.title,
  description: contact.meta.description,
  path: "/iletisim",
  locale: "tr",
});

export default function ContactPage() {
  return <ContactPageView locale="tr" />;
}
