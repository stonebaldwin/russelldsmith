import Link from "next/link";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${SITE.name} — home`}
      className={cn(
        "inline-flex items-center font-serif text-xl leading-none font-semibold tracking-[0.04em] whitespace-nowrap text-accent uppercase",
        className,
      )}
    >
      Russell&nbsp;D&nbsp;Smith
    </Link>
  );
}
