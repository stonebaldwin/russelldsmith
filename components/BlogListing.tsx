import type { Post } from "@/lib/content";
import { ArticleCard } from "./ArticleCard";
import { Pagination } from "./Pagination";

export function BlogListing({
  title,
  description,
  posts,
  page = 1,
  totalPages = 1,
  rootPath = "/blog/",
  eyebrow,
}: {
  title: string;
  description?: string;
  posts: Post[];
  page?: number;
  totalPages?: number;
  rootPath?: string;
  eyebrow?: string;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {description ? <p className="mt-3 text-lg leading-8 text-muted">{description}</p> : null}
      </header>

      {posts.length ? (
        <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-muted">No guides here yet.</p>
      )}

      <Pagination page={page} totalPages={totalPages} rootPath={rootPath} />
    </div>
  );
}
