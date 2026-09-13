import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { ServicePageView } from "@/components/ServicePage";

const data = getContent("tr").services["ambalaj-preflight-checklist"];

export const metadata = pageMetadata({
  title: data.meta.title,
  description: data.meta.description,
  path: "/ambalaj-preflight-checklist",
  locale: "tr",
});

export default function Page() {
  return <ServicePageView data={data} locale="tr" howHref="/nasil-calisir" />;
}
