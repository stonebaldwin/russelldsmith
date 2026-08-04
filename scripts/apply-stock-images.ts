/**
 * Apply fetched stock images to the MDX posts.
 *
 *   tsx scripts/apply-stock-images.ts [--dry]
 *
 * For each post in scripts/image-assignments.json:
 *  - point frontmatter `hero` at the new /images/blog/{slug}/stock.jpg
 *  - set `heroAlt` (keep existing, else the post title)
 *  - remove the first inline body image IF it duplicates the old hero (317/332
 *    posts repeat the hero as the first inline image — the hero already renders
 *    at the top of the page, so the inline copy is redundant)
 *
 * Uses targeted line edits (not gray-matter re-stringify) to avoid reformatting
 * the whole frontmatter block. Also writes docs/IMAGE-CREDITS.md +
 * public/images/blog/stock-credits.json for photographer attribution.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, "content", "blog");
const ASSIGN_FILE = path.join(ROOT, "scripts", "image-assignments.json");
const DRY = process.argv.includes("--dry");

interface Assignment {
  slug: string;
  concept: string;
  provider: string;
  id: string;
  photographer: string;
  photographerUrl: string;
  sourceUrl: string;
  localPath: string;
  alt: string;
}

/** strip a WordPress size suffix + extension so we can match variants. */
function imgKey(url: string | null): string | null {
  if (!url) return null;
  const file = url.split("/").pop() || "";
  return file.replace(/-\d+x\d+(?=\.\w+$)/, "").replace(/\.\w+$/, "");
}

function splitFrontmatter(text: string): { fm: string; body: string } | null {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return null;
  return { fm: m[1], body: text.slice(m[0].length) };
}

function upsertLine(fm: string, key: string, value: string): string {
  const re = new RegExp(`^${key}:.*$`, "m");
  const line = `${key}: "${value.replace(/"/g, '\\"')}"`;
  if (re.test(fm)) return fm.replace(re, line);
  // insert after `date:` if present, else append
  if (/^date:.*$/m.test(fm)) return fm.replace(/^(date:.*)$/m, `$1\n${line}`);
  return fm + `\n${line}`;
}

function getLine(fm: string, key: string): string | null {
  const m = fm.match(new RegExp(`^${key}:\\s*"?([^"\\n]*)"?\\s*$`, "m"));
  return m ? m[1] : null;
}

function main() {
  if (!fs.existsSync(ASSIGN_FILE)) {
    console.error("No image-assignments.json — run fetch-stock-images.ts first.");
    process.exit(1);
  }
  const assignments: Assignment[] = JSON.parse(fs.readFileSync(ASSIGN_FILE, "utf8"));
  let updated = 0,
    inlineRemoved = 0,
    heroAdded = 0,
    skipped = 0;
  const credits: Record<string, unknown> = {};

  for (const a of assignments) {
    const file = path.join(BLOG_DIR, a.slug + ".mdx");
    if (!fs.existsSync(file)) {
      console.warn("  ! missing post file:", a.slug);
      skipped++;
      continue;
    }
    const orig = fs.readFileSync(file, "utf8");
    const parts = splitFrontmatter(orig);
    if (!parts) {
      console.warn("  ! no frontmatter:", a.slug);
      skipped++;
      continue;
    }
    let { fm, body } = parts;

    const oldHero = getLine(fm, "hero");
    const title = getLine(fm, "title") || a.slug;
    const existingAlt = getLine(fm, "heroAlt");

    if (!oldHero) heroAdded++;
    fm = upsertLine(fm, "hero", a.localPath);
    fm = upsertLine(fm, "heroAlt", existingAlt || title);

    // remove the first inline body image if it duplicates the OLD hero
    const firstImg = body.match(/!\[[^\]]*\]\(([^)]+)\)/);
    if (firstImg && oldHero && imgKey(firstImg[1]) === imgKey(oldHero)) {
      body = body.replace(/[ \t]*!\[[^\]]*\]\([^)]+\)[ \t]*\n?/, "");
      // collapse a leading blank gap left behind
      body = body.replace(/^\n{3,}/, "\n\n");
      inlineRemoved++;
    }

    const next = `---\n${fm}\n---\n${body}`;
    if (next !== orig) {
      if (!DRY) fs.writeFileSync(file, next);
      updated++;
    }

    credits[a.slug] = {
      photographer: a.photographer,
      source: a.provider,
      sourceUrl: a.sourceUrl,
      photographerUrl: a.photographerUrl,
    };
  }

  if (!DRY) writeCredits(credits);

  console.log(
    `\n${DRY ? "[DRY] " : ""}Updated ${updated} post(s) · inline dup removed ${inlineRemoved} · heroes added ${heroAdded} · skipped ${skipped}`,
  );
}

function writeCredits(credits: Record<string, any>) {
  fs.writeFileSync(
    path.join(ROOT, "public", "images", "blog", "stock-credits.json"),
    JSON.stringify(credits, null, 2),
  );
  const lines = [
    "# Blog hero image credits",
    "",
    "Stock photos sourced from Pexels and Unsplash (both permit commercial use).",
    "Attribution is not required by either license but is recorded here as good practice.",
    "",
    "| Post | Photographer | Source |",
    "| --- | --- | --- |",
  ];
  for (const [slug, c] of Object.entries(credits).sort())
    lines.push(`| ${slug} | [${c.photographer}](${c.photographerUrl}) | [${c.source}](${c.sourceUrl}) |`);
  fs.writeFileSync(path.join(ROOT, "docs", "IMAGE-CREDITS.md"), lines.join("\n") + "\n");
}

main();
