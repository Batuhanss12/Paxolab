import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { LegalPageView } from "@/components/LegalPage";

const data = getContent("en").legal.terms;

export const metadata = pageMetadata({
  title: data.meta.title,
  description: data.meta.description,
  path: "/en/terms",
  locale: "en",
});

export default function Page() {
  return (
    <LegalPageView title={data.title} updated={data.updated} sections={data.sections} />
  );
}
