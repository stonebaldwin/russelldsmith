# russelldsmith.com

Modern, fast, editorial mortgage site for **Russell D Smith**, rebuilt from the
old WordPress blog at `teammovemortgage.com`. Next.js (App Router) on Cloudflare
Workers via the OpenNext adapter, with all content migrated and the old domain's
SEO preserved through a full per-URL 301 redirect layer.

> **Read `docs/MIGRATION-BRIEF.md` first** — it is the source of truth. Hard
> rules are in `CLAUDE.md` (never change a migrated slug; redirects are per-URL;
> the redirect test must pass with zero dead destinations before launch).

## Stack

- **Next.js 16** (App Router, RSC, TypeScript) + **Tailwind CSS v4**
- **MDX content** in `content/blog/{slug}.mdx` (`gray-matter` + `next-mdx-remote`)
- **Cloudflare Workers** via **`@opennextjs/cloudflare`** + **Wrangler**
- Fonts: Newsreader (serif headlines) + Inter (body/UI)

## Requirements

- Node **>= 20** (repo is developed on Node 22 — see `.nvmrc`)

```bash
npm install
```

## Develop

```bash
npm run dev            # Next dev server (http://localhost:3000)
npm run preview        # Build + run in the real Workers runtime (Wrangler)
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
```

## Content pipeline

The blog is migrated from `teammovemortgage.com` — **not** by copying WordPress,
but by reading its open REST API and Wayback snapshots, converting to MDX.

```bash
npm run content:scrape     # acquire all live posts -> content/blog/*.mdx (+ images, audit)
npm run content:recover    # rebuild 25 deleted posts from the Wayback Machine
npm run content:manifest   # (re)generate content-manifest.json from content/ + routes
npm run test:redirects     # assert every legacy_path in redirect-map.csv resolves to a live page
```

- The origin's WordPress install (`/blog/`) is **compromised with injected casino
  spam**. The scraper classifies every post and writes a human-readable audit to
  `docs/content-audit.md`; only legitimate mortgage content is migrated. Nothing
  is silently dropped.
- Images are downloaded to `public/images/blog/{slug}/` — never hot-linked.

## Deploy

Deploying needs a Cloudflare account with the `russelldsmith.com` and
`teammovemortgage.com` zones on Cloudflare (see `docs/LAUNCH-CHECKLIST.md`).

```bash
npm run deploy         # build + deploy the site Worker (russelldsmith.com)
```

The **redirect-only Worker** for `teammovemortgage.com` lives in
`workers/redirect/` and is deployed separately. **Both the old domain and its
redirect Worker are keep-forever infrastructure** — the backlinks point at old
URLs permanently.

## Repo layout

```
app/                    Next.js App Router routes
components/             editorial design-system components
content/blog/           migrated posts as MDX (slug = filename)
lib/                    content loader, redirect logic, SEO helpers
scripts/                scrape / wayback-recover / manifest / redirect-test
workers/redirect/       redirect-only Worker for teammovemortgage.com
public/images/blog/     migrated post images
docs/                   migration brief, redirect map, inventory, audit, checklist
```
