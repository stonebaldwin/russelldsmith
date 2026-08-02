import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// The site is (almost) fully static: every blog post and landing page is
// pre-rendered at build time via generateStaticParams. We therefore don't
// need an R2-backed incremental cache to launch — the default in-memory
// override is fine. If ISR/on-demand revalidation is added later, wire up
// r2IncrementalCache here and add the NEXT_INC_CACHE_R2_BUCKET binding in
// wrangler.jsonc.
export default defineCloudflareConfig({});
