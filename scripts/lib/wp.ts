/**
 * WordPress REST API client for the legacy origin (teammovemortgage.com/blog).
 * The origin is slow and intermittently times out, so every request retries
 * with backoff and a real User-Agent. Node-only (used by scripts).
 */

export const ORIGIN = "https://teammovemortgage.com";
export const API = `${ORIGIN}/blog/wp-json/wp/v2`;
export const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0 Safari/537.36 RDSmigration/1.0";

export interface WpTerm {
  taxonomy: string;
  slug: string;
  name: string;
}

export interface WpPost {
  id: number;
  slug: string;
  status: string;
  type: string;
  date: string; // YYYY-MM-DD
  dateRaw: string;
  modified: string; // YYYY-MM-DD
  link: string;
  title: string; // decoded plain text
  contentHtml: string;
  excerptHtml: string;
  categories: WpTerm[];
  tags: WpTerm[];
  featured?: { src: string; alt: string; width?: number; height?: number };
  yoast?: { title?: string; description?: string; canonical?: string };
}

export async function fetchWithRetry(
  url: string,
  { retries = 4, timeoutMs = 45000 }: { retries?: number; timeoutMs?: number } = {},
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json, text/html;q=0.9" },
        redirect: "follow",
        signal: ac.signal,
      });
      clearTimeout(t);
      if (res.ok) return res;
      // 429/5xx are retryable; 4xx (except 429) are not.
      if (res.status !== 429 && res.status < 500) return res;
      lastErr = new Error(`HTTP ${res.status} for ${url}`);
    } catch (err) {
      clearTimeout(t);
      lastErr = err;
    }
    if (attempt < retries) {
      const wait = Math.min(15000, 1000 * 2 ** attempt) + Math.floor(attempt * 250);
      await sleep(wait);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#039;": "'",
  "&#39;": "'", "&apos;": "'", "&nbsp;": " ", "&#8217;": "’",
  "&#8216;": "‘", "&#8220;": "“", "&#8221;": "”",
  "&#8211;": "–", "&#8212;": "—", "&hellip;": "…", "&#8230;": "…",
};

export function decodeEntities(s: string): string {
  if (!s) return "";
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&[a-z0-9#]+;/gi, (m) => ENTITIES[m] ?? m)
    .trim();
}

function normalizeTerms(embedded: any): { categories: WpTerm[]; tags: WpTerm[] } {
  const groups: any[] = embedded?.["wp:term"] ?? [];
  const flat: WpTerm[] = groups
    .flat()
    .filter(Boolean)
    .map((t: any) => ({ taxonomy: t.taxonomy, slug: t.slug, name: decodeEntities(t.name) }));
  return {
    categories: flat.filter((t) => t.taxonomy === "category"),
    tags: flat.filter((t) => t.taxonomy === "post_tag"),
  };
}

function normalizeFeatured(embedded: any): WpPost["featured"] | undefined {
  const media = embedded?.["wp:featuredmedia"]?.[0];
  const src: string | undefined = media?.source_url || media?.media_details?.sizes?.full?.source_url;
  if (!src) return undefined;
  return {
    src,
    alt: decodeEntities(media?.alt_text || ""),
    width: media?.media_details?.width,
    height: media?.media_details?.height,
  };
}

export function normalizePost(p: any): WpPost {
  const { categories, tags } = normalizeTerms(p._embedded);
  return {
    id: p.id,
    slug: p.slug,
    status: p.status,
    type: p.type,
    date: String(p.date).slice(0, 10),
    dateRaw: p.date,
    modified: String(p.modified).slice(0, 10),
    link: p.link,
    title: decodeEntities(p.title?.rendered ?? ""),
    contentHtml: p.content?.rendered ?? "",
    excerptHtml: p.excerpt?.rendered ?? "",
    categories,
    tags,
    featured: normalizeFeatured(p._embedded),
    yoast: p.yoast_head_json
      ? {
          title: p.yoast_head_json.title,
          description: p.yoast_head_json.description,
          canonical: p.yoast_head_json.canonical,
        }
      : undefined,
  };
}

/** Fetch ALL posts (paginated, embedded terms + media). */
export async function fetchAllPosts(
  opts: { perPage?: number; onPage?: (page: number, total: number) => void } = {},
): Promise<WpPost[]> {
  const perPage = opts.perPage ?? 100;
  const first = await fetchWithRetry(`${API}/posts?per_page=${perPage}&page=1&_embed=1`);
  const totalPages = Number(first.headers.get("x-wp-totalpages") ?? "1");
  const out: WpPost[] = [];
  const page1 = (await first.json()) as any[];
  page1.forEach((p) => out.push(normalizePost(p)));
  opts.onPage?.(1, totalPages);

  for (let page = 2; page <= totalPages; page++) {
    const res = await fetchWithRetry(`${API}/posts?per_page=${perPage}&page=${page}&_embed=1`);
    const arr = (await res.json()) as any[];
    arr.forEach((p) => out.push(normalizePost(p)));
    opts.onPage?.(page, totalPages);
    await sleep(500);
  }
  return out;
}

/** Fetch a handful of posts (for sampling / dev). */
export async function fetchSomePosts(count: number): Promise<WpPost[]> {
  const res = await fetchWithRetry(`${API}/posts?per_page=${count}&_embed=1&orderby=date&order=asc`);
  const arr = (await res.json()) as any[];
  return arr.map(normalizePost);
}

/** Fetch specific posts by slug. */
export async function fetchPostsBySlugs(slugs: string[]): Promise<WpPost[]> {
  const out: WpPost[] = [];
  for (const slug of slugs) {
    const res = await fetchWithRetry(`${API}/posts?slug=${encodeURIComponent(slug)}&_embed=1`);
    const arr = (await res.json()) as any[];
    if (arr.length) out.push(normalizePost(arr[0]));
    await sleep(250);
  }
  return out;
}
