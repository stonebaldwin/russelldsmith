/**
 * Fetch high-quality, on-topic stock photos for every blog post.
 *
 *   PEXELS_API_KEY=... UNSPLASH_ACCESS_KEY=... tsx scripts/fetch-stock-images.ts
 *   (keys are read from .env.local automatically)
 *
 * Strategy
 *  - Group posts by concept (see image-concepts.ts).
 *  - For each concept, build a POOL of candidate landscape photos by querying
 *    its sub-queries across Pexels + Unsplash, keeping provider relevance order.
 *  - Assign one DISTINCT photo per post; a global used-set guarantees no photo
 *    is ever reused across the whole site (fixes the "same image everywhere").
 *  - Download each assigned photo (~1600–1880px wide) to
 *    /public/images/blog/{slug}/stock.jpg and record credit + provenance.
 *
 * Resumable: posts already present in image-assignments.json (with the file on
 * disk) are skipped. Flags: --dry, --limit=N, --concept=key, --only=a,b,c.
 *
 * Rate limits: Pexels ~200 req/hr, Unsplash ~50 req/hr. Concept-batching keeps
 * total search calls low (a handful per concept); downloads are plain CDN GETs.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import pLimit from "p-limit";
import { classify, PostLike } from "./image-concepts";

// ----- config / flags --------------------------------------------------------
const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, "content", "blog");
const IMG_ROOT = path.join(ROOT, "public", "images", "blog");
const ASSIGN_FILE = path.join(ROOT, "scripts", "image-assignments.json");
const MIN_WIDTH = 1200;
const DOWNLOAD_CONCURRENCY = 5;

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const LIMIT = num(flag("--limit"));
const ONLY_CONCEPT = flag("--concept");
const ONLY_SLUGS = flag("--only")?.split(",").map((s) => s.trim());

function flag(name: string): string | undefined {
  const a = args.find((x) => x.startsWith(name + "="));
  return a ? a.slice(name.length + 1) : undefined;
}
function num(v?: string) {
  return v ? parseInt(v, 10) : undefined;
}

// ----- env -------------------------------------------------------------------
loadEnvLocal();
const PEXELS = process.env.PEXELS_API_KEY?.trim();
const UNSPLASH = process.env.UNSPLASH_ACCESS_KEY?.trim();
if (!PEXELS && !UNSPLASH && !DRY) {
  console.error(
    "\n✖ No API keys found. Add PEXELS_API_KEY and/or UNSPLASH_ACCESS_KEY to .env.local\n",
  );
  process.exit(1);
}
console.log(
  `Providers: ${[PEXELS && "Pexels", UNSPLASH && "Unsplash"].filter(Boolean).join(" + ")}` +
    (DRY ? "   [DRY RUN]" : ""),
);

function loadEnvLocal() {
  for (const f of [".env.local", ".env"]) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

// ----- types -----------------------------------------------------------------
interface Candidate {
  provider: "pexels" | "unsplash";
  id: string;
  width: number;
  height: number;
  downloadUrl: string; // ~1600px jpg
  photographer: string;
  photographerUrl: string;
  sourceUrl: string;
  alt: string;
}
interface Assignment {
  slug: string;
  concept: string;
  query: string;
  provider: string;
  id: string;
  width: number;
  height: number;
  photographer: string;
  photographerUrl: string;
  sourceUrl: string;
  localPath: string; // site-relative, e.g. /images/blog/{slug}/stock.jpg
  alt: string;
}

// ----- load posts + group by concept ----------------------------------------
function loadPosts(): (PostLike & { title: string })[] {
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const slug = f.replace(/\.mdx$/, "");
      const { data } = matter(fs.readFileSync(path.join(BLOG_DIR, f), "utf8"));
      return {
        slug,
        title: data.title ?? "",
        categories: data.categories ?? [],
        tags: data.tags ?? [],
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

// ----- provider search -------------------------------------------------------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function searchPexels(query: string): Promise<Candidate[]> {
  if (!PEXELS) return [];
  const url =
    "https://api.pexels.com/v1/search?orientation=landscape&per_page=80&query=" +
    encodeURIComponent(query);
  const res = await fetchRetry(url, { headers: { Authorization: PEXELS } });
  if (!res) return [];
  const json: any = await res.json();
  return (json.photos ?? []).map(
    (p: any): Candidate => ({
      provider: "pexels",
      id: String(p.id),
      width: p.width,
      height: p.height,
      downloadUrl: p.src?.large2x || p.src?.large || p.src?.original,
      photographer: p.photographer ?? "Pexels",
      photographerUrl: p.photographer_url ?? "https://www.pexels.com",
      sourceUrl: p.url,
      alt: p.alt || query,
    }),
  );
}

async function searchUnsplash(query: string): Promise<Candidate[]> {
  if (!UNSPLASH) return [];
  const url =
    "https://api.unsplash.com/search/photos?orientation=landscape&per_page=30&content_filter=high&query=" +
    encodeURIComponent(query);
  const res = await fetchRetry(url, {
    headers: { Authorization: "Client-ID " + UNSPLASH, "Accept-Version": "v1" },
  });
  if (!res) return [];
  const json: any = await res.json();
  return (json.results ?? []).map(
    (p: any): Candidate => ({
      provider: "unsplash",
      id: String(p.id),
      width: p.width,
      height: p.height,
      downloadUrl: (p.urls?.raw || p.urls?.full) + "&w=1600&q=80&fm=jpg&fit=crop",
      photographer: p.user?.name ?? "Unsplash",
      photographerUrl: p.user?.links?.html ?? "https://unsplash.com",
      sourceUrl: p.links?.html,
      alt: p.alt_description || query,
    }),
  );
}

async function fetchRetry(url: string, init: RequestInit, tries = 3): Promise<Response | null> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, init);
      if (res.status === 429) {
        console.warn("   rate-limited, waiting 60s…");
        await sleep(60_000);
        continue;
      }
      if (!res.ok) {
        console.warn(`   ${res.status} ${res.statusText} for ${url.slice(0, 80)}`);
        return null;
      }
      return res;
    } catch {
      await sleep(2000 * (i + 1));
    }
  }
  return null;
}

// Unsplash free tier = 50 req/hr, so spend it sparingly (Pexels is the
// workhorse at 200/hr). Query Unsplash for at most the first sub-query of each
// concept, and stop entirely once this per-run budget is exhausted.
let unsplashBudget = 40;
const PEXELS_SUBQUERIES = 3;

/** Build a de-duped, relevance-interleaved candidate pool for a concept. */
async function buildPool(queries: string[]): Promise<Candidate[]> {
  const perQuery: Candidate[][] = [];
  const pexelsQs = queries.slice(0, PEXELS_SUBQUERIES);
  for (let qi = 0; qi < pexelsQs.length; qi++) {
    const q = pexelsQs[qi];
    const useUnsplash = qi === 0 && unsplashBudget > 0;
    if (useUnsplash) unsplashBudget--;
    const [px, us] = await Promise.all([
      searchPexels(q),
      useUnsplash ? searchUnsplash(q) : Promise.resolve([]),
    ]);
    // interleave the two providers to preserve relevance from both
    const merged: Candidate[] = [];
    for (let i = 0; i < Math.max(px.length, us.length); i++) {
      if (px[i]) merged.push(px[i]);
      if (us[i]) merged.push(us[i]);
    }
    perQuery.push(merged.filter((c) => c.width >= MIN_WIDTH && c.downloadUrl));
    await sleep(350); // be polite between queries
  }
  // round-robin across sub-queries so the pool front-loads variety
  const pool: Candidate[] = [];
  const seen = new Set<string>();
  let added = true;
  for (let i = 0; added; i++) {
    added = false;
    for (const list of perQuery) {
      const c = list[i];
      if (c) {
        added = true;
        const key = c.provider + ":" + c.id;
        if (!seen.has(key)) {
          seen.add(key);
          pool.push(c);
        }
      }
    }
  }
  return pool;
}

