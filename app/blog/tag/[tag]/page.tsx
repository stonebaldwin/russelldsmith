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
    description: `Mortgage guides tagged ${label} from Russell D Smith.`,
    alternates: { canonical: `/blog/tag/${tag}/` },
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
      eyebrow="Tag"
      title={label}
      description={`Guides tagged “${label}.”`}
      posts={posts}
      rootPath={`/blog/tag/${tag}/`}
    />
  );
}
