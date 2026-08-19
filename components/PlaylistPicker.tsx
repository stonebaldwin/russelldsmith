"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { VideoPlayer } from "./VideoPlayer";
import type { Playlist } from "@/lib/youtube";

function shortName(title: string): string {
  return title.split(/[:|]/)[0].trim();
}

/** One playlist player + a pill selector to switch between playlists. */
export function PlaylistPicker({ playlists }: { playlists: Playlist[] }) {
  const [idx, setIdx] = useState(0);
  if (!playlists.length) return null;
  const active = playlists[idx];

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {playlists.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setIdx(i)}
            aria-pressed={i === idx}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              i === idx
                ? "border-accent bg-accent text-white"
                : "border-line-strong text-ink-soft hover:border-accent hover:text-accent",
            )}
          >
            {shortName(p.title)}
          </button>
        ))}
      </div>
      <VideoPlayer key={active.id} playlist={active} />
    </div>
  );
}
