import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getEvent, formatEventDate } from "@/lib/events";

/**
 * Event registrations (/events/ form) → an email to Russell and Stone, sent
 * with Cloudflare Email Service through the EMAIL `send_email` binding — the
 * same setup as /api/ask-russell/register/ (see docs/ASK-RUSSELL.md). Nothing
 * is stored; the email is the record.
 */

export const dynamic = "force-dynamic";

/** Who receives each registration. Kept server-side so it never ships to the browser. */
const NOTIFY = ["rsmith@alcova.com", "stonebaldwin@alcova.com"];
/** Sender — must be on the onboarded sending domain. */
const FROM = { email: "events@russelldsmith.com", name: "Event registrations" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ATTENDING = new Set(["yes", "maybe"]);

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

  const event = getEvent(clean(body.event, 200));
  const firstName = clean(body.firstName, 100);
  const lastName = clean(body.lastName, 100);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 40);
  const role = clean(body.role, 40);
  const company = clean(body.company, 200);
  const attending = clean(body.attending, 10);
  const guests = Math.max(0, Math.min(20, Math.floor(Number(body.guests) || 0)));
  const referrals = clean(body.referrals, 4000, true);
  const notes = clean(body.notes, 4000, true);

  if (
    !event ||
    !firstName ||
    !lastName ||
    !EMAIL_RE.test(email) ||
    !event.roles.includes(role) ||
    !ATTENDING.has(attending)
  ) {
    return json({ error: "Missing or invalid fields" }, 400);
  }

  const env = getCloudflareContext().env as unknown as { EMAIL?: SendEmail };
  if (!env.EMAIL) return json({ error: "Email not configured" }, 503);

  const text = [
    `New event registration`,
    ``,
    `Event:     ${event.title}`,
    `When:      ${formatEventDate(event.date)}${event.time ? `, ${event.time}` : ""}`,
    `Where:     ${event.venue ? `${event.venue}, ` : ""}${event.city}`,
    ``,
    `Name:      ${firstName} ${lastName}`,
    `Email:     ${email}`,
    `Phone:     ${phone || "—"}`,
    `I am a:    ${role}`,
    `Company:   ${company || "—"}`,
    `Attending: ${attending === "yes" ? "Yes, I plan to attend" : "Interested — send me details"}`,
    `Guests:    ${guests}`,
    ``,
    `Investors / builders they know who may be interested:`,
    referrals || "(none)",
    ``,
    `Questions or projects to cover:`,
    notes || "(none)",
    ``,
    `—`,
    `Sent from russelldsmith.com/events/. Reply to this email to reach the registrant.`,
  ].join("\n");

  try {
    await env.EMAIL.send({
      to: NOTIFY,
      from: FROM,
      replyTo: email,
      subject: `Event registration (${event.city}, ${event.date}): ${firstName} ${lastName} (${role})${guests ? ` +${guests}` : ""}`,
      text,
    });
  } catch (err) {
    console.error("events register: send failed", err);
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
