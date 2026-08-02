# Migration & Build Brief — russelldsmith.com

**Prepared:** August 2, 2026
**Read this fully before writing any code.** This is the source of truth for the project. Companion files in this folder: `redirect-map.csv` (exhaustive redirect map), `live-content-inventory.md` (content cross-check list), and the repo-root `CLAUDE.md` (hard rules).

---

## 0. TL;DR and the two rules that matter most

Russell D. Smith owns `teammovemortgage.com`, an old WordPress mortgage blog with years of accumulated SEO authority. We are rebuilding it as a modern **Next.js site on Cloudflare Workers** at **`russelldsmith.com`** (branding: **"Russell D Smith"**), migrating all content, and preserving + **recovering** the SEO.

Two rules govern every decision:

1. **Preserve URLs, not just content.** Every old URL must `301` to an equivalent new URL, path-for-path. Never mass-redirect the old domain to the new homepage — Google treats that as a soft 404 and discards the equity.
2. **The dead links are the prize.** The domain used three URL structures over the years and most old inbound links now dead-end on a `404.php` page. We recover them. See §2 and §5.

**By the numbers (Ahrefs, Aug 2026):** DR 8, but **520 live referring domains** and **3,398 all-time** — the gap is leaked equity. We identified **75 dead-but-linked URLs carrying 2,716 referring domains**, of which **25 deleted posts (~1,201 referring domains)** can be rebuilt and reclaimed. This reclamation is worth more than the site's current live traffic.

---

## 1. Goals

- Rebuild the site with a modern, fast, editorial UI (see §10 Design).
- Move to `russelldsmith.com`; retire the old GoDaddy site currently there and drop the "Team Move" brand entirely.
- **Acquire all live blog content by scraping** the existing site (Russell prefers scraping over a WordPress export; the article count is manageable). Guarantee completeness by cross-checking against a sitemap crawl and the Ahrefs-known list.
- **Recover deleted high-value posts** from the Wayback Machine and republish them at their original slugs.
- Build a complete **301 redirect layer** covering all three URL generations, then file a Change of Address with Google.

Russell has full registrar/DNS + hosting control of **both** domains, so edge-level redirects are available.

---

## 2. Current state (real data)

### 2.1 Three URL generations (all have backlinks; none were redirected)

- **Gen 1 — root date permalinks (~2014–2017):** `/YYYY/MM/DD/{slug}/`
- **Gen 2 — dated under /blog/ (~2019–2020):** `/blog/YYYY/MM/DD/{slug}/`
- **Gen 3 — current, live:** `/blog/{slug}/` (returns 200)
- **Legacy static pages:** `/{name}.php` (`/va-loans.php`, `/usda-loans.php`, `/fha-loans.php`, `/down-payment-assistance.php`, `/jumbo-loans.php`, `/lot-loans.php`, `/about-team-move.php`, `/contact-team-move.php`, `/index.php`, `/404.php`).
- **Root service pages:** `/usda/`, `/fha/`, `/va-loan/`, `/construction-perm/`, `/rehab-loans/`, `/mortgage-calculators/`, `/down-payment-assistance-nc-sc/`, `/va-funding-fee-tables/`, `/reverse-mortgages-nc-sc/`, `/rental-properties/`, `/jumbo/`, `/vacation-home-purchase/`, `/1st-time-buyer-mcc-tax-credit-nc/`, `/our-team/`, `/our-process/`, `/contact-us/`.
- **Old category root:** `/category/{cat}/` (later moved under `/blog/category/{cat}/`).

Observed breakage today: Gen 1 and Gen 2 URLs and several root pages now `302` to `https://teammovemortgage.com/404.php`, and some Gen 2 URLs `301` into a broken `/blog/blog/{slug}/` double-path. All that inbound equity is currently wasted. `/404.php` itself returns 200 and has ~125 referring domains pointing at it (aggregated dead links).

### 2.2 The opportunity, quantified

`redirect-map.csv` in this folder lists all 75 dead-but-linked URLs with their referring-domain counts and the destination each should map to. Summary:

- **2,716** referring domains flow through URLs that currently 301/302 to dead ends or the homepage.
- **25** of those are **deleted posts with no live equivalent** — together ~**1,201** referring domains — that we rebuild (Wayback) at their original slug. Top targets: the PMI-stop post (**284 refdomains**), USDA eligibility (118), manufactured-home doublewides (109), rental-property (87), Fannie Mae student loans (85), seller-paid-costs (84), tax-return-issues (82), down-payment-assistance-sc (61).
- The rest map cleanly via rule-based date-stripping to live posts, or via an explicit map for root/`.php` pages.

