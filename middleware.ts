import { NextResponse, type NextRequest } from "next/server";

/**
 * Canonicalize www → apex with a single, clean 301, preserving the exact path +
 * query string. www.russelldsmith.com is bound to this Worker as a custom domain
 * (wrangler.jsonc); every other host — the apex, local dev — passes straight
 * through untouched. Auth is handled in the admin server layouts, not here.
 */
export function middleware(req: NextRequest) {
  const path = `${req.nextUrl.pathname}${req.nextUrl.search}`;

  // www → apex (also forces https for www).
  if (req.headers.get("host") === "www.russelldsmith.com") {
    return NextResponse.redirect(`https://russelldsmith.com${path}`, 301);
  }

  // http → https. Cloudflare tags the original scheme in `cf-visitor`
  // ({"scheme":"http"|"https"}); "https" never contains the quoted "http" token,
  // so this only fires for real http requests — no redirect loop.
  const cfv = req.headers.get("cf-visitor") || "";
  if (cfv.includes('"scheme":"http"') || req.headers.get("x-forwarded-proto") === "http") {
    const host = req.headers.get("host") || "russelldsmith.com";
    return NextResponse.redirect(`https://${host}${path}`, 301);
  }

  return NextResponse.next();
}

export const config = {
  // Run on real navigations; skip Next internals (cheap no-op on the apex).
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
