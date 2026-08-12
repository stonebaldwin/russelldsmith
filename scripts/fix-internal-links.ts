/**
 * One-time migration cleanup: fix broken internal links in the migrated post
 * bodies. Old WordPress links point at pre-migration slugs / dead pages, which
 * the Ahrefs audit flags as broken-link errors.
 *
 *   tsx scripts/fix-internal-links.ts [--dry]
 *
 * Strategy:
 *  - CURATED map: hand-verified old-path → new-path (reviewed from a token-overlap
 *    matcher; only confident mappings included).
 *  - Rules: /tag/{x}/ → /blog/tag/{x}/ (if the tag exists); /apply-online/ → the
 *    external apply URL.
 *  - Everything else broken (dead PDFs, ambiguous old slugs, old post-ids) is
 *    UNLINKED — the anchor text is kept, the broken href removed. Better a plain
 *    phrase than a 404 or a wrong destination.
 */
import fs from "node:fs";
import path from "node:path";
import { CONTACT } from "../lib/site";

const DRY = process.argv.includes("--dry");
const APPLY = CONTACT.applyUrl;

// hand-verified old blog path → new blog path (both site-relative, trailing slash)
const CURATED: Record<string, string> = mapBlog({
  "commission-income-for-fha-loans": "fha-commission-income",
  "self-employed-business-owners-how-to-qualify-to-buy-a-home": "self-employed-home-loan",
  "self-employed-business-owner-borrowers-and-qualifying-for-a-mortgage-loan-to-purchase-a-home": "self-employed-mortgage",
  "did-you-know-that-some-forms-of-nontaxable-income-can-be-grossed-up": "non-taxable-income",
  "rent-your-current-home-and-buy-a-new-home-with-va-no-money-down": "va-rental-income",
  "step-by-step-instructions-for-locating-usda-eligible-properties-areas": "usda-property-eligibility",
  "will-credit-limit-increase-on-my-credit-card-hurt-my-score": "increase-credit-limit",
  "fha-loan-limits-in-south-carolina-counties": "sc-fha-loan-size-limits-sc-counties",
  "understand-why-when-flood-insurance-is-required-on-a-purchase": "flood-insurance-requirements",
  "how-to-search-for-fha-approved-condos": "fha-approved-condos-search",
  "va-fha-mortgage-loan-approvals-with-deferred-student-loan-payments": "deferred-student-loans-payments",
  "modular-homes-how-to-tell-the-difference-between-off-frame-and-on-frame": "on-frame-off-frame-modulars",
  "fha-has-changed-a-lot-of-guidelines-effective-91415-that-can-hurt-or-help-buyers": "fha-changes-guidelines-2",
  "2016-2017-usda-funding-fee-and-annual-fee-decrease-to-lower-mortgage-payments": "2016-2017-usda-funding-fee",
  "fha-down-payment-that-is-a-gift-from-family-or-employers-requirements": "gift-funds-fha",
  "homebuyer-series-i-want-to-buy-a-home-in-a-year-or-less-knowing-your-financing-options": "low-down-payment-options-2",
  "homebuyer-series-i-want-to-buy-a-home-in-a-year-or-less-your-roadmap-to-get-home": "mortgage-approval-credit-requirements",
  "homebuyer-series-step-2-i-want-to-buy-a-home-in-a-year-or-less-your-roadmap-to-get-home": "mortgage-approval-credit-requirements",
  "homebuyer-series-step-3-i-want-to-buy-a-home-in-a-year-or-less-your-roadmap-to-get-home": "mortgage-approval-credit-requirements",
  "no-rent-history-living-with-parents-or-family-we-have-mortgage-loan-solutions": "rent-free-mortgages-options",
  "5-reasons-why-now-is-the-time-to-move-from-your-parents-couch": "how-to-move-out-of-your-parents-house",
  "veterans-can-request-dd-214s-online-request-yours-today": "dd214-va-records",
  "why-how-you-should-check-your-credit-report-every-year": "credit-report-errors",
  "using-a-pastor-ministers-housing-allowance-to-qualify-for-a-mortgage-loan": "pastor-housing-allowance",
  "lower-your-interest-rate-with-a-va-interest-rate-reduction-refinance-loan-irrrl": "va-refinance-irrrl",
  "request-your-va-certificate-of-eligibility-to-buy-a-home-with-no-money-down": "va-certificate-of-eligibility",
  "spoiler-alert-reading-this-will-cause-sunny-days-endless-golf-dining-galore": "brunswick-county-nc",
  "south-carolina-property-tax-exemption-for-100-permanently-disabled-veterans": "sc-property-tax-exemption",
  "appraisal-requirements-to-look-for-in-order-to-prevent-delays-extra-costs-appraisal-tips": "appraisal-requirements-tips",
  "va-home-loan-requirements-for-termite-and-pest-inspections": "pest-inspection-va-requirements",
  "do-not-use-cash-when-purchasing-a-home-and-applying-for-a-mortgage": "cash-deposits-mortgages",
  "requirements-for-funds-needed-at-closing": "certified-funds-requirements",
  "2016-fha-loan-size-limits-per-county-or-area-in-nc": "2017-nc-fha-loan-size-limits-per-county",
  "credit-repair-consequences-how-to-remove-disputes-from-credit-for-mortgage-loan-approvals": "credit-disputes-problems",
  "water-testing-requirements-for-va-loans": "va-well-water-test",
  "you-can-get-a-2nd-va-mortgage-loan-while-you-have-another-va-mortgage-loan-with-bonus-or-2nd-tier-entitlement": "bonus-entitlement-2nd-tier-entitlement",
  "limits-on-seller-paid-closing-costs-for-buyers-using-va-fha-usda-fannie-mae-freddie-mac-loans": "seller-paid-costs-limits",
  "construction-to-permanent-loans-with-little-to-no-money-down-in-nc-sc-va": "construction-loans",
  "va-purchases-on-private-roads-dirt-roads-and-unpaved-roads": "all-weather-road",
  "2015-va-loan-limits-for-north-carolina-and-virginia-high-cost-counties": "va-loan-limits",
  "dont-be-surprised-10-important-steps-to-be-ready-for-closing": "purchase-closing",
  "all-of-brunswick-county-nc-is-approved-for-100-financing-through-usda-rural-development-guaranteed": "brunswick-county-usda",
  "so-many-ways-besides-cash-to-buy-a-second-home-at-the-beach-or-mountains": "second-home",
  "innovative-flexible-bank-statement-income-program-available": "bank-statement-mortgage-loans",
  "horry-county-sc-tax-office-application-for-legal-residence-4-special-assessment-rate": "horry-county-sc-residential-exemption",
  "va-mortgage-guidelines-for-determining-if-primary-residence-is-within-a-reasonable-commute-to-work": "va-home-loan-occupancy-requirements",
  "va-loan-for-purchase-while-veteran-already-has-another-va-loan-and-seller-pays-off-buyers-debt": "debts-being-paid-off-at-closing-on-a-va-home-loan",
  "you-just-killed-your-mortgage-approval-at-the-last-hour-solution-be-boring": "mortgage-loan-process",
  "best-tip-to-raise-credit-scores-fast-2015": "credit-score-tips",
  "should-you-enroll-in-bi-weekly-mortgage-payments-learn-the-truth-behind-numbers": "biweekly-mortgage",
  "checklist-of-items-to-provide-to-your-mortgage-lender-when-purchasing-a-home": "mortgage-checklist",
  "approving-fha-loans-with-only-1-credit-score-or-no-credit-scores": "fha-loans-low-credit-scores",
  "va-jumbo-loans-yes-va-offers-great-loans-for-luxury-homes": "va-jumbo-loans-nc-sc",
  "homebuyer-series-week-4-i-want-to-buy-a-home-in-a-year-or-less-best-tips-for-paying-rent-why": "rent-tips-first-time-buyers",
  "fha-mortgage-loan-approvals-with-limited-credit-or-low-credit-scores": "fha-loans-low-credit-scores",
});
// non-blog / landing curated
Object.assign(CURATED, {
  "/apply-online/": APPLY,
  "/mortgage-calculators.php/": "/mortgage-calculators/",
  "/down-payment-assistance-nc-sc/": "/down-payment-assistance/",
  "/first-time-home-buyers/": "/blog/first-time-home-buyer/",
  "/blog/.2015/06/12/va-loan-limits/": "/blog/va-loan-limits/",
  "/our-team/": "/about/",
  "/our-team/russell-smith/": "/about/",
});

