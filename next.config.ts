import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Content is migrated as MDX and rendered with next-mdx-remote at build time,
  // so no @next/mdx page-extension wiring is required here.
  reactStrictMode: true,
  // Old WordPress URLs all end in a trailing slash (/blog/{slug}/). Match them
  // exactly so every 301 lands on a real 200 with no extra normalization hop.
  trailingSlash: true,
  images: {
    // Blog/hero images are migrated locally into /public/images/blog/**.
    // next/image optimization is served by the Cloudflare IMAGES binding in prod.
    formats: ["image/avif", "image/webp"],
  },
  // NB: www → apex canonicalization is handled in middleware.ts (single clean
  // 301, exact path + query). next.config redirects() with an absolute
  // destination mishandles the root path (emits a literal ":path*").
};

export default nextConfig;

// Enables getCloudflareContext() during `next dev` (OpenNext Cloudflare adapter).
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
