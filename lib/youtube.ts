import fs from "node:fs";
import path from "node:path";

export interface Playlist {
  id: string;
  title: string;
  count: number;
  url: string;
  thumb: string;
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

/** Match a landing-page slug / blog-category slug to its best-fit playlist by
 *  title keywords (robust to playlist-id changes on re-harvest). */
const TOPIC_KEYWORDS: Record<string, string[]> = {
  "va-loans": ["VA Loan Masterclass"],
  "usda-loans": ["USDA"],
  usda: ["USDA"],
  "fha-loans": ["FHA Loan Masterclass"],
  fha: ["FHA Loan Masterclass"],
  "investment-property-loans": ["Real Estate Investor", "Investor"],
  "down-payment-assistance": ["First-Time Homebuyer"],
  "1st-time-buyers": ["First-Time Homebuyer"],
  "renovation-loans": ["Creative Mortgage Solutions"],
  "construction-perm": ["Creative Mortgage Solutions"],
  "jumbo-loans": ["Conventional Loan Masterclass"],
};

export function getPlaylistForTopic(slug: string): Playlist | undefined {
  const kws = TOPIC_KEYWORDS[slug];
  if (!kws) return undefined;
  return getPlaylists().find((p) => kws.some((k) => p.title.includes(k)));
}
