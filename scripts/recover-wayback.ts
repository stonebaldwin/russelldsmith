/**
 * Phase 2 — recover deleted posts from the Wayback Machine (migration brief §5).
 *
 * For each `action = REBUILD+redirect` row whose destination slug is NOT already
 * live (most were recovered directly by the REST-API crawl), find the newest 200
 * snapshot of the ORIGINAL legacy URL via the CDX API, fetch the raw archived
 * HTML (id_), extract the post, and republish as MDX at the original slug so the
 * redirect resolves and the backlinks land on real, on-topic content.
 *
 *   tsx scripts/recover-wayback.ts            # recover all missing REBUILD posts
 *   tsx scripts/recover-wayback.ts --force    # re-recover even if present
 */
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import { readRedirectRows } from "./lib/redirect-map.js";
import { htmlToMdx, debrandText, downloadImage } from "./lib/convert.js";
import { fetchWithRetry, USER_AGENT, decodeEntities } from "./lib/wp.js";
import { buildManifest } from "./lib/manifest.js";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content", "blog");
const SITE_URL = "https://russelldsmith.com";
const FORCE = process.argv.includes("--force");

interface Snapshot {
  timestamp: string;
  original: string;
}

async function cdxLatest(legacyUrl: string): Promise<Snapshot | null> {
  const target = ("teammovemortgage.com" + legacyUrl).replace(/\/$/, "") + "*";
  const api =
    `http://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(target)}` +
    `&output=json&filter=statuscode:200&limit=8&sort=reverse&collapse=digest`;
  const res = await fetchWithRetry(api, { timeoutMs: 60000 });
  const rows = (await res.json()) as string[][];
  if (!Array.isArray(rows) || rows.length < 2) return null;
  // rows[0] is the header; first data row is the newest (sort=reverse).
  const first = rows[1];
  return { timestamp: first[1], original: first[2] };
}

function firstText($: cheerio.CheerioAPI, selectors: string[]): string {
  for (const sel of selectors) {
    const el = $(sel).first();
    if (el.length && el.text().trim()) return el.text().trim();
  }
  return "";
}

function extractContentHtml($: cheerio.CheerioAPI): string {
  const selectors = [
    ".entry-content-wrapper",
    ".entry-content",
    ".post_content",
    "article .content",
    ".template-blog .post-entry",
    "article",
    "#main .content",
  ];
  for (const sel of selectors) {
    const el = $(sel).first();
    if (el.length && el.text().trim().length > 200) return el.html() || "";
  }
  return "";
}

