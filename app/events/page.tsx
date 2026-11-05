import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT } from "@/lib/site";
import { formatEventDate, pastEvents, upcomingEvents } from "@/lib/events";
import { DateBadge } from "@/components/EventCard";
import { EventRegistrationForm } from "@/components/EventRegistration";

/**
 * /events — Russell's in-person events. Every event is an entry in EVENTS
 * (lib/events.ts); registrations are emailed by /api/events/register/.
 */

const TITLE = "Events for Investors & Builders | Russell Smith";
const DESCRIPTION =
  "In-person events from Russell Smith for real estate investors and builders: how flip financing and ground-up construction financing work for spec homes and build-to-rent projects. Register free.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/events/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/events/" },
};

const H2 = "font-serif text-2xl font-medium text-accent sm:text-3xl";

export default function EventsPage() {
  const upcoming = upcomingEvents();
  const past = pastEvents();

  return (
    <div id="events">
      <section className="bg-[#0e1a2b] text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Events</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/85">
            Free, in-person sessions where Russell walks investors and builders through the
            financing behind real projects &mdash; and answers your questions on the spot.
          </p>
          {upcoming.length > 0 && (
            <a
              href="#register"
              className="mt-8 inline-flex rounded-lg bg-white px-6 py-3.5 text-base font-semibold text-[#0e1a2b] transition-colors hover:bg-accent-light"
            >
              Register now
            </a>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-14">
        <section aria-labelledby="upcoming-h">
          <h2 id="upcoming-h" className={H2}>Upcoming events</h2>
          {upcoming.length ? (
            <div className="mt-6 space-y-6">
              {upcoming.map((ev) => (
                <article key={ev.slug} id={ev.slug} className="scroll-mt-24 rounded-xl border border-line bg-surface p-6 sm:p-8">
                  <div className="flex gap-5">
                    <DateBadge date={ev.date} className="bg-accent-pale" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted">{ev.audience}</p>
                      <h3 className="mt-1 font-serif text-2xl font-semibold text-ink">{ev.title}</h3>
                    </div>
                  </div>

                  <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div>
                      <dt className="text-sm font-semibold text-ink">Date</dt>
                      <dd className="mt-0.5 text-ink-soft">{formatEventDate(ev.date)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-semibold text-ink">Time</dt>
                      <dd className="mt-0.5 text-ink-soft">{ev.time ?? "To be announced"}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-semibold text-ink">Location</dt>
                      <dd className="mt-0.5 text-ink-soft">
                        {ev.venue ? (
                          <>
                            {ev.venue}
                            <br />
                            {ev.city}
                          </>
                        ) : (
                          <>
                            {ev.city}
                            <br />
                            <span className="text-sm text-muted">Venue to be announced</span>
                          </>
                        )}
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-6 leading-7 text-ink-soft">{ev.summary}</p>

                  <h4 className="mt-6 font-semibold text-ink">What we&rsquo;ll cover</h4>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-ink-soft">
                    {ev.topics.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>

                  {(!ev.time || !ev.venue) && (
                    <p className="mt-6 rounded-lg border-l-4 border-accent-light bg-accent-pale/60 px-4 py-3 text-sm text-ink-soft">
                      Register below and Russell will email you the exact time and venue as soon as
                      they&rsquo;re set.
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-xl border border-dashed border-line-strong bg-accent-pale/50 p-6 text-center text-ink-soft">
              No events are scheduled right now. Check back soon, or{" "}
              <Link href="/contact/" className="font-semibold text-accent-2 hover:underline">
                get in touch
              </Link>{" "}
              to hear about the next one.
            </p>
          )}
        </section>

        {upcoming.length > 0 && (
          <section id="register" aria-labelledby="register-h" className="mt-14 scroll-mt-24">
            <h2 id="register-h" className={H2}>Register</h2>
            <p className="mt-3 text-ink-soft">
              Attendance is free. Registering saves your spot &mdash; and if
              you know other investors or builders who&rsquo;d get value from this, tell us below and
              Russell will make sure they get an invitation.
            </p>
            <div className="mt-6">
              <EventRegistrationForm events={upcoming} />
            </div>
            <p className="mt-4 text-sm text-muted">
              Questions? Call or text Russell at{" "}
              <a href={CONTACT.phoneHref} className="font-semibold text-accent-2 hover:underline">
                {CONTACT.phone}
              </a>
              .
            </p>
          </section>
        )}

        {past.length > 0 && (
          <section aria-labelledby="past-h" className="mt-14">
            <h2 id="past-h" className={H2}>Past events</h2>
            <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-surface">
              {past.map((ev) => (
                <li key={ev.slug} className="p-5">
                  <p className="text-sm text-muted">
                    {formatEventDate(ev.date)} &middot; {ev.city}
                  </p>
                  <p className="mt-1 font-semibold text-ink">{ev.title}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-14 text-sm text-muted">
          Events are educational. Information presented is not a commitment to lend; all loans are
          subject to credit approval, underwriting, and property eligibility.
        </p>
      </div>
    </div>
  );
}
