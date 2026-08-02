import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts } from "@/lib/content";
import { POSTS_PER_PAGE } from "@/lib/routes";
import { BlogListing } from "@/components/BlogListing";

export const dynamicParams = false;

export function generateStaticParams() {
  const total = Math.ceil(getAllPosts().length / POSTS_PER_PAGE);
  const params: { page: string }[] = [];
  for (let n = 2; n <= total; n++) params.push({ page: String(n) });
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const { page } = await params;
  return {
    title: `Mortgage Guides — Page ${page}`,
    alternates: { canonical: `/blog/page/${page}/` },
  };
}

export default async function BlogPagedPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const n = Number(page);
  const posts = getAllPosts();
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  if (!Number.isInteger(n) || n < 2 || n > totalPages) notFound();

  return (
    <BlogListing
      title="Mortgage Guides"
      description="Straight answers on VA, USDA, FHA, first-time buyer, construction, jumbo, and investment property loans."
      posts={posts.slice((n - 1) * POSTS_PER_PAGE, n * POSTS_PER_PAGE)}
      page={n}
      totalPages={totalPages}
      rootPath="/blog/"
    />
  );
}
