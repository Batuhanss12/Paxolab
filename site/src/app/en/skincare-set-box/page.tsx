import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { ServicePageView } from "@/components/ServicePage";

const data = getContent("en").services["skincare-set-box"];

export const metadata = pageMetadata({
  title: data.meta.title,
  description: data.meta.description,
  path: "/en/skincare-set-box",
  locale: "en",
});

export default function Page() {
  return <ServicePageView data={data} locale="en" howHref="/en/how-it-works" />;
}
