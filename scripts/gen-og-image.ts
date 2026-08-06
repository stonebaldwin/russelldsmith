/**
 * Generates the default social-share card at public/media/site/og-default.png
 * (1200×630) — the fallback Open Graph / Twitter image for pages that don't set
 * their own (home, landing, about, contact). Blog posts override it with their
 * hero. Re-run with `npm run gen:og` after brand changes.
 *
 * Typography is the real brand font (Futura PT, matching the site) rendered to
 * vector paths via opentype.js — so the text is crisp and brand-accurate with no
 * dependency on system fonts. The ALCOVA logo is the real asset, knocked out to
 * white. Composited to PNG with sharp.
 */
import sharp from "sharp";
import * as opentype from "opentype.js";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = resolve(ROOT, "public/media/site/og-default.png");
const W = 1200;
const H = 630;

// Brand palette (mirrors app/globals.css) + review stats (lib/reviews.ts).
const NAVY_TOP = "#0b4a84";
const NAVY_BOT = "#041f37";
const ACCENT_LIGHT = "#c7e2f7";
const ACCENT_BLUE = "#7bc0ef";
const GOLD = "#eab94e";
const RATING = "4.97 average · 1,638 verified reviews";

const font = {
  book: opentype.parse(readFileSync(resolve(ROOT, "public/fonts/FuturaPT-Book.ttf")).buffer),
  medium: opentype.parse(readFileSync(resolve(ROOT, "public/fonts/FuturaPT-Medium.ttf")).buffer),
  demi: opentype.parse(readFileSync(resolve(ROOT, "public/fonts/FuturaPT-Demi.ttf")).buffer),
};

type TextOpts = { fill?: string; opacity?: number; tracking?: number; anchor?: "start" | "end" };

// opentype.js's Path.toPathData() has a rounding bug that emits "NaN" for some
// coordinates (librsvg then silently truncates the glyph run). Serialize the
// raw commands ourselves — they're clean — so kerning can stay on.
const nn = (v: number) => Number(v.toFixed(2));
function serialize(path: opentype.Path) {
  let d = "";
  for (const c of path.commands as Array<Record<string, number> & { type: string }>) {
    if (c.type === "M") d += `M${nn(c.x)} ${nn(c.y)}`;
    else if (c.type === "L") d += `L${nn(c.x)} ${nn(c.y)}`;
    else if (c.type === "C") d += `C${nn(c.x1)} ${nn(c.y1)} ${nn(c.x2)} ${nn(c.y2)} ${nn(c.x)} ${nn(c.y)}`;
    else if (c.type === "Q") d += `Q${nn(c.x1)} ${nn(c.y1)} ${nn(c.x)} ${nn(c.y)}`;
    else if (c.type === "Z") d += "Z";
  }
  return d;
}

/** Render text to an SVG <path> (vector glyphs), with optional letter-spacing. */
function text(f: opentype.Font, str: string, x: number, y: number, size: number, o: TextOpts = {}) {
  const { fill = "#ffffff", opacity = 1, tracking = 0, anchor = "start" } = o;
  const width = measure(f, str, size, tracking);
  let cx = anchor === "end" ? x - width : x;
  let d = "";
  if (tracking) {
    for (const ch of str) {
      d += serialize(f.getPath(ch, cx, y, size));
      cx += f.getAdvanceWidth(ch, size) + tracking;
    }
  } else {
    d = serialize(f.getPath(str, cx, y, size));
  }
  return { svg: `<path d="${d}" fill="${fill}" fill-opacity="${opacity}"/>`, width };
}

function measure(f: opentype.Font, str: string, size: number, tracking = 0) {
  let w = f.getAdvanceWidth(str, size);
  if (tracking) w += tracking * (str.length - 1);
  return w;
}

function star(cx: number, cy: number, rOuter: number, fill: string) {
  const rInner = rOuter * 0.42;
  let d = "";
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? rInner : rOuter;
    const a = (-90 + i * 36) * (Math.PI / 180);
    d += (i ? "L" : "M") + (cx + r * Math.cos(a)).toFixed(2) + " " + (cy + r * Math.sin(a)).toFixed(2);
  }
  return `<path d="${d}Z" fill="${fill}"/>`;
}

