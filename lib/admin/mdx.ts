/**
 * Frontmatter <-> MDX (de)serialization for the CMS, matching the exact format
 * the migrated posts use (double-quoted scalars, single-line string arrays).
 *
 * We hand-roll this (no gray-matter/js-yaml at runtime) to keep diffs identical
 * to the existing files and to stay dependency-light on the Worker.
 */
export interface PostFrontmatter {
  title: string;
  slug: string;
  description: string;
  date: string; // YYYY-MM-DD
  updated?: string;
  categories: string[];
  tags: string[];
  hero?: string;
  heroAlt?: string;
  canonical: string;
  source_url?: string;
  recovered?: boolean;
  draft?: boolean;
}

const FIELD_ORDER: (keyof PostFrontmatter)[] = [
  "title",
  "slug",
  "description",
  "date",
  "updated",
  "categories",
  "tags",
  "hero",
  "heroAlt",
  "canonical",
  "source_url",
  "recovered",
  "draft",
];

export interface ParsedPost {
  frontmatter: Record<string, unknown>;
  body: string;
}

export function parseMdx(raw: string): ParsedPost {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { frontmatter: {}, body: raw };
  const body = raw.slice(m[0].length);
  const fm: Record<string, unknown> = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const rawVal = line.slice(idx + 1).trim();
    fm[key] = parseValue(rawVal);
  }
  return { frontmatter: fm, body };
}

function parseValue(v: string): unknown {
  if (v === "") return "";
  if (v === "true") return true;
  if (v === "false") return false;
  if (v.startsWith("[") && v.endsWith("]")) {
    const inner = v.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((s) => unquote(s.trim()));
  }
  return unquote(v);
}
function unquote(s: string): string {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return s;
}

function quote(s: string): string {
  return `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function serializeMdx(fm: PostFrontmatter, body: string): string {
  const lines: string[] = ["---"];
  for (const key of FIELD_ORDER) {
    const val = fm[key];
    if (val === undefined || val === null) continue;
    if (Array.isArray(val)) {
      // always emit categories/tags (even if empty) to keep a stable shape
      lines.push(`${key}: [${val.map((x) => quote(x)).join(", ")}]`);
    } else if (typeof val === "boolean") {
      if (val) lines.push(`${key}: ${val}`); // omit falsey flags
    } else if (val !== "") {
      lines.push(`${key}: ${quote(val)}`);
    }
  }
  lines.push("---", "");
  const cleanBody = body.replace(/^\s+/, "").replace(/\s+$/, "");
  return lines.join("\n") + "\n" + cleanBody + "\n";
}

/** Slugs are SEO-load-bearing (join key for 301s). Enforce the safe charset. */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

export const CANONICAL_BASE = "https://russelldsmith.com";
export function canonicalFor(slug: string): string {
  return `${CANONICAL_BASE}/blog/${slug}/`;
}
