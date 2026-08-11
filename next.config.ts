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
  // Canonicalize www → apex with a permanent (308) redirect, preserving path +
  // query. www.russelldsmith.com is bound to this Worker as a custom domain
  // (wrangler.jsonc) so these requests reach Next and get redirected.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.russelldsmith.com" }],
        destination: "https://russelldsmith.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

// Enables getCloudflareContext() during `next dev` (OpenNext Cloudflare adapter).
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
