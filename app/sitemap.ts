import type { MetadataRoute } from "next";
import { getAllPosts, getAllCategories, SITE_URL } from "@/lib/content";
import { LANDING_PAGES } from "@/lib/routes";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/blog/`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about/`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/contact/`, changeFrequency: "yearly", priority: 0.5 },
  ];

  for (const p of LANDING_PAGES) {
    entries.push({ url: `${SITE_URL}/${p.slug}/`, changeFrequency: "monthly", priority: 0.8 });
  }
  for (const post of getAllPosts()) {
    entries.push({
      url: `${SITE_URL}${post.url}`,
      lastModified: post.updated || post.date,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }
  for (const c of getAllCategories()) {
    entries.push({ url: `${SITE_URL}/blog/category/${c.slug}/`, changeFrequency: "weekly", priority: 0.4 });
  }
  // Tag archives are intentionally excluded — they're noindex (thin/near-duplicate),
  // so a sitemap listing would just create "noindex URL in sitemap" warnings.
  return entries;
}