---

## 3. Architecture

- **Framework:** Next.js (App Router, latest stable), TypeScript, RSC.
- **Hosting:** Cloudflare Workers via **`@opennextjs/cloudflare`** (OpenNext Cloudflare adapter). Local dev + deploy with Wrangler. Verify current adapter docs at build time; do not fall back to `next-on-pages` without checking.
- **Content:** Markdown/MDX in-repo at `/content/blog/{slug}.mdx`, one file per post, parsed at build with `gray-matter` + the MDX pipeline. Static, fast, cheap on Workers, version-controlled.
- **Styling:** Tailwind CSS + a CSS-variable design-token layer. Optional shadcn/ui primitives; keep the editorial look custom.
- **Images:** stored in `/public/images/blog/{slug}/` (or Cloudflare R2). Never hot-link the old domain.
- **SEO:** sitemap route, JSON-LD, canonicals, Cloudflare Web Analytics, Google Search Console.
- **Redirects:** a separate redirect-only Worker bound to the `teammovemortgage.com` zone (§7).

Root `CLAUDE.md` must encode the hard rules (never change a migrated slug; the redirect test must pass; content model).

---

## 4. Phase 1 — Acquire all live content by scraping

**Goal:** every live post reproduced as an MDX file at its exact slug, with title, meta description, date, categories, tags, body, and images preserved.

### 4.1 Enumerate every live post (belt-and-suspenders — do all three, then union)

1. **Sitemaps:** fetch `https://teammovemortgage.com/wp-sitemap.xml` (WordPress core) and `/sitemap_index.xml` (Yoast/RankMath). Follow the post sub-sitemaps; collect every `/blog/{slug}/` URL. Also collect page/category/tag URLs.
2. **Crawl the blog:** walk `/blog/` and its pagination `/blog/page/N/` until exhausted, and each `/blog/category/{cat}/` listing, collecting post links.
3. **Cross-check** the union against `live-content-inventory.md` (Ahrefs-known live posts) and against every `destination_path` in `redirect-map.csv`. Any known URL missing from the crawl must be fetched explicitly (or recovered per §5). **Log anything you cannot fetch — never silently drop a post.**

### 4.2 Scrape and convert each post

For each post URL:

- Fetch the HTML with a real User-Agent, retries, and low concurrency (the origin is slow and intermittently times out — be patient, back off, and fall back to the newest Wayback snapshot if the live fetch keeps failing).
- Extract: `<title>`, meta description, `<h1>`, publish date (JSON-LD `datePublished` or the WordPress `.entry-date`/`<time>`), categories, tags, and the main content container (WordPress `.entry-content` / `<article>`). Strip boilerplate (nav, sidebar, author box, share widgets, related-posts).
- Convert content HTML → Markdown (`turndown` in Node, or `markdownify` in Python), preserving headings, lists, tables, blockquotes, and links.
- Rewrite internal links from `teammovemortgage.com/...` to site-relative (`/blog/...`), applying the same normalization the redirect map uses (so an internal link to an old dated URL points at the new slug).
- Download every content image + the featured image to `/public/images/blog/{slug}/`; rewrite `src` accordingly.
- Write `/content/blog/{slug}.mdx` with this frontmatter:

```yaml
---
title: "..."            # original <title> / H1 — preserve for SEO continuity
slug: "..."             # MUST equal the old /blog/{slug}
description: "..."      # original meta description
date: "YYYY-MM-DD"
categories: ["..."]
tags: ["..."]
hero: "/images/blog/{slug}/hero.jpg"
canonical: "https://russelldsmith.com/blog/{slug}/"
source_url: "https://teammovemortgage.com/blog/{slug}/"   # provenance; remove before launch if desired
---
```

- **De-brand:** remove "Team Move" / "Team Move Mortgage" references and any old contact info from the body; the content stays, the brand becomes Russell D Smith. Do not otherwise rewrite the copy during migration (preserve rankings first; improve later).

### 4.3 Tooling

A Node script (`scripts/scrape.ts`) using `undici`/`fetch` + `cheerio` + `turndown` is the recommended path (matches the stack). Chromium is available if a Playwright fallback is needed for any JS-rendered page (WordPress posts are typically static HTML, so plain fetch should suffice). Emit `content-manifest.json` (every slug + source URL + fetch status) — the redirect test in §7 consumes it.

---

## 5. Phase 2 — Recover deleted posts (Wayback Machine)

