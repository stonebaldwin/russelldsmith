import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllCategories, getPostsByCategory, categoryLabel } from "@/lib/content";
import { BlogListing } from "@/components/BlogListing";
import { TopicVideos } from "@/components/TopicVideos";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllCategories().map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const label = categoryLabel(category);
  return {
    title: `${label} Guides`,
    description: `Mortgage guides about ${label} from Russell Smith.`,
    alternates: { canonical: `/blog/category/${category}/` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const posts = getPostsByCategory(category);
  if (!posts.length) notFound();
  const label = categoryLabel(category);
  return (
    <BlogListing
      title={label}
      description={`Every ${label} guide, in one place.`}
      posts={posts}
      rootPath={`/blog/category/${category}/`}
      aboveGrid={<TopicVideos className="mt-10" topic={category} />}
    />
  );
}
