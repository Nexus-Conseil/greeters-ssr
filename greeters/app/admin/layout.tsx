import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/layout/AdminShell";

export const metadata: Metadata = {
  title: "Admin — Paris Greeters",
  robots: "noindex,nofollow",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}