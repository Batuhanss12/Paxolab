import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { ServicePageView } from "@/components/ServicePage";

const data = getContent("en").services["ai-packaging-myths"];

export const metadata = pageMetadata({
  title: data.meta.title,
  description: data.meta.description,
  path: "/en/ai-packaging-myths",
  locale: "en",
});

export default function Page() {
  return <ServicePageView data={data} locale="en" howHref="/en/how-it-works" />;
}
