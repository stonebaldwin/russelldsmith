import Link from "next/link";
import { cn } from "@/lib/cn";

/** Path-based pagination. Page 1 = rootPath; page n = rootPath + "page/n/". */
function pageHref(rootPath: string, n: number): string {
  return n <= 1 ? rootPath : `${rootPath}page/${n}/`;
}

export function Pagination({
  page,
  totalPages,
  rootPath,
}: {
  page: number;
  totalPages: number;
  rootPath: string;
}) {
  if (totalPages <= 1) return null;
  const nums: number[] = [];
  for (let n = 1; n <= totalPages; n++) {
    if (n === 1 || n === totalPages || Math.abs(n - page) <= 1) nums.push(n);
  }
  const withGaps: (number | "…")[] = [];
  let prev = 0;
  for (const n of nums) {
    if (prev && n - prev > 1) withGaps.push("…");
    withGaps.push(n);
    prev = n;
  }

  const base =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm font-medium";

  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={pageHref(rootPath, page - 1)} className={cn(base, "text-ink-soft hover:bg-line/60")} rel="prev">
          ← Prev
        </Link>
      ) : null}
      {withGaps.map((n, i) =>
        n === "…" ? (
          <span key={`gap-${i}`} className="px-1.5 text-muted">
            …
          </span>
        ) : n === page ? (
          <span key={n} aria-current="page" className={cn(base, "bg-accent text-white")}>
            {n}
          </span>
        ) : (
          <Link key={n} href={pageHref(rootPath, n)} className={cn(base, "text-ink-soft hover:bg-line/60")}>
            {n}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link href={pageHref(rootPath, page + 1)} className={cn(base, "text-ink-soft hover:bg-line/60")} rel="next">
          Next →
        </Link>
      ) : null}
    </nav>
  );
}
