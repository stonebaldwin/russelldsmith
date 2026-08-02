import Link from "next/link";
import type { Post } from "@/lib/content";
import { Thumb } from "./Thumb";
import { PostMeta } from "./PostMeta";

/** The homepage lead story: large image + confident headline + dek. */
export function HeroFeature({ post }: { post: Post }) {
  return (
    <article className="grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-10">
      <Link href={post.url} tabIndex={-1} aria-hidden="true" className="block">
        <Thumb
          src={post.hero}
          alt={post.heroAlt || post.title}
          category={post.categories[0]}
          ratio="16/10"
          className="rounded-xl shadow-sm"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </Link>
      <div>
        <h2 className="font-serif text-3xl leading-[1.1] font-semibold tracking-tight text-ink sm:text-4xl">
          <Link href={post.url} className="transition-colors hover:text-accent">
            {post.title}
          </Link>
        </h2>
        {post.description ? (
          <p className="mt-3 text-lg leading-8 text-ink-soft">{post.description}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
          <PostMeta date={post.date} readingTimeMinutes={post.readingTimeMinutes} />
          <Link href={post.url} className="text-sm font-semibold text-accent-2 hover:underline">
            Read the guide →
          </Link>
        </div>
      </div>
    </article>
  );
}
