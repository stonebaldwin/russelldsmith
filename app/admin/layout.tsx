import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./admin.css";

// The CMS must never be statically prerendered or indexed.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CMS — Russell Smith",
  robots: { index: false, follow: false },
};

export default function AdminBaseLayout({ children }: { children: ReactNode }) {
  return <div className="admin-root">{children}</div>;
}
