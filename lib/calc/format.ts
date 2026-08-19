/** Number formatting shared by every calculator. */

export function usd(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function usdCents(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Compact dollars for tight spots — $1.2M, $634K, $850. */
export function usdCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${Math.round(abs)}`;
}

export function pct(n: number, digits = 1): string {
  return `${(Number.isFinite(n) ? n : 0).toFixed(digits)}%`;
}

export function ratio(n: number, digits = 2): string {
  return (Number.isFinite(n) ? n : 0).toFixed(digits);
}

/** Thousands separators for a number being typed into a currency field. */
export function groupDigits(n: number): string {
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** Read a number out of whatever the visitor typed. */
export function parseNumber(text: string): number {
  const cleaned = text.replace(/[^0-9.-]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}
