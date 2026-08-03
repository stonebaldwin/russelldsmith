/**
 * Harvests Russell's YouTube playlists AND the videos inside each one from his
 * channel, so the site can render a custom media player (main video + related
 * sidebar). Writes content/youtube.json + downloads playlist cover thumbnails.
 *
 *   tsx scripts/scrape-youtube.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fetchWithRetry, USER_AGENT, sleep } from "./lib/wp.js";
import { downloadImage } from "./lib/convert.js";

const CHANNEL_HANDLE = "@RusselltheMortgageStrategist";
const PLAYLISTS_URL = `https://www.youtube.com/${CHANNEL_HANDLE}/playlists`;
const ROOT = process.cwd();
const THUMB_DIR = path.join(ROOT, "public", "media", "youtube");

interface Video {
  id: string;
  title: string;
  duration: string;
}
interface Playlist {
  id: string;
  title: string;
  count: number;
  url: string;
  thumb: string;
  videos: Video[];
}

function ytInitialData(html: string): any | null {
  const m = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
  return m ? JSON.parse(m[1]) : null;
}

function collectPlaylists(data: any): { id: string; title: string; count: number; remote: string }[] {
  const out: { id: string; title: string; count: number; remote: string }[] = [];
  const seen = new Set<string>();
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
        count = Number(JSON.stringify(lv.contentImage.collectionThumbnailViewModel).match(/(\d+)\s*videos?/i)?.[1] || 0);
      } catch {}
      if (lv.contentId && title && !seen.has(lv.contentId)) {
        seen.add(lv.contentId);
        out.push({ id: lv.contentId, title, count, remote: thumb });
      }
    }
    if (o.gridPlaylistRenderer) {
      const g = o.gridPlaylistRenderer;
      const title = g.title?.runs?.[0]?.text || g.title?.simpleText || "";
      if (g.playlistId && title && !seen.has(g.playlistId)) {
        seen.add(g.playlistId);
        out.push({
          id: g.playlistId,
          title,
          count: Number((g.videoCountShortText?.simpleText || "").replace(/\D/g, "") || 0),
          remote: (g.thumbnail?.thumbnails || []).slice(-1)[0]?.url || "",
        });
      }
    }
    for (const k in o) walk(o[k]);
  }
  walk(data);
  return out;
}

function collectVideos(data: any): Video[] {
  const out: Video[] = [];
  const seen = new Set<string>();
  function add(id: string, title: string, duration: string) {
    if (id && title && !seen.has(id)) {
      seen.add(id);
      out.push({ id, title, duration });
    }
  }
  function walk(o: any) {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) return o.forEach(walk);
    if (o.playlistVideoRenderer) {
      const v = o.playlistVideoRenderer;
      add(v.videoId, v.title?.runs?.[0]?.text || v.title?.simpleText || "", v.lengthText?.simpleText || "");
    }
    if (o.lockupViewModel && o.lockupViewModel.contentType === "LOCKUP_CONTENT_TYPE_VIDEO") {
      const lv = o.lockupViewModel;
      let title = "";
      try {
        title = lv.metadata.lockupMetadataViewModel.title.content;
      } catch {}
      let duration = "";
      try {
        duration = JSON.stringify(lv.contentImage).match(/"text":"(\d+:\d+(?::\d+)?)"/)?.[1] || "";
      } catch {}
      add(lv.contentId, title, duration);
    }
    // YouTube Shorts inside a playlist
    if (o.shortsLockupViewModel) {
      const sl = o.shortsLockupViewModel;
      const url: string = sl.onTap?.innertubeCommand?.commandMetadata?.webCommandMetadata?.url || "";
      const id =
        sl.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId ||
        url.match(/\/shorts\/([\w-]{11})/)?.[1] ||
        "";
      let title = "";
      try {
        title = sl.overlayMetadata.primaryText.content;
      } catch {}
      if (!title && typeof sl.accessibilityText === "string") {
        title = sl.accessibilityText.replace(/,\s*[\d.,kmb]+\s*views?.*$/i, "").trim();
      }
      add(id, title, "");
    }
    for (const k in o) walk(o[k]);
  }
  walk(data);
  return out;
}

async function fetchPlaylistVideos(id: string): Promise<Video[]> {
  try {
    const res = await fetchWithRetry(`https://www.youtube.com/playlist?list=${id}`, {
      timeoutMs: 45000,
      retries: 2,
    });
    const data = ytInitialData(await res.text());
    return data ? collectVideos(data) : [];
  } catch {
    return [];
  }
}

async function main() {
  console.log(`[youtube] fetching ${PLAYLISTS_URL} ...`);
  const res = await fetchWithRetry(PLAYLISTS_URL, { timeoutMs: 45000, retries: 3 });
  const html = await res.text();
  const channelId = (html.match(/"channelId":"(UC[A-Za-z0-9_-]+)"/) || html.match(/channel\/(UC[A-Za-z0-9_-]+)/))?.[1] || "";
  const data = ytInitialData(html);
  if (!data) {
    console.error("[youtube] ytInitialData not found");
    process.exit(1);
  }
  const raw = collectPlaylists(data);
  console.log(`[youtube] found ${raw.length} playlists; fetching video lists ...`);

  fs.mkdirSync(THUMB_DIR, { recursive: true });
  const playlists: Playlist[] = [];
  for (const p of raw) {
    let thumb = p.remote;
    if (p.remote) {
      const dest = path.join(THUMB_DIR, `${p.id}.jpg`);
      if (await downloadImage(p.remote, dest, USER_AGENT)) thumb = `/media/youtube/${p.id}.jpg`;
    }
    const videos = await fetchPlaylistVideos(p.id);
    playlists.push({ id: p.id, title: p.title, count: p.count || videos.length, url: `https://www.youtube.com/playlist?list=${p.id}`, thumb, videos });
    console.log(`   · ${p.title} — ${videos.length} videos`);
    await sleep(400);
  }
  playlists.sort((a, b) => b.videos.length - a.videos.length);

  fs.writeFileSync(
    path.join(ROOT, "content", "youtube.json"),
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
  const totalVideos = playlists.reduce((n, p) => n + p.videos.length, 0);
  console.log(`[youtube] wrote content/youtube.json — ${playlists.length} playlists, ${totalVideos} videos`);
}

main().catch((e) => {
  console.error("[youtube] FATAL", e);
  process.exit(1);
});
