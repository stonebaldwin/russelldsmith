import Link from "next/link";
import { LANDING_PAGES } from "@/lib/routes";
import { SITE, COMPLIANCE } from "@/lib/site";

const GUIDE_LINKS = [
  { label: "All guides", href: "/blog/" },
  { label: "VA loans", href: "/blog/category/va-loans/" },
  { label: "USDA loans", href: "/blog/category/usda/" },
  { label: "FHA loans", href: "/blog/category/fha/" },
  { label: "First-time buyers", href: "/blog/category/1st-time-buyers/" },
  { label: "Tips", href: "/blog/category/tips/" },
];

function EqualHousingMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" className="text-ink">
      <path
        d="M12 3L3 10h2v9h14v-9h2L12 3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M8.5 12.5h7M8.5 15h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <p className="font-serif text-lg font-semibold text-ink">{SITE.name}</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted">{SITE.tagline}</p>
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

        {/* Compliance block (required for a mortgage site). Placeholders are
            filled in by Russell — see CLAUDE.md / lib/site.ts. */}
        <div className="mt-12 border-t border-line pt-8">
          <div className="flex items-start gap-3">
            <EqualHousingMark />
            <p className="text-sm font-medium text-ink">{COMPLIANCE.equalHousing}</p>
          </div>
          <dl className="mt-4 grid gap-x-8 gap-y-1 text-sm text-muted sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex gap-1.5">
              <dt className="font-medium text-ink-soft">NMLS ID:</dt>
              <dd>{COMPLIANCE.nmlsId}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="font-medium text-ink-soft">Company:</dt>
              <dd>{COMPLIANCE.company}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="font-medium text-ink-soft">Company NMLS:</dt>
              <dd>{COMPLIANCE.companyNmls}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="font-medium text-ink-soft">Licensed in:</dt>
              <dd>{COMPLIANCE.licensedStates}</dd>
            </div>
          </dl>
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