function mapBlog(o: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) out[`/blog/${k}/`] = `/blog/${v}/`;
  return out;
}

// ---- load valid paths + tags -----------------------------------------------
const m = JSON.parse(fs.readFileSync("content-manifest.json", "utf8"));
const validPaths = new Set<string>(m.allPaths.map((p: string) => (p.endsWith("/") ? p : p + "/")));
["/", "/about/", "/contact/", "/blog/", "/search/"].forEach((p) => validPaths.add(p));
const tagSlugs = new Set<string>(m.tags.map((t: any) => t.slug ?? t));

// validate curated destinations resolve (external URLs excepted)
for (const [from, to] of Object.entries(CURATED)) {
  if (/^https?:\/\//.test(to)) continue;
  if (!validPaths.has(to)) console.warn(`⚠ curated dest not a live path: ${from} → ${to}`);
}

function normalize(href: string): string {
  const base = href.split("#")[0].split("?")[0];
  return base.endsWith("/") ? base : base + "/";
}
/** returns { action } for a raw internal href, or null if it's fine/external/asset */
function resolve(href: string): { kind: "rewrite"; to: string } | { kind: "unlink" } | null {
  if (!href.startsWith("/") || href.startsWith("/images/") || href.startsWith("/media/")) return null;
  const norm = normalize(href);
  if (validPaths.has(norm)) return null; // already valid
  if (CURATED[norm]) return { kind: "rewrite", to: CURATED[norm] };
  const tagm = norm.match(/^\/tag\/([^/]+)\/$/);
  if (tagm && tagSlugs.has(tagm[1])) return { kind: "rewrite", to: `/blog/tag/${tagm[1]}/` };
  return { kind: "unlink" };
}

// keep any #fragment when rewriting
function withFragment(rawHref: string, to: string): string {
  if (/^https?:\/\//.test(to)) return to;
  const frag = rawHref.includes("#") ? "#" + rawHref.split("#")[1] : "";
  return to.replace(/\/$/, "/") + frag;
}

// ---- rewrite ----------------------------------------------------------------
const dir = "content/blog";
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
let filesChanged = 0,
  rewrites = 0,
  unlinks = 0;

for (const f of files) {
  const p = path.join(dir, f);
  let body = fs.readFileSync(p, "utf8");
  const before = body;

  // linked images first: [![alt](img)](/path) — nested brackets the plain link
  // regex can't handle. Unlinking keeps just the inline image.
  body = body.replace(/\[(!\[[^\]]*\]\([^)]*\))\]\((\/[^)\s]*)(?:\s+["'][^"')]*["'])?\)/g, (full, img, href) => {
    const r = resolve(href);
    if (!r) return full;
    if (r.kind === "rewrite") { rewrites++; return `[${img}](${withFragment(href, r.to)})`; }
    unlinks++;
    return img;
  });

  // markdown links: [text](/path) or [text](/path "title")
  body = body.replace(/\[([^\]]*)\]\((\/[^)\s]*)(?:\s+["'][^"')]*["'])?\)/g, (full, text, href) => {
    const r = resolve(href);
    if (!r) return full;
    if (r.kind === "rewrite") { rewrites++; return `[${text}](${withFragment(href, r.to)})`; }
    unlinks++;
    return text;
  });

  // html anchors: <a ... href="/path" ...>text</a>
  body = body.replace(/<a\s+[^>]*href="(\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (full, href, text) => {
    const r = resolve(href);
    if (!r) return full;
    if (r.kind === "rewrite") { rewrites++; return full.replace(href, withFragment(href, r.to)); }
    unlinks++;
    return text;
  });

  if (body !== before) {
    filesChanged++;
    if (!DRY) fs.writeFileSync(p, body);
  }
}

console.log(
  `${DRY ? "[DRY] " : ""}files changed: ${filesChanged} · links rewritten: ${rewrites} · links unlinked: ${unlinks}`,
);
