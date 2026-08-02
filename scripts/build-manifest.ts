/**
 * Regenerates content-manifest.json from content/ + static routes.
 *   tsx scripts/build-manifest.ts
 */
import { buildManifest } from "./lib/manifest.js";

const m = buildManifest({ write: true });
console.log(
  `[manifest] ${m.counts.posts} posts (${m.counts.recovered} recovered), ` +
    `${m.counts.categories} categories, ${m.counts.tags} tags, ` +
    `${m.counts.landing} landing → ${m.allPaths.length} live paths`,
);
