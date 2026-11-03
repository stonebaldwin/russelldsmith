# Ask Russell — weekly live Q&A page (`/ask-russell/`)

The permanent page for Russell's weekly Teams Q&A: register, add the series to a
calendar, join, and watch past sessions.

## Where things live

| What | File |
|---|---|
| Join link, weekly slot, event title, form endpoint | `ASK_RUSSELL` in `lib/ask-russell.ts` |
| Past-session recordings | `RECORDINGS` in `lib/ask-russell.ts` |
| Who receives registrations, sender address | `NOTIFY` / `FROM` in `app/api/ask-russell/register/route.ts` |
| Email binding | `send_email` in `wrangler.jsonc` |

The page, the Google Calendar link and the `.ics` download all read from
`ASK_RUSSELL`, so changing the link or the slot is a one-place edit.

## Registrations → email (Cloudflare Email Service)

Each registration is emailed to the `NOTIFY` addresses, with Reply-To set to the
registrant. Nothing is stored. One-time setup for the account that owns
russelldsmith.com — steps 1–2 were done 2026-10-30 with `wrangler email sending
enable russelldsmith.com` and `wrangler email routing addresses create <addr>`:

1. **Email Service → Email Sending → Onboard Domain → russelldsmith.com.** This
   adds MX/SPF/DKIM records on `cf-bounce.russelldsmith.com` and a DMARC record
   at `_dmarc.russelldsmith.com` (`p=reject`). The root MX records (the domain's
   Microsoft 365 mail) are **not** changed, and M365 mail still passes DMARC via
   the root SPF (`include:secureserver.net` → `spf.protection.outlook.com`). Do **not** enable Email Routing on the zone itself —
   that would replace the root MX records.
2. **Email Service → Email Routing → Destination Addresses:** add
   `rsmith@alcova.com` and `stonebaldwin@alcova.com`. Each gets a verification
   email; click the link. (ALCOVA's filter may quarantine it — check junk.)
   Sending to verified addresses is free on any Workers plan.
3. Deploy (push to `main`), then submit one test registration on the live page.

Until this is set up, the form shows its fallback: "you don't need to register —
just join live", with the join link.

## Adding a recording

Add one entry to `RECORDINGS` in `lib/ask-russell.ts`:

```ts
{
  date: "2026-11-04",
  title: "Self-employed income and second homes",
  questionsCovered: ["How is 1099 income averaged?", "Second home vs. investment occupancy"],
  videoUrl: "https://www.youtube.com/watch?v=XXXXXXXXXXX",
  notesUrl: "https://…", // optional
},
```

## Weekly routine

- Reminder emails (day before + hour before) are sent by hand to the people in
  the registration emails who ticked "Email me reminders". The site does not send them.
- After each session, add the recording entry above.
