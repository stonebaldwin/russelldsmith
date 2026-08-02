/**
 * Builds content-manifest.json — the canonical list of every live 200 path on
 * the new site (posts + landing pages + category/tag archives + core pages).
 * The redirect test (scripts/test-redirects.ts) asserts every legacy_path in
 * redirect-map.csv maps to a path that appears here. DRY: both the scraper and
 * `npm run content:manifest` call buildManifest().
 */
import fs from "node:fs";
import path from "node:path";
import {
  getAllPosts,
  getAllCategories,
  getAllTags,
  SITE_URL,
} from "../../lib/content.js";
import { CORE_ROUTES, LANDING_PAGES } from "../../lib/routes.js";

export interface Manifest {
  generatedAt: string;
  siteUrl: string;
  counts: {
    posts: number;
    recovered: number;
    categories: number;
    tags: number;
    landing: number;
  };
  posts: {
    slug: string;
    url: string;
    date: string;
    categories: string[];
    tags: string[];
    recovered: boolean;
    hero: boolean;
    source_url?: string;
  }[];
  categories: { slug: string; url: string; count: number }[];
  tags: { slug: string; url: string; count: number }[];
  landing: { slug: string; url: string }[];
  /** Every 200 path on the site — the redirect test's source of truth. */
  allPaths: string[];
}

export function buildManifest(opts: { write?: boolean; generatedAt?: string } = {}): Manifest {
  const posts = getAllPosts();
  const categories = getAllCategories();
  const tags = getAllTags();

  const postPaths = posts.map((p) => p.url);
  const categoryPaths = categories.map((c) => `/blog/category/${c.slug}/`);
  const tagPaths = tags.map((t) => `/blog/tag/${t.slug}/`);
  const landingPaths = LANDING_PAGES.map((l) => `/${l.slug}/`);

  const allPaths = Array.from(
    new Set([...CORE_ROUTES, ...landingPaths, ...postPaths, ...categoryPaths, ...tagPaths]),
  ).sort();

  const manifest: Manifest = {
    generatedAt: opts.generatedAt ?? new Date().toISOString(),
    siteUrl: SITE_URL,
    counts: {
      posts: posts.length,
      recovered: posts.filter((p) => p.recovered).length,
      categories: categories.length,
      tags: tags.length,
      landing: LANDING_PAGES.length,
    },
    posts: posts.map((p) => ({
      slug: p.slug,
      url: p.url,
      date: p.date,
      categories: p.categories,
      tags: p.tags,
      recovered: !!p.recovered,
      hero: !!p.hero,
      source_url: p.source_url,
    })),
    categories: categories.map((c) => ({ slug: c.slug, url: `/blog/category/${c.slug}/`, count: c.count })),
    tags: tags.map((t) => ({ slug: t.slug, url: `/blog/tag/${t.slug}/`, count: t.count })),
    landing: LANDING_PAGES.map((l) => ({ slug: l.slug, url: `/${l.slug}/` })),
    allPaths,
  };

  if (opts.write) {
    const out = path.join(process.cwd(), "content-manifest.json");
    fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + "\n");
  }
  return manifest;
}
