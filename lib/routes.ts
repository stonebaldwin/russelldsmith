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
  },
  {
    slug: "usda-loans",
    title: "USDA Loans",
    nav: "USDA",
    description:
      "USDA rural development loans: 100% financing, income and property eligibility, and how to qualify in NC and SC.",
    category: "usda",
    kind: "loan",
  },
  {
    slug: "fha-loans",
    title: "FHA Loans",
    nav: "FHA",
    description:
      "FHA loans explained: low down payments, credit guidelines, mortgage insurance, and first-time buyer options.",
    category: "fha",
    kind: "loan",
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
    slug: "investment-property-loans",
    title: "Investment Property Loans",
    nav: "Investment",
    description:
      "Financing for rental and investment properties: DSCR loans, down payments, and qualifying with rental income.",
    kind: "loan",
  },
  {
    slug: "mortgage-calculators",
    title: "Mortgage Calculators",
    nav: "Calculators",
    description:
      "Free mortgage calculators: monthly payment, affordability, and VA funding fee estimates.",
    kind: "tool",
  },
  {
    slug: "va-funding-fee-tables",
    title: "VA Funding Fee Tables",
    nav: "VA Funding Fee",
    description:
      "Current VA funding fee tables for purchase, cash-out, and IRRRL refinances, with exemptions.",
    kind: "tool",
  },
];

export const LANDING_SLUGS = LANDING_PAGES.map((p) => p.slug);

/** Core (non-landing, non-blog) routes that must exist. */
export const CORE_ROUTES = ["/", "/blog/", "/videos/", "/about/", "/contact/"];

/** Posts per page on the /blog index. */
export const POSTS_PER_PAGE = 24;

/** Primary top nav (label + href). Keep tight and scannable. */
export const PRIMARY_NAV: { label: string; href: string }[] = [
  { label: "VA Loans", href: "/va-loans/" },
  { label: "USDA", href: "/usda-loans/" },
  { label: "FHA", href: "/fha-loans/" },
  { label: "First-Time Buyers", href: "/blog/category/1st-time-buyers/" },
  { label: "Guides", href: "/blog/" },
  { label: "Videos", href: "/videos/" },
  { label: "About", href: "/about/" },
];

export function landingPath(slug: string): string {
  return `/${slug}/`;
}
