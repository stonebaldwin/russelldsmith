import { notFound } from "next/navigation";
import { adminConfig } from "@/lib/admin/env";
import { getPost } from "@/lib/admin/posts";
import { PostEditor } from "@/components/admin/PostEditor";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cfg = adminConfig();
  if (!cfg.ok) return null; // guarded by protected layout

  const post = await getPost(cfg.config, slug);
  if (!post) notFound();

  return (
    <PostEditor
      mode="edit"
      initialFrontmatter={post.frontmatter}
      initialBody={post.body}
      initialSha={post.sha}
    />
  );
}
