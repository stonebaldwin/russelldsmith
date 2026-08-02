/** Global site configuration + brand + compliance placeholders. */

export const SITE = {
  name: "Russell D Smith",
  shortName: "RDS",
  url: "https://russelldsmith.com",
  tagline: "Mortgage guidance you can trust.",
  description:
    "Clear, trustworthy mortgage guidance from Russell D Smith — VA, USDA, FHA, first-time buyer, construction, jumbo, and investment property loans.",
  locale: "en_US",
} as const;

export const AUTHOR = {
  name: "Russell D Smith",
  role: "Mortgage Loan Officer",
  // No photo asset yet — the byline renders a monogram avatar when this is null.
  photo: null as string | null,
  bio: "Russell D Smith is a mortgage loan officer who has spent years helping buyers across the Carolinas navigate VA, USDA, FHA, and conventional financing.",
} as const;

/** Primary call-to-action used in the header and CTA blocks. */
export const CTA = {
  label: "Get pre-qualified",
  href: "/contact/",
} as const;

/**
 * Mortgage compliance placeholders for Russell to fill in (see CLAUDE.md).
 * These render verbatim in the footer until replaced.
 */
export const COMPLIANCE = {
  nmlsId: "{{NMLS_ID}}",
  company: "{{COMPANY}}",
  companyNmls: "{{COMPANY_NMLS}}",
  licensedStates: "{{LICENSED_STATES}}",
  equalHousing: "Equal Housing Lender",
  disclaimer:
    "This is not a commitment to lend. All loans are subject to credit approval, income verification, and property appraisal. Rates, terms, and programs are subject to change without notice. Information is for educational purposes and should not be relied upon as financial or legal advice.",
  privacy:
    "We respect your privacy. Personal information submitted through this site is used only to respond to your inquiry and is never sold.",
} as const;
