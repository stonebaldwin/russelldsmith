/** Global site configuration + brand + Russell's real professional details. */

export const SITE = {
  name: "Russell Smith",
  shortName: "RS",
  url: "https://russelldsmith.com",
  tagline: "Mortgage guidance you can trust.",
  description:
    "Clear, trustworthy mortgage guidance from Russell Smith — VA, USDA, FHA, first-time buyer, construction, jumbo, and investment property loans across NC, SC & VA.",
  locale: "en_US",
} as const;

// Harvested from Russell's ALCOVA loan-officer page (alcova.com/loan-officer/rsmith).
export const AUTHOR = {
  name: "Russell Smith",
  role: "Branch Partner, ALCOVA Mortgage",
  tagline: "The Mortgage Strategist",
  nmls: "78989",
  servingArea: "NC, SC & VA",
  photo: "/media/site/russell-smith.png",
  bio: "Russell Smith is a mortgage strategist with 32 years in the business, serving buyers across North Carolina, South Carolina, and Virginia. Guided by faith and grounded in family, he is known for building creative financing strategies — especially for unique properties, large acreage, and farmland that don't fit inside a standard lending box. To Russell, choosing a lender is about far more than numbers: it's about trust and strategy.",
} as const;

/** Russell's contact + secure application (ALCOVA HomeHub). */
export const CONTACT = {
  phone: "(910) 352-6344",
  phoneHref: "tel:+19103526344",
  email: "rsmith@alcova.com",
  emailHref: "mailto:rsmith@alcova.com",
  applyUrl: "https://apply.alcova.com/homehub/signup/rsmith@alcova.com",
} as const;

/** Primary call-to-action — starts Russell's secure application. */
export const CTA = {
  label: "Get pre-qualified",
  href: CONTACT.applyUrl,
  external: true,
} as const;

export const SOCIAL = {
  facebook: "https://www.facebook.com/RussellTheMortgageStrategist/",
  youtube: "https://www.youtube.com/@RusselltheMortgageStrategist",
} as const;

/**
 * Mortgage compliance — harvested from ALCOVA's official disclosure. Russell
 * should still give this a final compliance review before launch.
 */
export const COMPLIANCE = {
  nmlsId: "78989", // Russell Smith, individual NMLS
  company: "ALCOVA Mortgage, LLC",
  companyNmls: "40508",
  companyAddress: "308 Market Street SE, Roanoke, VA 24011",
  companyPhone: "855.462.5268",
  licensedStates:
    "AL, AR, CO, DC, FL, GA, IL, IN, KS, KY, LA, MD, MI, MO, MS, NC, NJ, OH, OK, PA, SC, TN, TX, UT, VA, WA, WV",
  stateNotices:
    "Georgia Residential Mortgage Licensee #42101. Licensed by the N.J. Department of Banking and Insurance.",
  equalHousing: "Equal Housing Lender",
  disclaimer:
    "This is not a commitment to lend. All loans are subject to credit approval, income verification, and property appraisal. Rates, terms, and programs are subject to change without notice. Information is for educational purposes and should not be relied upon as financial or legal advice.",
  privacy:
    "We respect your privacy. Personal information submitted through this site is used only to respond to your inquiry and is never sold.",
} as const;