25 high-value posts no longer exist on the live site (they 302 to `404.php`). Recover each from the Internet Archive and republish at the **original slug** so the redirect rules resolve and the backlinks land on real, on-topic content.

- For each entry in `redirect-map.csv` with `action = REBUILD+redirect`, fetch the newest good snapshot of the **original legacy URL**, e.g.
  `https://web.archive.org/web/2id_/http://teammovemortgage.com/2015/05/22/when-does-pmi-stop-on-fha-usda-and-conventional-mortgage-loans/`
  (the `2id_` / `id_` suffix returns the raw archived HTML). Use the CDX API to find the latest 200 snapshot: `http://web.archive.org/cdx/search/cdx?url=teammovemortgage.com/2015/05/22/when-does-pmi-stop*&output=json&filter=statuscode:200&limit=5&sort=reverse`.
- Convert to MDX exactly as in §4.2, at the destination slug from the CSV (e.g. `/content/blog/when-does-pmi-stop-on-fha-usda-and-conventional-mortgage-loans.mdx`).
- **Modernize lightly:** de-brand to Russell D Smith, refresh obviously-dated figures (loan limits, funding-fee tables, year references) where doing so keeps the page accurate, but **keep the topic and primary keywords intact** so the recovered backlinks remain relevant. Add a short "reviewed/updated 2026" note where appropriate.
- Before rebuilding, **confirm the slug isn't actually live** in the §4 crawl. If a live post exists, downgrade the action to a plain redirect (the CSV `notes` column flags these to double-check). The Ahrefs-known-live list is not exhaustive, so trust the fresh crawl.

The full rebuild list is in `redirect-map.csv` (filter `action = REBUILD+redirect`) and summarized in Appendix B.

---

## 6. Phase 3 — Site build, routes, components

### 6.1 Routes (mirror old structure so slugs match 1:1)

