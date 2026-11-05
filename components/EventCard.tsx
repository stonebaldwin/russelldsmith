import Link from "next/link";
import { dateBadge, formatEventDate, type SiteEvent } from "@/lib/events";

/** Calendar-style date badge used on the homepage band and /events/. */
export function DateBadge({ date, className = "" }: { date: string; className?: string }) {
  const { month, day } = dateBadge(date);
  return (
    <div
      aria-hidden="true"
      className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl border border-accent/20 bg-white text-accent ${className}`}
    >
      <span className="text-xs font-semibold tracking-wider">{month}</span>
      <span className="font-serif text-3xl leading-none font-semibold">{day}</span>
    </div>
  );
}

/** Compact event teaser for the homepage. Links to the event on /events/. */
export function EventTeaser({ event }: { event: SiteEvent }) {
  return (
    <article className="flex gap-5 rounded-xl border border-line bg-surface p-5 sm:p-6">
      <DateBadge date={event.date} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted">
          {formatEventDate(event.date)} &middot; {event.city}
          {event.time ? ` · ${event.time}` : ""}
        </p>
        <h3 className="mt-1 font-serif text-xl font-semibold text-ink">{event.title}</h3>
        <p className="mt-2 leading-7 text-ink-soft">{event.summary}</p>
        <Link
          href={`/events/#${event.slug}`}
          className="mt-4 inline-flex rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-2-hover"
        >
          Details &amp; registration
        </Link>
      </div>
    </article>
  );
}
