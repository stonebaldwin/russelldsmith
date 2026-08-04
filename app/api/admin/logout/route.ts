import { clearCookieString } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json", "set-cookie": clearCookieString() },
  });
}