// ----- download --------------------------------------------------------------
async function download(c: Candidate, destAbs: string): Promise<boolean> {
  const res = await fetchRetry(c.downloadUrl, {});
  if (!res) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 5000) return false; // guard against error pages
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });
  fs.writeFileSync(destAbs, buf);
  return true;
}

// ----- main ------------------------------------------------------------------
async function main() {
  const posts = loadPosts();

  // load existing assignments (resume)
  const existing: Record<string, Assignment> = fs.existsSync(ASSIGN_FILE)
    ? Object.fromEntries(
        (JSON.parse(fs.readFileSync(ASSIGN_FILE, "utf8")) as Assignment[]).map((a) => [a.slug, a]),
      )
    : {};

  const usedImages = new Set<string>();
  for (const a of Object.values(existing)) usedImages.add(a.provider + ":" + a.id);

  // group by concept. Override posts have per-slug bespoke queries, so each gets
  // its own singleton group (keyed by slug) instead of sharing one pool.
  const groups = new Map<string, { concept: string; queries: string[]; posts: typeof posts }>();
  for (const p of posts) {
    const { concept, queries } = classify(p);
    const key = concept === "override" ? `override:${p.slug}` : concept;
    if (!groups.has(key)) groups.set(key, { concept, queries, posts: [] });
    groups.get(key)!.posts.push(p);
  }

  const dl = pLimit(DOWNLOAD_CONCURRENCY);
  let done = 0;
  let processed = 0;

  for (const [, group] of groups) {
    const concept = group.concept;
    if (ONLY_CONCEPT && concept !== ONLY_CONCEPT) continue;

    // which posts in this group still need an image?
    const todo = group.posts.filter((p) => {
      if (ONLY_SLUGS && !ONLY_SLUGS.includes(p.slug)) return false;
      if (LIMIT && processed >= LIMIT) return false;
      const a = existing[p.slug];
      const fileOk = a && fs.existsSync(path.join(ROOT, a.localPath.replace(/^\//, "public/")));
      return !fileOk;
    });
    if (todo.length === 0) continue;

    console.log(`\n▸ ${concept}  (${todo.length} to fetch)  queries: ${group.queries.join(" | ")}`);
    if (DRY) {
      todo.forEach((p) => console.log("     · " + p.slug));
      processed += todo.length;
      continue;
    }

    const pool = await buildPool(group.queries);
    console.log(`   pool: ${pool.length} candidates`);

    // assign distinct, not-yet-used candidates
    let pi = 0;
    const jobs: Promise<void>[] = [];
    for (const p of todo) {
      if (LIMIT && processed >= LIMIT) break;
      while (pi < pool.length && usedImages.has(pool[pi].provider + ":" + pool[pi].id)) pi++;
      const cand = pool[pi];
      if (!cand) {
        console.warn(`   ⚠ pool exhausted for ${concept}; ${p.slug} left for a re-run`);
        continue;
      }
      pi++;
      usedImages.add(cand.provider + ":" + cand.id);
      processed++;

      const localPath = `/images/blog/${p.slug}/stock.jpg`;
      const destAbs = path.join(IMG_ROOT, p.slug, "stock.jpg");
      jobs.push(
        dl(async () => {
          const ok = await download(cand, destAbs);
          if (!ok) {
            console.warn(`   ✖ download failed: ${p.slug}`);
            usedImages.delete(cand.provider + ":" + cand.id);
            return;
          }
          existing[p.slug] = {
            slug: p.slug,
            concept,
            query: group.queries[0],
            provider: cand.provider,
            id: cand.id,
            width: cand.width,
            height: cand.height,
            photographer: cand.photographer,
            photographerUrl: cand.photographerUrl,
            sourceUrl: cand.sourceUrl,
            localPath,
            alt: cand.alt,
          };
          done++;
          console.log(`   ✓ ${p.slug}  ←  ${cand.provider}/${cand.id} (${cand.photographer})`);
        }),
      );
    }
    await Promise.all(jobs);
    // persist after each concept so progress survives interruption
    saveAssignments(existing);
  }

  saveAssignments(existing);
  console.log(`\n✅ Fetched ${done} new image(s). Total assigned: ${Object.keys(existing).length}/${posts.length}.`);
  const missing = posts.filter((p) => !existing[p.slug]);
  if (missing.length) {
    console.log(`\n⚠ ${missing.length} still missing — re-run to retry:`);
    missing.slice(0, 40).forEach((p) => console.log("   - " + p.slug));
  }
}

function saveAssignments(map: Record<string, Assignment>) {
  const list = Object.values(map).sort((a, b) => a.slug.localeCompare(b.slug));
  fs.writeFileSync(ASSIGN_FILE, JSON.stringify(list, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
