import Link from "next/link";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${SITE.name} — home`}
      className={cn(
        "inline-flex items-baseline font-serif text-[1.35rem] leading-none font-semibold tracking-tight text-ink",
        className,
      )}
    >
      <span>Russell</span>
      <span className="mx-1 text-accent">D</span>
      <span>Smith</span>
    </Link>
  );
}
