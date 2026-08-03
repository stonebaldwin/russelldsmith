"use client";

import { useState } from "react";
import type { Playlist } from "@/lib/youtube";

/**
 * Lightweight YouTube playlist embed: shows the thumbnail + play button and only
 * loads the (heavy) YouTube iframe when the user clicks — keeps pages fast.
 */
export function LitePlaylist({ playlist }: { playlist: Playlist }) {
  const [playing, setPlaying] = useState(false);
  const src = `https://www.youtube-nocookie.com/embed/videoseries?list=${playlist.id}&autoplay=1`;

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-accent-deep">
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={src}
          title={playlist.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play playlist: ${playlist.title}`}
          className="group absolute inset-0 h-full w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local YouTube thumbnail */}
          <img
            src={playlist.thumb}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
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
