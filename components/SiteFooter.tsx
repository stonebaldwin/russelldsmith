import Link from "next/link";
import { LANDING_PAGES } from "@/lib/routes";
import { SITE, AUTHOR, CONTACT, COMPLIANCE } from "@/lib/site";

const GUIDE_LINKS = [
  { label: "All guides", href: "/blog/" },
  { label: "VA loans", href: "/blog/category/va-loans/" },
  { label: "USDA loans", href: "/blog/category/usda/" },
  { label: "FHA loans", href: "/blog/category/fha/" },
  { label: "First-time buyers", href: "/blog/category/1st-time-buyers/" },
  { label: "Tips", href: "/blog/category/tips/" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <p className="font-serif text-lg font-semibold text-accent">{SITE.name}</p>
            <p className="mt-1 text-sm text-muted">
              {AUTHOR.role} · Serving {AUTHOR.servingArea}
            </p>
            <p className="mt-3 text-sm">
              <a href={CONTACT.phoneHref} className="text-ink-soft hover:text-accent">
                {CONTACT.phone}
              </a>
            </p>
            <p className="text-sm">
              <a href={CONTACT.emailHref} className="break-words text-ink-soft hover:text-accent">
                {CONTACT.email}
              </a>
            </p>
          </div>

          <nav aria-label="Loan programs">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Loan programs</h2>
            <ul className="mt-3 space-y-2">
              {LANDING_PAGES.filter((p) => p.kind === "loan").map((p) => (
                <li key={p.slug}>
                  <Link href={`/${p.slug}/`} className="text-sm text-ink-soft hover:text-accent">
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Guides">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Guides</h2>
            <ul className="mt-3 space-y-2">
              {GUIDE_LINKS.map((g) => (
                <li key={g.href}>
                  <Link href={g.href} className="text-sm text-ink-soft hover:text-accent">
                    {g.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Company</h2>
            <ul className="mt-3 space-y-2">
              <li><Link href="/about/" className="text-sm text-ink-soft hover:text-accent">About Russell</Link></li>
              <li><Link href="/contact/" className="text-sm text-ink-soft hover:text-accent">Contact</Link></li>
              <li><Link href="/mortgage-calculators/" className="text-sm text-ink-soft hover:text-accent">Calculators</Link></li>
            </ul>
          </nav>
        </div>

        {/* Compliance block (required for a mortgage site). Data harvested from
            ALCOVA's official disclosure — Russell to give a final review. */}
        <div className="mt-12 border-t border-line pt-8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- small local logo */}
              <img
                src="/media/site/equal-housing-lender.png"
                alt="Equal Housing Lender"
                className="h-7 w-auto"
              />
              <span className="text-sm font-medium text-ink">{COMPLIANCE.equalHousing}</span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- small local logo */}
            <img src="/media/site/alcova-logo.png" alt={COMPLIANCE.company} className="h-6 w-auto" />
          </div>

          <p className="mt-5 text-sm text-ink-soft">
            {AUTHOR.name}, {AUTHOR.role} · NMLS #{COMPLIANCE.nmlsId}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted">
            {COMPLIANCE.company} · NMLS #{COMPLIANCE.companyNmls} · {COMPLIANCE.companyAddress} ·{" "}
            {COMPLIANCE.companyPhone}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Licensed in {COMPLIANCE.licensedStates}. {COMPLIANCE.stateNotices}
          </p>

          <p className="mt-5 max-w-4xl text-xs leading-5 text-muted">{COMPLIANCE.disclaimer}</p>
          <p className="mt-2 max-w-4xl text-xs leading-5 text-muted">{COMPLIANCE.privacy}</p>
          <p className="mt-6 text-xs text-muted">
            © {year} {SITE.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