async function whiteLogo(): Promise<{ href: string; w: number; h: number }> {
  const src = resolve(ROOT, "public/media/site/alcova-logo.png");
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    out[i] = 255;
    out[i + 1] = 255;
    out[i + 2] = 255;
    out[i + 3] = data[i + 3]; // keep original alpha → white silhouette
  }
  const png = await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  return { href: `data:image/png;base64,${png.toString("base64")}`, w: info.width, h: info.height };
}

async function main() {
  const logo = await whiteLogo();
  const logoW = 268;
  const logoH = Math.round((logo.h / logo.w) * logoW);

  const headshot = readFileSync(resolve(ROOT, "public/media/site/russell-smith.png")).toString("base64");

  // Photo panel (native 300×300 → crisp), vertically centred on the right.
  const pW = 300;
  const pX = 812;
  const pY = Math.round((H - pW) / 2);

  // Left text column.
  const LX = 84;
  const headline = text(font.demi, "Russell Smith", LX, 322, 98, { fill: "#ffffff" });
  const tagline = text(font.medium, "The Mortgage Strategist", LX, 392, 41, { fill: ACCENT_LIGHT });
  const svcLine = text(font.book, "VA · USDA · FHA · Jumbo · Construction", LX, 452, 29, { fill: "#ffffff", opacity: 0.9 });
  const licLine = text(font.book, "Licensed in North Carolina, South Carolina & Virginia", LX, 488, 22, { fill: "#ffffff", opacity: 0.62 });

  // Social proof: refined gold stars + plain type (no pill, no emoji).
  const starY = 548;
  let stars = "";
  for (let i = 0; i < 5; i++) stars += star(LX + 12 + i * 30, starY, 12, GOLD);
  const rating = text(font.medium, RATING, LX + 12 + 5 * 30 + 12, starY + 8, 25, { fill: "#ffffff", opacity: 0.92 });

  const domain = text(font.book, "russelldsmith.com", LX, 600, 23, { fill: "#ffffff", opacity: 0.55, tracking: 0.5 });

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${NAVY_TOP}"/>
      <stop offset="1" stop-color="${NAVY_BOT}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.18" cy="0.16" r="0.9">
      <stop offset="0" stop-color="#1a6cb0" stop-opacity="0.55"/>
      <stop offset="0.5" stop-color="#1a6cb0" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vign" cx="0.5" cy="0.5" r="0.75">
      <stop offset="0.55" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.34"/>
    </radialGradient>
    <radialGradient id="pglow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#2b7cbf" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#2b7cbf" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="pclip"><rect x="${pX}" y="${pY}" width="${pW}" height="${pW}" rx="30"/></clipPath>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="18"/>
      <feOffset dx="0" dy="14" result="o"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#vign)"/>

  <!-- left accent hairline -->
  <rect x="0" y="0" width="8" height="${H}" fill="${ACCENT_BLUE}" fill-opacity="0.9"/>

  <!-- ALCOVA logo (white knockout) -->
  <image x="${LX}" y="70" width="${logoW}" height="${logoH}" href="${logo.href}"/>

  <!-- headline + short accent rule -->
  ${headline.svg}
  <rect x="${LX + 2}" y="344" width="66" height="5" rx="2.5" fill="${ACCENT_BLUE}"/>
  ${tagline.svg}
  ${svcLine.svg}
  ${licLine.svg}

  <!-- social proof -->
  ${stars}
  ${rating.svg}

  ${domain.svg}

  <!-- headshot: soft glow, shadowed rounded panel, hairline -->
  <circle cx="${pX + pW / 2}" cy="${pY + pW / 2}" r="215" fill="url(#pglow)"/>
  <g filter="url(#shadow)">
    <rect x="${pX}" y="${pY}" width="${pW}" height="${pW}" rx="30" fill="#0a2c49"/>
  </g>
  <image x="${pX}" y="${pY}" width="${pW}" height="${pW}" href="data:image/png;base64,${headshot}" clip-path="url(#pclip)" preserveAspectRatio="xMidYMid slice"/>
  <rect x="${pX}" y="${pY}" width="${pW}" height="${pW}" rx="30" fill="none" stroke="${ACCENT_LIGHT}" stroke-opacity="0.28" stroke-width="1.5"/>
</svg>`;

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  writeFileSync(OUT, png);
  const meta = await sharp(png).metadata();
  console.log(`[gen:og] wrote ${OUT} (${meta.width}×${meta.height}, ${(png.length / 1024).toFixed(0)}KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
