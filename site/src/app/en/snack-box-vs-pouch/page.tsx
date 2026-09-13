import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { ServicePageView } from "@/components/ServicePage";

const data = getContent("en").services["snack-box-vs-pouch"];

export const metadata = pageMetadata({
  title: data.meta.title,
  description: data.meta.description,
  path: "/en/snack-box-vs-pouch",
  locale: "en",
});

export default function Page() {
  return <ServicePageView data={data} locale="en" howHref="/en/how-it-works" />;
}
