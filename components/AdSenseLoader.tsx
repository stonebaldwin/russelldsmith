"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

const EXCLUDED_PATHS = ["/admin", "/search", "/privacy", "/contact", "/connect", "/blog/tag/"];

/** Loads Auto ads only on public editorial pages after approval and consent setup. */
export function AdSenseLoader({ client }: { client: string }) {
  const path = usePathname() || "/";
  if (EXCLUDED_PATHS.some((prefix) => path.startsWith(prefix))) return null;

  return (
    <Script
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}
