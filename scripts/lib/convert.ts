/**
 * HTML -> MDX conversion, shared by the scraper (live REST content) and the
 * Wayback recovery script. Responsibilities (migration brief section 4.2):
 *   - strip boilerplate / junk blocks
 *   - localize <img> to /images/blog/{slug}/... and report images to download
 *   - rewrite internal teammovemortgage.com links to site-relative via mapPath()
 *   - de-brand "Team Move" -> "Russell D Smith" on VISIBLE TEXT ONLY
 *   - convert to GitHub-flavored Markdown (tables, etc.)
 * Returns markdown + the image manifest + audit flags. Never throws on content.
 */
import * as cheerio from "cheerio";
import TurndownService from "turndown";
// @ts-expect-error - no types published for the gfm plugin
import { gfm } from "turndown-plugin-gfm";
import { mapPath } from "../../lib/redirects.js";
import { ORIGIN, decodeEntities } from "./wp.js";

export interface ImageRef {
  srcUrl: string; // absolute source to download
  localPath: string; // /images/blog/{slug}/{filename}
  filename: string;
}

export interface ConvertResult {
  markdown: string;
  images: ImageRef[];
  debrandCount: number;
  flags: string[];
}

const BRAND_REPLACEMENTS: [RegExp, string][] = [
  [/team\s*move\s+mortgage(,?\s+llc)?/gi, "Russell D Smith"],
  [/\bteam\s*move\b/gi, "Russell D Smith"],
  [/teammovemortgage\.com/gi, "russelldsmith.com"],
];

/** De-brand plain text (titles, descriptions). */
export function debrandText(input: string): { text: string; count: number } {
  let count = 0;
  let text = input;
  for (const [re, to] of BRAND_REPLACEMENTS) {
    text = text.replace(re, () => {
      count++;
      return to;
    });
  }
  return { text, count };
}

function absolutize(url: string, baseUrl: string): string {
  try {
    if (url.startsWith("//")) return "https:" + url;
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
}

function isOriginHost(u: string): boolean {
  try {
    const host = new URL(u).host.replace(/^www\./, "");
    return host === "teammovemortgage.com" || host.endsWith(".teammovemortgage.com");
  } catch {
    return false;
  }
}

function filenameFromUrl(url: string, used: Set<string>): string {
  let base = "image";
  try {
    const u = new URL(url);
    base = decodeURIComponent(u.pathname.split("/").filter(Boolean).pop() || "image");
  } catch {
    base = url.split("/").pop() || "image";
  }
  base = base.split("?")[0].split("#")[0];
  base = base.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!/\.[a-z0-9]{2,5}$/.test(base)) base += ".jpg";
  let name = base;
  let i = 2;
  while (used.has(name)) {
    const dot = base.lastIndexOf(".");
    name = `${base.slice(0, dot)}-${i}${base.slice(dot)}`;
    i++;
  }
  used.add(name);
  return name;
}

/**
 * The legacy site used the Enfold/Avia page builder. Its `[av_*]` shortcodes
 * (and a few other WP shortcodes) arrive UNRENDERED in REST content and would
 * otherwise leak in as escaped `\[av_button...\]` text. Convert buttons to real
 * links (so link-rewriting + de-branding still apply) and drop layout wrappers.
 */
// WordPress shortcode attributes may use straight OR smart quotes.
function shortcodeAttr(tag: string, name: string): string {
  const re = new RegExp(`${name}=\\s*(['"\\u2018\\u2019\\u201c\\u201d])([\\s\\S]*?)\\1`, "i");
  const m = tag.match(re);
  return m ? m[2].trim() : "";
}

