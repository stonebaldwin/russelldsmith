import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Content is migrated as MDX and rendered with next-mdx-remote at build time,
  // so no @next/mdx page-extension wiring is required here.
  reactStrictMode: true,
  images: {
    // Blog/hero images are migrated locally into /public/images/blog/**.
    // next/image optimization is served by the Cloudflare IMAGES binding in prod.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;

// Enables getCloudflareContext() during `next dev` (OpenNext Cloudflare adapter).
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
