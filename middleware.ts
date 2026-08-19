import { NextResponse, type NextRequest } from "next/server";

/**
 * Short, sayable aliases for pages whose real slug is SEO-load-bearing and can
 * never move (see docs/redirect-map.csv). 301, path-only — the real page keeps
 * the link equity and the canonical URL.
 */
const PATH_ALIASES: Record<string, string> = {
  "/real-estate-investors/": "/investment-property-loans/",
  "/investors/": "/investment-property-loans/",
  "/calculators/": "/mortgage-calculators/",
};

/**
 * Canonicalize www → apex with a single, clean 301, preserving the exact path +
 * query string. www.russelldsmith.com is bound to this Worker as a custom domain
 * (wrangler.jsonc); every other host — the apex, local dev — passes straight
 * through untouched. Then applies PATH_ALIASES. Auth is handled in the admin
 * server layouts, not here.
 */
export function middleware(req: NextRequest) {
  const path = `${req.nextUrl.pathname}${req.nextUrl.search}`;

  // www → apex (also forces https for www).
  if (req.headers.get("host") === "www.russelldsmith.com") {
    return NextResponse.redirect(`https://russelldsmith.com${path}`, 301);
  }

  // http → https. Cloudflare tags the original scheme in `cf-visitor`
  // ({"scheme":"http"|"https"}); "https" never contains the quoted "http" token,
  // so this only fires for real http requests — no redirect loop. Localhost is
  // exempt: the OpenNext dev shim reports scheme "http", and `next dev` serves
  // plain http, so without this guard local dev 301s every request to a port
  // that isn't listening on TLS.
  const host = req.headers.get("host") || "russelldsmith.com";
  const isLocal = /^(localhost|127\.|\[::1\]|0\.0\.0\.0)/.test(host);
  const cfv = req.headers.get("cf-visitor") || "";
  if (
    !isLocal &&
    (cfv.includes('"scheme":"http"') || req.headers.get("x-forwarded-proto") === "http")
  ) {
    return NextResponse.redirect(`https://${host}${path}`, 301);
  }

  const alias = PATH_ALIASES[req.nextUrl.pathname];
  if (alias) {
    return NextResponse.redirect(new URL(`${alias}${req.nextUrl.search}`, req.url), 301);
  }

  return NextResponse.next();
}

export const config = {
  // Run on real navigations; skip Next internals (cheap no-op on the apex).
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
