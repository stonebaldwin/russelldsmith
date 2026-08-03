import type { Metadata } from "next";
import { getAllPosts } from "@/lib/content";
import { POSTS_PER_PAGE } from "@/lib/routes";
import { BlogListing } from "@/components/BlogListing";

export const metadata: Metadata = {
  title: "Mortgage Guides",
  description:
    "In-depth mortgage guides from Russell Smith — VA, USDA, FHA, first-time buyer, construction, and more.",
  alternates: { canonical: "/blog/" },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  return (
    <BlogListing
      title="Mortgage Guides"
      description="Straight answers on VA, USDA, FHA, first-time buyer, construction, jumbo, and investment property loans."
      posts={posts.slice(0, POSTS_PER_PAGE)}
      page={1}
      totalPages={totalPages}
      rootPath="/blog/"
    />
  );
}
