import Link from "next/link";
import type { Post } from "@/lib/content";
import { Thumb } from "./Thumb";
import { CategoryEyebrow } from "./CategoryEyebrow";
import { PostMeta } from "./PostMeta";

export function ArticleCard({
  post,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
}: {
  post: Post;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <article className="group flex flex-col">
      <Link href={post.url} tabIndex={-1} aria-hidden="true" className="block">
        <Thumb
          src={post.hero}
          alt={post.heroAlt || post.title}
          category={post.categories[0]}
          className="rounded-lg"
          sizes={sizes}
          priority={priority}
        />
      </Link>
      <div className="mt-3 flex flex-1 flex-col">
        <CategoryEyebrow slug={post.categories[0]} />
        <h3 className="mt-1.5 font-serif text-lg leading-snug font-semibold text-ink">
          <Link href={post.url} className="transition-colors hover:text-accent">
            {post.title}
          </Link>
        </h3>
        {post.description ? (
          <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted">{post.description}</p>
        ) : null}
        <PostMeta date={post.date} readingTimeMinutes={post.readingTimeMinutes} className="mt-2" />
      </div>
    </article>
  );
}
