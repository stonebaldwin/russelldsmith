import type { Metadata } from "next";
import { getPlaylists, getChannel } from "@/lib/youtube";
import { LitePlaylist } from "@/components/LitePlaylist";

export const metadata: Metadata = {
  title: "Video Guides",
  description:
    "Step-by-step mortgage video guides from Russell D Smith — VA, USDA, FHA, first-time buyer, investor, refinance and more, organized by topic.",
  alternates: { canonical: "/videos/" },
};

export default function VideosPage() {
  const playlists = getPlaylists();
  const channel = getChannel();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-accent sm:text-4xl">
          Video Guides
        </h1>
        <p className="mt-3 text-lg leading-8 text-muted">
          Russell&rsquo;s YouTube library — every loan type broken down step by step, organized into
          topic playlists. Tap any playlist to start watching.
        </p>
        <a
          href={channel.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#ff0000] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
            <path d="M23 12s0-3.3-.4-4.9a2.6 2.6 0 0 0-1.8-1.8C19.2 5 12 5 12 5s-7.2 0-8.8.4a2.6 2.6 0 0 0-1.8 1.8C1 8.7 1 12 1 12s0 3.3.4 4.9a2.6 2.6 0 0 0 1.8 1.8C4.8 19 12 19 12 19s7.2 0 8.8-.4a2.6 2.6 0 0 0 1.8-1.8C23 15.3 23 12 23 12zM9.8 15.3V8.7l5.7 3.3-5.7 3.3z" />
          </svg>
          Subscribe on YouTube
        </a>
      </div>

      {playlists.length ? (
        <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {playlists.map((p) => (
            <LitePlaylist key={p.id} playlist={p} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-muted">Video playlists are being added — check back soon.</p>
      )}
    </div>
  );
}
