import Link from "next/link";
import { cn } from "@/lib/cn";
import { categoryLabel } from "@/lib/content";

export function CategoryEyebrow({
  slug,
  className,
  as = "link",
}: {
  slug?: string;
  className?: string;
  as?: "link" | "text";
}) {
  if (!slug) return null;
  const cls = cn(
    "text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-accent",
    className,
  );
  if (as === "text") return <span className={cls}>{categoryLabel(slug)}</span>;
  return (
    <Link href={`/blog/category/${slug}/`} className={cn(cls, "hover:text-accent-2")}>
      {categoryLabel(slug)}
    </Link>
  );
}
