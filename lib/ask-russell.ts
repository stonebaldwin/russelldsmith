/**
 * Ask Russell — the weekly live Q&A on Microsoft Teams (/ask-russell/).
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ THE SINGLE CONFIG. Everything about the meeting lives here: the join │
 * │ link, the weekly slot, the calendar files, the form endpoint. Every  │
 * │ button, date, calendar link and .ics download on the page reads from │
 * │ this object — change a value here and the whole page follows.        │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export const ASK_RUSSELL = {
  /** The recurring Teams join link — the SAME link is used every week. If it is
   *  ever not an https:// URL, the Join buttons read "Join link coming soon". */
  TEAMS_JOIN_URL: "https://teams.microsoft.com/meet/2515628392072728?p=A2kvULnBWGIjMYdOQF",

  /** Weekly slot: Wednesdays 10:00 AM ET (confirmed 2026-10-30), 60 minutes.
   *  WEEKDAY: 0 = Sunday … 6 = Saturday. */
  WEEKDAY: 3,
  TIME: "10:00", // 24-hour HH:MM, wall-clock time in TIMEZONE
  TIMEZONE: "America/New_York",
  DURATION_MINUTES: 60,

  EVENT_TITLE: "Ask Russell — Weekly Mortgage Q&A with Russell Smith",

  /** Where registrations are POSTed as JSON. The site's own route emails each
   *  one to Russell and Stone via Cloudflare Email Service — recipients are set
   *  in app/api/ask-russell/register/route.ts. Empty string = don't send, just
   *  show the success state. */
  FORM_ENDPOINT: "/api/ask-russell/register/",
} as const;

/**
 * Previous sessions. ADD ONE ENTRY PER RECORDED SESSION — nothing else needs to
 * change. Order doesn't matter; the page sorts newest-first. videoUrl can be any
 * YouTube URL (watch, youtu.be, embed, live) or a direct .mp4 link.
 *
 *   {
 *     date: "2026-11-04",
 *     title: "Self-employed income and second homes",
 *     questionsCovered: ["How is 1099 income averaged?", "Second home vs. investment occupancy"],
 *     videoUrl: "https://www.youtube.com/watch?v=XXXXXXXXXXX",
 *     notesUrl: "https://…", // optional
 *   },
 */
export const RECORDINGS: Recording[] = [];

export interface Recording {
  /** Session date, YYYY-MM-DD */
  date: string;
  title: string;
  questionsCovered: string[];
  videoUrl: string;
  notesUrl?: string;
}

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ICS_DAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export const hasJoinUrl = () => /^https:\/\//.test(ASK_RUSSELL.TEAMS_JOIN_URL);

/* ------------------------------------------------------------------ */
/* Time zone math — the slot is wall-clock time in TIMEZONE, so DST is */
/* respected without hard-coding any offsets.                          */
/* ------------------------------------------------------------------ */

function zonedParts(instant: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day"), h: get("hour"), mi: get("minute"), s: get("second") };
}

/** Offset (ms) of timeZone from UTC at the given instant. */
function tzOffset(instant: number, timeZone: string) {
  const p = zonedParts(instant, timeZone);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(instant / 1000) * 1000;
}

/** UTC instant for a wall-clock time in timeZone. */
function zonedToInstant(y: number, m: number, d: number, h: number, mi: number, timeZone: string) {
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const first = guess - tzOffset(guess, timeZone);
  return guess - tzOffset(first, timeZone);
}

export interface Session {
  start: Date;
  end: Date;
  /** true while the session is in progress */
  live: boolean;
}

/** The session that is in progress now, or else the next upcoming one. */
export function nextSession(now: number = Date.now()): Session {
  const { WEEKDAY, TIME, TIMEZONE, DURATION_MINUTES } = ASK_RUSSELL;
  const [hh, mm] = TIME.split(":").map(Number);
  const today = zonedParts(now, TIMEZONE);
  for (let i = 0; i <= 7; i++) {
    // Calendar arithmetic on the zoned date (UTC is just a neutral carrier here).
    const day = new Date(Date.UTC(today.y, today.m - 1, today.d + i));
    if (day.getUTCDay() !== WEEKDAY) continue;
    const start = zonedToInstant(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), hh, mm, TIMEZONE);
    const end = start + DURATION_MINUTES * 60_000;
    if (end > now) return { start: new Date(start), end: new Date(end), live: start <= now };
  }
  throw new Error("unreachable: a weekday always occurs within 8 days");
}

/** "Wednesday, November 4, 2026 · 10:00 AM ET" */
export function formatSession(start: Date) {
  const { TIMEZONE } = ASK_RUSSELL;
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(start);
  return `${date} · ${formatTime(start)}`;
}

function formatTime(start: Date) {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: ASK_RUSSELL.TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(start);
  return `${time} ${zoneAbbrev()}`;
}

/** ET / CT / MT / PT for US zones, else the zone's short name. */
function zoneAbbrev() {
  const tz = ASK_RUSSELL.TIMEZONE;
  const known: Record<string, string> = {
    "America/New_York": "ET",
    "America/Chicago": "CT",
    "America/Denver": "MT",
    "America/Los_Angeles": "PT",
  };
  return known[tz] ?? tz;
}

/** "Wednesdays · 10:00 AM ET" — the standing slot, safe to render on the server. */
export function slotLabel() {
  const [hh, mm] = ASK_RUSSELL.TIME.split(":").map(Number);
  const h12 = ((hh + 11) % 12) + 1;
  const time = `${h12}:${String(mm).padStart(2, "0")} ${hh < 12 ? "AM" : "PM"}`;
  return `${WEEKDAY_NAMES[ASK_RUSSELL.WEEKDAY]}s · ${time} ${zoneAbbrev()}`;
}

