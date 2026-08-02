/**
 * Spam classifier. The legacy WordPress blog was compromised: ~30 casino /
 * sports-betting / gambling posts (multilingual, all dated 2026) were injected
 * among ~331 legitimate mortgage posts (2014-2021). This decides keep vs drop
 * with a reason, so nothing is ever SILENTLY dropped (CLAUDE.md rule 6).
 *
 * Signals, in priority order:
 *   1. Allowlist (inventory + redirect destinations) -> always KEEP
 *   2. Spam keyword in slug/title -> DROP
 *   3. Post-migration era (year >= 2022; the real blog ended 2021) -> DROP
 *   4. Otherwise (2014-2021, no spam signal) -> KEEP (legit era)
 */

// Multilingual gambling / casino / betting / pharma / adult spam markers.
const SPAM_TERMS = [
  "casino", "casinos", "kasino", "kasinopelaam", "pokies", "slot", "slots",
  "roulette", "blackjack", "baccarat", "poker", "gambl", "betting", "bookmaker",
  "sportwetten", "wetten", "bahis", "jackpot", "freispiele", "freespins",
  "free-spins", "aviator", "plinko", "mostbet", "1win", "parimatch", "pin-up",
  "pinco", "vipzino", "betwinner", "melbet", "1xbet", "spinbetter", "vulkan",
  "bonanza", "non-aams", "aams", "lugas", "bettilt", "stake", "bet365",
  "wager", "gokkast", "speelhal", "kumarhane", "apuestas", "scommesse",
  "vinci", "voittostrateg", "bonukset", "bonusene", "bahisleri", "guvenli-bahis",
  "sportsbook", "livecasino", "live-casino", "evolution-gaming", "chicken-road",
  "ice-fishing-game", "drivesouthwest", "baxterbet", "westace", "vipzino",
];

const SPAM_RE = new RegExp(`(${SPAM_TERMS.map((t) => t.replace(/[-]/g, "\\-?")).join("|")})`, "i");

// The real mortgage blog's last legitimate posts are dated 2021 or earlier.
// Everything from 2022 onward with no allowlist match is injected spam/junk.
const LEGIT_ERA_MAX_YEAR = 2021;

export interface ClassifyInput {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  categories: { slug: string }[];
}

export interface ClassifyResult {
  keep: boolean;
  reason: string;
  flags: string[];
}

export function classifyPost(post: ClassifyInput, allowlist: Set<string>): ClassifyResult {
  const flags: string[] = [];
  const year = Number((post.date || "").slice(0, 4)) || 0;
  const hay = `${post.slug} ${post.title}`;

  const catSlugs = post.categories.map((c) => c.slug);
  if (catSlugs.includes("public") || catSlugs.includes("uncategorized")) {
    flags.push(`weak-category:${catSlugs.join("+") || "none"}`);
  }

  // 1. Allowlist wins.
  if (allowlist.has(post.slug)) {
    // Even allowlisted, note if it looks spammy (shouldn't happen) for review.
    if (SPAM_RE.test(hay)) flags.push("allowlisted-but-spammy");
    return { keep: true, reason: "allowlist", flags };
  }

  // 2. Spam keyword -> drop.
  const m = hay.match(SPAM_RE);
  if (m) {
    return { keep: false, reason: `spam-keyword:${m[1].toLowerCase()}`, flags };
  }

  // 3. Post-migration era -> drop (injected).
  if (year > LEGIT_ERA_MAX_YEAR) {
    return { keep: false, reason: `injected-era:${year}`, flags };
  }

  // 4. Legit era, no spam signal -> keep.
  if (year === 0) {
    flags.push("no-date");
    return { keep: false, reason: "no-date-unverifiable", flags };
  }
  return { keep: true, reason: "legit-era", flags };
}

export { SPAM_RE };
