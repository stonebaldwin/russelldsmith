/**
 * Pulls ALL media off the old teammovemortgage.com marketing site so nothing is
 * lost — especially the personal photos of Russell and his mortgage team. Crawls
 * the homepage + every marketing .php page + the CSS, extracts every image /
 * font / video / PDF reference (incl. background-image, srcset, lazy data-*, and
 * slick-carousel slides), downloads them locally, and writes a manifest.
 *
 *   tsx scripts/scrape-media.ts
 *
 * Output:
 *   public/media/site/*     images
 *   public/fonts/*          web fonts (FuturaPT, etc.)
 *   public/media/docs/*     pdfs
 *   scripts/.cache/media-manifest.json
 */
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import { fetchWithRetry } from "./lib/wp.js";

const ORIGIN = "https://teammovemortgage.com";
const ROOT = process.cwd();
const IMG_DIR = path.join(ROOT, "public", "media", "site");
const FONT_DIR = path.join(ROOT, "public", "fonts");
const DOC_DIR = path.join(ROOT, "public", "media", "docs");

const PAGES = [
  "/", "/index.php",
  "/about-team-move.php", "/contact-team-move.php",
  "/loan-types.php", "/va-loans.php", "/usda-loans.php", "/fha-loans.php",
  "/conventional-loans.php", "/jumbo-loans.php", "/construction-loans.php",
  "/renovation-loans.php", "/refinance-loans.php", "/heloc-loans.php",
  "/bridge-loans.php", "/lot-loans.php", "/second-home-loans.php",
  "/rental-property-loans.php", "/down-payment-assistance.php",
  "/mortgage-calculators.php",
  "/our-team/", "/our-process/", "/reverse-mortgages-nc-sc/",
];
const CSS_FILES = ["/css/style.css", "/css/style2.css", "/css/form.css", "/css/responsive.css"];

const found = new Map<string, Set<string>>(); // absolute url -> source pages
function add(url: string, source: string, base: string) {
  if (!url) return;
  url = url.trim().replace(/^['"]|['"]$/g, "");
  if (!url || url.startsWith("data:") || url.startsWith("#")) return;
  let abs: string;
  try {
    abs = new URL(url, base).toString();
  } catch {
    return;
  }
  abs = abs.split("#")[0];
  // Only same-origin assets.
  try {
    const h = new URL(abs).host.replace(/^www\./, "");
    if (h !== "teammovemortgage.com") return;
  } catch {
    return;
  }
  if (!found.has(abs)) found.set(abs, new Set());
  found.get(abs)!.add(source);
}

const ASSET_RE = /\.(png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|eot|mp4|webm|pdf)(\?|$)/i;

function extractFromHtml(html: string, pageUrl: string) {
  const $ = cheerio.load(html);
  $("img").each((_, el) => {
    const $i = $(el);
    add($i.attr("src") || "", pageUrl, pageUrl);
    add($i.attr("data-src") || "", pageUrl, pageUrl);
    add($i.attr("data-lazy-src") || "", pageUrl, pageUrl);
    for (const key of ["srcset", "data-srcset", "data-lazy-srcset"]) {
      const ss = $i.attr(key);
      if (ss) ss.split(",").forEach((c) => add(c.trim().split(/\s+/)[0], pageUrl, pageUrl));
    }
  });
  $("source").each((_, el) => {
    add($(el).attr("src") || "", pageUrl, pageUrl);
    const ss = $(el).attr("srcset");
    if (ss) ss.split(",").forEach((c) => add(c.trim().split(/\s+/)[0], pageUrl, pageUrl));
  });
  $("video").each((_, el) => {
    add($(el).attr("src") || "", pageUrl, pageUrl);
    add($(el).attr("poster") || "", pageUrl, pageUrl);
  });
  $("link[rel~='icon'], link[rel='apple-touch-icon'], link[rel='mask-icon']").each((_, el) =>
    add($(el).attr("href") || "", pageUrl, pageUrl),
  );
  // background-image / data-bg style attributes
  $("[style]").each((_, el) => {
    const style = $(el).attr("style") || "";
    for (const m of style.matchAll(/url\(([^)]+)\)/gi)) add(m[1], pageUrl, pageUrl);
  });
  $("[data-bg], [data-background], [data-background-image], [data-parallax-image]").each((_, el) => {
    for (const key of ["data-bg", "data-background", "data-background-image", "data-parallax-image"]) {
      add($(el).attr(key) || "", pageUrl, pageUrl);
    }
  });
  // any anchor/href pointing at a downloadable asset (e.g. PDFs)
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (ASSET_RE.test(href)) add(href, pageUrl, pageUrl);
  });
  // raw url(...) anywhere in inline <style> blocks
  $("style").each((_, el) => {
    const css = $(el).text();
    for (const m of css.matchAll(/url\(([^)]+)\)/gi)) add(m[1], pageUrl, pageUrl);
  });
}

