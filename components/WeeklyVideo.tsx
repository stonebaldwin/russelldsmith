/**
 * The player used by each Mortgage Strategist Weekly episode page.
 *
 * The episodes are unlisted, link-shared pages: site chrome and the video,
 * nothing else. Shared here so a new week is a ~15-line page file.
 *
 * Sizing note: the source is a 1080x1920 portrait phone recording, so the
 * player is sized off the viewport HEIGHT rather than its width. At 9:16 a
 * full-width video on a phone runs ~700px tall and pushes its own controls
 * below the fold.
 */
export function WeeklyVideo({
  src,
  poster,
  title,
}: {
  /** Streamed via /api/video/... — see app/api/video/[file]/route.ts. */
  src: string;
  poster: string;
  /** Not rendered visibly; the page is deliberately just the player. */
  title: string;
}) {
  return (
    <section className="bg-[#0e1a2b]">
      <h1 className="sr-only">{title}</h1>

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
            src={src}
            poster={poster}
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
