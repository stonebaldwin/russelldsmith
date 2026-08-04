/**
 * Generate content/blog-index.json — a lightweight index the CMS dashboard reads
 * (slug, title, date, draft, categories) so it never has to fetch 300+ files.
 *
 * The CMS keeps this file up to date on every create/edit/delete; run this to
 * (re)seed it from the MDX on disk. Safe to run anytime.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const OUT = path.join(process.cwd(), "content", "blog-index.json");

const rows = fs
  .readdirSync(BLOG_DIR)
  .filter((f) => f.endsWith(".mdx"))
  .map((f) => {
    const slug = f.replace(/\.mdx$/, "");
    const { data } = matter(fs.readFileSync(path.join(BLOG_DIR, f), "utf8"));
    return {
      slug,
      title: data.title ?? slug,
      date: data.date ?? "",
      updated: data.updated ?? undefined,
      draft: data.draft === true ? true : undefined,
      categories: Array.isArray(data.categories) ? data.categories : [],
    };
  })
  .sort((a, b) => (b.date || "").localeCompare(a.date || "") || a.title.localeCompare(b.title));

fs.writeFileSync(OUT, JSON.stringify(rows, null, 2) + "\n");
console.log(`Wrote ${rows.length} entries → content/blog-index.json`);
