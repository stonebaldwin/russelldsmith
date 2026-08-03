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
    <footer className="mt-20 bg-accent text-white/80">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <p className="font-serif text-lg font-semibold text-white">{SITE.name}</p>
            <p className="mt-1 text-sm text-white/70">
              {AUTHOR.role} · Serving {AUTHOR.servingArea}
            </p>
            <p className="mt-3 text-sm">
              <a href={CONTACT.phoneHref} className="text-white/85 hover:text-white">
                {CONTACT.phone}
              </a>
            </p>
            <p className="text-sm">
              <a href={CONTACT.emailHref} className="break-words text-white/85 hover:text-white">
                {CONTACT.email}
              </a>
            </p>
            <div className="mt-4 inline-flex items-center gap-3 rounded-lg bg-white px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- small local logo */}
              <img
                src="/media/site/equal-housing-lender.png"
                alt="Equal Housing Lender"
                className="h-6 w-auto"
              />
              {/* eslint-disable-next-line @next/next/no-img-element -- small local logo */}
              <img src="/media/site/alcova-logo.png" alt={COMPLIANCE.company} className="h-5 w-auto" />
            </div>
          </div>

          <nav aria-label="Loan programs">
            <h2 className="text-xs font-semibold tracking-wider text-accent-light uppercase">
              Loan programs
            </h2>
            <ul className="mt-3 space-y-2">
              {LANDING_PAGES.filter((p) => p.kind === "loan").map((p) => (
                <li key={p.slug}>
                  <Link href={`/${p.slug}/`} className="text-sm text-white/80 hover:text-white">
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Guides">
            <h2 className="text-xs font-semibold tracking-wider text-accent-light uppercase">Guides</h2>
            <ul className="mt-3 space-y-2">
              {GUIDE_LINKS.map((g) => (
                <li key={g.href}>
                  <Link href={g.href} className="text-sm text-white/80 hover:text-white">
                    {g.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company">
            <h2 className="text-xs font-semibold tracking-wider text-accent-light uppercase">Company</h2>
            <ul className="mt-3 space-y-2">
              <li><Link href="/about/" className="text-sm text-white/80 hover:text-white">About Russell</Link></li>
              <li><Link href="/contact/" className="text-sm text-white/80 hover:text-white">Contact</Link></li>
              <li><Link href="/mortgage-calculators/" className="text-sm text-white/80 hover:text-white">Calculators</Link></li>
            </ul>
          </nav>
        </div>

        {/* Compliance block (required for a mortgage site). Data harvested from
            ALCOVA's official disclosure — Russell to give a final review. */}
        <div className="mt-12 border-t border-white/15 pt-8">
          <p className="text-sm font-medium text-white">
            {COMPLIANCE.equalHousing} · {AUTHOR.name}, {AUTHOR.role} · NMLS #{COMPLIANCE.nmlsId}
          </p>
          <p className="mt-1 text-xs leading-5 text-white/60">
            {COMPLIANCE.company} · NMLS #{COMPLIANCE.companyNmls} · {COMPLIANCE.companyAddress} ·{" "}
            {COMPLIANCE.companyPhone}
          </p>
          <p className="mt-1 text-xs leading-5 text-white/60">
            Licensed in {COMPLIANCE.licensedStates}. {COMPLIANCE.stateNotices}
          </p>
          <p className="mt-5 max-w-4xl text-xs leading-5 text-white/55">{COMPLIANCE.disclaimer}</p>
          <p className="mt-2 max-w-4xl text-xs leading-5 text-white/55">{COMPLIANCE.privacy}</p>
          <p className="mt-6 text-xs text-white/60">
            © {year} {SITE.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
