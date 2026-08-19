import { getPlaylists, getChannel } from "@/lib/youtube";
import { PlaylistPicker } from "./PlaylistPicker";

/** Homepage video section — one playlist player + a selector to switch playlists. */
export function VideoSection() {
  const playlists = getPlaylists().filter((p) => p.videos.length);
  if (!playlists.length) return null;
  const channel = getChannel();

  return (
    <section>
      <div className="flex items-end justify-between border-b-2 border-accent/15 pb-2.5">
        <h2 className="font-serif text-2xl font-medium text-accent">Watch &amp; learn</h2>
        <a
          href={channel.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-accent-2 hover:underline"
        >
          Subscribe on YouTube →
        </a>
      </div>
      <p className="mt-3 max-w-2xl text-muted">
        Russell breaks down every loan type on YouTube — pick a series and start watching.
      </p>
      <div className="mt-6">
        <PlaylistPicker playlists={playlists} />
      </div>
    </section>
  );
}