function stripWpShortcodes(html: string): string {
  // av_button / av_button_big -> <a>
  html = html.replace(/\[av_button[^\]]*\]/gi, (raw) => {
    const m = decodeEntities(raw); // shortcode quotes arrive as &#8217; entities
    const label = shortcodeAttr(m, "label") || "Learn more";
    const link = shortcodeAttr(m, "link");
    let url = "";
    if (link) {
      const parts = link.split(",");
      url = (parts.length > 1 ? parts.slice(1).join(",") : parts[0]).trim();
    }
    return /^(https?:\/\/|\/)/i.test(url)
      ? `<p><a href="${url}">${label}</a></p>`
      : `<p>${label}</p>`;
  });
  html = html.replace(/\[\/av_button[^\]]*\]/gi, "");
  // Drop all remaining Enfold av_* wrappers (open/close), keeping inner content.
  html = html.replace(/\[\/?av_[a-z0-9_]*[^\]]*\]/gi, "");
  // Drop other common WP/page-builder shortcodes.
  html = html.replace(
    /\[\/?(?:caption|gallery|vc_[a-z_]*|toggle|tabs?|tab_[a-z]*|accordion[a-z_]*|contact-form-7|cf7[a-z0-9_-]*|wpforms|embed|playlist|audio|video|ecs-list-posts|su_[a-z_]*)[^\]]*\]/gi,
    "",
  );
  return html;
}

function makeTurndown(): TurndownService {
  const td = new TurndownService({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "_",
    strongDelimiter: "**",
    linkStyle: "inlined",
  });
  td.use(gfm);
  td.remove(["script", "style", "noscript"]);
  return td;
}

// Junk containers occasionally embedded in post bodies.
const JUNK_SELECTORS = [
  ".sharedaddy",
  ".jp-relatedposts",
  ".addtoany_share_save_container",
  ".addtoany_content",
  ".sd-sharing",
  ".post-views",
  ".wpcnt",
  ".yarpp-related",
  "#jp-post-flair",
  "script",
  "style",
  "ins.adsbygoogle",
];

