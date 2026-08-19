/**
 * Russell's RebelIQ calculator suite — the single source of truth for
 * /mortgage-calculators/ and its child pages.
 *
 * Each calculator is a hosted, ALCOVA-branded RebelIQ app (Russell's own
 * account) embedded in an iframe. They are NOT re-implemented here: they carry
 * Russell's NMLS, contact details and compliance language, and they are the
 * lead-capture surface he wants people landing on.
 *
 * EMBEDDING (verified 2026-08-19): these do NOT work in a cross-origin iframe.
 * The document loads and the SSR HTML contains the whole calculator, but the
 * frame paints blank — on an http parent and on an https one alike. The same URL
 * framed same-origin (from app.rebeliq.ai itself) renders perfectly, so it isn't
 * framing per se; it's the third-party context (RebelIQ's client wipes the page
 * when its storage/session access is partitioned). Nothing on our side fixes
 * that, so each calculator opens in a new tab — see components/CalculatorPanel.
 *
 * `embedHeights` is kept for the day RebelIQ ships an embeddable mode: three
 * measured content heights at iframe widths of 390 / 768 / 1120 px with ~5%
 * headroom, which the `.calc-embed` CSS in app/globals.css interpolates between.
 * Flipping EMBED in CalculatorPanel turns inline embedding back on site-wide.
 */

export interface Calculator {
  /** URL segment under /mortgage-calculators/ */
  slug: string;
  /** H1 + card title */
  title: string;
  /** short label for pills / nav / cards */
  nav: string;
  /** meta description + hero dek */
  description: string;
  /** one-line "what it answers", shown on the hub cards */
  answers: string;
  /** the hosted RebelIQ calculator */
  url: string;
  /**
   * Measured content heights in px at iframe widths 390 / 768 / 1120.
   * Order: [narrow, mid, wide].
   */
  embedHeights: [number, number, number];
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
    url: "https://app.rebeliq.ai/calc/russell-smith-alcova-85ykp",
    embedHeights: [3670, 3110, 2280],
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
    url: "https://app.rebeliq.ai/calc/russel-smith-alcova-va-calc-v8emt",
    embedHeights: [3990, 3360, 2350],
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
    url: "https://app.rebeliq.ai/calc/russell-smith-alcova-home-affordability-idyrj",
    embedHeights: [4090, 3620, 2600],
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
    url: "https://app.rebeliq.ai/calc/russell-smith-alcova-refinance-emsa7",
    embedHeights: [3770, 3450, 2610],
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
    url: "https://app.rebeliq.ai/calc/russell-smith-alcova-rvb-hyuik",
    embedHeights: [4570, 3870, 3240],
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
    url: "https://app.rebeliq.ai/calc/russell-smith-alcova-dscr-3575i",
    embedHeights: [4490, 3910, 2920],
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
    url: "https://app.rebeliq.ai/calc/russell-smith-alcova-seller-net-proceeds-go50w",
    embedHeights: [3470, 3230, 2430],
    highlights: [
      "Net proceeds after payoff, commission, transfer tax and closing costs",
      "Home prep, repairs, moving costs and capital gains",
      "Price scenarios, so you can see what a higher or lower sale does",
    ],
    keywords: ["seller", "closing costs", "commission", "short sale", "selling"],
    seeAlso: [{ label: "Guides for Real Estate Pros", href: "/blog/category/real-estate-professionals/" }],
  },
];

export const CALCULATOR_SLUGS = CALCULATORS.map((c) => c.slug);

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
