"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the public site header/footer on CMS routes (/admin) so the admin gets
 * a clean, full-height canvas. Renders its children everywhere else.
 */
export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
