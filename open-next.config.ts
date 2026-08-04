import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// The site is (almost) fully static: every blog post, category, tag, and landing
// page is pre-rendered at build time via generateStaticParams. OpenNext serves
// those prerendered pages through its *incremental cache* — so with no cache
// configured they 404 at runtime (the default in-memory override is empty in a
// fresh Worker isolate). The static-assets cache serves them straight from the
// already-deployed Workers Assets (the ASSETS binding) — no R2/KV/billing needed.
// If on-demand ISR/revalidation is added later, switch to r2IncrementalCache +
// an NEXT_INC_CACHE_R2_BUCKET binding.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
