import { adminConfig } from "@/lib/admin/env";
import { requireApiSession } from "@/lib/admin/session";
import { deletePost, savePost } from "@/lib/admin/posts";
import type { PostFrontmatter } from "@/lib/admin/mdx";

export const dynamic = "force-dynamic";

// Update an existing post
export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const unauth = await requireApiSession();
  if (unauth) return unauth;
  const cfg = adminConfig();
  if (!cfg.ok) return err(`Server missing: ${cfg.missing.join(", ")}`, 500);

  const { slug } = await params;
  try {
    const { frontmatter, body, sha } = (await req.json()) as {
      frontmatter: PostFrontmatter;
      body: string;
      sha: string;
    };
    // Slug is SEO-load-bearing and the 301 join key — never allow it to change.
    if (frontmatter.slug !== slug) {
      return err("Changing a post's slug is not allowed (SEO/redirect safety).", 400);
    }
    if (!sha) return err("Missing file sha (reload the post and try again).", 400);
    const result = await savePost(cfg.config, { frontmatter, body: body ?? "", isNew: false, sha });
    return Response.json({ ok: true, slug: result.slug, sha: result.sha });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to update post", 400);
  }
}

// Delete a post
export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const unauth = await requireApiSession();
  if (unauth) return unauth;
  const cfg = adminConfig();
  if (!cfg.ok) return err(`Server missing: ${cfg.missing.join(", ")}`, 500);

  const { slug } = await params;
  try {
    await deletePost(cfg.config, slug);
    return Response.json({ ok: true });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to delete post", 400);
  }
}

function err(error: string, status: number) {
  return Response.json({ error }, { status });
}
