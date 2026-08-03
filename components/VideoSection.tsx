import Link from "next/link";
import { getPlaylists } from "@/lib/youtube";
import { LitePlaylist } from "./LitePlaylist";

/** Homepage "video guides" section — features the top playlists. */
export function VideoSection() {
  const all = getPlaylists();
  if (!all.length) return null;
  const featured = all.slice(0, 3);

  return (
    <section>
      <div className="flex items-end justify-between border-b-2 border-accent/15 pb-2.5">
        <h2 className="font-serif text-2xl font-medium text-accent">Watch &amp; learn</h2>
        <Link href="/videos/" className="text-sm font-medium text-accent-2 hover:underline">
          All {all.length} playlists →
        </Link>
      </div>
      <p className="mt-3 max-w-2xl text-muted">
        Russell breaks down every loan type on YouTube — step-by-step video guides you can watch
        before you ever fill out an application.
      </p>
      <div className="mt-6 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((p) => (
          <LitePlaylist key={p.id} playlist={p} />
        ))}
      </div>
    </section>
  );
}
