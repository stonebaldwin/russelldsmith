import type { ReactNode } from "react";
import { requireSession } from "@/lib/admin/session";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  await requireSession();
  return <AdminShell>{children}</AdminShell>;
}
