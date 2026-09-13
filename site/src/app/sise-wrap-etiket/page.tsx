import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { ServicePageView } from "@/components/ServicePage";

const data = getContent("tr").services["sise-wrap-etiket"];

export const metadata = pageMetadata({
  title: data.meta.title,
  description: data.meta.description,
  path: "/sise-wrap-etiket",
  locale: "tr",
});

export default function Page() {
  return <ServicePageView data={data} locale="tr" howHref="/nasil-calisir" />;
}
