"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { Playlist } from "@/lib/youtube";

const ORIGIN = "https://www.youtube-nocookie.com";
const videoThumb = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

function shortName(title: string): string {
  return title.split(/[:|]/)[0].trim();
}

/**
 * YouTube-style media player: a main video with a scrollable sidebar of the
 * other videos in the playlist. Loads PAUSED (no autoplay on page load); the
 * viewer presses play, and picking a sidebar video switches + plays it.
 */
export function VideoPlayer({ playlist }: { playlist: Playlist }) {
  const videos = playlist.videos ?? [];
  const [activeId, setActiveId] = useState(videos[0]?.id ?? "");
  const [started, setStarted] = useState(false);

  if (!videos.length) return null;
  const active = videos.find((v) => v.id === activeId) ?? videos[0];

  function select(id: string) {
    setActiveId(id);
    setStarted(true);
  }

  return (
    <div className="grid gap-x-6 gap-y-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div>
        <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-black">
          {started ? (
            <iframe
              key={active.id}
              className="absolute inset-0 h-full w-full"
              src={`${ORIGIN}/embed/${active.id}?autoplay=1&rel=0`}
              title={active.title}
              loading="lazy"
              allow="autoplay; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setStarted(true)}
              aria-label={`Play: ${active.title}`}
              className="group absolute inset-0 h-full w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- YouTube CDN thumbnail */}
              <img src={videoThumb(active.id)} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/10" />
              <span className="absolute top-1/2 left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#ff0000] shadow-lg transition-transform group-hover:scale-110">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </button>
          )}
        </div>
        <h3 className="mt-3 font-serif text-lg leading-snug font-medium text-ink">{active.title}</h3>
        <p className="mt-1 text-sm text-muted">
          {shortName(playlist.title)} · {videos.length} videos
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">Up next</p>
        <ul className="flex max-h-[24rem] flex-col gap-1 overflow-y-auto pr-1 lg:max-h-[28rem]">
          {videos.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => select(v.id)}
                className={cn(
                  "flex w-full gap-3 rounded-lg p-1.5 text-left transition-colors",
                  v.id === active.id ? "bg-accent-pale" : "hover:bg-line/40",
                )}
              >
                <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md bg-line-strong">
                  {/* eslint-disable-next-line @next/next/no-img-element -- YouTube CDN thumbnail */}
                  <img
                    src={videoThumb(v.id)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  {v.duration ? (
                    <span className="absolute right-1 bottom-1 rounded bg-black/80 px-1 text-[10px] font-medium text-white">
                      {v.duration}
                    </span>
                  ) : null}
                </span>
                <span className="min-w-0 flex-1 py-0.5">
                  <span className="line-clamp-2 text-sm leading-snug font-medium text-ink">
                    {v.title}
                  </span>
                  {v.id === active.id ? (
                    <span className="mt-0.5 block text-xs font-medium text-accent">▶ Now playing</span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
