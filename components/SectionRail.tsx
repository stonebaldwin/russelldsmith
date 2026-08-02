import Link from "next/link";
import type { Post } from "@/lib/content";
import { ArticleCard } from "./ArticleCard";

/** A labeled topic row — one clean card grid with lots of air. */
export function SectionRail({
  title,
  href,
  posts,
  viewAllLabel = "View all",
}: {
  title: string;
  href?: string;
  posts: Post[];
  viewAllLabel?: string;
}) {
  if (!posts.length) return null;
  return (
    <section>
      <div className="flex items-baseline justify-between border-b border-line pb-2.5">
        <h2 className="font-serif text-xl font-semibold text-ink">
          {href ? (
            <Link href={href} className="hover:text-accent">
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
        {href ? (
          <Link href={href} className="text-sm font-medium text-accent-2 hover:underline">
            {viewAllLabel} →
          </Link>
        ) : null}
      </div>
      <div className="mt-6 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <ArticleCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
