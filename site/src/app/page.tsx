import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { HomePageView } from "@/components/HomePageView";

const { home } = getContent("tr");

export const metadata = pageMetadata({
  title: home.meta.title,
  description: home.meta.description,
  path: "/",
  locale: "tr",
});

export default function HomePage() {
  return <HomePageView locale="tr" />;
}
