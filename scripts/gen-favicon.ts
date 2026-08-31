/**
 * Generates the site's icon set from the real ALCOVA icon mark.
 *
 *   app/icon.svg        — scalable; what modern browsers use for the tab
 *   app/apple-icon.png  — 180×180 iOS home-screen icon (must be opaque)
 *   app/favicon.ico     — 16/32/48 fallback for older browsers and Windows
 *
 * Next.js App Router picks all three up by filename; no <link> tags needed.
 *
 * The brand asset (public/media/site/alcova-icon-white.svg) is a WHITE mark on
 * transparency, which would be invisible against a light browser tab. So it is
 * composited onto a full-bleed brand-blue rounded tile — legible on light and
 * dark tab strips alike, and it matches the site's own accent colour.
 *
 * Re-run with `npm run gen:favicon` after a brand change.
 */
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SRC = resolve(ROOT, "public/media/site/alcova-icon-white.svg");

/** --accent in app/globals.css — the ALCOVA Mortgage brand blue. */
const BRAND = "#00589d";
/** Fraction of the tile the mark occupies; the rest is breathing room. */
const MARK_SCALE = 0.86;
/** Corner radius as a fraction of the tile — app-icon feel, still crisp at 16px. */
const RADIUS = 0.2;

/** viewBox of the source mark, so it can be centred without guessing. */
function markViewBox(svg: string): { w: number; h: number } {
  const m = /viewBox="([\d.\s-]+)"/.exec(svg);
  if (!m) throw new Error("No viewBox in source SVG");
  const [, , w, h] = m[1].trim().split(/\s+/).map(Number);
  return { w, h };
}

/** The mark's <path> elements, lifted out of the source file. */
function markPaths(svg: string): string {
  const paths = svg.match(/<path\b[^>]*\/>/g);
  if (!paths?.length) throw new Error("No <path> in source SVG");
  // The source colours via a CSS class in <defs>; inline the fill instead so the
  // path works standalone.
  return paths.map((p) => p.replace(/class="[^"]*"/, 'fill="#fff"')).join("");
}

/** Composes the tile at a given canvas size (SVG units == px). */
function tileSvg(size: number, src: string): string {
  const { w, h } = markViewBox(src);
  const scale = (size * MARK_SCALE) / h;
  const dx = (size - w * scale) / 2;
  const dy = (size - h * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * RADIUS}" fill="${BRAND}"/>
  <g transform="translate(${dx.toFixed(3)} ${dy.toFixed(3)}) scale(${scale.toFixed(5)})">${markPaths(src)}</g>
</svg>`;
}

/**
 * Packs PNGs into an .ico. Modern ICO allows raw PNG per entry, so this is just
 * the 6-byte header + one 16-byte directory entry each + the PNG bytes — no
 * BMP re-encoding and no extra dependency.
 */
function buildIco(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries: Buffer[] = [];
  for (const { size, png } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 == 256)
    e.writeUInt8(size >= 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // palette size
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)]);
}

async function main() {
  const src = readFileSync(SRC, "utf8");

  // Scalable icon — rendered at whatever size the browser wants.
  const svgOut = resolve(ROOT, "app/icon.svg");
  writeFileSync(svgOut, `${tileSvg(512, src)}\n`);

  // Apple touch icon. iOS ignores transparency and squares the corners itself,
  // so this is flattened onto the brand colour rather than left with alpha.
  const appleOut = resolve(ROOT, "app/apple-icon.png");
  const apple = await sharp(Buffer.from(tileSvg(180, src)))
    .flatten({ background: BRAND })
    .png()
    .toBuffer();
  writeFileSync(appleOut, apple);

  // Legacy .ico, multi-resolution.
  const icoSizes = [16, 32, 48];
  const icoOut = resolve(ROOT, "app/favicon.ico");
  const pngs = await Promise.all(
    icoSizes.map(async (size) => ({
      size,
      png: await sharp(Buffer.from(tileSvg(size, src))).png().toBuffer(),
    })),
  );
  writeFileSync(icoOut, buildIco(pngs));

  console.log(`icon.svg        ${Buffer.byteLength(tileSvg(512, src))} B`);
  console.log(`apple-icon.png  180x180, ${apple.length} B`);
  console.log(`favicon.ico     ${icoSizes.join("/")}, ${buildIco(pngs).length} B`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