async function recover(legacyPath: string, slug: string): Promise<boolean> {
  const snap = await cdxLatest(legacyPath);
  if (!snap) {
    console.error(`   ✗ ${slug}: no Wayback snapshot found`);
    return false;
  }
  const rawUrl = `https://web.archive.org/web/${snap.timestamp}id_/${snap.original}`;
  const res = await fetchWithRetry(rawUrl, { timeoutMs: 60000 });
  if (!res.ok) {
    console.error(`   ✗ ${slug}: snapshot fetch ${res.status}`);
    return false;
  }
  const html = await res.text();
  const $ = cheerio.load(html);
  // Drop the Wayback toolbar + injected chrome before extraction.
  $("#wm-ipp-base, #wm-ipp, #donato, script, style").remove();

  const rawTitle =
    $('meta[property="og:title"]').attr("content") ||
    firstText($, ["h1.entry-title", "h1.post-title", "h1"]) ||
    $("title").text() ||
    "";
  // Strip the site's SEO title suffix (" - Local Lenders … | 5 Star").
  const cleanedTitle = decodeEntities(rawTitle).split(/\s+[|–]\s+|\s+-\s+/)[0].trim();
  const title = debrandText(cleanedTitle).text;

  const rawDesc =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    "";

  const contentHtml = extractContentHtml($);
  if (!contentHtml || contentHtml.replace(/<[^>]+>/g, "").trim().length < 150) {
    console.error(`   ✗ ${slug}: could not extract post body from snapshot`);
    return false;
  }

  // Date from the legacy path (/YYYY/MM/DD/...), reliable and stable.
  const dm = legacyPath.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
  const date = dm ? `${dm[1]}-${dm[2]}-${dm[3]}` : "2016-01-01";

  // Categories from archived category links.
  const categories = Array.from(
    new Set(
      $('a[href*="/category/"]')
        .toArray()
        .map((a) => ($(a).attr("href") || "").match(/\/category\/([^/]+)\//)?.[1])
        .filter((s): s is string => !!s && s !== "uncategorized"),
    ),
  ).slice(0, 5);

  const postUrl = `https://teammovemortgage.com${legacyPath}`;
  const { markdown: rawMarkdown, images } = htmlToMdx(contentHtml, { slug, postUrl });
  // Strip a leading WP permalink title heading (a Wayback/entry-content artifact).
  const markdown = rawMarkdown
    .replace(/^#{1,6}\s+\[[^\]]*\]\([^)]*Permanent Link[^)]*\)\s*\n+/i, "")
    // Strip the WP post-meta line ("June 28, 2015/in [Category](…), …").
    .replace(/^[A-Z][a-z]+ \d{1,2}, \d{4}\/in [^\n]*\n+/, "");

  // Download images — archived images often 404 at the origin; failures are
  // stripped from the body by the same logic as the scraper (best-effort).
  let body = markdown;
  for (const im of images) {
    const dest = path.join(ROOT, "public", im.localPath.replace(/^\//, ""));
    const ok = await downloadImage(im.srcUrl, dest, USER_AGENT);
    if (!ok) {
      const esc = im.localPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      body = body.replace(new RegExp(`!\\[[^\\]]*\\]\\(${esc}\\)`, "g"), "");
    }
  }
  body = body.replace(/\n{3,}/g, "\n\n").trim() + "\n";

  let description = debrandText(decodeEntities(rawDesc).trim()).text;
  if (!description) description = body.replace(/[#>*_`~\-|[\]()!]/g, " ").replace(/\s+/g, " ").trim().slice(0, 157) + "…";
  if (description.length > 160) description = description.slice(0, 157) + "…";

  const fm = [
    "---",
    `title: ${JSON.stringify(title)}`,
    `slug: ${JSON.stringify(slug)}`,
    `description: ${JSON.stringify(description)}`,
    `date: ${JSON.stringify(date)}`,
    `categories: [${categories.map((c) => JSON.stringify(c)).join(", ")}]`,
    `tags: []`,
    `canonical: ${JSON.stringify(`${SITE_URL}/blog/${slug}/`)}`,
    `source_url: ${JSON.stringify(postUrl)}`,
    `recovered: true`,
    "---",
    "",
  ].join("\n");

  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  fs.writeFileSync(path.join(CONTENT_DIR, `${slug}.mdx`), fm + "\n" + body);
  console.log(`   ✓ ${slug}  (recovered from ${snap.timestamp}, cats: ${categories.join(", ") || "—"})`);
  return true;
}

async function main() {
  const rebuild = readRedirectRows().filter((r) => r.action === "REBUILD+redirect");
  console.log(`[recover] ${rebuild.length} REBUILD posts in the map`);

  let recovered = 0;
  let skipped = 0;
  let failed = 0;
  for (const row of rebuild) {
    const slug = row.dest.match(/^\/blog\/([^/]+)\/$/)?.[1];
    if (!slug) continue;
    if (!FORCE && fs.existsSync(path.join(CONTENT_DIR, `${slug}.mdx`))) {
      skipped++;
      continue;
    }
    console.log(`[recover] recovering ${slug} ...`);
    const ok = await recover(row.legacy, slug);
    if (ok) recovered++;
    else failed++;
  }

  console.log(`\n[recover] recovered=${recovered} skipped(already live)=${skipped} failed=${failed}`);
  if (recovered) {
    buildManifest({ write: true });
    console.log(`[recover] manifest updated.`);
  }
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error("[recover] FATAL:", err);
  process.exit(1);
});
