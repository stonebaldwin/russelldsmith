import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllTags, getPostsByTag, tagLabel } from "@/lib/content";
import { BlogListing } from "@/components/BlogListing";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTags().map((t) => ({ tag: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const label = tagLabel(tag);
  return {
    title: `${label}`,
    description: `Mortgage guides tagged ${label} from Russell Smith.`,
    alternates: { canonical: `/blog/tag/${tag}/` },
    // Tag archives are thin/near-duplicate (most have a single post) and carry no
    // redirect equity — keep them usable for readers but out of the index.
    // Links are still followed so the posts they list stay well-crawled.
    robots: { index: false, follow: true },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const posts = getPostsByTag(tag);
  if (!posts.length) notFound();
  const label = tagLabel(tag);
  return (
    <BlogListing
      title={label}
      description={`Guides tagged “${label}.”`}
      posts={posts}
      rootPath={`/blog/tag/${tag}/`}
    />
  );
}
