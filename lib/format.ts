/** Format an ISO date (YYYY-MM-DD) as "August 2, 2026" without timezone drift. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[m - 1]} ${d}, ${y}`;
}

/** ISO date for <time dateTime>. */
export function isoDate(iso: string): string {
  return iso.slice(0, 10);
}