/** Convert one post's content HTML into MDX-ready markdown. */
export function htmlToMdx(
  contentHtml: string,
  opts: { slug: string; postUrl: string },
): ConvertResult {
  const { slug, postUrl } = opts;
  const flags: string[] = [];
  let debrandCount = 0;
  const images: ImageRef[] = [];
  const usedNames = new Set<string>();

  const $ = cheerio.load(stripWpShortcodes(contentHtml), null, false);

  // 1. Remove junk blocks.
  for (const sel of JUNK_SELECTORS) $(sel).remove();

  // 1.5. Unwrap WordPress layout tables (no <th>, cells contain block content
  // like headings/paragraphs/images). turndown leaves these as raw HTML, which
  // react-markdown won't render — so flatten them to normal flow. Genuine data
  // tables (inline cell content) are left for turndown-gfm to convert.
  $("table").each((_, el) => {
    const $t = $(el);
    if ($t.find("th").length) return;
    const hasBlock = $t
      .find("td")
      .toArray()
      .some((td) => $(td).find("h1,h2,h3,h4,h5,h6,p,ul,ol,div,img,table,blockquote").length > 0);
    if (!hasBlock) return;
    const parts = $t
      .find("td")
      .toArray()
      .map((td) => $(td).html() || "");
    $t.replaceWith(`<div>${parts.join("\n")}</div>`);
  });

  // 2. Convert iframes (video embeds) into a plain link so MDX stays safe.
  $("iframe").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src");
    if (src) {
      const abs = absolutize(src, postUrl);
      $(el).replaceWith(`<p><a href="${abs}">Watch the video</a></p>`);
    } else {
      $(el).remove();
    }
  });

  // 3. Localize images.
  $("img").each((_, el) => {
    const $img = $(el);
    const raw =
      $img.attr("src") ||
      $img.attr("data-src") ||
      $img.attr("data-lazy-src") ||
      ($img.attr("srcset") || $img.attr("data-srcset") || "").split(",")[0]?.trim().split(" ")[0] ||
      "";
    if (!raw || raw.startsWith("data:")) {
      $img.remove();
      return;
    }
    const abs = absolutize(raw, postUrl);
    const filename = filenameFromUrl(abs, usedNames);
    const localPath = `/images/blog/${slug}/${filename}`;
    images.push({ srcUrl: abs, localPath, filename });
    // De-brand alt text (Team Move -> Russell D Smith) — attributes aren't
    // covered by the text-node walk below.
    const altRes = debrandText($img.attr("alt") || "");
    debrandCount += altRes.count;
    // Reset the node to a clean <img> (drop srcset/sizes/lazy/data-*).
    const clean = $("<img>").attr("src", localPath).attr("alt", altRes.text);
    $img.replaceWith(clean);
  });

  // 4. Rewrite internal links; demote stray <h1> to <h2>.
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (/^(mailto:|tel:|#)/i.test(href)) return;
    const abs = absolutize(href, postUrl);
    if (isOriginHost(abs)) {
      try {
        const u = new URL(abs);
        $(el).attr("href", mapPath(u.pathname) + (u.search || ""));
      } catch {
        /* leave */
      }
    }
  });
  $("h1").each((_, el) => {
    const $el = $(el);
    const tag = $("<h2>").html($el.html() || "");
    $el.replaceWith(tag);
  });
  // Move images out of headings so they don't glue onto the heading text.
  $("h2,h3,h4,h5,h6").each((_, el) => {
    const $h = $(el);
    $h.find("img").each((__, im) => {
      $("<p>").append($(im).clone()).insertAfter($h);
      $(im).remove();
    });
  });

  // 5. De-brand visible text nodes only (never attributes/hrefs).
  const walk = (node: any) => {
    if (node.type === "text") {
      const { text, count } = debrandText(node.data ?? "");
      if (count) {
        node.data = text;
        debrandCount += count;
      }
    } else if (node.children) {
      node.children.forEach(walk);
    }
  };
  ($.root()[0] as any).children.forEach(walk);

  // 6. Convert to markdown.
  const html = $.html();
  let markdown = makeTurndown().turndown(html);

  // 7. Tidy: collapse >2 blank lines, trim.
  markdown = markdown.replace(/\n{3,}/g, "\n\n").trim() + "\n";

  // 8. Audit flags.
  if (/team\s*move/i.test(markdown)) flags.push("still-mentions-team-move");
  if (/\b(?:\(?\d{3}\)?[.\s-]?\d{3}[.\s-]?\d{4})\b/.test(markdown)) flags.push("contains-phone-number");
  if (images.length === 0) flags.push("no-body-images");

  return { markdown, images, debrandCount, flags };
}

/**
 * Sniff bytes to distinguish real images from the HTML error pages the origin
 * sometimes returns with a 200 status for missing images.
 */
function sniffKind(buf: Buffer): "image" | "html" | "other" {
  const head = buf.subarray(0, 64).toString("latin1").trim().toLowerCase();
  if (
    head.startsWith("<!doctype") ||
    head.startsWith("<html") ||
    head.startsWith("<head") ||
    head.startsWith("<body")
  ) {
    return "html";
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image"; // JPEG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image"; // PNG
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "image"; // GIF
  if (buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return "image";
  if (head.includes("<svg")) return "image"; // SVG
  return "other";
}

/** Download an image to disk; returns true only for a VALID image. Node-only. */
export async function downloadImage(
  srcUrl: string,
  destAbsPath: string,
  ua: string,
): Promise<boolean> {
  const fs = await import("node:fs");
  const path = await import("node:path");
  if (fs.existsSync(destAbsPath)) return true; // already fetched + validated
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 45000);
  try {
    const res = await fetch(srcUrl, { headers: { "User-Agent": ua }, signal: ac.signal });
    if (!res.ok) return false;
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 512) return false; // tracking pixels / empties
    const kind = sniffKind(buf);
    // Reject HTML error pages served as images; require an image signature or
    // an explicit image/* content-type.
    if (kind === "html") return false;
    if (kind !== "image" && !ct.startsWith("image/")) return false;
    fs.mkdirSync(path.dirname(destAbsPath), { recursive: true });
    fs.writeFileSync(destAbsPath, buf);
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export { ORIGIN };
