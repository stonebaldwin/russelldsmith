/**
 * Static route definitions — the single source of truth for the landing pages
 * and core pages. Used by the sitemap, the manifest builder, the redirect test,
 * and the site nav. Landing pages exist because they are 301 destinations for
 * high-authority legacy root URLs (migration brief section 6.1).
 */

export interface LandingPage {
  slug: string;
  /** H1 / card title */
  title: string;
  /** short nav label */
  nav: string;
  /** meta description + hero dek */
  description: string;
  /** which loan category (slug) this page features, if any */
  category?: string;
  /** kind of page for rendering */
  kind: "loan" | "tool";
  /** calculator slugs (lib/calculators.ts) to surface on this page */
  calculators?: string[];
}

export const LANDING_PAGES: LandingPage[] = [
  {
    slug: "va-loans",
    title: "VA Loans",
    nav: "VA Loans",
    description:
      "VA home loan guidance for veterans and active-duty service members: eligibility, funding fees, appraisals, and $0-down purchases.",
    category: "va-loans",
    kind: "loan",
    calculators: ["va-loan", "payment"],
  },
  {
    slug: "usda-loans",
    title: "USDA Loans",
    nav: "USDA",
    description:
      "USDA rural development loans: 100% financing, income and property eligibility, and how to qualify in NC and SC.",
    category: "usda",
    kind: "loan",
    calculators: ["payment", "home-affordability"],
  },
  {
    slug: "fha-loans",
    title: "FHA Loans",
    nav: "FHA",
    description:
      "FHA loans explained: low down payments, credit guidelines, mortgage insurance, and first-time buyer options.",
    category: "fha",
    kind: "loan",
    calculators: ["payment", "home-affordability"],
  },
  {
    slug: "renovation-loans",
    title: "Renovation Loans",
    nav: "Renovation",
    description:
      "Renovation and rehab loans (FHA 203k and conventional) that finance the purchase and the improvements in one mortgage.",
    kind: "loan",
  },
  {
    slug: "construction-perm",
    title: "Construction-to-Perm Loans",
    nav: "Construction",
    description:
      "One-time-close construction-to-permanent financing for building a home, plus lot and land options.",
    kind: "loan",
  },
  {
    slug: "down-payment-assistance",
    title: "Down Payment Assistance",
    nav: "Down Payment Help",
    description:
      "Down payment assistance programs and grants for buyers in North and South Carolina.",
    kind: "loan",
    calculators: ["home-affordability", "payment"],
  },
  {
    slug: "reverse-mortgages",
    title: "Reverse Mortgages",
    nav: "Reverse",
    description:
      "Reverse mortgage (HECM) basics for homeowners 62+: how they work, requirements, and considerations.",
    kind: "loan",
  },
  {
    slug: "jumbo-loans",
    title: "Jumbo Loans",
    nav: "Jumbo",
    description:
      "Jumbo mortgage financing above conforming loan limits: guidelines, down payments, and rates.",
    kind: "loan",
  },
  {
    // Kept at this slug on purpose: it's the 301 destination for the old
    // /rental-properties/ (40 referring domains). /real-estate-investors/ is
    // 301'd here by middleware.ts as a memorable alias Russell can hand out.
    slug: "investment-property-loans",
    title: "Real Estate Investor Loans",
    nav: "Real Estate Investors",
    description:
      "Financing built for real estate investors: DSCR loans that qualify on the property's own rent, purchase-rehab, HELOCs, and portfolio strategies for building rental income.",
    kind: "loan",
    calculators: ["dscr", "payment"],
  },
  {
    // Rendered by app/mortgage-calculators/page.tsx (see CUSTOM_LANDING_ROUTES),
    // which owns its own <title>/description. This entry exists so the sitemap,
    // nav, and build manifest still know the page.
    slug: "mortgage-calculators",
    title: "Mortgage Calculators",
    nav: "Calculators",
    description:
      "Free mortgage calculators: monthly payment, VA loan, affordability, refinance, rent vs. buy, DSCR rental, and seller net proceeds.",
    kind: "tool",
  },
  {
    slug: "va-funding-fee-tables",
    title: "VA Funding Fee Tables",
    nav: "VA Funding Fee",
    description:
      "Current VA funding fee tables for purchase, cash-out, and IRRRL refinances, with exemptions.",
    kind: "tool",
    calculators: ["va-loan"],
  },
];

/**
 * Landing slugs that are served by their own static route instead of the
 * catch-all app/[landing]/page.tsx. They stay in LANDING_PAGES (the sitemap,
 * nav, and build manifest all read from it) but must be excluded from that
 * route's generateStaticParams, or two routes would claim the same path.
 */
export const CUSTOM_LANDING_ROUTES = ["mortgage-calculators"];

export const LANDING_SLUGS = LANDING_PAGES.filter(
  (p) => !CUSTOM_LANDING_ROUTES.includes(p.slug),
).map((p) => p.slug);

/** Core (non-landing, non-blog) routes that must exist. */
export const CORE_ROUTES = ["/", "/blog/", "/about/", "/contact/"];

/** Posts per page on the /blog index. */
export const POSTS_PER_PAGE = 24;

/** Primary top nav (label + href). Keep tight and scannable. */
export const PRIMARY_NAV: { label: string; href: string }[] = [
  { label: "VA Loans", href: "/va-loans/" },
  { label: "USDA", href: "/usda-loans/" },
  { label: "FHA", href: "/fha-loans/" },
  { label: "First-Time Buyers", href: "/blog/category/1st-time-buyers/" },
  { label: "Investors", href: "/investment-property-loans/" },
  { label: "Calculators", href: "/mortgage-calculators/" },
  { label: "About", href: "/about/" },
];

export function landingPath(slug: string): string {
  return `/${slug}/`;
}
