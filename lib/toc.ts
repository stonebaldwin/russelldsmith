import GithubSlugger from "github-slugger";

export interface TocItem {
  depth: 2 | 3;
  text: string;
  id: string;
}

/** Strip inline markdown syntax from heading text for display + slugging. */
function stripInlineMd(s: string): string {
  return s
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();
}

/**
 * Extract h2/h3 headings from markdown for the table of contents. Uses the same
 * github-slugger algorithm as rehype-slug (and in document order), so the ids
 * match the anchors rehype-slug generates on the rendered page exactly.
 */
export function extractToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  const lines = markdown.split("\n");
  let inFence = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const depth = m[1].length as 2 | 3;
    const text = stripInlineMd(m[2]);
    if (!text) continue;
    items.push({ depth, text, id: slugger.slug(text) });
  }
  return items;
}
