# CLAUDE.md — russelldsmith.com

Project rules for any agent working in this repo. Read `docs/MIGRATION-BRIEF.md` first — it is the source of truth.

## What this project is
Rebuilding an old WordPress mortgage blog (`teammovemortgage.com`) as a modern Next.js site on Cloudflare Workers at `russelldsmith.com`, migrating all content by scraping, recovering deleted high-value posts from the Wayback Machine, and preserving/recovering SEO via a full 301 redirect layer. Brand: **Russell D Smith**.

## Hard rules (do not violate)
1. **Never change a migrated post's slug.** Old `/blog/{slug}/` → new `/blog/{slug}/`, identical. Slugs are SEO-load-bearing and are the join key for redirects. Rebuilt posts use their original (pre-deletion) slug from `docs/redirect-map.csv`.
2. **Never mass-redirect the old domain to the homepage.** Redirects are per-URL, path-preserving (see brief §7).
3. **The redirect build-time test must pass with zero dead destinations before launch.** Every `legacy_path` in `docs/redirect-map.csv` must resolve to a live 200 page.
4. **Preserve on-page SEO at migration:** keep original title, meta description, H1, body, and internal-link targets. De-brand "Team Move" → Russell D Smith, but do not rewrite copy during migration. Improve content only after launch.
5. **Never hot-link images from teammovemortgage.com.** Download to `/public/images/blog/{slug}/`.
6. **Log, never silently drop.** Any post that can't be fetched must be logged and recovered (Wayback) — never omitted.
7. **The old domain + redirect Worker are keep-forever infrastructure.** Document them as such.

## Content model
- Posts: `/content/blog/{slug}.mdx` with frontmatter (`title, slug, description, date, categories, tags, hero, canonical, source_url`). See brief §4.2.
- Build emits `content-manifest.json` (every slug + source URL + fetch status); the redirect test consumes it.

## Stack
Next.js App Router + TypeScript + Tailwind, deployed on Cloudflare Workers via `@opennextjs/cloudflare` (Wrangler). MDX content. Verify adapter docs before scaffolding.

## Key files
- `docs/MIGRATION-BRIEF.md` — full plan (read fully).
- `docs/redirect-map.csv` — exhaustive redirect map (75 URLs, 2,716 referring domains; 25 rebuilds).
- `docs/live-content-inventory.md` — content cross-check list (not exhaustive; crawl is authoritative).

## Compliance
Mortgage site: footer must include NMLS ID, company + company NMLS, Equal Housing Lender statement, licensed states, "not a commitment to lend"/privacy disclosures. Use placeholders `{{NMLS_ID}}`, `{{COMPANY}}`, `{{COMPANY_NMLS}}`, `{{LICENSED_STATES}}` for Russell to fill.
