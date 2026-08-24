import type { Metadata } from "next";
import Link from "next/link";
import { AUTHOR, CONTACT, SOCIAL, COMPLIANCE } from "@/lib/site";
import { getPlaylists, getChannel } from "@/lib/youtube";
import { ApplyLink } from "@/components/ApplyLink";
import { Thumb } from "@/components/Thumb";

/**
 * /connect — the one-page resource hub Russell points audiences to.
 *
 * This is the destination behind the QR code on the closing slide of his
 * Realtor presentations ("Connect to build your business"), so it is built
 * phone-first: everything above the fold is a tap target, nothing needs
 * pinch-zoom, and the whole page is a single scroll. Because the QR is printed
 * into decks and handouts, THE PATH /connect/ MUST NOT CHANGE — update what is
 * on the page, never its URL, or every deck already in the wild breaks.
 */

export const metadata: Metadata = {
  title: "Connect with Russell Smith | The Mortgage Strategist",
  description:
    "Everything in one place: video masterclasses, mortgage calculators, loan programs, and how to reach Russell Smith directly.",
  alternates: { canonical: "/connect/" },
  openGraph: {
    title: "Connect with Russell Smith | The Mortgage Strategist",
    description:
      "Video masterclasses, mortgage calculators, loan programs, and direct contact — all in one place.",
    url: "/connect/",
    type: "profile",
  },
};

/** Playlist to lead with — the investor series matches the Realtor/REO talks. */
const FEATURED_PLAYLIST = "PLodXDSBT4h5573or_KBO0OUN_aPuF8QAM";

const QUICK_LINKS: { label: string; note: string; href: string }[] = [
  {
    label: "Get to know your loan officer",
    note: "32 years, the strategy-first approach, and how I work",
    href: "/about/",
  },
  {
    label: "Payment calculators",
    note: "Payment, affordability, refinance, DSCR, seller net",
    href: "/mortgage-calculators/",
  },
  {
    label: "Investor loan programs",
    note: "DSCR, purchase-renovation, rentals and portfolio financing",
    href: "/investment-property-loans/",
  },
  {
    label: "Guides and articles",
    note: "Hundreds of posts on every loan type and scenario",
    href: "/blog/",
  },
];

const SOCIALS: { label: string; href: string }[] = [
  { label: "YouTube", href: SOCIAL.youtube },
  { label: "Facebook", href: SOCIAL.facebook },
  { label: "Instagram", href: SOCIAL.instagram },
  { label: "LinkedIn", href: SOCIAL.linkedin },
];

export default function ConnectPage() {
  const channel = getChannel();
  const playlists = getPlaylists().filter((p) => p.videos.length);
  const featured = playlists.find((p) => p.id === FEATURED_PLAYLIST) ?? playlists[0];
  const rest = playlists.filter((p) => p.id !== featured?.id).slice(0, 6);

  return (
    <div>
      {/* ---------------- Hero ---------------- */}
      <section className="bg-[#0e1a2b] text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16">
          {/* eslint-disable-next-line @next/next/no-img-element -- small static asset, no optimizer dependency */}
          <img
            src={AUTHOR.photo}
            alt={AUTHOR.name}
            width={112}
            height={112}
            className="mx-auto h-28 w-28 rounded-full ring-2 ring-white/25"
          />
          <h1 className="mt-5 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            {AUTHOR.name}
          </h1>
          <p className="mt-2 text-lg font-medium text-accent-light">{AUTHOR.tagline}</p>
          <p className="mt-3 text-sm text-white/60">
            ALCOVA Mortgage &middot; NMLS #{AUTHOR.nmls} &middot; {AUTHOR.servingArea}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <a
              href={CONTACT.phoneHref}
              className="rounded-lg bg-white px-5 py-3.5 text-base font-semibold text-[#0e1a2b] transition-colors hover:bg-accent-light"
            >
              Call or text
            </a>
            <a
              href={CONTACT.emailHref}
              className="rounded-lg border border-white/25 px-5 py-3.5 text-base font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/5"
            >
              Email me
            </a>
            <ApplyLink className="rounded-lg bg-accent px-5 py-3.5 text-base font-semibold text-white transition-colors hover:bg-accent-2-hover">
              Get pre-qualified
            </ApplyLink>
          </div>
          <p className="mt-4 text-sm text-white/55">
            {CONTACT.phone} &middot; {CONTACT.email}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-14">
        {/* ---------------- Quick links ---------------- */}
        <section>
          <h2 className="font-serif text-2xl font-medium text-accent">Start here</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {QUICK_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="block h-full rounded-xl border border-line bg-surface p-5 transition-colors hover:border-accent"
                >
                  <span className="block text-base font-semibold text-ink">{l.label}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted">{l.note}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------- YouTube ---------------- */}
        {featured && (
          <section className="mt-14">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="font-serif text-2xl font-medium text-accent">Watch &amp; learn</h2>
              <a
                href={`${channel.url}/playlists`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-accent-2 hover:underline"
              >
                All playlists on YouTube &rarr;
              </a>
            </div>
            <p className="mt-3 text-muted">
              Full masterclass series on every loan type &mdash; free, and built to be shared with
              your clients.
            </p>

            <a
              href={featured.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block overflow-hidden rounded-xl border border-line transition-colors hover:border-accent"
            >
              <Thumb src={featured.thumb} alt={featured.title} ratio="16/9" />
              <div className="bg-accent-pale p-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-accent-deep">
                  Start with this one
                </span>
                <span className="mt-1.5 block font-serif text-xl font-medium text-ink">
                  {featured.title}
                </span>
                <span className="mt-1 block text-sm text-muted">{featured.count} videos</span>
              </div>
            </a>

            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {rest.map((p) => (
                <li key={p.id}>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-full gap-3 rounded-xl border border-line bg-surface p-3 transition-colors hover:border-accent"
                  >
                    <Thumb
                      src={p.thumb}
                      alt={p.title}
                      ratio="16/9"
                      className="w-28 shrink-0 rounded-md"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold leading-5 text-ink">
                        {p.title.split("|")[0].trim()}
                      </span>
                      <span className="mt-1 block text-xs text-muted">{p.count} videos</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------------- Social ---------------- */}
        <section className="mt-14">
          <h2 className="font-serif text-2xl font-medium text-accent">Follow along</h2>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-line bg-surface px-4 py-3.5 text-center text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------- Realtor note ---------------- */}
        <section className="mt-14 rounded-xl border border-line bg-accent-pale p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h2 className="font-serif text-xl font-medium text-accent">Realtor or investor?</h2>
            <p className="mt-1 text-ink-soft">
              Let&rsquo;s talk through the financing before the offer, not after it.
            </p>
          </div>
          <a
            href={CONTACT.phoneHref}
            className="mt-4 inline-flex shrink-0 rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-2-hover sm:mt-0"
          >
            Call {CONTACT.phone}
          </a>
        </section>

        <p className="mt-10 text-xs leading-5 text-muted">
          {AUTHOR.name}, {AUTHOR.role} &middot; NMLS #{COMPLIANCE.nmlsId} &middot;{" "}
          {COMPLIANCE.company} NMLS #{COMPLIANCE.companyNmls} &middot; {COMPLIANCE.equalHousing}.{" "}
          {COMPLIANCE.disclaimer}
        </p>
      </div>
    </div>
  );
}
