/**
 * Generates the default social-share card at public/media/site/og-default.png
 * (1200×630) — used as the fallback Open Graph / Twitter image for every page
 * that doesn't set its own (home, landing, about, contact). Blog posts override
 * it with their hero. Re-run with `npm run gen:og` after brand changes.
 */
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = resolve(ROOT, "public/media/site/og-default.png");

// Brand tokens (mirror app/globals.css + lib/reviews.ts).
const ACCENT = "#00589d";
const ACCENT_DEEP = "#00426f";
const ACCENT_LIGHT = "#bfe0f7";
const RATING = "4.97/5 · 1,638 reviews";

const headshot = readFileSync(resolve(ROOT, "public/media/site/russell-smith.png")).toString("base64");

const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${ACCENT}"/>
      <stop offset="1" stop-color="${ACCENT_DEEP}"/>
    </linearGradient>
    <clipPath id="circle"><circle cx="980" cy="300" r="180"/></clipPath>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="10" y="620" fill="${ACCENT_LIGHT}"/>

  <!-- headshot -->
  <circle cx="980" cy="300" r="188" fill="none" stroke="${ACCENT_LIGHT}" stroke-width="6"/>
  <image x="800" y="120" width="360" height="360" clip-path="url(#circle)"
         href="data:image/png;base64,${headshot}" preserveAspectRatio="xMidYMid slice"/>

  <!-- text block -->
  <text x="90" y="150" fill="${ACCENT_LIGHT}" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="bold" letter-spacing="3">ALCOVA MORTGAGE</text>
  <text x="88" y="270" fill="#ffffff" font-family="Helvetica, Arial, sans-serif" font-size="104" font-weight="bold">Russell Smith</text>
  <text x="90" y="330" fill="#ffffff" font-family="Helvetica, Arial, sans-serif" font-size="40" font-weight="bold" opacity="0.92">The Mortgage Strategist</text>
  <text x="90" y="410" fill="${ACCENT_LIGHT}" font-family="Helvetica, Arial, sans-serif" font-size="30">VA · USDA · FHA · First-Time Buyer</text>
  <text x="90" y="452" fill="${ACCENT_LIGHT}" font-family="Helvetica, Arial, sans-serif" font-size="30">&amp; Construction loan guides</text>

  <!-- rating chip -->
  <rect x="90" y="500" width="470" height="62" rx="31" fill="#ffffff" opacity="0.12"/>
  <text x="120" y="541" fill="#ffd66b" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="bold">★★★★★</text>
  <text x="290" y="541" fill="#ffffff" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="bold">${RATING}</text>

  <text x="90" y="600" fill="#ffffff" font-family="Helvetica, Arial, sans-serif" font-size="26" opacity="0.75">russelldsmith.com</text>
</svg>`;

async function main() {
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  writeFileSync(OUT, png);
  const meta = await sharp(png).metadata();
  console.log(`[gen:og] wrote ${OUT} (${meta.width}×${meta.height}, ${(png.length / 1024).toFixed(0)}KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
