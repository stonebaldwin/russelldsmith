import fs from "node:fs";
import path from "node:path";

export interface Video {
  id: string;
  title: string;
  duration: string;
}
export interface Playlist {
  id: string;
  title: string;
  count: number;
  url: string;
  thumb: string;
  videos: Video[];
}

/** YouTube CDN thumbnail for a video (safe to hot-link; it's YouTube's own CDN). */
export function videoThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
}
export function watchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
export interface YouTubeData {
  channel: { name: string; handle: string; id: string; url: string };
  playlists: Playlist[];
}

const FALLBACK: YouTubeData = {
  channel: {
    name: "Russell Smith | Mortgage Strategist",
    handle: "@RusselltheMortgageStrategist",
    id: "",
    url: "https://www.youtube.com/@RusselltheMortgageStrategist",
  },
  playlists: [],
};

let _data: YouTubeData | null = null;
function load(): YouTubeData {
  if (_data) return _data;
  try {
    _data = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "content", "youtube.json"), "utf8"),
    ) as YouTubeData;
  } catch {
    _data = FALLBACK;
  }
  return _data;
}

export function getChannel() {
  return load().channel;
}
export function getPlaylists(): Playlist[] {
  return load().playlists;
}
export function getPlaylistById(id: string): Playlist | undefined {
  return load().playlists.find((p) => p.id === id);
}
export function embedUrl(playlistId: string): string {
  return `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}`;
}

/** Match a landing-page slug / blog-category slug to its playlists by title
 *  keywords (robust to playlist-id changes on re-harvest). Topics that have
 *  more than one relevant series list every keyword — getPlaylistsForTopic
 *  returns them all, in the order the keywords are listed. */
const TOPIC_KEYWORDS: Record<string, string[]> = {
  "va-loans": ["VA Loan Masterclass"],
  "usda-loans": ["USDA"],
  usda: ["USDA"],
  "fha-loans": ["FHA Loan Masterclass"],
  fha: ["FHA Loan Masterclass"],
  // Russell works with investors constantly — give them all three series.
  "investment-property-loans": ["Real Estate Investor", "BRRRR", "Creative Investor"],
  "down-payment-assistance": ["First-Time Homebuyer"],
  "1st-time-buyers": ["First-Time Homebuyer"],
  "renovation-loans": ["Creative Mortgage Solutions"],
  "construction-perm": ["Creative Mortgage Solutions"],
  "jumbo-loans": ["Conventional Loan Masterclass"],
  "real-estate-professionals": ["Mortgage Success Stories", "Creative Mortgage Solutions"],
  tips: ["Mortgage Credit Explained"],
};

/** Every playlist matching a topic, keyword order preserved, no duplicates. */
export function getPlaylistsForTopic(slug: string): Playlist[] {
  const kws = TOPIC_KEYWORDS[slug];
  if (!kws) return [];
  const playlists = getPlaylists();
  const out: Playlist[] = [];
  for (const kw of kws) {
    for (const p of playlists) {
      if (p.title.includes(kw) && p.videos.length && !out.includes(p)) out.push(p);
    }
  }
  return out;
}
