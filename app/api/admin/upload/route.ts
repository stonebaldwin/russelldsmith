import { adminConfig } from "@/lib/admin/env";
import { requireApiSession } from "@/lib/admin/session";
import { uploadImage } from "@/lib/admin/posts";
import { isValidSlug } from "@/lib/admin/mdx";

export const dynamic = "force-dynamic";

// Upload an image into /public/images/blog/{slug}/ and return its site path.
export async function POST(req: Request) {
  const unauth = await requireApiSession();
  if (unauth) return unauth;
  const cfg = adminConfig();
  if (!cfg.ok) return err(`Server missing: ${cfg.missing.join(", ")}`, 500);

  try {
    const { slug, filename, dataUrl } = (await req.json()) as {
      slug: string;
      filename: string;
      dataUrl: string;
    };
    if (!isValidSlug(slug)) return err("Set a valid post slug before uploading images.", 400);
    if (!filename || !dataUrl) return err("Missing file data.", 400);

    const base64 = dataUrl.includes(",") ? dataUrl.slice(dataUrl.indexOf(",") + 1) : dataUrl;
    // ~ base64 is 4/3 of bytes; cap around 8MB original
    if (base64.length > 8 * 1024 * 1024 * 1.4) return err("Image too large (max ~8MB).", 400);

    const { path } = await uploadImage(cfg.config, slug, filename, base64);
    return Response.json({ ok: true, path });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Upload failed", 400);
  }
}

function err(error: string, status: number) {
  return Response.json({ error }, { status });
}
