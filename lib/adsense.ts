/** The authorized account's public publisher ID. An env var can override it at build time. */
const configuredId =
  process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID?.trim() || "pub-7753187048644576";

export const ADSENSE_PUBLISHER_ID = /^pub-\d{16}$/.test(configuredId)
  ? configuredId
  : null;

export const ADSENSE_CLIENT = ADSENSE_PUBLISHER_ID
  ? `ca-${ADSENSE_PUBLISHER_ID}`
  : null;

// Verification can go live before ads. Enable this only after site approval and
// the required consent messages have been published in AdSense.
export const ADSENSE_ADS_ENABLED =
  ADSENSE_CLIENT !== null && process.env.NEXT_PUBLIC_ADSENSE_ENABLE_ADS === "true";