function destFor(absUrl: string): string {
  const u = new URL(absUrl);
  let name = decodeURIComponent(u.pathname.split("/").filter(Boolean).pop() || "asset");
  name = name.replace(/[^a-zA-Z0-9._-]+/g, "-");
  if (/\.(woff2?|ttf|otf|eot)$/i.test(name)) return path.join(FONT_DIR, name);
  if (/\.pdf$/i.test(name)) return path.join(DOC_DIR, name);
  return path.join(IMG_DIR, name);
}

async function download(absUrl: string, dest: string): Promise<{ ok: boolean; bytes: number }> {
  if (fs.existsSync(dest)) return { ok: true, bytes: fs.statSync(dest).size };
  try {
    const res = await fetchWithRetry(absUrl, { timeoutMs: 45000, retries: 3 });
    if (!res.ok) return { ok: false, bytes: 0 };
    const buf = Buffer.from(await res.arrayBuffer());
    // Reject the origin's HTML 404 page served with a 200.
    const head = buf.subarray(0, 32).toString("latin1").trim().toLowerCase();
    if (head.startsWith("<!doctype") || head.startsWith("<html")) return { ok: false, bytes: 0 };
    if (buf.byteLength < 100) return { ok: false, bytes: 0 };
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    return { ok: true, bytes: buf.byteLength };
  } catch {
    return { ok: false, bytes: 0 };
  }
}

async function main() {
  console.log(`[media] crawling ${PAGES.length} pages + ${CSS_FILES.length} stylesheets ...`);
  for (const p of PAGES) {
    const url = ORIGIN + p;
    try {
      const res = await fetchWithRetry(url, { timeoutMs: 40000, retries: 2 });
      if (!res.ok) {
        console.log(`   · ${p} -> HTTP ${res.status} (skip)`);
        continue;
      }
      extractFromHtml(await res.text(), url);
      console.log(`   · ${p} -> ok (${found.size} assets so far)`);
    } catch {
      console.log(`   · ${p} -> fetch failed (skip)`);
    }
  }
  for (const c of CSS_FILES) {
    const url = ORIGIN + c;
    try {
      const res = await fetchWithRetry(url, { timeoutMs: 40000, retries: 2 });
      if (!res.ok) continue;
      const css = await res.text();
      for (const m of css.matchAll(/url\(([^)]+)\)/gi)) add(m[1], c, url);
    } catch {
      /* skip */
    }
  }

  const assets = [...found.keys()].filter((u) => ASSET_RE.test(u));
  console.log(`[media] downloading ${assets.length} assets ...`);
  const manifest: { url: string; localPath: string; bytes: number; sources: string[] }[] = [];
  let okCount = 0;
  for (const url of assets) {
    const dest = destFor(url);
    const { ok, bytes } = await download(url, dest);
    if (ok) {
      okCount++;
      manifest.push({
        url,
        localPath: "/" + path.relative(path.join(ROOT, "public"), dest).replace(/\\/g, "/"),
        bytes,
        sources: [...(found.get(url) || [])],
      });
    }
  }

  fs.mkdirSync(path.join(ROOT, "scripts", ".cache"), { recursive: true });
  fs.writeFileSync(
    path.join(ROOT, "scripts", ".cache", "media-manifest.json"),
    JSON.stringify(manifest.sort((a, b) => b.bytes - a.bytes), null, 2),
  );
  console.log(`\n[media] downloaded ${okCount}/${assets.length} assets.`);
  console.log(`[media] images: ${fs.existsSync(IMG_DIR) ? fs.readdirSync(IMG_DIR).length : 0}, fonts: ${fs.existsSync(FONT_DIR) ? fs.readdirSync(FONT_DIR).length : 0}`);
  console.log(`[media] manifest: scripts/.cache/media-manifest.json`);
}

main().catch((e) => {
  console.error("[media] FATAL", e);
  process.exit(1);
});
