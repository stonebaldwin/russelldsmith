/**
 * High-level CMS content operations: list / read / create / update / delete
 * posts and upload images — all against GitHub (source of truth).
 *
 * A lightweight `content/blog-index.json` is maintained for a fast dashboard
 * listing (avoids fetching 300+ files per load). The public site never reads
 * this index — it re-derives everything from the MDX at build time.
 */
import { AdminConfig } from "./env";
import {
  deleteFile,
  getFile,
  listDir,
  putBase64File,
  putTextFile,
} from "./github";
import {
  canonicalFor,
  isValidSlug,
  parseMdx,
  PostFrontmatter,
  serializeMdx,
} from "./mdx";

const BLOG_DIR = "content/blog";
const IMG_DIR = "public/images/blog";
const INDEX_PATH = "content/blog-index.json";

export interface PostIndexEntry {
  slug: string;
  title: string;
  date: string;
  updated?: string;
  draft?: boolean;
  categories: string[];
}

export interface FullPost {
  frontmatter: PostFrontmatter;
  body: string;
  sha: string;
}

// ---- listing ---------------------------------------------------------------
export async function listPosts(cfg: AdminConfig): Promise<PostIndexEntry[]> {
  const idx = await getFile(cfg, INDEX_PATH);
  if (idx) {
    try {
      const parsed = JSON.parse(idx.content) as PostIndexEntry[];
      if (Array.isArray(parsed)) return parsed.sort(byDateDesc);
    } catch {
      /* fall through to dir listing */
    }
  }
  // fallback: list slugs from the directory (no titles/dates available)
  const files = await listDir(cfg, BLOG_DIR);
  return files
    .filter((f) => f.type === "file" && f.name.endsWith(".mdx"))
    .map((f) => ({ slug: f.name.replace(/\.mdx$/, ""), title: f.name.replace(/\.mdx$/, ""), date: "", categories: [] }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

function byDateDesc(a: PostIndexEntry, b: PostIndexEntry) {
  return (b.date || "").localeCompare(a.date || "") || a.title.localeCompare(b.title);
}

// ---- read ------------------------------------------------------------------
export async function getPost(cfg: AdminConfig, slug: string): Promise<FullPost | null> {
  const file = await getFile(cfg, `${BLOG_DIR}/${slug}.mdx`);
  if (!file) return null;
  const { frontmatter, body } = parseMdx(file.content);
  return {
    frontmatter: normalizeFrontmatter(frontmatter, slug),
    body,
    sha: file.sha,
  };
}

function normalizeFrontmatter(fm: Record<string, unknown>, slug: string): PostFrontmatter {
  return {
    title: str(fm.title),
    slug: str(fm.slug) || slug,
    description: str(fm.description),
    date: str(fm.date),
    updated: fm.updated ? str(fm.updated) : undefined,
    categories: arr(fm.categories),
    tags: arr(fm.tags),
    hero: fm.hero ? str(fm.hero) : undefined,
    heroAlt: fm.heroAlt ? str(fm.heroAlt) : undefined,
    canonical: str(fm.canonical) || canonicalFor(slug),
    source_url: fm.source_url ? str(fm.source_url) : undefined,
    recovered: fm.recovered === true || undefined,
    draft: fm.draft === true || undefined,
  };
}
const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
const arr = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);

// ---- create / update -------------------------------------------------------
export interface SaveInput {
  frontmatter: PostFrontmatter;
  body: string;
  isNew: boolean;
  sha?: string; // required when updating
}

export async function savePost(cfg: AdminConfig, input: SaveInput): Promise<{ slug: string; sha: string }> {
  const fm = input.frontmatter;
  const slug = fm.slug;
  if (!isValidSlug(slug)) throw new Error(`Invalid slug "${slug}" (use lowercase letters, numbers, hyphens).`);
  if (!fm.title.trim()) throw new Error("Title is required.");

  fm.canonical = canonicalFor(slug);
  const path = `${BLOG_DIR}/${slug}.mdx`;

  if (input.isNew) {
    const existing = await getFile(cfg, path);
    if (existing) throw new Error(`A post with slug "${slug}" already exists.`);
  }

  const content = serializeMdx(fm, input.body);
  const { sha } = await putTextFile(
    cfg,
    path,
    content,
    input.isNew ? `cms: create post ${slug}` : `cms: update post ${slug}`,
    input.sha,
  );

  await upsertIndex(cfg, {
    slug,
    title: fm.title,
    date: fm.date,
    updated: fm.updated,
    draft: fm.draft,
    categories: fm.categories,
  });
  return { slug, sha };
}

export async function deletePost(cfg: AdminConfig, slug: string): Promise<void> {
  const path = `${BLOG_DIR}/${slug}.mdx`;
  const file = await getFile(cfg, path);
  if (!file) throw new Error(`Post "${slug}" not found.`);
  await deleteFile(cfg, path, `cms: delete post ${slug}`, file.sha);
  await removeFromIndex(cfg, slug);
}

// ---- images ----------------------------------------------------------------
export async function uploadImage(
  cfg: AdminConfig,
  slug: string,
  filename: string,
  base64Content: string,
): Promise<{ path: string }> {
  const safe = filename.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
  const repoPath = `${IMG_DIR}/${slug}/${safe}`;
  // if a file with that name exists, suffix to avoid clobbering
  let finalPath = repoPath;
  const existing = await getFile(cfg, repoPath).catch(() => null);
  if (existing) {
    const dot = safe.lastIndexOf(".");
    finalPath = `${IMG_DIR}/${slug}/${safe.slice(0, dot)}-${Date.now().toString(36)}${safe.slice(dot)}`;
  }
  await putBase64File(cfg, finalPath, base64Content, `cms: upload image ${finalPath}`);
  return { path: "/" + finalPath.replace(/^public\//, "") };
}

// ---- index maintenance -----------------------------------------------------
async function upsertIndex(cfg: AdminConfig, entry: PostIndexEntry): Promise<void> {
  const { list, sha } = await readIndex(cfg);
  const next = list.filter((e) => e.slug !== entry.slug);
  next.push(entry);
  next.sort(byDateDesc);
  await writeIndex(cfg, next, sha);
}
async function removeFromIndex(cfg: AdminConfig, slug: string): Promise<void> {
  const { list, sha } = await readIndex(cfg);
  await writeIndex(cfg, list.filter((e) => e.slug !== slug), sha);
}
async function readIndex(cfg: AdminConfig): Promise<{ list: PostIndexEntry[]; sha?: string }> {
  const idx = await getFile(cfg, INDEX_PATH);
  if (!idx) return { list: [] };
  try {
    return { list: JSON.parse(idx.content) as PostIndexEntry[], sha: idx.sha };
  } catch {
    return { list: [], sha: idx.sha };
  }
}
async function writeIndex(cfg: AdminConfig, list: PostIndexEntry[], sha?: string): Promise<void> {
  await putTextFile(cfg, INDEX_PATH, JSON.stringify(list, null, 2) + "\n", "cms: update blog index", sha);
}
