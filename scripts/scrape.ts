/**
 * Content acquisition (migration brief Phase 1). Enumerates every post via the
 * WordPress REST API, classifies legit-vs-spam, converts kept posts to MDX at
 * their exact slug, localizes images, de-brands, and writes:
 *   - content/blog/{slug}.mdx
 *   - public/images/blog/{slug}/*
 *   - content/taxonomy.json     (category/tag slug -> display name)
 *   - docs/content-audit.md     (every keep/drop decision + reason + flags)
 *   - content-manifest.json     (via buildManifest)
 *
 * Usage:
 *   tsx scripts/scrape.ts                     # full run
 *   tsx scripts/scrape.ts --limit 3           # first 3 kept posts (dev sample)
 *   tsx scripts/scrape.ts --slugs a,b,c       # only these slugs
 *   tsx scripts/scrape.ts --no-images         # skip image downloads
 *   tsx scripts/scrape.ts --dry               # classify + audit only, no writes
 *   tsx scripts/scrape.ts --concurrency 6     # image download concurrency
 */
import fs from "node:fs";
import path from "node:path";
import pLimit from "p-limit";
import {
  fetchAllPosts,
  fetchPostsBySlugs,
  USER_AGENT,
  type WpPost,
} from "./lib/wp.js";
import { htmlToMdx, debrandText, downloadImage } from "./lib/convert.js";
import { classifyPost, type ClassifyResult } from "./lib/classify.js";
import { buildManifest } from "./lib/manifest.js";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content", "blog");
const SITE_URL = "https://russelldsmith.com";

// ---------- args ----------
const args = process.argv.slice(2);
function flag(name: string): boolean {
  return args.includes(`--${name}`);
}
function opt(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}
const LIMIT = opt("limit") ? Number(opt("limit")) : opt("sample") ? Number(opt("sample")) : Infinity;
const SLUGS = opt("slugs")?.split(",").map((s) => s.trim()).filter(Boolean);
const NO_IMAGES = flag("no-images");
const DRY = flag("dry");
const CONCURRENCY = Number(opt("concurrency") ?? 5);

// ---------- allowlist ----------
function buildAllowlist(): Set<string> {
  const set = new Set<string>();
  // Known-live inventory: lines like `- \`slug\``
  try {
    const inv = fs.readFileSync(path.join(ROOT, "docs", "live-content-inventory.md"), "utf8");
    for (const m of inv.matchAll(/^-\s+`([^`]+)`/gm)) set.add(m[1]);
  } catch {}
  // Redirect-map destinations of the form /blog/{slug}/
  try {
    const csv = fs.readFileSync(path.join(ROOT, "docs", "redirect-map.csv"), "utf8");
    for (const line of csv.split("\n").slice(1)) {
      const cols = parseCsvLine(line);
      const dest = cols[3];
      const m = dest?.match(/^\/blog\/([^/]+)\/$/);
      if (m) set.add(m[1]);
    }
  } catch {}
  return set;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

// ---------- helpers ----------
function extFromUrl(url: string, fallback = ".jpg"): string {
  const m = url.split("?")[0].match(/\.([a-z0-9]{2,5})$/i);
  return m ? `.${m[1].toLowerCase()}` : fallback;
}
function stripHtml(h: string): string {
  return h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function computeDescription(post: WpPost, markdown: string): string {
  let d = post.yoast?.description?.trim() || "";
  if (!d) d = stripHtml(post.excerptHtml);
  if (!d) d = markdown.replace(/[#>*_`~\-|[\]()!]/g, " ").replace(/\s+/g, " ").trim();
  d = debrandText(d).text.trim();
  if (d.length > 160) d = d.slice(0, 157).replace(/\s+\S*$/, "") + "…";
  return d;
}
function emitFrontmatter(entries: [string, unknown][]): string {
  const lines = ["---"];
  for (const [k, v] of entries) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) lines.push(`${k}: [${v.map((x) => JSON.stringify(String(x))).join(", ")}]`);
    else if (typeof v === "boolean") lines.push(`${k}: ${v}`);
    else lines.push(`${k}: ${JSON.stringify(String(v))}`);
  }
  lines.push("---", "");
  return lines.join("\n");
}

interface ProcessedRecord {
  slug: string;
  date: string;
  title: string;
  categories: string[];
  flags: string[];
}
interface DroppedRecord {
  slug: string;
  date: string;
  title: string;
  reason: string;
}

