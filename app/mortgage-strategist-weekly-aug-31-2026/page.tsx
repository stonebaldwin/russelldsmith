import type { Metadata } from "next";
import { WeeklyVideo } from "@/components/WeeklyVideo";

/**
 * Mortgage Strategist Weekly — August 31, 2026.
 *
 * One page per episode, each on its own dated slug so a link keeps pointing at
 * the week it was sent for. The year is part of the slug on purpose: "aug-31"
 * alone collides the next time August 31 comes around.
 *
 * "Unlisted" means: meta-noindex, absent from app/sitemap.ts, and not linked
 * from the header, footer, or any other page — reachable only with the URL. It
 * is deliberately NOT added to robots.txt, since a Disallow there would stop
 * crawlers from ever reading the noindex tag.
 *
 * To add next week: copy this file to a new dated folder, point it at the new
 * asset, and register that asset in app/api/video/[file]/route.ts.
 */

const SLUG = "mortgage-strategist-weekly-aug-31-2026";
const TITLE = "Mortgage Strategist Weekly — August 31, 2026";

export const metadata: Metadata = {
  title: TITLE,
  description: "Russell Smith's weekly mortgage update for the week of August 31, 2026.",
  robots: { index: false, follow: false, nocache: true },
};

export default function Page() {
  return (
    <WeeklyVideo
      src={`/api/video/${SLUG}.mp4`}
      poster={`/media/video/${SLUG}-poster.jpg`}
      title={TITLE}
    />
  );
}
