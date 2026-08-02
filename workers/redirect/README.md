# teammovemortgage.com redirect Worker

**Keep-forever infrastructure.** This Worker is bound to the old
`teammovemortgage.com` zone and `301`s every request to the matching path on
`russelldsmith.com`, path-for-path, preserving the query string. The old
domain's backlinks point at old URLs permanently, so this Worker — and the old
domain registration + Cloudflare zone — must stay live indefinitely.

## How it works

`worker.js` is **generated** — do not edit it by hand. It contains:

- an **explicit map** (root pages, `.php` pages, renamed slugs) merged from
  `../../lib/redirects.ts` (`BASE_EXPLICIT`) + the `match_method = explicit` rows
  of `../../docs/redirect-map.csv`, and
- `mapPath()`, which mirrors `lib/redirects.ts` and applies the generation rules
  (Gen-1/Gen-2 date-stripping, double-blog cleanup, category-root).

Regenerate after changing the CSV or the redirect rules:

```bash
# from the repo root
npm run gen:redirect
```

The build-time test (`npm run test:redirects`, run from the repo root) imports
this Worker's `mapPath` and asserts it agrees with `lib/redirects.ts` and that
every legacy URL resolves to a live page — so this file can never silently drift.

## Deploy

Requires the `teammovemortgage.com` zone on the same Cloudflare account
(nameservers pointed to Cloudflare) and `wrangler login`.

```bash
npx wrangler deploy
```

Then uncomment the `routes` block in `wrangler.jsonc` to bind
`teammovemortgage.com/*` (and `www`). Confirm SSL is active on the old zone so
`https://` old URLs redirect. Verify one URL from each generation returns
`301 -> 200`:

```bash
curl -sSI https://teammovemortgage.com/2015/05/22/when-does-pmi-stop-on-fha-usda-and-conventional-mortgage-loans/
curl -sSI https://teammovemortgage.com/blog/2020/02/17/va-seller-paid-closing-costs/
curl -sSI https://teammovemortgage.com/usda/
```
