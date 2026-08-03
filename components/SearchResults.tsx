"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { searchDocs, type SearchDoc } from "@/lib/search";

export function SearchResults() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [docs, setDocs] = useState<SearchDoc[]>([]);
  const [input, setInput] = useState(q);
  const router = useRouter();

  useEffect(() => {
    fetch("/search-index.json")
      .then((r) => (r.ok ? r.json() : []))
      .then(setDocs)
      .catch(() => {});
  }, []);
  useEffect(() => setInput(q), [q]);

  const results = searchDocs(docs, q, 60);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-3xl font-medium text-accent sm:text-4xl">Search guides</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/search?q=${encodeURIComponent(input.trim())}`);
        }}
        className="mt-5 flex gap-2"
        role="search"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search VA, USDA, FHA, credit…"
          aria-label="Search guides"
          className="w-full rounded-md border border-line-strong bg-surface px-4 py-2.5 text-ink outline-none focus:border-accent-2"
        />
        <button
          type="submit"
          className="shrink-0 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-2-hover"
        >
          Search
        </button>
      </form>

      {q ? (
        <p className="mt-6 text-sm text-muted">
          {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
        </p>
      ) : (
        <p className="mt-6 text-muted">Type a search above to find a guide.</p>
      )}

      <ul className="mt-2 divide-y divide-line">
        {results.map((r) => (
          <li key={r.u} className="py-4">
            <Link href={r.u} className="group block">
              <h2 className="font-serif text-lg font-medium text-ink group-hover:text-accent">
                {r.t}
              </h2>
              {r.d ? <p className="mt-1 line-clamp-2 text-sm text-muted">{r.d}</p> : null}
              {r.c[0] ? (
                <p className="mt-1 text-xs font-medium tracking-wide text-accent uppercase">
                  {r.c[0]}
                </p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
