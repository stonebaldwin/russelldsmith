import { PostEditor } from "@/components/admin/PostEditor";
import type { PostFrontmatter } from "@/lib/admin/mdx";

export const dynamic = "force-dynamic";

export default function NewPostPage() {
  const fm: PostFrontmatter = {
    title: "",
    slug: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    categories: [],
    tags: [],
    canonical: "",
    draft: true,
  };
  return <PostEditor mode="new" initialFrontmatter={fm} initialBody="" />;
}
