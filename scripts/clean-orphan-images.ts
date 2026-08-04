/**
 * Delete orphaned blog images — files under public/images/blog/** that nothing
 * references anymore (chiefly the old low-res WordPress thumbnails left behind
 * after the stock-image refresh).
 *
 *   tsx scripts/clean-orphan-images.ts          # dry run (report only)
 *   tsx scripts/clean-orphan-images.ts --delete # actually remove
 *
 * A file is KEPT if any /images/blog/... reference to it exists in the MDX
 * content or the app/components/lib source. Non-image files (e.g.
 * stock-credits.json) are always kept.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const IMG_ROOT = path.join(ROOT, "public", "images", "blog");
const DELETE = process.argv.includes("--delete");

const IMG_EXT = /\.(jpe?g|png|webp|gif|avif|svg)$/i;

// ---- 1. collect every referenced /images/blog/... path ----------------------
const referenced = new Set<string>();
const REF_RE = /\/images\/blog\/[A-Za-z0-9._\-/]+\.(?:jpe?g|png|webp|gif|avif|svg)/gi;

function scanDir(dir: string, exts: RegExp) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".open-next") continue;
      scanDir(p, exts);
    } else if (exts.test(entry.name)) {
      const text = fs.readFileSync(p, "utf8");
      for (const m of text.matchAll(REF_RE)) referenced.add(decodeURIComponent(m[0]));
    }
  }
}

scanDir(path.join(ROOT, "content"), /\.(mdx|md|json)$/);
for (const d of ["app", "components", "lib"]) {
  const dir = path.join(ROOT, d);
  if (fs.existsSync(dir)) scanDir(dir, /\.(tsx?|jsx?|css|json)$/);
}

// ---- 2. walk the image tree, classify orphans -------------------------------
interface Orphan {
  abs: string;
  rel: string; // site path /images/blog/...
  size: number;
}
const orphans: Orphan[] = [];
let kept = 0;

function walkImages(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkImages(abs);
      continue;
    }
    if (!IMG_EXT.test(entry.name)) continue; // keep non-image files (credits json, etc.)
    const rel = "/" + path.relative(path.join(ROOT, "public"), abs).split(path.sep).join("/");
    if (referenced.has(rel)) {
      kept++;
    } else {
      orphans.push({ abs, rel, size: fs.statSync(abs).size });
    }
  }
}
if (fs.existsSync(IMG_ROOT)) walkImages(IMG_ROOT);

// ---- 3. report / delete -----------------------------------------------------
const totalBytes = orphans.reduce((s, o) => s + o.size, 0);
const mb = (b: number) => (b / (1024 * 1024)).toFixed(1) + "MB";

console.log(`Referenced image paths: ${referenced.size}`);
console.log(`Kept (referenced): ${kept}`);
console.log(`Orphans: ${orphans.length}  (${mb(totalBytes)})`);
console.log("\nSample orphans:");
orphans.slice(0, 15).forEach((o) => console.log("  " + o.rel));

// safety: make sure we never delete a stock.jpg (all are referenced as heroes)
const badStock = orphans.filter((o) => /\/stock\.jpg$/.test(o.rel));
if (badStock.length) {
  console.error(`\n✖ ABORT: ${badStock.length} stock.jpg files look orphaned — refs scan is wrong. Not deleting.`);
  process.exit(1);
}

if (DELETE) {
  let removed = 0;
  const emptyDirs = new Set<string>();
  for (const o of orphans) {
    fs.rmSync(o.abs);
    emptyDirs.add(path.dirname(o.abs));
    removed++;
  }
  // remove now-empty slug dirs
  let prunedDirs = 0;
  for (const d of emptyDirs) {
    try {
      if (fs.readdirSync(d).length === 0) {
        fs.rmdirSync(d);
        prunedDirs++;
      }
    } catch {
      /* ignore */
    }
  }
  console.log(`\n🗑  Deleted ${removed} files (${mb(totalBytes)}), pruned ${prunedDirs} empty dirs.`);
} else {
  console.log(`\n(dry run — re-run with --delete to remove the ${orphans.length} orphans)`);
}
