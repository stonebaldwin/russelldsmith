"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { CONTACT } from "@/lib/site";
import { EVENTS_FORM_ENDPOINT, formatEventDate, type SiteEvent } from "@/lib/events";

/**
 * Registration form for /events/. Emails Russell + Stone via
 * /api/events/register/. Also collects referrals — investors and builders the
 * registrant knows who may want to attend — since that's how Russell grows these.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Field = "event" | "firstName" | "lastName" | "email" | "role" | "attending";
type Errors = Partial<Record<Field, string>>;

const INPUT =
  "mt-1.5 block w-full rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";
const LABEL = "text-sm font-semibold text-ink";
const OPT = <span className="font-normal text-muted">(optional)</span>;
const REQ = <span className="font-normal text-muted">(required)</span>;

export function EventRegistrationForm({ events }: { events: SiteEvent[] }) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [eventSlug, setEventSlug] = useState(events.length === 1 ? events[0].slug : "");
  const [registered, setRegistered] = useState<SiteEvent | null>(null);

  const selected = events.find((e) => e.slug === eventSlug);
  const roles = selected?.roles ?? Array.from(new Set(events.flatMap((e) => e.roles)));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data = {
      event: eventSlug,
      firstName: String(fd.get("firstName") ?? "").trim(),
      lastName: String(fd.get("lastName") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
      role: String(fd.get("role") ?? ""),
      company: String(fd.get("company") ?? "").trim(),
      attending: String(fd.get("attending") ?? ""),
      guests: Number(fd.get("guests") ?? 0) || 0,
      referrals: String(fd.get("referrals") ?? "").trim(),
      notes: String(fd.get("notes") ?? "").trim(),
      website: String(fd.get("website") ?? ""), // honeypot
    };
    const next: Errors = {};
    if (!selected) next.event = "Please choose an event.";
    if (!data.firstName) next.firstName = "Please enter your first name.";
    if (!data.lastName) next.lastName = "Please enter your last name.";
    if (!EMAIL_RE.test(data.email)) next.email = "Please enter a valid email address.";
    if (!data.role) next.role = "Please choose one.";
    if (!data.attending) next.attending = "Please choose one.";
    setErrors(next);
    if (Object.keys(next).length) {
      const first = Object.keys(next)[0];
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch(EVENTS_FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setRegistered(selected ?? null);
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "done" && registered) {
    return (
      <div role="status" className="rounded-xl border border-line bg-accent-pale p-6 sm:p-8">
        <h3 className="font-serif text-2xl font-semibold text-accent">You&rsquo;re on the list</h3>
        <p className="mt-2 text-lg text-ink">
          {registered.title} &mdash; {formatEventDate(registered.date)}, {registered.city}
        </p>
        <p className="mt-3 text-ink-soft">
          Russell will email you {registered.time && registered.venue ? "a reminder" : "the time and venue"} before
          the event. Know another investor or builder who should be there? Send them this page.
        </p>
      </div>
    );
  }

  const fieldError = (name: Field) =>
    errors[name] ? (
      <p id={`ev-${name}-error`} className="mt-1 text-sm text-red-700">
        {errors[name]}
      </p>
    ) : null;
  const aria = (name: Field) => ({
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `ev-${name}-error` : undefined,
  });

  return (
    <form noValidate onSubmit={onSubmit} className="relative rounded-xl border border-line bg-surface p-6 sm:p-8">
      {status === "error" && (
        <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-ink">
          <p className="font-semibold">Sorry &mdash; your registration didn&rsquo;t go through.</p>
          <p className="mt-1 text-sm text-ink-soft">
            Please try again, or call or text Russell at{" "}
            <a href={CONTACT.phoneHref} className="font-semibold text-accent-2 hover:underline">
              {CONTACT.phone}
            </a>{" "}
            to save your spot.
          </p>
        </div>
      )}
      {/* Spam trap: hidden from people and screen readers; bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="ev-website">Website</label>
        <input id="ev-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {events.length === 1 ? (
          <div className="sm:col-span-2 rounded-lg bg-accent-pale/60 px-4 py-3">
            <p className="text-sm font-semibold text-ink">Registering for</p>
            <p className="mt-0.5 text-ink-soft">
              {events[0].title} &mdash; {formatEventDate(events[0].date)}, {events[0].city}
            </p>
          </div>
        ) : (
        <div className="sm:col-span-2">
          <label htmlFor="ev-event" className={LABEL}>
            Event {REQ}
          </label>
          <select
            id="ev-event"
            name="event"
            value={eventSlug}
            onChange={(e) => setEventSlug(e.target.value)}
            className={INPUT}
            {...aria("event")}
          >
            {events.length > 1 && (
              <option value="" disabled>
                Choose an event
              </option>
            )}
            {events.map((ev) => (
              <option key={ev.slug} value={ev.slug}>
                {formatEventDate(ev.date, { short: true })} &middot; {ev.city} &middot; {ev.title}
              </option>
            ))}
          </select>
          {fieldError("event")}
        </div>
        )}
        <div>
          <label htmlFor="ev-first" className={LABEL}>
            First name {REQ}
          </label>
          <input id="ev-first" name="firstName" autoComplete="given-name" required className={INPUT} {...aria("firstName")} />
          {fieldError("firstName")}
        </div>
        <div>
          <label htmlFor="ev-last" className={LABEL}>
            Last name {REQ}
          </label>
          <input id="ev-last" name="lastName" autoComplete="family-name" required className={INPUT} {...aria("lastName")} />
          {fieldError("lastName")}
        </div>
        <div>
          <label htmlFor="ev-email" className={LABEL}>
            Email {REQ}
          </label>
          <input id="ev-email" name="email" type="email" autoComplete="email" inputMode="email" required className={INPUT} {...aria("email")} />
          {fieldError("email")}
        </div>
        <div>
          <label htmlFor="ev-phone" className={LABEL}>
            Phone {OPT}
          </label>
          <input id="ev-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" className={INPUT} />
        </div>
        <div>
          <label htmlFor="ev-role" className={LABEL}>
            I am a&hellip; {REQ}
          </label>
          <select id="ev-role" name="role" required defaultValue="" className={INPUT} {...aria("role")}>
            <option value="" disabled>
              Choose one
            </option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {fieldError("role")}
        </div>
        <div>
          <label htmlFor="ev-company" className={LABEL}>
            Company {OPT}
          </label>
          <input id="ev-company" name="company" autoComplete="organization" className={INPUT} />
        </div>

        <fieldset className="sm:col-span-2" {...aria("attending")}>
          <legend className={LABEL}>Will you attend? {REQ}</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {[
              { v: "yes", label: "Yes, save me a seat" },
              { v: "maybe", label: "Interested — send me the details" },
            ].map((o) => (
              <label
                key={o.v}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-line-strong px-4 py-3 text-ink has-[:checked]:border-accent has-[:checked]:bg-accent-pale"
              >
                <input type="radio" name="attending" value={o.v} className="h-4 w-4 accent-[var(--accent)]" />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
          {fieldError("attending")}
        </fieldset>

        <div>
          <label htmlFor="ev-guests" className={LABEL}>
            Guests you&rsquo;re bringing {OPT}
          </label>
          <input id="ev-guests" name="guests" type="number" min={0} max={20} defaultValue={0} inputMode="numeric" className={INPUT} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="ev-referrals" className={LABEL}>
            Know other investors or builders who&rsquo;d want to come? {OPT}
          </label>
          <p className="mt-0.5 text-sm text-muted">
            Add their names and an email or phone, and Russell will personally invite them.
          </p>
          <textarea
            id="ev-referrals"
            name="referrals"
            rows={3}
            placeholder={"Jane Doe — jane@example.com\nJohn Smith — (910) 555-0123"}
            className={INPUT}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="ev-notes" className={LABEL}>
            A project or question you&rsquo;d like covered {OPT}
          </label>
          <textarea
            id="ev-notes"
            name="notes"
            rows={3}
            placeholder="e.g. A BRRRR deal my bank passed on, or two spec homes on lots I own"
            className={INPUT}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className={cn(
          "mt-6 inline-flex w-full items-center justify-center rounded-lg bg-accent px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-accent-2-hover disabled:opacity-70 sm:w-auto",
        )}
      >
        {status === "sending" ? "Registering…" : "Register"}
      </button>
    </form>
  );
}
