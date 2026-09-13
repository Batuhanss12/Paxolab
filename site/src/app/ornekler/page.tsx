import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { ExamplesView } from "@/components/ExamplesView";

const { examples } = getContent("tr");

export const metadata = pageMetadata({
  title: examples.meta.title,
  description: examples.meta.description,
  path: "/ornekler",
  locale: "tr",
});

export default function ExamplesPage() {
  return <ExamplesView locale="tr" />;
}
