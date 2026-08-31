import type { Metadata } from "next";

/**
 * /watch — an unlisted, single-video page.
 *
 * "Unlisted" here means: meta-noindex, absent from `app/sitemap.ts`, and not
 * linked from the header, footer, or any other page. It is reachable only by
 * someone who has the URL. It is deliberately NOT added to robots.txt —
 * disallowing it there would stop crawlers from ever reading the noindex tag,
 * which is the opposite of what we want.
 *
 * The page is nothing but the site chrome and the player, per the brief. The
 * source is a 1080x1920 portrait phone recording, so the player is sized off
 * the viewport HEIGHT rather than its width: at 9:16, a full-width video on a
 * phone would run ~700px tall and push its own controls below the fold.
 */

const VIDEO = "/media/video/russell-smith-message.mp4";
const POSTER = "/media/video/russell-smith-message-poster.jpg";

export const metadata: Metadata = {
  title: "Watch",
  description: "A short video message from Russell Smith.",
  // Unlisted: keep it out of the index and out of link-graph consideration.
  robots: { index: false, follow: false, nocache: true },
};

export default function WatchPage() {
  return (
    <section className="bg-[#0e1a2b]">
      <h1 className="sr-only">A video message from Russell Smith</h1>

      <div className="mx-auto px-4 py-6 sm:py-10">
        {/*
         * Cap the player's WIDTH at whatever width makes a 9:16 box fit the
         * remaining viewport height, so the whole frame plus its controls land
         * on screen without scrolling. 11rem covers the sticky header and this
         * section's own padding; 26rem keeps it from ballooning on a desktop
         * monitor, where a portrait video has height to spare.
         */}
        <div
          className="mx-auto w-full"
          style={{ maxWidth: "min(26rem, calc((100dvh - 11rem) * 9 / 16))" }}
        >
          <video
            className="block aspect-[9/16] w-full rounded-xl bg-black shadow-2xl shadow-black/40"
            src={VIDEO}
            poster={POSTER}
            controls
            // iOS Safari fullscreens an un-hinted <video> the moment it plays;
            // playsInline keeps it in the page layout.
            playsInline
            // Don't spend a phone's data on 22MB before anyone hits play — the
            // poster carries the first impression.
            preload="metadata"
          />
        </div>
      </div>
    </section>
  );
}
