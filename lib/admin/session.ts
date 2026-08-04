/**
 * Server-side session guards for the CMS (used by admin layouts + API routes).
 * We enforce auth in a server layout + each route handler (reliable on
 * @opennextjs/cloudflare) rather than middleware.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./auth";
import { adminConfig } from "./env";

export async function isAuthed(): Promise<boolean> {
  const cfg = adminConfig();
  if (!cfg.ok) return false;
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value, cfg.config.sessionSecret);
}

/** For server pages/layouts: redirect to login if not authed. */
export async function requireSession(): Promise<void> {
  if (!(await isAuthed())) redirect("/admin/login");
}

/** For API routes: returns a 401 Response if not authed, else null. */
export async function requireApiSession(): Promise<Response | null> {
  if (await isAuthed()) return null;
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}
