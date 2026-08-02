/**
 * Reads docs/redirect-map.csv and merges its explicit rows over BASE_EXPLICIT
 * to produce the final map the redirect Worker ships. Shared by the Worker
 * generator and the redirect test.
 */
import fs from "node:fs";
import path from "node:path";
import { BASE_EXPLICIT, type ExplicitMap } from "../../lib/redirects.js";

export interface RedirectRow {
  legacy: string;
  refdomains: number;
  status: string;
  dest: string;
  method: string;
  action: string;
  notes: string;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

const CSV_PATH = path.join(process.cwd(), "docs", "redirect-map.csv");

export function readRedirectRows(): RedirectRow[] {
  const raw = fs.readFileSync(CSV_PATH, "utf8").trim();
  const lines = raw.split("\n").slice(1); // drop header
  const rows: RedirectRow[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const c = parseCsvLine(line);
    rows.push({
      legacy: c[0],
      refdomains: Number(c[1]) || 0,
      status: c[2],
      dest: c[3],
      method: c[4],
      action: c[5],
      notes: c[6] ?? "",
    });
  }
  return rows;
}

/** BASE_EXPLICIT overlaid with the CSV's `match_method = explicit` rows (CSV wins). */
export function buildMergedExplicit(): ExplicitMap {
  const merged: ExplicitMap = { ...BASE_EXPLICIT };
  for (const row of readRedirectRows()) {
    if (row.method === "explicit") merged[row.legacy] = row.dest;
  }
  return merged;
}
