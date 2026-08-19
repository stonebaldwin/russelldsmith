import { getPlaylistsForTopic, getChannel } from "@/lib/youtube";
import { cn } from "@/lib/cn";
import { VideoPlayer } from "./VideoPlayer";
import { PlaylistPicker } from "./PlaylistPicker";

/** "First-Time Homebuyer Masterclass | Programs, Credit Tips…" → "First-Time Homebuyer Masterclass" */
function shortName(title: string): string {
  return title.split(/[:|]/)[0].trim();
}

/**
 * "Watch" section for a topic — a landing page slug or a blog category slug.
 * Renders a single player when the topic maps to one playlist, and the pill
 * picker when it maps to several (e.g. the investor page's three series).
 * Renders nothing when there's no playlist for the topic.
 */
export function TopicVideos({
  topic,
  heading,
  dek,
  className,
}: {
  topic: string;
  /** Defaults to the playlist's own name — pass one when the page wants its own framing. */
  heading?: string;
  dek?: string;
  className?: string;
}) {
  const playlists = getPlaylistsForTopic(topic);
  if (!playlists.length) return null;
  const channel = getChannel();
  const videoCount = playlists.reduce((n, p) => n + p.videos.length, 0);
  const title =
    heading ??
    (playlists.length > 1
      ? "Watch: Russell’s video series"
      : `Watch: ${shortName(playlists[0].title)}`);

  return (
    <section className={cn(className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b-2 border-accent/15 pb-2.5">
        <h2 className="font-serif text-2xl font-medium text-accent">{title}</h2>
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
        {dek ??
          (playlists.length > 1
            ? `${videoCount} videos across ${playlists.length} of Russell's series — pick one and start watching.`
            : `${videoCount} short videos — pick one and start watching.`)}
      </p>
      <div className="mt-6">
        {playlists.length > 1 ? (
          <PlaylistPicker playlists={playlists} />
        ) : (
          <VideoPlayer playlist={playlists[0]} />
        )}
      </div>
    </section>
  );
}