/* ------------------------------------------------------------------ */
/* Calendar links / files — a WEEKLY recurring series.                 */
/* ------------------------------------------------------------------ */

const RRULE = () => `RRULE:FREQ=WEEKLY;BYDAY=${ICS_DAYS[ASK_RUSSELL.WEEKDAY]}`;

function eventDescription() {
  const join = hasJoinUrl() ? ASK_RUSSELL.TEAMS_JOIN_URL : "https://russelldsmith.com/ask-russell/";
  return [
    "A free weekly live Q&A on Microsoft Teams for bankers, Realtors, investors, CPAs, and other real-estate partners. Bring any mortgage scenario and get a straight answer from Russell Smith, Branch Partner & Sr. Loan Officer, ALCOVA Mortgage.",
    "",
    `Join the meeting: ${join}`,
    "",
    "Details and past recordings: https://russelldsmith.com/ask-russell/",
  ].join("\n");
}

const location = () => (hasJoinUrl() ? ASK_RUSSELL.TEAMS_JOIN_URL : "Microsoft Teams");

/** YYYYMMDDTHHMMSS in the configured zone (floating local time). */
function localStamp(instant: Date) {
  const p = zonedParts(instant.getTime(), ASK_RUSSELL.TIMEZONE);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.y}${pad(p.m)}${pad(p.d)}T${pad(p.h)}${pad(p.mi)}${pad(p.s)}`;
}

export function googleCalendarUrl(session: Session) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ASK_RUSSELL.EVENT_TITLE,
    dates: `${localStamp(session.start)}/${localStamp(session.end)}`,
    ctz: ASK_RUSSELL.TIMEZONE,
    recur: RRULE(),
    location: location(),
    details: eventDescription(),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function icsEscape(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Fold lines at 75 octets (RFC 5545 §3.1). */
function fold(line: string) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let cur = "";
  let curLen = 0;
  for (const ch of line) {
    const len = new TextEncoder().encode(ch).length;
    if (curLen + len > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = "";
      curLen = 0;
    }
    cur += ch;
    curLen += len;
  }
  out.push(cur);
  return out.join("\r\n ");
}

/** "-0500" style offset for VTIMEZONE. */
function icsOffset(ms: number) {
  const sign = ms < 0 ? "-" : "+";
  const mins = Math.abs(ms) / 60_000;
  return `${sign}${String(Math.floor(mins / 60)).padStart(2, "0")}${String(mins % 60).padStart(2, "0")}`;
}

/**
 * VTIMEZONE for the configured zone, so Outlook keeps the series at the same
 * wall-clock time across DST. Offsets are read from the zone itself; the
 * transition rules are the US ones (2nd Sun of March / 1st Sun of November).
 */
function vtimezone(year: number) {
  const tz = ASK_RUSSELL.TIMEZONE;
  const std = tzOffset(Date.UTC(year, 0, 15), tz);
  const dst = tzOffset(Date.UTC(year, 6, 15), tz);
  const lines = ["BEGIN:VTIMEZONE", `TZID:${tz}`];
  if (std === dst) {
    lines.push("BEGIN:STANDARD", "DTSTART:19700101T000000", `TZOFFSETFROM:${icsOffset(std)}`, `TZOFFSETTO:${icsOffset(std)}`, "END:STANDARD");
  } else {
    lines.push(
      "BEGIN:DAYLIGHT", "DTSTART:19700308T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
      `TZOFFSETFROM:${icsOffset(std)}`, `TZOFFSETTO:${icsOffset(dst)}`, "END:DAYLIGHT",
      "BEGIN:STANDARD", "DTSTART:19701101T020000", "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
      `TZOFFSETFROM:${icsOffset(dst)}`, `TZOFFSETTO:${icsOffset(std)}`, "END:STANDARD",
    );
  }
  lines.push("END:VTIMEZONE");
  return lines;
}

/** .ics for the weekly series with two reminders (1 day + 1 hour before). */
export function buildIcs(session: Session, now: Date = new Date()) {
  const tz = ASK_RUSSELL.TIMEZONE;
  const utcStamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//russelldsmith.com//Ask Russell//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...vtimezone(session.start.getUTCFullYear()),
    "BEGIN:VEVENT",
    "UID:ask-russell-weekly@russelldsmith.com",
    `DTSTAMP:${utcStamp}`,
    `DTSTART;TZID=${tz}:${localStamp(session.start)}`,
    `DTEND;TZID=${tz}:${localStamp(session.end)}`,
    RRULE(),
    `SUMMARY:${icsEscape(ASK_RUSSELL.EVENT_TITLE)}`,
    `LOCATION:${icsEscape(location())}`,
    `DESCRIPTION:${icsEscape(eventDescription())}`,
    ...(hasJoinUrl() ? [`URL:${ASK_RUSSELL.TEAMS_JOIN_URL}`] : []),
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Ask Russell is tomorrow", "TRIGGER:-P1D", "END:VALARM",
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Ask Russell starts in 1 hour", "TRIGGER:-PT1H", "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

/* ------------------------------------------------------------------ */
/* Recordings                                                          */
/* ------------------------------------------------------------------ */

/** YouTube video id from any common URL shape, else null. */
export function youTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
}

export function sortedRecordings() {
  return [...RECORDINGS].sort((a, b) => b.date.localeCompare(a.date));
}
