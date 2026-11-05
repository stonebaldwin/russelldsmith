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
  /** Roles offered in the registration form's "I am a…" select. */
  roles: string[];
}

export const EVENTS: SiteEvent[] = [
  {
    slug: "southport-spec-and-rental-builds-2026-12",
    title: "Financing Spec Homes & Build-to-Rent: Flip + Ground-Up Construction",
    date: "2026-12-02",
    city: "Southport, NC",
    audience: "Real estate investors and builders",
    summary:
      "An in-person session in Southport showing investors and builders how our flip financing and ground-up construction financing work together — whether you're building a spec home to sell or building a property to hold as a rental.",
    topics: [
      "How flip (fix-and-flip) financing works and where it fits",
      "Ground-up construction financing for new builds",
      "Building a spec home to sell: structuring the loan from lot to sale",
      "Building to hold: moving a finished build into a long-term rental loan",
      "Live Q&A on your deals and projects",
    ],
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
