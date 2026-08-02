# START HERE — Claude Code implementation prompt

Paste the block below into a fresh Claude Code session opened in this repo
(`/Users/stonebaldwin/dev/russellsmith`). Everything it needs is in this folder.

---

You are building a production website in this repo. Do not ask me to re-explain the project — the full spec is on disk. Work autonomously, in phases, and check in at each phase boundary with what you did and what's next.

**Step 1 — read the spec (in this order):**
1. `CLAUDE.md` — the hard rules. Obey them literally, especially: never change a migrated post's slug; redirects are per-URL and path-preserving; the redirect build-time test must pass with zero dead destinations before launch.
2. `docs/MIGRATION-BRIEF.md` — the complete plan (goals, current state, architecture, all six phases, design direction, acceptance criteria).
3. `docs/redirect-map.csv` — the exhaustive redirect map: 75 legacy URLs carrying ~2,716 referring domains, including 25 deleted posts (`action = REBUILD+redirect`) to recover from the Wayback Machine.
4. `docs/live-content-inventory.md` — cross-check list of known-live posts (the sitemap crawl is authoritative).

**Step 2 — confirm the plan.** Summarize the six phases back to me in a few lines and list the exact tech choices you'll use (Next.js App Router + TypeScript + Tailwind, `@opennextjs/cloudflare` on Workers, MDX content). Flag anything in the brief you'd do differently and why. Then proceed.

**Step 3 — build, in the order in brief §11:**
1. Scaffold Next.js + Tailwind + the OpenNext Cloudflare adapter; get a hello-world Worker deploying with Wrangler.
2. Build the MDX content pipeline (frontmatter loader + `content-manifest.json`) against 2–3 sample posts.
3. Build the routes, design system, and components per brief §6 and the design direction in §10 (editorial/CNN-but-cleaner, brand "Russell D Smith").
4. Write and run `scripts/scrape.ts` to acquire ALL live posts by scraping `teammovemortgage.com` (enumerate via `wp-sitemap.xml`/`sitemap_index.xml` + `/blog/` pagination + category listings; union with the cross-check list; the origin is slow so use retries, a real User-Agent, low concurrency, and a Wayback fallback). Convert each to MDX at its exact slug; download images locally; de-brand "Team Move" → Russell D Smith. Log anything you can't fetch.
5. Recover the 25 deleted posts (`action = REBUILD+redirect` in the CSV) from the Wayback Machine, republished at their original slugs; lightly modernize but keep topic + keywords. Build the landing pages listed in §6.1 (they're redirect destinations).
6. Implement the redirect-only Cloudflare Worker for the `teammovemortgage.com` zone (starter code in brief §7.2; generate the explicit map from `redirect-map.csv`). Write the build-time redirect test that asserts every `legacy_path` in the CSV resolves to a page that exists in `content-manifest.json` or the static routes. **Make it pass.**
7. SEO plumbing: sitemap, self-referencing canonicals, JSON-LD, and the compliance footer with `{{NMLS_ID}}` / `{{COMPANY}}` / `{{COMPANY_NMLS}}` / `{{LICENSED_STATES}}` placeholders.
8. Produce the launch checklist from §9 (DNS cutover steps, deploy the redirect Worker, GSC Change of Address). Don't flip DNS yourself — leave that for me.

**Definition of done:** brief §12 acceptance criteria. Most important: every migrated post lives at its original `/blog/{slug}/`, the redirect test passes with zero dead destinations, and all 25 rebuild posts are live at their original slugs.

Constraints: keep commits small and logically scoped; write a short `README.md` documenting how to run the scraper, dev server, and deploy; do not use browser localStorage anywhere; ask me only when you hit a genuine blocker (e.g. you need Russell's NMLS details or WordPress didn't expose a sitemap).

---

## What you (Russell/Stone) need to have handy
- **NMLS ID + company details** for the compliance footer (or leave the placeholders and fill later).
- **Cloudflare account** with both `russelldsmith.com` and `teammovemortgage.com` as zones (nameservers pointed to Cloudflare) so the site Worker and the redirect Worker can deploy.
- Confirm you want the two landing-page slugs I picked (`/investment-property-loans`, `/reverse-mortgages`, `/jumbo-loans`) or rename them — they're redirect destinations in the map.
