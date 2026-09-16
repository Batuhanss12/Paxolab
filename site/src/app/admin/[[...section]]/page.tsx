import type { Metadata } from "next";
import { AdminApp } from "@/components/panel/AdminApp";

export const metadata: Metadata = {
  title: "Yönetim",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminApp />;
}
