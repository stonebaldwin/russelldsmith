/**
 * Canonical redirect logic for the teammovemortgage.com -> russelldsmith.com
 * migration. This is the SINGLE SOURCE OF TRUTH shared by:
 *   - the redirect-only Worker (workers/redirect) — via a generated explicit map
 *   - the build-time redirect test (scripts/test-redirects.ts)
 *
 * Rules (all 301, query strings preserved by the caller). Order matters:
 *   1. Explicit map (root pages, .php, renamed slugs)
 *   2. Gen 2:  /blog/YYYY/MM/DD/{slug}/ -> /blog/{slug}/
 *   3. Gen 1:  /YYYY/MM/DD/{slug}/      -> /blog/{slug}/
 *   4. Double-blog cleanup: /blog/blog/{slug}/ -> /blog/{slug}/
 *   5. Old category root:   /category/{cat}/   -> /blog/category/{cat}/
 *   6. Live pass-through: same path
 * Unmatched paths fall through to "/" in the Worker (logged), never here.
 */

export type ExplicitMap = Record<string, string>;

/**
 * Base explicit map from the migration brief (section 7.2): the known
 * root/service/.php pages of the old site. The build step MERGES the
 * `match_method = explicit` rows from docs/redirect-map.csv on top of this
 * (CSV wins on conflict) to produce the final map the Worker ships.
 */
export const BASE_EXPLICIT: ExplicitMap = {
  "/": "/",
  "/index.php": "/",
  "/404.php": "/",
  "/usda/": "/usda-loans/",
  "/usda-loans.php": "/usda-loans/",
  "/fha/": "/fha-loans/",
  "/fha-loans.php": "/fha-loans/",
  "/va-loan/": "/va-loans/",
  "/va-loans.php": "/va-loans/",
  "/construction-perm/": "/construction-perm/",
  "/rehab-loans/": "/renovation-loans/",
  "/mortgage-calculators/": "/mortgage-calculators/",
  "/down-payment-assistance-nc-sc/": "/down-payment-assistance/",
  "/down-payment-assistance.php": "/down-payment-assistance/",
  "/va-funding-fee-tables/": "/va-funding-fee-tables/",
  "/reverse-mortgages-nc-sc/": "/reverse-mortgages/",
  "/rental-properties/": "/investment-property-loans/",
  "/vacation-home-purchase/": "/blog/second-home/",
  "/1st-time-buyer-mcc-tax-credit-nc/": "/blog/mortgage-credit-certificate/",
  "/jumbo/": "/jumbo-loans/",
  "/jumbo-loans.php": "/jumbo-loans/",
  "/lot-loans.php": "/construction-perm/",
  "/contact-us/": "/contact/",
  "/contact-team-move.php": "/contact/",
  "/our-team/": "/about/",
  "/about-team-move.php": "/about/",
  "/our-process/": "/about/",
};

function ensureTrailingSlash(p: string): string {
  if (p === "" ) return "/";
  // leave query/hash-less directory paths with a trailing slash
  if (p.endsWith("/")) return p;
  // don't touch things that look like files (has a dot in the last segment)
  const last = p.split("/").pop() ?? "";
  if (last.includes(".")) return p;
  return p + "/";
}

/** Map an old pathname to its new pathname. Pure; no query handling. */
export function mapPath(pathname: string, explicit: ExplicitMap = BASE_EXPLICIT): string {
  let p = pathname || "/";
  if (!p.startsWith("/")) p = "/" + p;

  // 1. Explicit map — try exact, then with/without trailing slash.
  if (explicit[p] !== undefined) return explicit[p];
  const alt = p.endsWith("/") ? p.slice(0, -1) : p + "/";
  if (explicit[alt] !== undefined) return explicit[alt];

  // 2. Gen 2: /blog/YYYY/MM/DD/{slug}/ -> /blog/{slug}/
  let m = p.replace(/^\/blog\/\d{4}\/\d{2}\/\d{2}\/(.+)$/, "/blog/$1");
  if (m !== p) return ensureTrailingSlash(m);

  // 3. Gen 1: /YYYY/MM/DD/{slug}/ -> /blog/{slug}/
  m = p.replace(/^\/\d{4}\/\d{2}\/\d{2}\/(.+)$/, "/blog/$1");
  if (m !== p) return ensureTrailingSlash(m);

  // 4. Double-blog cleanup: /blog/blog/{slug}/ -> /blog/{slug}/
  m = p.replace(/^\/blog\/blog\/(.+)$/, "/blog/$1");
  if (m !== p) return ensureTrailingSlash(m);

  // 5. Old category root: /category/{cat}/ -> /blog/category/{cat}/
  m = p.replace(/^\/category\/(.+)$/, "/blog/category/$1");
  if (m !== p) return ensureTrailingSlash(m);

  // 6. Live pass-through (already on the new structure).
  return p;
}
