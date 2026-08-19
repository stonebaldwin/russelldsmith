/**
 * Russell's calculator suite — the single source of truth for
 * /mortgage-calculators/ and its child pages.
 *
 * The calculators themselves are built in-house: the maths lives in lib/calc/*
 * (pure, testable functions) and the UI in components/calculators/*. Every
 * model was checked against Russell's hosted RebelIQ calculators and matches
 * them to the dollar; the rate schedules and default assumptions all sit in
 * lib/calc/rates.ts so there is one place to review when guidelines change.
 *
 * Adding a calculator: add it here, then add its component to
 * components/calc/renderCalculator.tsx — the CalculatorSlug union makes the
 * type check fail until you do.
 */

export type CalculatorSlug =
  | "payment"
  | "va-loan"
  | "home-affordability"
  | "refinance"
  | "rent-vs-buy"
  | "dscr"
  | "seller-net-proceeds";

export interface Calculator {
  /** URL segment under /mortgage-calculators/ */
  slug: CalculatorSlug;
  /** H1 + card title */
  title: string;
  /** short label for pills / nav / cards */
  nav: string;
  /** meta description + hero dek */
  description: string;
  /** one-line "what it answers", shown on the hub cards */
  answers: string;
  /** what the calculator actually shows you — 3 factual bullets */
  highlights: string[];
  /** search terms used to surface relevant blog guides beneath the calculator */
  keywords: string[];
  /** on-site pages worth sending this calculator's audience to next */
  seeAlso?: { label: string; href: string }[];
}

export const CALCULATORS: Calculator[] = [
  {
    slug: "payment",
    title: "Mortgage Payment Calculator",
    nav: "Monthly payment",
    description:
      "Estimate your full monthly mortgage payment — principal, interest, taxes, insurance, PMI and HOA — for conventional and FHA loans.",
    answers: "What will my monthly payment actually be?",
    highlights: [
      "Conventional and FHA, side by side",
      "Principal & interest, taxes, insurance, PMI and HOA broken out",
      "Share a link to the exact scenario you ran",
    ],
    keywords: ["payment", "pmi", "escrow", "property tax", "homeowners insurance"],
    seeAlso: [
      { label: "FHA Loans", href: "/fha-loans/" },
      { label: "Down Payment Assistance", href: "/down-payment-assistance/" },
    ],
  },
  {
    slug: "va-loan",
    title: "VA Loan Calculator",
    nav: "VA loan",
    description:
      "Estimate a $0-down VA loan payment with the VA funding fee built in, including exempt and subsequent-use scenarios.",
    answers: "What does a $0-down VA payment look like?",
    highlights: [
      "Funding fee from your military status, prior VA use and disability rating",
      "Pay the funding fee upfront or roll it into the loan",
      "Full payment breakdown with the funding fee as its own line",
    ],
    keywords: ["va", "veteran", "funding fee", "irrrl", "bah"],
    seeAlso: [
      { label: "VA Loans", href: "/va-loans/" },
      { label: "VA Funding Fee Tables", href: "/va-funding-fee-tables/" },
    ],
  },
  {
    slug: "home-affordability",
    title: "Home Affordability Calculator",
    nav: "Affordability",
    description:
      "Work out the price range you can comfortably afford based on your income, debts, down payment and target payment.",
    answers: "How much home can I afford?",
    highlights: [
      "A price range built from your income, debts and down payment",
      "Housing-ratio guidance, so you see comfortable vs. stretched",
      "Cash-to-close estimate including closing costs",
    ],
    keywords: ["afford", "debt to income", "credit score", "first-time", "pre-qualif"],
    seeAlso: [
      { label: "First-Time Buyer Guides", href: "/blog/category/1st-time-buyers/" },
      { label: "Down Payment Assistance", href: "/down-payment-assistance/" },
    ],
  },
  {
    slug: "refinance",
    title: "Refinance Calculator",
    nav: "Refinance",
    description:
      "Compare your current mortgage against a new one to see the monthly savings, the closing costs, and how long it takes to break even.",
    answers: "Does refinancing actually save me money?",
    highlights: [
      "Optimize for a lower payment or for less total interest",
      "Your current loan and the new one, side by side",
      "Savings analysis, including rolling other debts in",
    ],
    keywords: ["refinance", "cash out", "irrrl", "streamline", "pay off a mortgage early"],
    seeAlso: [{ label: "VA Loans", href: "/va-loans/" }],
  },
  {
    slug: "rent-vs-buy",
    title: "Rent vs. Buy Calculator",
    nav: "Rent vs. buy",
    description:
      "See how renting compares to owning over time once you account for appreciation, tax treatment, and the money you build in equity.",
    answers: "Am I better off buying or renting?",
    highlights: [
      "The month at which buying becomes cheaper than renting",
      "Full cost breakdown — opportunity cost and tax benefits included",
      "The equity and wealth you build over your time horizon",
    ],
    keywords: ["rent", "first-time", "equity", "renting"],
    seeAlso: [{ label: "First-Time Buyer Guides", href: "/blog/category/1st-time-buyers/" }],
  },
  {
    slug: "dscr",
    title: "DSCR Loan Calculator",
    nav: "DSCR",
    description:
      "Run a rental property on its own income: calculate the debt service coverage ratio, the qualifying payment, and the cash flow — no personal income needed.",
    answers: "Does this rental qualify on its own rent?",
    highlights: [
      "DSCR ratio, cap rate, cash-on-cash return and monthly cash flow",
      "Break-even rent and max purchase price at 1.0 and 1.25 DSCR",
      "Five-year projection, for a purchase or a refinance",
    ],
    keywords: ["dscr", "rental", "investment", "cash flow", "multifamily"],
    seeAlso: [{ label: "Real Estate Investor Loans", href: "/investment-property-loans/" }],
  },
  {
    slug: "seller-net-proceeds",
    title: "Seller Net Proceeds Calculator",
    nav: "Seller net proceeds",
    description:
      "Estimate what a seller actually walks away with after the payoff, commissions, closing costs and prorations.",
    answers: "What do I net when I sell?",
    highlights: [
      "Net proceeds after payoff, commission, transfer tax and closing costs",
      "Home prep, repairs, moving costs and capital gains",
      "Price scenarios, so you can see what a higher or lower sale does",
    ],
    keywords: ["seller", "closing costs", "commission", "short sale", "selling"],
    seeAlso: [{ label: "Guides for Real Estate Pros", href: "/blog/category/real-estate-professionals/" }],
  },
];

export const CALCULATOR_SLUGS: CalculatorSlug[] = CALCULATORS.map((c) => c.slug);

/** Base path for the calculator hub. Also a legacy 301 destination — never change it. */
export const CALCULATORS_ROOT = "/mortgage-calculators";

export function calculatorPath(slug: string): string {
  return `${CALCULATORS_ROOT}/${slug}/`;
}

export function getCalculator(slug: string): Calculator | undefined {
  return CALCULATORS.find((c) => c.slug === slug);
}

/** Look up several calculators by slug, preserving the requested order. */
export function getCalculators(slugs: string[]): Calculator[] {
  return slugs
    .map((s) => getCalculator(s))
    .filter((c): c is Calculator => c !== undefined);
}

/** Every calculator path — fed into the build manifest and the sitemap. */
export const CALCULATOR_PATHS = CALCULATORS.map((c) => calculatorPath(c.slug));
