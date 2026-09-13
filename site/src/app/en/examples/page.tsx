import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { ExamplesView } from "@/components/ExamplesView";

const { examples } = getContent("en");

export const metadata = pageMetadata({
  title: examples.meta.title,
  description: examples.meta.description,
  path: "/en/examples",
  locale: "en",
});

export default function Page() {
  return <ExamplesView locale="en" />;
}
