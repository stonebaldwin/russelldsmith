import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * Build-time content layer. Reads migrated posts from `content/blog/*.mdx`.
 *
 * IMPORTANT: every function here runs at BUILD time (static generation), never
 * on the Cloudflare Worker at request time — all blog routes are statically
 * pre-rendered via generateStaticParams. Keep it filesystem-based and simple.
 */

export const SITE_URL = "https://russelldsmith.com";
const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const TAXONOMY_FILE = path.join(process.cwd(), "content", "taxonomy.json");

export interface PostFrontmatter {
  title: string;
  slug: string;
  description: string;
  date: string; // ISO date (YYYY-MM-DD)
  updated?: string;
  categories: string[]; // category slugs
  tags: string[]; // tag slugs
  hero?: string; // site-relative, e.g. /images/blog/{slug}/hero.jpg
  heroAlt?: string;
  canonical: string;
  source_url?: string;
  recovered?: boolean; // rebuilt from the Wayback Machine
  draft?: boolean;
}

export interface Post extends PostFrontmatter {
  body: string; // MDX source (frontmatter stripped)
  readingTimeMinutes: number;
  url: string; // /blog/{slug}/
}

export interface Term {
  slug: string;
  name: string;
  count: number;
}

interface Taxonomy {
  categories: Record<string, string>; // slug -> display name
  tags: Record<string, string>;
}

let _taxonomy: Taxonomy | null = null;
function taxonomy(): Taxonomy {
  if (_taxonomy) return _taxonomy;
  try {
    _taxonomy = JSON.parse(fs.readFileSync(TAXONOMY_FILE, "utf8")) as Taxonomy;
  } catch {
    _taxonomy = { categories: {}, tags: {} };
  }
  return _taxonomy;
}

/** Human label for a category slug (falls back to a prettified slug). */
export function categoryLabel(slug: string): string {
  return taxonomy().categories[slug] ?? prettifySlug(slug);
}
export function tagLabel(slug: string): string {
  return taxonomy().tags[slug] ?? prettifySlug(slug);
}

function prettifySlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\b(Va|Fha|Usda|Sc|Nc|Pmi|Irrrl|Mcc|Ibr|Bah|Ets|Fsbo)\b/gi, (m) =>
      m.toUpperCase(),
    );
}

function readingTime(markdown: string): number {
  const words = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~\-|[\]()!]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** All post slugs (filenames without extension). Safe if the dir is missing. */
export function getPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

export function getPostBySlug(slug: string): Post {
  const file = path.join(BLOG_DIR, `${slug}.mdx`);
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  const fm = data as Partial<PostFrontmatter>;

  assert(fm.title, `Post "${slug}" is missing "title"`);
  assert(fm.date, `Post "${slug}" is missing "date"`);
  // Slug is load-bearing for SEO: the filename is the source of truth and must
  // match the frontmatter slug when present.
  const resolvedSlug = fm.slug ?? slug;
  assert(
    resolvedSlug === slug,
    `Post "${slug}": frontmatter slug "${fm.slug}" != filename. Slugs must never change.`,
  );

  return {
    title: fm.title!,
    slug,
    description: fm.description ?? "",
    date: normalizeDate(fm.date!),
    updated: fm.updated ? normalizeDate(fm.updated) : undefined,
    categories: fm.categories ?? [],
    tags: fm.tags ?? [],
    hero: fm.hero,
    heroAlt: fm.heroAlt,
    canonical: fm.canonical ?? `${SITE_URL}/blog/${slug}/`,
    source_url: fm.source_url,
    recovered: fm.recovered ?? false,
    draft: fm.draft ?? false,
    body: content,
    readingTimeMinutes: readingTime(content),
    url: `/blog/${slug}/`,
  };
}

function normalizeDate(d: string): string {
  // Accept full ISO or YYYY-MM-DD; store as YYYY-MM-DD.
  return String(d).slice(0, 10);
}

let _cache: Post[] | null = null;
/** All published posts, newest first. Cached for the build. */
export function getAllPosts({ includeDrafts = false } = {}): Post[] {
  if (!_cache) {
    _cache = getPostSlugs()
      .map((s) => {
        try {
          return getPostBySlug(s);
        } catch (err) {
          console.error(`[content] failed to load ${s}:`, err);
          return null;
        }
      })
      .filter((p): p is Post => p !== null);
  }
  const posts = includeDrafts ? _cache : _cache.filter((p) => !p.draft);
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}

export function getPublishedSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

function collectTerms(kind: "categories" | "tags"): Term[] {
  const counts = new Map<string, number>();
  for (const post of getAllPosts()) {
    for (const slug of post[kind]) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  const label = kind === "categories" ? categoryLabel : tagLabel;
  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, name: label(slug), count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function getAllCategories(): Term[] {
  return collectTerms("categories");
}
export function getAllTags(): Term[] {
  return collectTerms("tags");
}

export function getPostsByCategory(slug: string): Post[] {
  return getAllPosts().filter((p) => p.categories.includes(slug));
}
export function getPostsByTag(slug: string): Post[] {
  return getAllPosts().filter((p) => p.tags.includes(slug));
}

/** Related posts: same category, then fill with recent, excluding self. */
export function getRelatedPosts(post: Post, limit = 3): Post[] {
  const others = getAllPosts().filter((p) => p.slug !== post.slug);
  const scored = others
    .map((p) => ({
      p,
      score: p.categories.filter((c) => post.categories.includes(c)).length,
    }))
    .sort((a, b) => b.score - a.score || b.p.date.localeCompare(a.p.date));
  return scored.slice(0, limit).map((s) => s.p);
}
