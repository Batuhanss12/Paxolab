import type { Metadata } from "next";
import { CustomerApp } from "@/components/panel/CustomerApp";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false, follow: false },
};

export default function HesapPage() {
  return <CustomerApp />;
}