// ---------- main ----------
async function main() {
  const allowlist = buildAllowlist();
  console.log(`[scrape] allowlist: ${allowlist.size} known-good slugs`);

  console.log(`[scrape] fetching posts from REST API...`);
  let posts: WpPost[];
  if (SLUGS) {
    posts = await fetchPostsBySlugs(SLUGS);
    console.log(`[scrape] fetched ${posts.length} posts by slug`);
  } else {
    posts = await fetchAllPosts({
      onPage: (p, t) => console.log(`[scrape]   page ${p}/${t}`),
    });
    console.log(`[scrape] fetched ${posts.length} posts total`);
  }

  // Classify.
  const kept: { post: WpPost; cls: ClassifyResult }[] = [];
  const dropped: DroppedRecord[] = [];
  for (const post of posts) {
    const cls = classifyPost(post, allowlist);
    if (cls.keep) kept.push({ post, cls });
    else dropped.push({ slug: post.slug, date: post.date, title: post.title, reason: cls.reason });
  }
  console.log(`[scrape] classified: ${kept.length} keep, ${dropped.length} drop`);

  const toProcess = kept.slice(0, Number.isFinite(LIMIT) ? (LIMIT as number) : kept.length);
  console.log(`[scrape] processing ${toProcess.length} posts${NO_IMAGES ? " (no images)" : ""}${DRY ? " (dry run)" : ""}`);

  const taxonomy = { categories: {} as Record<string, string>, tags: {} as Record<string, string> };
  const processed: ProcessedRecord[] = [];
  const failures: { slug: string; error: string }[] = [];
  const imgLimit = pLimit(CONCURRENCY);

  if (!DRY) fs.mkdirSync(CONTENT_DIR, { recursive: true });

  for (const { post, cls } of toProcess) {
    const slug = post.slug;
    const flags = [...cls.flags];
    const postUrl = post.link || `${"https://teammovemortgage.com"}/blog/${slug}/`;

    try {
    const { markdown, images, debrandCount, flags: convFlags } = htmlToMdx(post.contentHtml, {
      slug,
      postUrl,
    });
    flags.push(...convFlags);
    if (markdown.replace(/\s+/g, "").length < 200) flags.push("thin-content");

    // Accumulate taxonomy names.
    for (const c of post.categories) taxonomy.categories[c.slug] = c.name;
    for (const t of post.tags) taxonomy.tags[t.slug] = t.name;
    const categorySlugs = post.categories.map((c) => c.slug);
    const tagSlugs = post.tags.map((t) => t.slug);

    // Full image list: featured hero candidate + body images.
    const heroCandidate = post.featured?.src
      ? {
          srcUrl: post.featured.src,
          localPath: `/images/blog/${slug}/hero${extFromUrl(post.featured.src)}`,
        }
      : null;
    const allImages = [...(heroCandidate ? [heroCandidate] : []), ...images];

    // Download + validate (rejects HTML-404s the origin serves with 200).
    const ok = new Map<string, boolean>();
    if (!DRY && !NO_IMAGES) {
      await Promise.all(
        allImages.map((im) =>
          imgLimit(async () => {
            const dest = path.join(ROOT, "public", im.localPath.replace(/^\//, ""));
            ok.set(im.localPath, await downloadImage(im.srcUrl, dest, USER_AGENT));
          }),
        ),
      );
    } else {
      allImages.forEach((im) => ok.set(im.localPath, true));
    }

    // Drop failed body images from the markdown — never ship a broken <img>.
    let body = markdown;
    for (const im of images.filter((i) => ok.get(i.localPath) === false)) {
      const esc = im.localPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      body = body.replace(new RegExp(`!\\[[^\\]]*\\]\\(${esc}\\)`, "g"), "");
    }
    body = body.replace(/\n{3,}/g, "\n\n").trim() + "\n";

    // Hero: featured if it downloaded, else first valid body image.
    let hero: string | undefined;
    let heroAlt: string | undefined;
    if (heroCandidate && ok.get(heroCandidate.localPath)) {
      hero = heroCandidate.localPath;
      heroAlt = debrandText(post.featured!.alt || post.title).text;
    } else {
      const firstOk = images.find((im) => ok.get(im.localPath));
      if (firstOk) {
        hero = firstOk.localPath;
        heroAlt = debrandText(post.title).text;
        flags.push("hero-from-body");
      } else {
        flags.push("no-hero");
      }
    }
    const skipped = [...ok.values()].filter((v) => !v).length;
    if (skipped) flags.push(`images-skipped:${skipped}`);

    // Write MDX.
    const title = debrandText(post.title).text;
    const description = computeDescription(post, body);
    const frontmatter = emitFrontmatter([
      ["title", title],
      ["slug", slug],
      ["description", description],
      ["date", post.date],
      ["updated", post.modified !== post.date ? post.modified : undefined],
      ["categories", categorySlugs],
      ["tags", tagSlugs],
      ["hero", hero],
      ["heroAlt", hero ? heroAlt : undefined],
      ["canonical", `${SITE_URL}/blog/${slug}/`],
      ["source_url", postUrl],
    ]);
    if (!DRY) fs.writeFileSync(path.join(CONTENT_DIR, `${slug}.mdx`), frontmatter + "\n" + body);

    processed.push({ slug, date: post.date, title, categories: categorySlugs, flags });
    console.log(
      `[scrape]   ✓ ${slug}  (${categorySlugs.join(", ") || "—"})  ${debrandCount ? `debrand×${debrandCount} ` : ""}${flags.length ? `[${flags.join(", ")}]` : ""}`,
    );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      failures.push({ slug, error: msg });
      console.error(`[scrape]   ✗ ${slug}: ${msg}`);
    }
  }

  if (!DRY) {
    fs.writeFileSync(
      path.join(ROOT, "content", "taxonomy.json"),
      JSON.stringify(taxonomy, null, 2) + "\n",
    );
    writeAudit(processed, dropped, kept.length, posts.length);
    const manifest = buildManifest({ write: true });
    console.log(
      `[scrape] manifest: ${manifest.counts.posts} posts, ${manifest.counts.categories} categories, ${manifest.counts.tags} tags, ${manifest.allPaths.length} live paths`,
    );
  }

  if (failures.length) {
    console.log(`[scrape] ${failures.length} posts FAILED to process:`);
    for (const f of failures) console.log(`   - ${f.slug}: ${f.error}`);
  }
  console.log(
    `\n[scrape] DONE. processed=${processed.length} dropped=${dropped.length} failed=${failures.length}`,
  );
  const review = processed.filter((p) => p.flags.some((f) => f.startsWith("still-mentions-team-move") || f.startsWith("contains-phone") || f === "thin-content"));
  if (review.length) console.log(`[scrape] ${review.length} posts flagged for manual review (see docs/content-audit.md)`);
}

function writeAudit(
  processed: ProcessedRecord[],
  dropped: DroppedRecord[],
  keptCount: number,
  totalCount: number,
) {
  const dropReasons = new Map<string, number>();
  for (const d of dropped) {
    const key = d.reason.split(":")[0];
    dropReasons.set(key, (dropReasons.get(key) ?? 0) + 1);
  }
  const lines: string[] = [];
  lines.push(`# Content migration audit`, ``);
  lines.push(`_Generated by \`scripts/scrape.ts\`. Every fetched post's keep/drop decision is logged here (CLAUDE.md rule 6: log, never silently drop)._`, ``);
  lines.push(`- **Fetched:** ${totalCount}`);
  lines.push(`- **Kept (legit):** ${keptCount}`);
  lines.push(`- **Processed this run:** ${processed.length}`);
  lines.push(`- **Dropped (spam/junk):** ${dropped.length}`, ``);
  lines.push(`## Drop reasons`, ``);
  for (const [reason, n] of [...dropReasons.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(`- \`${reason}\`: ${n}`);
  }
  lines.push(``, `## Dropped posts`, ``, `| slug | date | reason |`, `| --- | --- | --- |`);
  for (const d of dropped.sort((a, b) => (a.date < b.date ? 1 : -1))) {
    lines.push(`| ${d.slug} | ${d.date} | ${d.reason} |`);
  }
  const flagged = processed.filter((p) => p.flags.length);
  lines.push(``, `## Kept posts flagged for review (${flagged.length})`, ``, `| slug | date | flags |`, `| --- | --- | --- |`);
  for (const p of flagged) lines.push(`| ${p.slug} | ${p.date} | ${p.flags.join(", ")} |`);
  lines.push(``, `## All kept posts (${processed.length})`, ``, `| slug | date | categories |`, `| --- | --- | --- |`);
  for (const p of processed.sort((a, b) => (a.date < b.date ? 1 : -1))) {
    lines.push(`| ${p.slug} | ${p.date} | ${p.categories.join(", ")} |`);
  }
  fs.writeFileSync(path.join(ROOT, "docs", "content-audit.md"), lines.join("\n") + "\n");
}

main().catch((err) => {
  console.error("[scrape] FATAL:", err);
  process.exit(1);
});
