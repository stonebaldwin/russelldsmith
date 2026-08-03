import Link from "next/link";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${SITE.name} — home`}
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- small local brand logo */}
      <img
        src="/media/site/alcova-logo.png"
        alt="ALCOVA Mortgage"
        className="h-6 w-auto sm:h-7"
      />
      <span className="hidden h-6 w-px bg-line-strong sm:block" aria-hidden="true" />
      <span className="font-poppins hidden text-base leading-none font-semibold tracking-[0.02em] whitespace-nowrap text-accent uppercase sm:inline lg:text-lg">
        Russell Smith
      </span>
    </Link>
  );
}
