import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { ServicePageView } from "@/components/ServicePage";

const data = getContent("en").services["reading-a-tuck-end-dieline"];

export const metadata = pageMetadata({
  title: data.meta.title,
  description: data.meta.description,
  path: "/en/reading-a-tuck-end-dieline",
  locale: "en",
});

export default function Page() {
  return <ServicePageView data={data} locale="en" howHref="/en/how-it-works" />;
}
