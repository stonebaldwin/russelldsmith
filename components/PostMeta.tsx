import { cn } from "@/lib/cn";
import { formatDate, isoDate } from "@/lib/format";

export function PostMeta({
  date,
  readingTimeMinutes,
  className,
}: {
  date: string;
  readingTimeMinutes?: number;
  className?: string;
}) {
  return (
    <p className={cn("text-sm text-muted", className)}>
      <time dateTime={isoDate(date)}>{formatDate(date)}</time>
      {readingTimeMinutes ? <span> · {readingTimeMinutes} min read</span> : null}
    </p>
  );
}
