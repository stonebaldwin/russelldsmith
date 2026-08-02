import { AUTHOR, SITE } from "@/lib/site";
import { formatDate, isoDate } from "@/lib/format";

function Monogram() {
  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent font-serif text-sm font-semibold tracking-tight text-white"
    >
      {SITE.shortName}
    </span>
  );
}

export function AuthorByline({
  date,
  readingTimeMinutes,
  updated,
}: {
  date: string;
  readingTimeMinutes?: number;
  updated?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {AUTHOR.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={AUTHOR.photo} alt={AUTHOR.name} className="h-11 w-11 rounded-full object-cover" />
      ) : (
        <Monogram />
      )}
      <div className="text-sm">
        <p className="font-semibold text-ink">
          {AUTHOR.name} <span className="font-normal text-muted">· {AUTHOR.role}</span>
        </p>
        <p className="text-muted">
          <time dateTime={isoDate(date)}>{formatDate(date)}</time>
          {readingTimeMinutes ? <span> · {readingTimeMinutes} min read</span> : null}
          {updated && updated !== date ? (
            <span> · Updated {formatDate(updated)}</span>
          ) : null}
        </p>
      </div>
    </div>
  );
}
