import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { ContactPageView } from "@/components/ContactPageView";

const { contact } = getContent("en");

export const metadata = pageMetadata({
  title: contact.meta.title,
  description: contact.meta.description,
  path: "/en/contact",
  locale: "en",
});

export default function Page() {
  return <ContactPageView locale="en" />;
}
