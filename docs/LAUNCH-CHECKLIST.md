# Launch & verification checklist — russelldsmith.com

Runbook for cutover. Steps marked **[you]** need Russell/Stone (credentials, DNS,
Google). Everything else is built and verified in the repo.

## 0. What you need to have handy

- **Cloudflare account** with **both** zones added. Both domains are registered
  at **GoDaddy** — GoDaddy stays the registrar; you only move DNS to Cloudflare.
  Cloudflare Workers custom domains require the zone's DNS to be on Cloudflare, so
  for each domain: add it as a Cloudflare site → Cloudflare shows two nameservers
  → in **GoDaddy → Domain → Nameservers → Change**, replace GoDaddy's with those
  two. (This is what "point the domain to Cloudflare" means below.) Moving
  `russelldsmith.com`'s NS retires the old GoDaddy landing page automatically.
- `wrangler login` completed locally (or a `CLOUDFLARE_API_TOKEN`).
- **Compliance details** — already filled from Russell's ALCOVA loan-officer
  profile in `lib/site.ts` (NMLS #78989, ALCOVA Mortgage, LLC #40508, licensed
  states, GA/NJ notices, contact + HomeHub application). **No placeholders
  remain** — only a final legal review of the footer disclosure is outstanding.
- Google Search Console access for both domains.
- (For `/admin` CMS in production) **Worker secrets**: `ADMIN_PASSWORD`,
  `SESSION_SECRET`, `GITHUB_TOKEN` — see `docs/CMS.md` / `scripts/setup-cms-secrets.sh`.
  Not required for the public site to work; only the CMS needs them.

## 1. Pre-launch (in the repo — status)

- [x] Every live post migrated to `content/blog/{slug}.mdx` at its original slug
  (332 posts: 331 live + 1 Wayback-recovered).
- [x] All 25 REBUILD targets live at their original slugs (24 recovered directly
  by the crawl, 1 from the Wayback Machine).
- [x] Injected casino spam (30 posts) excluded; every keep/drop decision logged
  in `docs/content-audit.md`.
- [x] Images downloaded locally to `public/images/blog/**` (never hot-linked).
- [x] `content-manifest.json` generated.
- [x] **Redirect test passes with zero dead destinations** (`npm run test:redirects`).
- [x] Sitemap (`/sitemap.xml`, 1,716 URLs), `robots.txt` (disallows `/admin` +
  `/api/`), self-referencing canonicals, JSON-LD (Article, Breadcrumb, Person,
  WebSite, LocalBusiness w/ aggregate rating), Open Graph + Twitter cards with a
  branded default social image (`public/media/site/og-default.png`, `npm run gen:og`).
- [x] Compliance footer present (with placeholders).
- [x] Compliance + contact details filled from Russell's ALCOVA loan-officer
  profile — NMLS #78989, ALCOVA Mortgage, LLC (NMLS #40508), (910) 352-6344,
  rsmith@alcova.com, HomeHub application, licensed-states + GA/NJ notices, and
  his headshot (`lib/site.ts`). **[you]** Give the compliance block a final
  legal review before launch.
- [ ] **[you]** Manually spot-check the top ~20 reclamation URLs after deploy
  (see §2 of `docs/redirect-map.csv`, sorted by referring domains): each old URL
  should `301 → 200` and land on-topic.

## 2. Deploy the site (russelldsmith.com)

```bash
npm run deploy          # opennextjs-cloudflare build && deploy
```

- [ ] **[you]** In the Cloudflare dashboard (or via `wrangler.jsonc` `routes`),
  bind the Worker to `russelldsmith.com/*`.
- [ ] Retire the old GoDaddy site currently on `russelldsmith.com`.
- [ ] **[you]** Set the CMS Worker secrets if using `/admin` (see §0):
  `bash scripts/setup-cms-secrets.sh` or `wrangler secret put …`.
- [ ] **[you]** Enable **Cloudflare Web Analytics** for `russelldsmith.com`
  (dashboard → Web Analytics → Add site). On a proxied Cloudflare zone the beacon
  is auto-injected — no code change needed. This is how you'll measure traffic.

## 3. Deploy the redirect Worker (teammovemortgage.com)

```bash
cd workers/redirect
npx wrangler deploy
```

- [ ] **[you]** Uncomment the `routes` block in `workers/redirect/wrangler.jsonc`
  to bind `teammovemortgage.com/*` and `www.teammovemortgage.com/*`.
- [ ] Confirm SSL/edge cert is active on the old zone so `https://` old URLs
  redirect.
- [ ] Verify one URL from each generation returns `301 → 200`:
  ```bash
  curl -sSIL https://teammovemortgage.com/2015/05/22/when-does-pmi-stop-on-fha-usda-and-conventional-mortgage-loans/
  curl -sSIL https://teammovemortgage.com/blog/2020/02/17/va-seller-paid-closing-costs/
  curl -sSIL https://teammovemortgage.com/usda/
  curl -sSIL https://teammovemortgage.com/down-payment-assistance.php
  ```

## 4. DNS cutover **[you]**

- [ ] Switch **both** domains' nameservers at **GoDaddy → Cloudflare** (see §0)
  if not already done. Until this is done, `wrangler deploy`'s custom-domain
  routes can't attach.
- [ ] Bind `russelldsmith.com` to the site Worker (Workers routes / custom
  domain). With DNS on Cloudflare, adding the Worker custom domain creates the
  needed records automatically.
- [ ] Keep `teammovemortgage.com` on Cloudflare for the redirect Worker.
- [ ] **Do not** mass-redirect the old domain to the homepage — the redirect
  Worker handles per-URL 301s. (Hard rule.)

## 5. Search Console **[you]**

- [ ] Verify **both** domains in GSC. Easiest for Cloudflare-managed domains:
  **Domain property → DNS TXT** verification (Cloudflare can add the TXT record
  in one click; no code change, verifies the whole domain incl. `www`).
- [ ] Submit `https://russelldsmith.com/sitemap.xml`.
- [ ] On the old `teammovemortgage.com` property, run **Change of Address** →
  point to `russelldsmith.com`.
- [ ] Keep the old property verified to monitor the migration.

## 6. Post-launch (4–8 weeks)

- [ ] Watch GSC Coverage on the old domain for new 404s; add any strays as
  `explicit` rows in `docs/redirect-map.csv`, then
  `npm run gen:redirect && cd workers/redirect && npx wrangler deploy`.
- [ ] Track rankings/traffic for top live posts + reclaimed URLs (GSC + Ahrefs).
  Expect a short dip, then recovery and likely net growth from reclamation.
- [ ] Scrub residual old contact info flagged in `docs/content-audit.md`
  (`contains-phone-number`).

## Keep-forever infrastructure

The old domain `teammovemortgage.com`, its Cloudflare zone, and the redirect
Worker (`workers/redirect/`) are **permanent**. The backlinks point at old URLs
forever; never retire them.
