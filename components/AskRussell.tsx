"use client";

import { useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import {
  ASK_RUSSELL,
  buildIcs,
  formatSession,
  googleCalendarUrl,
  hasJoinUrl,
  nextSession,
  slotLabel,
  youTubeId,
  type Recording,
} from "@/lib/ask-russell";

/**
 * Client pieces of /ask-russell/. The next-session date is computed in the
 * browser (the page is statically built, so a server-rendered date would go
 * stale); before hydration it falls back to the standing slot label.
 */

let loadedAt: number | undefined;
const noSubscribe = () => () => {};

/** Current time, read once on the client; null during server render. */
function useNow() {
  return useSyncExternalStore(
    noSubscribe,
    () => (loadedAt ??= Date.now()),
    () => null,
  );
}

function useSession() {
  const now = useNow();
  return now === null ? null : nextSession(now);
}

export function NextSessionText({ className }: { className?: string }) {
  const session = useSession();
  if (!session) return <span className={className}>{slotLabel()}</span>;
  return (
    <span className={className}>
      {session.live ? "Live now: " : ""}
      {formatSession(session.start)}
    </span>
  );
}

const BTN =
  "inline-flex items-center justify-center rounded-lg px-5 py-3 text-base font-semibold transition-colors";

export function JoinButton({ className }: { className?: string }) {
  if (!hasJoinUrl()) {
    return (
      <span aria-disabled="true" className={cn(BTN, "cursor-default opacity-70", className)}>
        Join link coming soon
      </span>
    );
  }
  return (
    <a
      href={ASK_RUSSELL.TEAMS_JOIN_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(BTN, className)}
    >
      Join the Meeting
    </a>
  );
}

function downloadIcs() {
  const session = nextSession();
  const blob = new Blob([buildIcs(session)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ask-russell-weekly.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Google / Outlook / Apple — the weekly series, all from the one config. */
export function CalendarOptions({
  compact = false,
  tone = "light",
}: {
  compact?: boolean;
  tone?: "light" | "dark";
}) {
  const session = useSession();
  const item =
    tone === "dark"
      ? "border-white/25 text-white hover:border-white/60 hover:bg-white/5"
      : "border-line-strong bg-surface text-ink hover:border-accent hover:text-accent";
  const size = compact ? "px-4 py-2 text-sm" : "px-5 py-3 text-base";
  const cls = cn("inline-flex items-center justify-center gap-2 rounded-lg border font-semibold transition-colors", size, item);
  return (
    <div className={compact ? "flex flex-wrap gap-3" : "grid gap-3 sm:grid-cols-3"}>
      <a
        href={session ? googleCalendarUrl(session) : undefined}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
      >
        Google Calendar
      </a>
      <button type="button" onClick={downloadIcs} className={cls}>
        Outlook (.ics)
      </button>
      <button type="button" onClick={downloadIcs} className={cls}>
        Apple Calendar (.ics)
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Registration                                                        */
/* ------------------------------------------------------------------ */

const ROLES = ["Banker", "Realtor", "Investor", "CPA", "Other"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Errors = Partial<Record<"firstName" | "lastName" | "email" | "role", string>>;

const INPUT =
  "mt-1.5 block w-full rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

export function RegistrationForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errors, setErrors] = useState<Errors>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      firstName: String(fd.get("firstName") ?? "").trim(),
      lastName: String(fd.get("lastName") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      role: String(fd.get("role") ?? ""),
      company: String(fd.get("company") ?? "").trim(),
      question: String(fd.get("question") ?? "").trim(),
      reminders: fd.get("reminders") === "on",
      website: String(fd.get("website") ?? ""), // honeypot
    };
    const next: Errors = {};
    if (!data.firstName) next.firstName = "Please enter your first name.";
    if (!data.lastName) next.lastName = "Please enter your last name.";
    if (!EMAIL_RE.test(data.email)) next.email = "Please enter a valid email address.";
    if (!data.role) next.role = "Please choose one.";
    setErrors(next);
    if (Object.keys(next).length) {
      const first = Object.keys(next)[0];
      e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    // Registration is informational, never a gate: with no endpoint configured
    // the success state still shows.
    if (!ASK_RUSSELL.FORM_ENDPOINT) {
      setStatus("done");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch(ASK_RUSSELL.FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div role="status" className="rounded-xl border border-line bg-accent-pale p-6 sm:p-8">
        <h3 className="font-serif text-2xl font-semibold text-accent">You&rsquo;re registered for Ask Russell</h3>
        <p className="mt-2 text-lg text-ink">
          Next session: <NextSessionText className="font-semibold" />
        </p>
        <p className="mt-3 text-ink-soft">
          Save this page and add the weekly series to your calendar now so it&rsquo;s there every week.
        </p>
        <div className="mt-5">
          <JoinButton className="bg-accent text-white hover:bg-accent-2-hover" />
        </div>
        <div className="mt-5">
          <CalendarOptions />
        </div>
      </div>
    );
  }

  const fieldError = (name: keyof Errors) =>
    errors[name] ? (
      <p id={`${name}-error`} className="mt-1 text-sm text-red-700">
        {errors[name]}
      </p>
    ) : null;
  const aria = (name: keyof Errors) => ({
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form noValidate onSubmit={onSubmit} className="relative rounded-xl border border-line bg-surface p-6 sm:p-8">
      {status === "error" && (
        <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-ink">
          <p className="font-semibold">Sorry — your registration didn&rsquo;t go through.</p>
          <p className="mt-1 text-sm text-ink-soft">
            No problem: you don&rsquo;t need to register to attend. Just join live at{" "}
            <NextSessionText />.
          </p>
          <div className="mt-3">
            <JoinButton className="bg-accent px-4 py-2 text-sm text-white hover:bg-accent-2-hover" />
          </div>
        </div>
      )}
      {/* Spam trap: hidden from people and screen readers; bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="ar-website">Website</label>
        <input id="ar-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="ar-first" className="text-sm font-semibold text-ink">
            First name <span className="text-muted font-normal">(required)</span>
          </label>
          <input id="ar-first" name="firstName" autoComplete="given-name" required className={INPUT} {...aria("firstName")} />
          {fieldError("firstName")}
        </div>
        <div>
          <label htmlFor="ar-last" className="text-sm font-semibold text-ink">
            Last name <span className="text-muted font-normal">(required)</span>
          </label>
          <input id="ar-last" name="lastName" autoComplete="family-name" required className={INPUT} {...aria("lastName")} />
          {fieldError("lastName")}
        </div>
        <div>
          <label htmlFor="ar-email" className="text-sm font-semibold text-ink">
            Email <span className="text-muted font-normal">(required)</span>
          </label>
          <input id="ar-email" name="email" type="email" autoComplete="email" inputMode="email" required className={INPUT} {...aria("email")} />
          {fieldError("email")}
        </div>
        <div>
          <label htmlFor="ar-role" className="text-sm font-semibold text-ink">
            I am a&hellip; <span className="text-muted font-normal">(required)</span>
          </label>
          <select id="ar-role" name="role" required defaultValue="" className={INPUT} {...aria("role")}>
            <option value="" disabled>
              Choose one
            </option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {fieldError("role")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="ar-company" className="text-sm font-semibold text-ink">
            Company <span className="text-muted font-normal">(optional)</span>
          </label>
          <input id="ar-company" name="company" autoComplete="organization" className={INPUT} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="ar-question" className="text-sm font-semibold text-ink">
            Your question for Russell <span className="text-muted font-normal">(optional)</span>
          </label>
          <textarea
            id="ar-question"
            name="question"
            rows={4}
            placeholder="Describe the scenario — no names or personal details needed."
            className={INPUT}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="flex items-start gap-3 text-ink-soft">
            <input
              type="checkbox"
              name="reminders"
              defaultChecked
              className="mt-1 h-4 w-4 shrink-0 rounded border-line-strong accent-[var(--accent)]"
            />
            <span>Email me reminders about Ask Russell sessions</span>
          </label>
        </div>
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className={cn(BTN, "mt-6 w-full bg-accent text-white hover:bg-accent-2-hover disabled:opacity-70 sm:w-auto")}
      >
        {status === "sending" ? "Registering…" : "Register"}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Recordings                                                          */
/* ------------------------------------------------------------------ */

const YT_ORIGIN = "https://www.youtube-nocookie.com";

/** Thumbnail first; the iframe only loads when the viewer presses play. */
function RecordingVideo({ url, title }: { url: string; title: string }) {
  const [started, setStarted] = useState(false);
  const id = youTubeId(url);

  if (id) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-lg border border-line bg-black">
        {started ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`${YT_ORIGIN}/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setStarted(true)}
            aria-label={`Play recording: ${title}`}
            className="group absolute inset-0 h-full w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- YouTube CDN thumbnail */}
            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover" />
            <span className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/10" />
            <span className="absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#ff0000] shadow-lg transition-transform group-hover:scale-110">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
    );
  }

  if (/\.(mp4|webm|m4v)(\?|$)/i.test(url)) {
    return (
      <video controls preload="none" className="aspect-video w-full rounded-lg border border-line bg-black">
        <source src={url} />
      </video>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent-2 hover:underline">
      Watch the recording &rarr;
    </a>
  );
}

export function RecordingCard({ recording }: { recording: Recording }) {
  const [y, m, d] = recording.date.split("-").map(Number);
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(Date.UTC(y, m - 1, d));
  return (
    <article className="rounded-xl border border-line bg-surface p-5">
      <RecordingVideo url={recording.videoUrl} title={recording.title} />
      <p className="mt-4 text-sm font-medium text-muted">
        <time dateTime={recording.date}>{dateLabel}</time>
      </p>
      <h3 className="mt-1 font-serif text-xl font-semibold text-ink">{recording.title}</h3>
      {recording.questionsCovered.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-ink-soft">
          {recording.questionsCovered.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      )}
      {recording.notesUrl && (
        <a
          href={recording.notesUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm font-semibold text-accent-2 hover:underline"
        >
          Session notes &rarr;
        </a>
      )}
    </article>
  );
}
