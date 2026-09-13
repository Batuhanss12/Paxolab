import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { LegalPageView } from "@/components/LegalPage";

const data = getContent("tr").legal.terms;

export const metadata = pageMetadata({
  title: data.meta.title,
  description: data.meta.description,
  path: "/kullanim-kosullari",
  locale: "tr",
});

export default function Page() {
  return (
    <LegalPageView title={data.title} updated={data.updated} sections={data.sections} />
  );
}
