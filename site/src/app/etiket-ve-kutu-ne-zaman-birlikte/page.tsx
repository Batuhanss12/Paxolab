import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { ServicePageView } from "@/components/ServicePage";

const data = getContent("tr").services["etiket-ve-kutu-ne-zaman-birlikte"];

export const metadata = pageMetadata({
  title: data.meta.title,
  description: data.meta.description,
  path: "/etiket-ve-kutu-ne-zaman-birlikte",
  locale: "tr",
});

export default function Page() {
  return <ServicePageView data={data} locale="tr" howHref="/nasil-calisir" />;
}
