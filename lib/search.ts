/** Client-side search over the static index emitted at /search-index.json. */

export interface SearchDoc {
  t: string; // title
  u: string; // url
  d: string; // description
  c: string[]; // category labels
  k: string; // lowercased keyword blob (title + description + categories + tags)
}

/**
 * Rank docs against a query. All terms must match (AND); title matches and
 * prefix matches score higher. Returns the top `limit` docs.
 */
export function searchDocs(docs: SearchDoc[], query: string, limit = 8): SearchDoc[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  const scored: { doc: SearchDoc; score: number }[] = [];
  for (const doc of docs) {
    const title = doc.t.toLowerCase();
    let score = 0;
    let allMatch = true;
    for (const term of terms) {
      const inTitle = title.includes(term);
      const inBlob = doc.k.includes(term);
      if (!inTitle && !inBlob) {
        allMatch = false;
        break;
      }
      if (title.startsWith(term)) score += 5;
      else if (inTitle) score += 3;
      if (inBlob) score += 1;
    }
    if (allMatch) {
      // small boost for whole-phrase title match
      if (title.includes(q)) score += 4;
      scored.push({ doc, score });
    }
  }
  scored.sort((a, b) => b.score - a.score || a.doc.t.localeCompare(b.doc.t));
  return scored.slice(0, limit).map((s) => s.doc);
}
