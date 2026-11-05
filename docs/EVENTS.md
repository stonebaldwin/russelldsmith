# Events (`/events/`)

In-person events for investors, builders and partners, with a registration form.

| What | File |
|---|---|
| The events themselves (date, city, time, venue, topics, form roles) | `EVENTS` in `lib/events.ts` |
| Who receives registrations, sender address | `NOTIFY` / `FROM` in `app/api/events/register/route.ts` |
| Homepage "Upcoming events" band | `app/page.tsx` (hidden when nothing is upcoming) |

- **Add an event:** add one entry to `EVENTS`. Leave `time` / `venue` out until
  confirmed — the page shows "To be announced" and tells registrants they'll get
  the details by email. Fill them in later and redeploy.
- **Registrations** are emailed to `NOTIFY` (Reply-To = registrant) with the
  same Cloudflare Email Service `EMAIL` binding as Ask Russell — see
  `docs/ASK-RUSSELL.md` for the one-time setup. Nothing is stored. Each email
  includes the registrant's guest count and any **investors/builders they
  referred** — follow up with those personally.
- **Past events:** pages are static, so an event moves from "Upcoming" to "Past
  events" (and off the homepage) at the first deploy after its date.
