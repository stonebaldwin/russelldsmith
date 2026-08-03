import { TESTIMONIALS, RATING } from "@/lib/reviews";
import { RatingBadge, Stars } from "./RatingBadge";
import { cn } from "@/lib/cn";

/** "What our clients think" — testimonial cards + the aggregate rating. */
export function Testimonials({
  title = "What our clients think",
  limit,
  className,
}: {
  title?: string;
  limit?: number;
  className?: string;
}) {
  const items = limit ? TESTIMONIALS.slice(0, limit) : TESTIMONIALS;
  return (
    <section className={className} aria-labelledby="testimonials-heading">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-accent/15 pb-2.5">
        <h2 id="testimonials-heading" className="font-serif text-2xl font-medium text-accent">
          {title}
        </h2>
        <RatingBadge />
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t, i) => (
          <figure
            key={i}
            className={cn("flex flex-col rounded-xl border border-line bg-surface p-6")}
          >
            <Stars value={5} className="text-sm" />
            <blockquote className="mt-3 flex-1 text-[0.95rem] leading-7 text-ink-soft">
              &ldquo;{t.body}&rdquo;
            </blockquote>
            <figcaption className="mt-4 text-sm font-semibold text-ink">
              {t.author}
              {t.role ? <span className="font-normal text-muted"> · {t.role}</span> : null}
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="mt-6">
        <a
          href={RATING.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-accent-2 hover:underline"
        >
          Read all {RATING.count.toLocaleString()} reviews on {RATING.source} →
        </a>
      </p>
    </section>
  );
}
