import { adminConfig } from "@/lib/admin/env";
import { requireApiSession } from "@/lib/admin/session";
import { savePost } from "@/lib/admin/posts";
import type { PostFrontmatter } from "@/lib/admin/mdx";

export const dynamic = "force-dynamic";

// Create a new post
export async function POST(req: Request) {
  const unauth = await requireApiSession();
  if (unauth) return unauth;
  const cfg = adminConfig();
  if (!cfg.ok) return err(`Server missing: ${cfg.missing.join(", ")}`, 500);

  try {
    const { frontmatter, body } = (await req.json()) as {
      frontmatter: PostFrontmatter;
      body: string;
    };
    const { slug, sha } = await savePost(cfg.config, { frontmatter, body: body ?? "", isNew: true });
    return Response.json({ ok: true, slug, sha });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to create post", 400);
  }
}

function err(error: string, status: number) {
  return Response.json({ error }, { status });
}
