"use client";

import { useState } from "react";
import type { Playlist } from "@/lib/youtube";

const ORIGIN = "https://www.youtube-nocookie.com";

/**
 * Lightweight YouTube playlist embed: shows the thumbnail + play button and only
 * loads the (heavy) YouTube iframe when the user clicks — keeps pages fast.
 * The player loads PAUSED (no autoplay); the viewer presses play and uses
 * YouTube's native controls. A Close button collapses it back to the thumbnail.
 */
export function LitePlaylist({ playlist }: { playlist: Playlist }) {
  const [open, setOpen] = useState(false);
  const src = `${ORIGIN}/embed/videoseries?list=${playlist.id}&rel=0`;

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-accent-deep">
      {open ? (
        <>
          <iframe
            className="absolute inset-0 h-full w-full"
            src={src}
            title={playlist.title}
            loading="lazy"
            allow="clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close video"
            title="Close"
            className="absolute top-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Play playlist: ${playlist.title}`}
          className="group absolute inset-0 h-full w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local YouTube thumbnail */}
          <img src={playlist.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
          <span className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/10" />
          <span className="absolute top-1/2 left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#ff0000] shadow-lg transition-transform group-hover:scale-110">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 text-left">
            <span className="line-clamp-1 font-serif text-lg font-medium text-white">
              {playlist.title}
            </span>
            <span className="text-sm text-white/85">{playlist.count} videos</span>
          </span>
        </button>
      )}
    </div>
  );
}
