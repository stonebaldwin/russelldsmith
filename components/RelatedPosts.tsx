import type { Post } from "@/lib/content";
import { ArticleCard } from "./ArticleCard";

export function RelatedPosts({ posts }: { posts: Post[] }) {
  if (!posts.length) return null;
  return (
    <section aria-labelledby="related-heading">
      <h2
        id="related-heading"
        className="border-b border-line pb-2.5 font-serif text-xl font-semibold text-ink"
      >
        Related guides
      </h2>
      <div className="mt-6 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <ArticleCard key={post.slug} post={post} sizes="(max-width: 640px) 100vw, 33vw" />
        ))}
      </div>
    </section>
  );
}
