import type { Metadata } from "next";
import { AdminApp } from "@/components/panel/AdminApp";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function EnAdminPage() {
  return <AdminApp />;
}
