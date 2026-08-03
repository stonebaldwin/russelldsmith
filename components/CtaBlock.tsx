import { CTA } from "@/lib/site";
import { cn } from "@/lib/cn";
import { ApplyLink } from "./ApplyLink";

export function CtaBlock({
  title = "Ready to talk through your options?",
  body = "Get a straight answer on what you qualify for — no pressure, no jargon.",
  className,
}: {
  title?: string;
  body?: string;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "rounded-2xl bg-accent px-6 py-8 text-white sm:px-10 sm:py-10",
        className,
      )}
    >
      <h2 className="font-serif text-2xl font-semibold sm:text-[1.75rem]">{title}</h2>
      <p className="mt-2 max-w-xl text-[0.975rem] leading-7 text-white/85">{body}</p>
      <ApplyLink className="mt-5 inline-flex rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-white/90">
        {CTA.label}
      </ApplyLink>
    </aside>
  );
}
