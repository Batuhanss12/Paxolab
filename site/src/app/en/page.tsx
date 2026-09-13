import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { HomePageView } from "@/components/HomePageView";

const { home } = getContent("en");

export const metadata = pageMetadata({
  title: home.meta.title,
  description: home.meta.description,
  path: "/en",
  locale: "en",
});

export default function EnHomePage() {
  return <HomePageView locale="en" />;
}
