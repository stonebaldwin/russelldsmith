import type { Metadata } from "next";
import { AUTHOR } from "@/lib/site";
import { ASK_RUSSELL, slotLabel, sortedRecordings } from "@/lib/ask-russell";
import {
  CalendarOptions,
  JoinButton,
  NextSessionText,
  RecordingCard,
  RegistrationForm,
} from "@/components/AskRussell";

/**
 * /ask-russell — the permanent home of Russell's weekly live Teams Q&A for
 * bankers, Realtors, investors, CPAs and other partners: register, put the
 * weekly series on your calendar, join, and watch past sessions.
 *
 * Everything about the meeting (join link, weekly slot, form endpoint) lives in
 * the ASK_RUSSELL config in lib/ask-russell.ts; recordings are the RECORDINGS
 * array in the same file.
 */

const TITLE = "Ask Russell — Weekly Live Mortgage Q&A | Russell Smith";
const DESCRIPTION =
  "A free weekly live Q&A on Microsoft Teams for bankers, Realtors, investors, CPAs, and real-estate partners. Bring any mortgage scenario and get a straight answer from Russell Smith.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/ask-russell/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/ask-russell/" },
};

const STEPS = [
  { title: "Register once", body: "Tell us who you are — and, if you like, the scenario you want Russell to tackle." },
  { title: "Add the series to your calendar", body: "One click puts every weekly session on your calendar, with reminders." },
  { title: "Join live and ask", body: "Bring your question to the call — or submit it on the form ahead of time." },
];

const EXAMPLE_QUESTIONS = [
  "How do you count commission or bonus income for a borrower who just changed jobs?",
  "My self-employed client wrote off most of their income — what are the options?",
  "VA or FHA: which works better for this buyer, and what will the appraisal flag?",
  "Can my investor client qualify on rental income instead of personal income?",
  "Second home or investment property — how does lending treat each one?",
  "We have a 21-day close. What needs to happen this week to make it?",
];

const FAQ = [
  { q: "Is it free?", a: "Yes. There is no cost to attend or to submit a question." },
  {
    q: "Do I need a Teams account or the app?",
    a: "No. The join link opens in your web browser — no account or download required.",
  },
  {
    q: "Can I submit a question without attending?",
    a: "Yes. Add it to the registration form and Russell will cover it on the call; the recording is posted here afterward.",
  },
  {
    q: "Will sessions be recorded?",
    a: "Yes. Sessions are recorded and posted on this page, so you can catch up on any you miss.",
  },
];

const H2 = "font-serif text-2xl font-medium text-accent sm:text-3xl";

export default function AskRussellPage() {
  const recordings = sortedRecordings();

  return (
    <div id="ask-russell">
      {/* ---------------- Hero ---------------- */}
      <section className="bg-[#0e1a2b] text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Ask Russell</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/85">
            A free weekly live Q&amp;A for bankers, Realtors, investors, CPAs, and other real-estate
            partners. Bring any mortgage scenario and get a straight answer from {AUTHOR.name},{" "}
            {AUTHOR.role}.
          </p>
          <p className="mt-6 text-sm font-medium text-accent-light">Next session</p>
          <p className="mt-1 text-xl font-semibold sm:text-2xl">
            <NextSessionText />
          </p>
          <p className="mt-1 text-sm text-white/60">
            {`${slotLabel()} · ${ASK_RUSSELL.DURATION_MINUTES} minutes · Microsoft Teams`}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <a
              href="#register"
              className="rounded-lg bg-white px-5 py-3.5 text-base font-semibold text-[#0e1a2b] transition-colors hover:bg-accent-light"
            >
              Register
            </a>
            <a
              href="#calendar"
              className="rounded-lg border border-white/25 px-5 py-3.5 text-base font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/5"
            >
              Add to Calendar
            </a>
            <JoinButton className="bg-accent py-3.5 text-white hover:bg-accent-2-hover" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-14">
        {/* ---------------- How it works ---------------- */}
        <section aria-labelledby="how">
          <h2 id="how" className={H2}>How it works</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-xl border border-line bg-surface p-5">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-pale font-semibold text-accent"
                >
                  {i + 1}
                </span>
                <h3 className="mt-3 text-base font-semibold text-ink">{s.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{s.body}</p>
              </li>
            ))}
          </ol>

          <h3 className="mt-10 text-lg font-semibold text-ink">Who it&rsquo;s for</h3>
          <p className="mt-2 text-ink-soft">
            Bankers, Realtors, investors, CPAs, financial advisors, and anyone else who helps clients
            buy, sell, or finance real estate. If a mortgage question is holding up a deal or a
            conversation, bring it.
          </p>
          <h3 className="mt-6 text-lg font-semibold text-ink">Questions partners bring</h3>
          <ul className="mt-3 space-y-2">
            {EXAMPLE_QUESTIONS.map((q) => (
              <li key={q} className="rounded-lg border-l-4 border-accent-light bg-accent-pale/60 px-4 py-3 text-ink-soft">
                &ldquo;{q}&rdquo;
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------- Add to calendar ---------------- */}
        <section id="calendar" aria-labelledby="calendar-h" className="mt-14 scroll-mt-24">
          <h2 id="calendar-h" className={H2}>Add the weekly series to your calendar</h2>
          <p className="mt-3 text-ink-soft">
            One entry covers every session &mdash; {slotLabel()} &mdash; with the join link inside and
            reminders a day and an hour before.
          </p>
          <div className="mt-5">
            <CalendarOptions />
          </div>
        </section>

        {/* ---------------- Registration ---------------- */}
        <section id="register" aria-labelledby="register-h" className="mt-14 scroll-mt-24">
          <h2 id="register-h" className={H2}>Register</h2>
          <p className="mt-3 text-ink-soft">
            Registration is optional &mdash; the join link above always works &mdash; but it lets
            Russell know you&rsquo;re coming and gives you a place to send your question in advance.
          </p>
          <div className="mt-6">
            <RegistrationForm />
          </div>
        </section>

        {/* ---------------- Recordings ---------------- */}
        <section aria-labelledby="recordings-h" className="mt-14">
          <h2 id="recordings-h" className={H2}>Previous sessions</h2>
          <p className="mt-3 text-sm text-muted">
            Sessions are recorded and posted here. General education only &mdash; not financial or
            legal advice for your specific situation.
          </p>
          {recordings.length ? (
            <div className="mt-6 grid gap-6">
              {recordings.map((r) => (
                <RecordingCard key={`${r.date}-${r.title}`} recording={r} />
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-xl border border-dashed border-line-strong bg-accent-pale/50 p-6 text-center text-ink-soft">
              Session recordings will be posted here &mdash; the series is just getting started.
            </p>
          )}
          <div className="mt-6">
            <p className="mb-3 text-sm font-semibold text-ink">Never miss a session:</p>
            <CalendarOptions compact />
          </div>
        </section>

        {/* ---------------- FAQ ---------------- */}
        <section aria-labelledby="faq-h" className="mt-14">
          <h2 id="faq-h" className={H2}>FAQ</h2>
          <dl className="mt-6 divide-y divide-line rounded-xl border border-line bg-surface">
            {FAQ.map((f) => (
              <div key={f.q} className="p-5">
                <dt className="font-semibold text-ink">{f.q}</dt>
                <dd className="mt-1 text-ink-soft">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
