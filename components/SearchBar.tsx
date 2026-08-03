"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { searchDocs, type SearchDoc } from "@/lib/search";
import { cn } from "@/lib/cn";

let indexCache: Promise<SearchDoc[]> | null = null;
function loadIndex(): Promise<SearchDoc[]> {
  if (!indexCache) {
    indexCache = fetch("/search-index.json")
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [] as SearchDoc[]);
  }
  return indexCache;
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [docs, setDocs] = useState<SearchDoc[]>([]);
  const [active, setActive] = useState(0);
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      loadIndex().then(setDocs);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const results = searchDocs(docs, q, 6);

  function close() {
    setOpen(false);
    setQ("");
  }
  function submit() {
    const query = q.trim();
    if (!query) return;
    const dest = results[active]?.u ?? `/search?q=${encodeURIComponent(query)}`;
    close();
    router.push(dest);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Search guides"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-line/60 hover:text-accent"
      >
        <SearchIcon />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,30rem)] overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
          <div className="flex items-center gap-2 border-b border-line px-3">
            <SearchIcon className="shrink-0 text-muted" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, results.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                }
              }}
              placeholder="Search guides…"
              aria-label="Search guides"
              className="w-full bg-transparent py-3 text-sm text-ink outline-none"
            />
          </div>

          {q.trim() ? (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.length ? (
                results.map((r, i) => (
                  <li key={r.u}>
                    <Link
                      href={r.u}
                      onClick={close}
                      onMouseEnter={() => setActive(i)}
                      className={cn(
                        "block px-3 py-2",
                        i === active ? "bg-accent-pale" : "hover:bg-line/40",
                      )}
                    >
                      <span className="line-clamp-1 text-sm font-medium text-ink">{r.t}</span>
                      {r.c[0] ? <span className="text-xs text-muted">{r.c[0]}</span> : null}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="px-3 py-3 text-sm text-muted">No guides match &ldquo;{q}&rdquo;.</li>
              )}
              {results.length ? (
                <li className="border-t border-line">
                  <button
                    type="button"
                    onClick={submit}
                    className="block w-full px-3 py-2 text-left text-sm font-medium text-accent hover:bg-line/40"
                  >
                    See all results for &ldquo;{q}&rdquo; &rarr;
                  </button>
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
