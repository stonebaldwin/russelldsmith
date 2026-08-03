/**
 * Harvests Russell's YouTube playlists (guides organized by topic) from his
 * channel and writes content/youtube.json + downloads each playlist thumbnail.
 * The site embeds/links these throughout (homepage, /videos, landing pages).
 *
 *   tsx scripts/scrape-youtube.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fetchWithRetry, USER_AGENT } from "./lib/wp.js";
import { downloadImage } from "./lib/convert.js";

const CHANNEL_HANDLE = "@RusselltheMortgageStrategist";
const PLAYLISTS_URL = `https://www.youtube.com/${CHANNEL_HANDLE}/playlists`;
const ROOT = process.cwd();
const THUMB_DIR = path.join(ROOT, "public", "media", "youtube");

interface Playlist {
  id: string;
  title: string;
  count: number;
  url: string;
  thumb: string; // local path (or remote fallback)
}

function collectPlaylists(data: any): { id: string; title: string; count: number; remote: string }[] {
  const out: { id: string; title: string; count: number; remote: string }[] = [];
  const seen = new Set<string>();
  function pushUnique(id: string, title: string, count: number, remote: string) {
    if (!id || !title || seen.has(id)) return;
    seen.add(id);
    out.push({ id, title, count, remote });
  }
  function walk(o: any) {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) return o.forEach(walk);
    if (o.lockupViewModel && o.lockupViewModel.contentType === "LOCKUP_CONTENT_TYPE_PLAYLIST") {
      const lv = o.lockupViewModel;
      let title = "";
      let thumb = "";
      let count = 0;
      try {
        title = lv.metadata.lockupMetadataViewModel.title.content;
      } catch {}
      try {
        const src =
          lv.contentImage.collectionThumbnailViewModel.primaryThumbnail.thumbnailViewModel.image.sources;
        thumb = src[src.length - 1].url;
      } catch {}
      try {
        const ov = JSON.stringify(lv.contentImage.collectionThumbnailViewModel);
        count = Number(ov.match(/(\d+)\s*videos?/i)?.[1] || 0);
      } catch {}
      pushUnique(lv.contentId, title, count, thumb);
    }
    if (o.gridPlaylistRenderer) {
      const g = o.gridPlaylistRenderer;
      const title = g.title?.runs?.[0]?.text || g.title?.simpleText || "";
      const count = Number((g.videoCountShortText?.simpleText || "").replace(/\D/g, "") || 0);
      const thumb = (g.thumbnail?.thumbnails || []).slice(-1)[0]?.url || "";
      pushUnique(g.playlistId, title, count, thumb);
    }
    for (const k in o) walk(o[k]);
  }
  walk(data);
  return out;
}

async function main() {
  console.log(`[youtube] fetching ${PLAYLISTS_URL} ...`);
  const res = await fetchWithRetry(PLAYLISTS_URL, { timeoutMs: 45000, retries: 3 });
  const html = await res.text();
  const idMatch = html.match(/"channelId":"(UC[A-Za-z0-9_-]+)"/) || html.match(/channel\/(UC[A-Za-z0-9_-]+)/);
  const channelId = idMatch?.[1] || "";
  const m = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
  if (!m) {
    console.error("[youtube] ytInitialData not found");
    process.exit(1);
  }
  const raw = collectPlaylists(JSON.parse(m[1]));
  console.log(`[youtube] found ${raw.length} playlists`);

  fs.mkdirSync(THUMB_DIR, { recursive: true });
  const playlists: Playlist[] = [];
  for (const p of raw) {
    let thumb = p.remote;
    if (p.remote) {
      const dest = path.join(THUMB_DIR, `${p.id}.jpg`);
      const ok = await downloadImage(p.remote, dest, USER_AGENT);
      if (ok) thumb = `/media/youtube/${p.id}.jpg`;
    }
    playlists.push({
      id: p.id,
      title: p.title,
      count: p.count,
      url: `https://www.youtube.com/playlist?list=${p.id}`,
      thumb,
    });
  }
  // Largest (most complete) playlists first.
  playlists.sort((a, b) => b.count - a.count);

  const outFile = path.join(ROOT, "content", "youtube.json");
  fs.writeFileSync(
    outFile,
    JSON.stringify(
      {
        channel: {
          name: "Russell Smith | Mortgage Strategist",
          handle: CHANNEL_HANDLE,
          id: channelId,
          url: `https://www.youtube.com/${CHANNEL_HANDLE}`,
        },
        playlists,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`[youtube] wrote content/youtube.json (${playlists.length} playlists, channel ${channelId})`);
  console.log(`[youtube] thumbnails: ${fs.readdirSync(THUMB_DIR).length}`);
}

main().catch((e) => {
  console.error("[youtube] FATAL", e);
  process.exit(1);
});
