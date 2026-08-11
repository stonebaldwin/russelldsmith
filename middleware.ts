import { NextResponse, type NextRequest } from "next/server";

/**
 * Canonicalize www → apex with a single, clean 301, preserving the exact path +
 * query string. www.russelldsmith.com is bound to this Worker as a custom domain
 * (wrangler.jsonc); every other host — the apex, local dev — passes straight
 * through untouched. Auth is handled in the admin server layouts, not here.
 */
export function middleware(req: NextRequest) {
  if (req.headers.get("host") === "www.russelldsmith.com") {
    const dest = `https://russelldsmith.com${req.nextUrl.pathname}${req.nextUrl.search}`;
    return NextResponse.redirect(dest, 301);
  }
  return NextResponse.next();
}

export const config = {
  // Run on real navigations; skip Next internals (cheap no-op on the apex).
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
