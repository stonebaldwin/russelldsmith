import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Ask Russell registrations (/ask-russell/ form) → an email to Russell and
 * Stone, sent with Cloudflare Email Service through the EMAIL `send_email`
 * binding in wrangler.jsonc. Nothing is stored; the email is the record.
 *
 * Needs, in the Cloudflare dashboard for the russelldsmith.com account:
 *  - Email Service → Email Sending → Onboard russelldsmith.com (adds records on
 *    cf-bounce.russelldsmith.com + a DMARC record; the root MX, i.e. the
 *    domain's Microsoft 365 mail, is not touched).
 *  - Email Routing → Destination Addresses: add + verify both NOTIFY addresses
 *    (sending to verified addresses is free on any Workers plan).
 * Until that is done the binding throws, this returns 503, and the form shows
 * its fallback ("you don't need to register — just join live").
 */

export const dynamic = "force-dynamic";

/** Who receives each registration. Kept server-side so it never ships to the browser. */
const NOTIFY = ["rsmith@alcova.com", "stonebaldwin@alcova.com"];
/** Sender — must be on the onboarded sending domain. */
const FROM = { email: "askrussell@russelldsmith.com", name: "Ask Russell registrations" };

const ROLES = new Set(["Banker", "Realtor", "Investor", "CPA", "Other"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface SendEmail {
  send(message: {
    to: string | string[];
    from: string | { email: string; name: string };
    replyTo?: string;
    subject: string;
    text: string;
  }): Promise<{ messageId: string }>;
}

/** Trim, cap length, and (for one-line fields) strip line breaks. */
function clean(v: unknown, max: number, multiline = false) {
  let s = typeof v === "string" ? v.trim() : "";
  if (!multiline) s = s.replace(/[\r\n]+/g, " ");
  return s.slice(0, max);
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Bad request" }, 400);
  }

  // Honeypot: real visitors never see or fill this field. Pretend success.
  if (clean(body.website, 200)) return json({ ok: true });

  const firstName = clean(body.firstName, 100);
  const lastName = clean(body.lastName, 100);
  const email = clean(body.email, 200);
  const role = clean(body.role, 20);
  const company = clean(body.company, 200);
  const question = clean(body.question, 4000, true);
  const reminders = body.reminders === true;

  if (!firstName || !lastName || !EMAIL_RE.test(email) || !ROLES.has(role)) {
    return json({ error: "Missing or invalid fields" }, 400);
  }

  const env = getCloudflareContext().env as unknown as { EMAIL?: SendEmail };
  if (!env.EMAIL) return json({ error: "Email not configured" }, 503);

  const text = [
    `New Ask Russell registration`,
    ``,
    `Name:      ${firstName} ${lastName}`,
    `Email:     ${email}`,
    `I am a:    ${role}`,
    `Company:   ${company || "—"}`,
    `Reminders: ${reminders ? "Yes, email me reminders" : "No"}`,
    ``,
    `Question for Russell:`,
    question || "(none)",
    ``,
    `—`,
    `Sent from russelldsmith.com/ask-russell/. Reply to this email to reach the registrant.`,
  ].join("\n");

  try {
    await env.EMAIL.send({
      to: NOTIFY,
      from: FROM,
      replyTo: email,
      subject: `Ask Russell registration: ${firstName} ${lastName} (${role})`,
      text,
    });
  } catch (err) {
    console.error("ask-russell register: send failed", err);
    return json({ error: "Could not send" }, 502);
  }
  return json({ ok: true });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
