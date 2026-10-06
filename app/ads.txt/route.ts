import { ADSENSE_PUBLISHER_ID } from "@/lib/adsense";

// The publisher ID is embedded at build time, like the verification meta tag.
export const dynamic = "force-static";

export function GET() {
  if (!ADSENSE_PUBLISHER_ID) {
    return new Response("AdSense publisher ID is not configured.\n", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(`google.com, ${ADSENSE_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
