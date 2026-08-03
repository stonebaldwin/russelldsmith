import { getAllPosts, categoryLabel, tagLabel } from "@/lib/content";
import type { SearchDoc } from "@/lib/search";

// Prerendered to a static /search-index.json asset at build time — always fresh
// from content, served straight off the edge (no runtime cost on Workers).
export const dynamic = "force-static";

export function GET() {
  const docs: SearchDoc[] = getAllPosts().map((p) => {
    const cats = p.categories.map(categoryLabel);
    const tags = p.tags.map(tagLabel);
    return {
      t: p.title,
      u: p.url,
      d: p.description,
      c: cats,
      k: `${p.title} ${p.description} ${cats.join(" ")} ${tags.join(" ")}`.toLowerCase(),
    };
  });
  return Response.json(docs);
}
