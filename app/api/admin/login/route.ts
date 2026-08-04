import { adminConfig } from "@/lib/admin/env";
import { createSessionToken, sessionCookieString, verifyPassword } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const cfg = adminConfig();
  if (!cfg.ok) {
    return json({ error: `Server missing: ${cfg.missing.join(", ")}` }, 500);
  }
  let password = "";
  try {
    const body = (await req.json()) as { password?: string };
    password = body.password ?? "";
  } catch {
    return json({ error: "Bad request" }, 400);
  }

  if (!verifyPassword(password, cfg.config.adminPassword)) {
    return json({ error: "Incorrect password." }, 401);
  }

  const token = await createSessionToken(cfg.config.sessionSecret);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json", "set-cookie": sessionCookieString(token) },
  });
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
