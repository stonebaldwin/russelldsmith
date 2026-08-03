import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "@/components/SearchResults";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
  alternates: { canonical: "/search/" },
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={<div className="mx-auto max-w-4xl px-4 py-12 text-muted sm:px-6">Loading…</div>}
    >
      <SearchResults />
    </Suspense>
  );
}
