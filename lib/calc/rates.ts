/**
 * Every rate, fee schedule and default assumption the calculators use, in one
 * reviewable place.
 *
 * COMPLIANCE: this file is the single thing to re-check when guidelines change.
 * Russell should review it against VA.gov / HUD / current MI card rates at least
 * annually — the date on each block says what it reflects. Everything here is a
 * *default* for an input the visitor can edit, never a hard-coded answer, and
 * every calculator labels its output as an estimate.
 */

/* ------------------------------------------------------------------ */
/* VA funding fee — schedule effective April 7, 2023 (unchanged since). */
/* Mirrors the published table in components/VAFundingFeeTable.tsx.     */
/* ------------------------------------------------------------------ */
export const VA_FUNDING_FEE = {
  /** Purchase / construction, as a % of the base loan amount, by down payment. */
  purchase: [
    { minDownPct: 10, firstUse: 1.25, subsequentUse: 1.25 },
    { minDownPct: 5, firstUse: 1.5, subsequentUse: 1.5 },
    { minDownPct: 0, firstUse: 2.15, subsequentUse: 3.3 },
  ],
  cashOutFirstUse: 2.15,
  cashOutSubsequentUse: 3.3,
  irrrl: 0.5,
} as const;

/**
 * VA funding fee as a % of the base loan. Veterans receiving compensation for a
 * service-connected disability (and certain surviving spouses / Purple Heart
 * recipients) are exempt.
 */
export function vaFundingFeePct({
  downPct,
  firstUse,
  exempt,
}: {
  downPct: number;
  firstUse: boolean;
  exempt: boolean;
}): number {
  if (exempt) return 0;
  const band = VA_FUNDING_FEE.purchase.find((b) => downPct >= b.minDownPct);
  if (!band) return 0;
  return firstUse ? band.firstUse : band.subsequentUse;
}

/* ------------------------------------------------------------------ */
/* FHA mortgage insurance — schedule effective March 20, 2023.          */
/* Terms > 15 years, base loan at or below the standard limit.          */
/* ------------------------------------------------------------------ */
export const FHA_MIP = {
  /** Upfront MIP, % of base loan. Normally financed into the loan. */
  upfrontPct: 1.75,
  /**
   * Annual MIP, % of loan balance, by loan-to-value at origination. The 2023
   * reduction put everything at or below 95% LTV at the same 0.50%.
   */
  annual: [
    { maxLtv: 95, pct: 0.5 },
    { maxLtv: 100, pct: 0.55 },
  ],
  /**
   * Annual MIP runs 11 years when LTV at origination is 90% or less, and for the
   * life of the loan above that.
   */
  yearsIfLtvAtOrBelow90: 11,
} as const;

export function fhaAnnualMipPct(ltv: number): number {
  const band = FHA_MIP.annual.find((b) => ltv <= b.maxLtv);
  return band ? band.pct : FHA_MIP.annual[FHA_MIP.annual.length - 1].pct;
}

/* ------------------------------------------------------------------ */
/* Conventional PMI — typical borrower-paid monthly MI, ~740 FICO, 2026. */
/* Real pricing varies a lot by credit score, coverage and MI company,   */
/* so this only seeds an editable field.                                 */
/* ------------------------------------------------------------------ */
export const CONVENTIONAL_PMI = {
  /** Annual premium, % of loan balance, by loan-to-value. */
  bands: [
    { maxLtv: 80, pct: 0 },
    { maxLtv: 85, pct: 0.32 },
    { maxLtv: 90, pct: 0.52 },
    { maxLtv: 95, pct: 0.62 },
    { maxLtv: 100, pct: 0.75 },
  ],
  /**
   * Borrowers can request PMI cancellation at 80% LTV, and the servicer must
   * terminate it automatically at 78% of the original value.
   */
  autoTerminationLtv: 78,
} as const;

export function conventionalPmiPct(ltv: number): number {
  const band = CONVENTIONAL_PMI.bands.find((b) => ltv <= b.maxLtv);
  return band ? band.pct : CONVENTIONAL_PMI.bands[CONVENTIONAL_PMI.bands.length - 1].pct;
}

/* ------------------------------------------------------------------ */
/* Starting assumptions — every one of these is an editable input.      */
/*                                                                     */
/* Deliberately NOT `as const`: these seed mutable calculator state, so */
/* they need to widen to `number` rather than pin to a literal type.    */
/* ------------------------------------------------------------------ */
export const DEFAULTS = {
  /** Sample scenario, so a first-time visitor sees a working calculator. */
  homePrice: 450_000,
  downPct: 20,
  rate: 6.5,
  termYears: 30,

  /** Annual property tax as a % of value — a mid-range NC/SC figure. */
  propertyTaxPct: 1.1,
  /** Annual homeowners insurance, in dollars. */
  insuranceAnnual: 1_800,
  hoaMonthly: 0,

  /** Buyer closing costs as a % of price (excludes the down payment). */
  closingCostPct: 1.5,

  /* Affordability */
  annualIncome: 100_000,
  monthlyDebts: 500,
  /** Front-end (housing) ratio — the share of gross income going to housing. */
  housingRatioPct: 28,
  /** Back-end ratio — housing plus all other monthly debt. */
  totalDebtRatioPct: 43,

  /* Rental / DSCR */
  units: 2,
  monthlyRentPerUnit: 2_000,
  investorDownPct: 25,
  investorRate: 7.5,
  vacancyPct: 5,
  managementPct: 8,
  /** Annual repairs & capex as a % of property value. */
  repairsPct: 1,
  /** Annual insurance on a small rental, in dollars. */
  rentalInsuranceAnnual: 1_800,

  /* Rent vs. buy */
  monthlyRent: 2_200,
  rentGrowthPct: 3,
  rentersInsuranceMonthly: 20,
  appreciationPct: 3.5,
  /** Annual upkeep as a % of home value. */
  maintenancePct: 1,
  /** Return if the down payment were invested instead. */
  investmentReturnPct: 6,
  /** Costs of selling, as a % of the sale price. */
  sellingCostPct: 7.5,
  horizonYears: 10,

  /* Seller net proceeds */
  salePrice: 350_000,
  mortgageBalance: 200_000,
  commissionPct: 5.5,
  transferTaxPct: 0.5,
  sellerClosingCostPct: 1.5,
  concessionsPct: 0,
  homePrepCost: 2_500,
  movingCost: 2_000,

  /* Refinance */
  currentBalance: 320_000,
  currentRate: 7.5,
  monthsRemaining: 324,
  newRate: 6.25,
  refiClosingCosts: 4_500,
};
