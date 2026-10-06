# AdSense setup for russelldsmith.com

Google makes the site-approval decision after reviewing the entire live site. No code change can guarantee approval. This project provides a verification meta tag and root `ads.txt` response when a real publisher ID is configured; ad loading has a separate switch so verification can happen before ads are enabled.

## Current status (October 5, 2026, Eastern time)

- Commit `88db0c3` was pushed to `main` and deployed to the Cloudflare account that owns `russelldsmith.com`.
- AdSense verified the live meta tag and accepted the review request. The site is **Getting ready / Review requested** in account `pub-7753187048644576`.
- The European regulations message and **Russell Smith US privacy choices** message are published for this domain in AdSense. They will appear through the AdSense tag when ad loading is enabled after approval.
- The live `/ads.txt` returns the matching authorized seller line. AdSense still showed **Not found** immediately after submission, so check its status again after Google fetches it.

## Before requesting review

1. Have Russell or ALCOVA review the site's mortgage claims, licensing disclosures, and the [privacy policy](https://russelldsmith.com/privacy/). The archive contains 332 posts originally published from 2014–2021; some have later update dates, but many loan rules, rates, and program figures may be stale. Correct material information that has changed and keep actual update dates accurate. Two posts are under 150 words, so assess whether they provide enough original value. Confirm the migrated articles belong to the site owner and that image rights are documented.
2. Confirm the live homepage, guides, about, contact, and privacy pages work without a login. Check `https://russelldsmith.com/robots.txt` and `https://russelldsmith.com/sitemap.xml`.
3. Use the confirmed AdSense account `pub-7753187048644576`. Add **russelldsmith.com** as a site in that account.

## Connect the site

The confirmed publisher ID is recorded in `lib/adsense.ts` so future builds retain verification. `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` can override it **during the Next/OpenNext build** if the account changes. Deploy with:

```bash
env -u CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID=91ae5452938b90ad0d9e77533875a0ec npm run deploy
```

The ID is public, not a secret. The shell's existing `CLOUDFLARE_API_TOKEN` belongs to another account; this command uses the local Wrangler OAuth login for the account that owns the domain. Leave `NEXT_PUBLIC_ADSENSE_ENABLE_ADS` unset during review.

After deployment, inspect the homepage HTML for `<meta name="google-adsense-account" content="ca-pub-...">` and check `https://russelldsmith.com/ads.txt` contains exactly the authorized `google.com, pub-..., DIRECT, f08c47fec0942fa0` line. Without a valid ID, `/ads.txt` intentionally returns 404 and no verification tag is rendered. In AdSense, select **meta tag** as the connection method, then verify and request review. The account holder must complete payment/contact verification requested by Google.

## Consent and ads after approval

The European and US state messages are published in **AdSense → Privacy & messaging**. Review the privacy policy against the actual providers and settings in the AdSense account before turning on ads.

Once the site is approved and consent messages are published, enable the AdSense loader and Auto ads in the account, then rebuild/deploy:

```bash
env -u CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID=91ae5452938b90ad0d9e77533875a0ec NEXT_PUBLIC_ADSENSE_ENABLE_ADS=true npm run deploy
```

The loader uses the account's `ca-pub-...` ID. Keep the ID consistent across the meta tag, loader, and `ads.txt`. It is omitted from admin, search, privacy, contact, connect, and tag archive pages. Review Auto ads placements in the AdSense dashboard and exclude any other pages where ads do not fit. Check ad behavior on desktop and mobile.

## If review needs attention

Read the specific issue in **AdSense → Sites**. Review Google's [site-readiness guidance](https://support.google.com/adsense/answer/7299563), [publisher policies](https://support.google.com/adsense/answer/48182), and [connection instructions](https://support.google.com/adsense/answer/7584263). Fix the cited issue and request another review. Google says site reviews usually take a few days but can take 2–4 weeks.
