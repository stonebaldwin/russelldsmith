# AdSense setup for russelldsmith.com

Google makes the site-approval decision after reviewing the entire live site. No code change can guarantee approval. This project provides a verification meta tag and root `ads.txt` response when a real publisher ID is configured; ad loading has a separate switch so verification can happen before ads are enabled.

## Before requesting review

1. Have Russell or ALCOVA review the site's mortgage claims, licensing disclosures, and the [privacy policy](https://russelldsmith.com/privacy/). The archive contains 332 posts originally published from 2014–2021; some have later update dates, but many loan rules, rates, and program figures may be stale. Correct material information that has changed and keep actual update dates accurate. Two posts are under 150 words, so assess whether they provide enough original value. Confirm the migrated articles belong to the site owner and that image rights are documented.
2. Confirm the live homepage, guides, about, contact, and privacy pages work without a login. Check `https://russelldsmith.com/robots.txt` and `https://russelldsmith.com/sitemap.xml`.
3. Use the confirmed AdSense account `pub-7753187048644576`. Add **russelldsmith.com** as a site in that account.

## Connect the site

The confirmed publisher ID is recorded in `lib/adsense.ts` so future builds retain verification. `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` can override it **during the Next/OpenNext build** if the account changes. Deploy with:

```bash
npm run deploy
```

The ID is public, not a secret. Leave `NEXT_PUBLIC_ADSENSE_ENABLE_ADS` unset at this stage.

After deployment, inspect the homepage HTML for `<meta name="google-adsense-account" content="ca-pub-...">` and check `https://russelldsmith.com/ads.txt` contains exactly the authorized `google.com, pub-..., DIRECT, f08c47fec0942fa0` line. Without a valid ID, `/ads.txt` intentionally returns 404 and no verification tag is rendered. In AdSense, select **meta tag** as the connection method, then verify and request review. The account holder must complete payment/contact verification requested by Google.

## Consent and ads after approval

In **AdSense → Privacy & messaging**, select and publish Google's certified CMP (or another Google-certified TCF CMP) for visitors in the EEA, UK, and Switzerland before serving ads there. Configure any other regional messages required for the site's audience. Review the privacy policy against the actual providers and settings in the AdSense account.

Once the site is approved and consent messages are published, enable the AdSense loader and Auto ads in the account, then rebuild/deploy:

```bash
NEXT_PUBLIC_ADSENSE_ENABLE_ADS=true npm run deploy
```

The loader uses the account's `ca-pub-...` ID. Keep the ID consistent across the meta tag, loader, and `ads.txt`. It is omitted from admin, search, privacy, contact, connect, and tag archive pages. Review Auto ads placements in the AdSense dashboard and exclude any other pages where ads do not fit. Check ad behavior on desktop and mobile.

## If review needs attention

Read the specific issue in **AdSense → Sites**. Review Google's [site-readiness guidance](https://support.google.com/adsense/answer/7299563), [publisher policies](https://support.google.com/adsense/answer/48182), and [connection instructions](https://support.google.com/adsense/answer/7584263). Fix the cited issue and request another review. Google says site reviews usually take a few days but can take 2–4 weeks.
