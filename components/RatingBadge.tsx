import { cn } from "@/lib/cn";
import { RATING } from "@/lib/reviews";

export function Stars({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span className={cn("relative inline-block leading-none", className)} aria-hidden="true">
      <span className="text-line-strong">★★★★★</span>
      <span className="absolute inset-0 overflow-hidden text-[#f5a623]" style={{ width: `${pct}%` }}>
        ★★★★★
      </span>
    </span>
  );
}

/** Star rating + count, linking to Russell's Experience.com reviews. */
export function RatingBadge({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <a
      href={RATING.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Rated ${RATING.value} out of 5 from ${RATING.count} reviews on ${RATING.source}`}
      className={cn(
        "inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm transition-opacity hover:opacity-90",
        tone === "light" ? "text-white" : "text-ink hover:text-accent",
        className,
      )}
    >
      <Stars value={RATING.value} className="text-base" />
      <span>
        <strong className="font-semibold">{RATING.value}</strong>/5 ·{" "}
        {RATING.count.toLocaleString()} reviews on {RATING.source}
      </span>
    </a>
  );
}