- `/` homepage · `/blog` index · `/blog/[slug]` article · `/blog/category/[category]` · `/blog/tag/[tag]` (**keep — several tag pages rank and hold links**).
- Service/landing pages that absorb high-authority root URLs (build these; they're redirect destinations): `/va-loans`, `/usda-loans`, `/fha-loans`, `/renovation-loans`, `/construction-perm`, `/down-payment-assistance`, `/mortgage-calculators`, `/va-funding-fee-tables`, `/reverse-mortgages`, `/jumbo-loans`, `/investment-property-loans`.
- `/about`, `/contact`, `/apply` (or external application link).

Generate `sitemap.xml` + `robots.txt`. Self-referencing canonicals. Open Graph/Twitter meta. JSON-LD: `Article` (posts), `BreadcrumbList`, and a loan-officer `Person`/`LocalBusiness` entity for Russell.

### 6.2 Components

Header (sticky, minimal), Footer (with compliance block — §8), HeroFeature, ArticleCard, SectionRail (category row), CategoryPill/eyebrow, AuthorByline, ArticleBody (typographic prose), TableOfContents (sticky on desktop), RelatedPosts, CTA block ("Get pre-qualified" / "Contact Russell"). Mortgage calculators can be small client components (payment, affordability, VA funding fee).

---

## 7. Phase 4 — Redirects (the SEO-preservation core)

Serve two Cloudflare zones: `russelldsmith.com` → the Next.js Worker; `teammovemortgage.com` → a **redirect-only Worker** that `301`s every request to the matching path on the new domain. Keep the old zone/Worker live **indefinitely** and the old domain **registered forever** — the backlinks point at old URLs permanently.

### 7.1 Rule order (all 301 permanent; preserve query strings)

1. **Explicit map** (root pages, `.php`, renamed slugs) — load from `redirect-map.csv` where `match_method = explicit`, plus every `action = REBUILD+redirect` / renamed destination so a moved slug never falls through to a wrong rule.
2. **Gen 2:** `/blog/YYYY/MM/DD/{slug}/` → `/blog/{slug}/`
3. **Gen 1:** `/YYYY/MM/DD/{slug}/` → `/blog/{slug}/`
4. **Double-blog cleanup:** `/blog/blog/{slug}/` → `/blog/{slug}/`
5. **Old category root:** `/category/{cat}/` → `/blog/category/{cat}/`
6. **Live pass-through:** `/blog/{slug}/`, `/blog/category/{cat}/`, `/blog/tag/{tag}/` → same path.
7. **Fallback:** unmatched → `/` (homepage). Log these; catch strays via GSC Coverage post-launch and add explicit entries.

Rules 2–3 depend on the destination slug existing — it will, because Phase 1 migrates every live post and Phase 2 rebuilds deleted ones at their original slug.

### 7.2 Starter redirect Worker

```js
// worker.js — Cloudflare Worker bound to teammovemortgage.com/*
const DEST = "https://russelldsmith.com";

// Generate EXPLICIT from redirect-map.csv (match_method=explicit + any renamed
// REBUILD destinations). Seed values below; extend from the CSV at build time.
const EXPLICIT = {
  "/": "/", "/index.php": "/", "/404.php": "/",
  "/usda/": "/usda-loans/", "/usda-loans.php": "/usda-loans/",
  "/fha/": "/fha-loans/", "/fha-loans.php": "/fha-loans/",
  "/va-loan/": "/va-loans/", "/va-loans.php": "/va-loans/",
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
  "/jumbo/": "/jumbo-loans/", "/jumbo-loans.php": "/jumbo-loans/",
  "/lot-loans.php": "/construction-perm/",
  "/contact-us/": "/contact/", "/contact-team-move.php": "/contact/",
  "/our-team/": "/about/", "/about-team-move.php": "/about/", "/our-process/": "/about/",
};

function mapPath(p) {
  if (EXPLICIT[p] !== undefined) return EXPLICIT[p];
  let m = p.replace(/^\/blog\/\d{4}\/\d{2}\/\d{2}\/(.+)$/, "/blog/$1"); if (m !== p) return m;
  m = p.replace(/^\/\d{4}\/\d{2}\/\d{2}\/(.+)$/, "/blog/$1");         if (m !== p) return m;
  m = p.replace(/^\/blog\/blog\/(.+)$/, "/blog/$1");                  if (m !== p) return m;
  m = p.replace(/^\/category\/(.+)$/, "/blog/category/$1");           if (m !== p) return m;
  return p; // live pass-through; unknowns handled by the site 404 + fallback
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    return Response.redirect(DEST + mapPath(url.pathname) + url.search, 301);
  },
};
```

Alternative: Cloudflare **Bulk Redirects** (CSV of source→target) for the explicit rows + **Single Redirect Rules** for the date patterns. The Worker is simpler for the regex transforms — prefer it.

### 7.3 Build-time redirect test (must pass before launch)

Build a fixture from **every `legacy_path` in `redirect-map.csv`** plus representative samples of each generation. Assert `mapPath()` output for each exists in `content-manifest.json` or the static route list. **Fail the build on any dead destination.** This is the safety net that guarantees no equity is lost.

---

## 8. Phase 5 — SEO technical & compliance

- **Google Search Console:** verify **both** domains. On old `teammovemortgage.com`, run **Change of Address** (built for a full-domain 301 move). Submit the new sitemap; keep the old property verified to monitor.
- **Canonicals** self-reference; never point at the old domain. **Structured data** as in §6.1. **Sitemap** covers posts, archives, landing pages.
- **Mortgage compliance (required):** footer must carry Russell's **NMLS ID**, company + company NMLS, **Equal Housing Lender** logo/statement, licensed states, and "not a commitment to lend"/privacy disclosures. Use labeled placeholders for Russell to fill: `{{NMLS_ID}}`, `{{COMPANY}}`, `{{COMPANY_NMLS}}`, `{{LICENSED_STATES}}`.
- **Performance:** static rendering, optimized images, minimal JS → strong Core Web Vitals (free ranking insurance on Workers).

---

## 9. Phase 6 — Launch & verification checklist

Pre-launch: all live posts have MDX; all rebuild posts exist at target slugs; `content-manifest.json` generated; redirect test passes with zero dead destinations; top-20 reclamation URLs manually spot-checked (301→200, on-topic); sitemap builds; canonicals clean; compliance footer present.

Launch: point `russelldsmith.com` to the Next.js Worker; retire the GoDaddy site; deploy the redirect Worker on `teammovemortgage.com/*`; confirm SSL on the old zone so `https://` old URLs redirect; verify one URL from each generation returns 301→200; submit sitemap + run Change of Address.

Post-launch (4–8 weeks): watch GSC Coverage for new 404s on the old domain and add explicit rules; track rankings/traffic for top live posts and reclaimed URLs in GSC + Ahrefs. Expect a short dip, then recovery and — from reclamation — likely net growth above the old baseline.

---

## 10. Design direction

**Vibe:** editorial/news-magazine in the spirit of **CNN.com**, but deliberately **cleaner, calmer, more organized**. Borrow: clear section nav, a strong lead-story hero, scannable card grids, confident headline typography. Fix CNN's clutter with generous whitespace, fewer competing items per view, and a clear hierarchy. It should read like a well-edited publication — trustworthy, since it's mortgage content.

**Brand:** wordmark **"Russell D Smith"**. No "Team Move" anywhere.

- **Header:** sticky, minimal. Wordmark left; topic nav (VA Loans · USDA · FHA · First-Time Buyers · Guides · Calculators · About); one understated CTA ("Get pre-qualified").
- **Homepage:** a lead **hero** (featured guide, large image, category eyebrow, big headline, one-line dek) + 2–3 secondary cards; then **category rails** (one labeled row per topic) as clean card grids with lots of air.
- **Article card:** image, category eyebrow (small caps, accent), serif headline, optional dek, meta (date · read time); consistent aspect ratios.
- **Article template:** single reading column (~680px), serif headline, byline w/ Russell's name+photo, hero image, sticky **table of contents** on desktop, well-set body type, related posts, contextual CTA. This is where rankings live — fast and readable.
- **Type & color tokens (refine in build):** headline serif (*Newsreader* / *Source Serif 4* / *Fraunces*); body/UI sans (*Inter*). Neutral warm-gray canvas, near-black ink, **one confident accent** — trustworthy deep navy or forest green (finance trust cues), not CNN red — plus a brighter tint for links/CTAs. One accent + neutrals reads "organized." Comfortable line-height (~1.6) in body. WCAG AA contrast, visible focus states, semantic landmarks, responsive from 360px.

Deliver as reusable components + design tokens so topic sections and article pages are visually one system.

---

## 11. Suggested build order

1. Scaffold Next.js + Tailwind + OpenNext Cloudflare; deploy a hello-world Worker.
2. Content pipeline (MDX loader, frontmatter, `content-manifest.json`) with 2–3 sample posts.
3. Routes + design system + core components against samples.
4. Run the scraper (§4); import all live posts + images; reconcile against the cross-check lists.
5. Recover deleted posts (§5); build landing pages (§6.1).
6. Redirect Worker + fixture test (§7); make it pass.
7. SEO plumbing + compliance footer (§8).
8. Launch checklist (§9); DNS cutover; Change of Address.

---

## 12. Acceptance criteria

- Every migrated post reachable at `russelldsmith.com/blog/{original-slug}/` with original title/meta/content, de-branded.
- Every `legacy_path` in `redirect-map.csv` 301s to a live 200 page — zero dead destinations (enforced by the build test).
- All 25 rebuild posts live at their original slugs with recovered, lightly-modernized content.
- Sitemap submitted, Change of Address filed, canonicals clean, compliance footer present with placeholders.
- Core Web Vitals pass; WCAG AA; the design reads as a clean editorial publication branded "Russell D Smith."
- Old domain + redirect Worker documented as keep-forever infrastructure.

---

## Appendix A — `redirect-map.csv` schema

Columns: `legacy_path`, `referring_domains`, `current_status`, `destination_path`, `match_method` (`explicit` | `rule:strip-date-gen1` | `rule:strip-date-gen2` | `rule:double-blog` | `rule:category-root`), `action` (`redirect` | `REBUILD+redirect`), `notes`. Sorted by referring domains descending. This is the exhaustive list of URLs that carry link equity and need explicit handling; ordinary live `/blog/{slug}/` pass-throughs are handled by the Worker's default and validated by the redirect test.

## Appendix B — Rebuild list (recover from Wayback, republish at original slug)

Filter `redirect-map.csv` for `action = REBUILD+redirect` (25 posts, ~1,201 referring domains). Highest priority: `when-does-pmi-stop-on-fha-usda-and-conventional-mortgage-loans` (284), `usda-eligibility` (118), `va-fha-usda-manufactured-home-doublewides-foundation-rules-requirements` (109), `rental-property` (87), `fannie-mae-student-loans` (85), `seller-paid-costs-limits` (84), `tax-return-issues-that-can-cause-delays-or-denials-when-buying-a-home` (82), `down-payment-assistance-sc` (61), `conforming-loan-limits-2018` (44), `fannie-mae-loosens-guidelines` (39), `capital-gains-tax` (29), `cash-deposits-mortgages` (27), `mortgage-credit-score` (27). Confirm each is truly absent from the live crawl before rebuilding.

## Appendix C — Content enumeration

`live-content-inventory.md` lists the Ahrefs-known live posts as a cross-check. It is **not** exhaustive — the authoritative list comes from the Phase-1 sitemap crawl. Reconcile crawl ∪ inventory ∪ redirect-map destinations; fetch or recover anything missing; log gaps.
