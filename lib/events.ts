/**
 * Russell's in-person events (/events/).
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ADD ONE ENTRY PER EVENT. The /events/ page, the homepage "Upcoming   │
 * │ events" band and the registration form's event picker all read from │
 * │ this array. Once an event's date has passed it moves to "Past events"│
 * │ and drops off the homepage at the next deploy.                       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Leave `time` / `venue` undefined until they're confirmed — the page shows
 * "Time and venue to be announced" and registrants are told they'll get the
 * details by email.
 */

export interface SiteEvent {
  /** Stable id — used as the #anchor on /events/ and in registration emails. */
  slug: string;
  title: string;
  /** Event date, YYYY-MM-DD (local date in the event's city). */
  date: string;
  /** Display time, e.g. "5:30 – 7:30 PM". Undefined = to be announced. */
  time?: string;
  /** City shown everywhere, e.g. "Southport, NC". */
  city: string;
  /** Venue name + street address. Undefined = to be announced. */
  venue?: string;
  /** Who it's for — one short line. */
  audience: string;
  /** One-paragraph summary (homepage card + top of the event block). */
  summary: string;
  /** What attendees will learn. */
  topics: string[];
  /** Guest speakers, shown on /events/. */
  speakers?: { name: string; org?: string }[];
  /** Short highlight chips (e.g. "No income verification"). */
  highlights?: string[];
  /** Roles offered in the registration form's "I am a…" select. */
  roles: string[];
}

export const EVENTS: SiteEvent[] = [
  {
    slug: "southport-spec-and-rental-builds-2026-12",
    title: "Investor & Builder Financing: Flips, BRRRR, and Spec & Rental Construction",
    date: "2026-12-02",
    city: "Southport, NC",
    audience: "Real estate investors and builders",
    summary:
      "Chris Lemons and Matt Puryear of CFS join Russell in Southport to show investors and builders how we finance property flips, BRRRR deals, and ground-up construction for spec homes and rentals — with no income verification, closing quickly in your LLC. Come find the solutions banks won't consider.",
    topics: [
      "Fix-and-flip financing: purchase and rehab, closed fast",
      "BRRRR transactions: buy, rehab, rent, refinance, repeat",
      "Ground-up construction loans for spec homes you plan to sell",
      "Building to rent: construction financing for properties you'll hold",
      "No income verification, closing in your LLC",
      "Live Q&A on your deals — including the ones your bank turned down",
    ],
    speakers: [
      { name: "Chris Lemons", org: "CFS" },
      { name: "Matt Puryear", org: "CFS" },
      { name: "Russell Smith", org: "ALCOVA Mortgage" },
    ],
    highlights: ["No income verification", "Close in your LLC", "Fast closings", "Flips · BRRRR · Construction"],
    roles: ["Investor", "Builder", "Realtor", "Other"],
  },
];

/** Today's date (YYYY-MM-DD) in Eastern time, where every event is held. */
function todayEastern(now = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(now);
}

/** Events on or after today, soonest first. Evaluated at build time on static pages. */
export function upcomingEvents(now = Date.now()): SiteEvent[] {
  const today = todayEastern(now);
  return EVENTS.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
}

/** Events before today, newest first. */
export function pastEvents(now = Date.now()): SiteEvent[] {
  const today = todayEastern(now);
  return EVENTS.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date));
}

export function getEvent(slug: string): SiteEvent | undefined {
  return EVENTS.find((e) => e.slug === slug);
}

/** "Wednesday, December 2, 2026" */
export function formatEventDate(date: string, opts?: { short?: boolean }): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: opts?.short ? "short" : "long",
    month: opts?.short ? "short" : "long",
    day: "numeric",
    year: "numeric",
  }).format(Date.UTC(y, m - 1, d));
}

/** Month + day parts for the date badge. */
export function dateBadge(date: string): { month: string; day: string } {
  const [y, m, d] = date.split("-").map(Number);
  const month = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short" }).format(Date.UTC(y, m - 1, d));
  return { month: month.toUpperCase(), day: String(d) };
}

/** Where the registration form POSTs (emails Russell + Stone). */
export const EVENTS_FORM_ENDPOINT = "/api/events/register/";
