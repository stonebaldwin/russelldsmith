import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { classify, slugHash } from "./image-concepts";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));

const rows = files.map((f) => {
  const slug = f.replace(/\.mdx$/, "");
  const { data } = matter(fs.readFileSync(path.join(BLOG_DIR, f), "utf8"));
  const { concept, queries } = classify({
    slug,
    title: data.title ?? "",
    categories: data.categories ?? [],
    tags: data.tags ?? [],
  });
  const primary = queries[slugHash(slug) % queries.length];
  return { slug, title: data.title ?? "", concept, primary };
});

const dist: Record<string, number> = {};
for (const r of rows) dist[r.concept] = (dist[r.concept] || 0) + 1;

const mode = process.argv[2];
if (mode === "--dist") {
  console.log("Concept distribution (" + rows.length + " posts):\n");
  for (const [k, n] of Object.entries(dist).sort((a, b) => b[1] - a[1]))
    console.log(String(n).padStart(4) + "  " + k);
  console.log("\nfallback posts:");
  for (const r of rows.filter((r) => r.concept === "fallback"))
    console.log("   - " + r.slug + "  (" + r.title + ")");
} else if (mode && mode.startsWith("--concept=")) {
  const want = mode.slice("--concept=".length);
  for (const r of rows.filter((r) => r.concept === want))
    console.log(r.slug + "\n    → " + r.primary + "\n");
} else {
  for (const r of rows)
    console.log(r.concept.padEnd(24) + " | " + r.slug + "\n" + " ".repeat(26) + "→ " + r.primary);
}

fs.writeFileSync(
  process.argv.includes("--json") ? "image-plan.json" : "/dev/null",
  JSON.stringify(rows, null, 2),
);
