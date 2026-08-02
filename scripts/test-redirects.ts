/**
 * Build-time redirect test (migration brief section 7.3). Fails the build on any
 * dead destination. Asserts, for every legacy URL that carries link equity:
 *   1. the shipped Worker and lib/redirects.ts map it identically (no drift)
 *   2. it maps to the destination the CSV intends
 *   3. that destination is a LIVE 200 page (present in content-manifest.json)
 * plus representative Gen-1 / Gen-2 / double-blog / category samples built from
 * real live slugs.
 *
 *   tsx scripts/test-redirects.ts   (run after gen:redirect + content:manifest)
 */
import fs from "node:fs";
import path from "node:path";
import { mapPath as libMapPath } from "../lib/redirects.js";
import { mapPath as workerMapPath } from "../workers/redirect/worker.js";
import { buildMergedExplicit, readRedirectRows } from "./lib/redirect-map.js";

const manifestPath = path.join(process.cwd(), "content-manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("✗ content-manifest.json missing — run `npm run content:manifest` first.");
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const live = new Set<string>(manifest.allPaths);
const merged = buildMergedExplicit();
const rows = readRedirectRows();

interface Failure {
  kind: string;
  legacy: string;
  detail: string;
}
const failures: Failure[] = [];
let checks = 0;

function check(cond: boolean, kind: string, legacy: string, detail: string) {
  checks++;
  if (!cond) failures.push({ kind, legacy, detail });
}

// 1. Every legacy_path in the CSV.
for (const row of rows) {
  const wOut = workerMapPath(row.legacy);
  const lOut = libMapPath(row.legacy, merged);
  check(wOut === lOut, "worker/lib-drift", row.legacy, `worker=${wOut} lib=${lOut}`);
  check(wOut === row.dest, "csv-mismatch", row.legacy, `mapped=${wOut} expected=${row.dest}`);
  check(live.has(wOut), "dead-destination", row.legacy, `-> ${wOut} (not a live page)`);
}

// 2. Representative generation samples built from REAL live slugs.
const samplePosts = (manifest.posts as { slug: string }[]).slice(0, 30);
for (const { slug } of samplePosts) {
  const cases: [string, string][] = [
    [`/blog/2020/02/17/${slug}/`, `/blog/${slug}/`], // Gen 2
    [`/2015/05/22/${slug}/`, `/blog/${slug}/`], // Gen 1
    [`/blog/blog/${slug}/`, `/blog/${slug}/`], // double-blog
  ];
  for (const [legacy, expected] of cases) {
    const out = workerMapPath(legacy);
    check(out === expected, "rule-map", legacy, `-> ${out} (expected ${expected})`);
    check(out === libMapPath(legacy, merged), "worker/lib-drift", legacy, `lib disagrees`);
    check(live.has(out), "dead-destination", legacy, `-> ${out} (not a live page)`);
  }
}

// 3. Category-root rule from real categories.
for (const c of (manifest.categories as { slug: string }[]).slice(0, 12)) {
  const legacy = `/category/${c.slug}/`;
  const out = workerMapPath(legacy);
  check(out === `/blog/category/${c.slug}/`, "rule-map", legacy, `-> ${out}`);
  check(live.has(out), "dead-destination", legacy, `-> ${out} (not a live page)`);
}

// ---- report ----
if (failures.length) {
  const byKind = new Map<string, Failure[]>();
  for (const f of failures) {
    if (!byKind.has(f.kind)) byKind.set(f.kind, []);
    byKind.get(f.kind)!.push(f);
  }
  console.error(`\n✗ REDIRECT TEST FAILED — ${failures.length}/${checks} checks failed\n`);
  for (const [kind, list] of byKind) {
    console.error(`  [${kind}] ${list.length}`);
    for (const f of list.slice(0, 20)) console.error(`     ${f.legacy}  ${f.detail}`);
    if (list.length > 20) console.error(`     … and ${list.length - 20} more`);
  }
  const dead = failures.filter((f) => f.kind === "dead-destination");
  if (dead.length) {
    console.error(
      `\n  ${dead.length} DEAD DESTINATIONS. If these are REBUILD posts, run ` +
        `\`npm run content:recover\` to rebuild them from the Wayback Machine.\n`,
    );
  }
  process.exit(1);
}

console.log(
  `\n✓ redirect test passed — ${checks} checks, ${rows.length} legacy URLs, ` +
    `0 dead destinations. Every equity-carrying URL resolves to a live page.\n`,
);
