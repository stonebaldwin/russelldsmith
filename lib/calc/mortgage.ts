/**
 * The monthly-payment model shared by the payment, VA, and affordability
 * calculators: one place that knows how a price, a down payment and a program
 * turn into a full PITI + mortgage-insurance payment.
 */
import {
  monthlyPayment,
  monthReachingLtv,
  solveFor,
  totalInterest as loanTotalInterest,
} from "./finance";
import {
  CONVENTIONAL_PMI,
  FHA_MIP,
  conventionalPmiPct,
  fhaAnnualMipPct,
  vaFundingFeePct,
} from "./rates";

export type LoanProgram = "conventional" | "fha" | "va";

export interface PaymentInputs {
  program: LoanProgram;
  homePrice: number;
  /** Dollars down. The UI keeps a % in sync with this. */
  downPayment: number;
  rate: number;
  termYears: number;
  /** Annual property tax, as a % of the price. */
  propertyTaxPct: number;
  /**
   * Annual homeowners insurance in dollars. Kept in dollars (rather than a % of
   * price) because it prices off the structure's replacement cost — which is why
   * it stays flat while property tax scales with price in the affordability solve.
   */
  insuranceAnnual: number;
  hoaMonthly: number;
  /**
   * Conventional annual PMI %. Left undefined, it's estimated from LTV — the UI
   * seeds the field from that estimate and lets the visitor override it.
   */
  pmiPct?: number;
  /** VA-only options. */
  firstUse?: boolean;
  vaExempt?: boolean;
  /** Roll the VA funding fee / FHA upfront MIP into the loan (the norm). */
  financeUpfrontFee?: boolean;
}

export interface PaymentResult {
  /** Price less down payment, before any financed upfront fee. */
  baseLoan: number;
  ltv: number;
  /** VA funding fee or FHA upfront MIP, in dollars. */
  upfrontFee: number;
  upfrontFeePct: number;
  upfrontFeeLabel: string | null;
  /** Upfront fee rolled into the loan (0 when paid in cash). */
  financedFee: number;
  loanAmount: number;

  principalAndInterest: number;
  propertyTax: number;
  insurance: number;
  mortgageInsurance: number;
  /** "PMI", "MIP", or null when the program has none. */
  mortgageInsuranceLabel: string | null;
  hoa: number;
  total: number;

  /** Month the monthly mortgage insurance drops off, if it ever does. */
  miEndsMonth: number | null;
  miNote: string | null;

  totalInterest: number;
  /** Down payment plus any upfront fee paid in cash. */
  cashDue: number;
}

export function computePayment(input: PaymentInputs): PaymentResult {
  const price = Math.max(0, input.homePrice);
  const down = Math.min(Math.max(0, input.downPayment), price);
  const baseLoan = Math.max(0, price - down);
  const ltv = price > 0 ? (baseLoan / price) * 100 : 0;
  const downPct = price > 0 ? (down / price) * 100 : 0;

  let upfrontFeePct = 0;
  let upfrontFeeLabel: string | null = null;
  if (input.program === "va") {
    upfrontFeePct = vaFundingFeePct({
      downPct,
      firstUse: input.firstUse ?? true,
      exempt: input.vaExempt ?? false,
    });
    upfrontFeeLabel = "VA funding fee";
  } else if (input.program === "fha") {
    upfrontFeePct = FHA_MIP.upfrontPct;
    upfrontFeeLabel = "Upfront MIP";
  }
  const upfrontFee = (upfrontFeePct / 100) * baseLoan;
  const financeFee = input.financeUpfrontFee ?? true;
  const financedFee = financeFee ? upfrontFee : 0;
  const loanAmount = baseLoan + financedFee;

  const principalAndInterest = monthlyPayment(loanAmount, input.rate, input.termYears);
  const propertyTax = ((input.propertyTaxPct / 100) * price) / 12;
  const insurance = Math.max(0, input.insuranceAnnual) / 12;

  let mortgageInsurance = 0;
  let mortgageInsuranceLabel: string | null = null;
  let miEndsMonth: number | null = null;
  let miNote: string | null = null;

  if (input.program === "conventional") {
    const pmiPct = input.pmiPct ?? conventionalPmiPct(ltv);
    mortgageInsurance = ((pmiPct / 100) * loanAmount) / 12;
    if (mortgageInsurance > 0) {
      mortgageInsuranceLabel = "PMI";
      miEndsMonth = monthReachingLtv(
        loanAmount,
        price,
        input.rate,
        input.termYears,
        CONVENTIONAL_PMI.autoTerminationLtv,
      );
      miNote = `PMI comes off automatically at ${CONVENTIONAL_PMI.autoTerminationLtv}% loan-to-value — you can ask for it at 80%.`;
    }
  } else if (input.program === "fha") {
    // Annual MIP is quoted against the base LTV, then charged on the balance.
    // Like most payment calculators this holds the premium at its year-one level
    // rather than re-striking it each year as the balance falls.
    const annualPct = fhaAnnualMipPct(ltv);
    mortgageInsurance = ((annualPct / 100) * loanAmount) / 12;
    mortgageInsuranceLabel = "MIP";
    if (ltv <= 90) {
      miEndsMonth = FHA_MIP.yearsIfLtvAtOrBelow90 * 12;
      miNote = `With 10% or more down, FHA mortgage insurance runs ${FHA_MIP.yearsIfLtvAtOrBelow90} years.`;
    } else {
      miNote =
        "With less than 10% down, FHA mortgage insurance stays for the life of the loan — refinancing out is the usual exit.";
    }
  } else {
    miNote = "VA loans carry no monthly mortgage insurance.";
  }

  const total = principalAndInterest + propertyTax + insurance + mortgageInsurance + input.hoaMonthly;

  return {
    baseLoan,
    ltv,
    upfrontFee,
    upfrontFeePct,
    upfrontFeeLabel,
    financedFee,
    loanAmount,
    principalAndInterest,
    propertyTax,
    insurance,
    mortgageInsurance,
    mortgageInsuranceLabel,
    hoa: input.hoaMonthly,
    total,
    miEndsMonth,
    miNote,
    totalInterest: loanTotalInterest(loanAmount, input.rate, input.termYears),
    cashDue: down + (financeFee ? 0 : upfrontFee),
  };
}

/* ------------------------------------------------------------------ */
/* Affordability — the payment model, inverted.                        */
/* ------------------------------------------------------------------ */

export interface AffordabilityInputs {
  program: Exclude<LoanProgram, "va">;
  annualIncome: number;
  monthlyDebts: number;
  downPct: number;
  rate: number;
  termYears: number;
  propertyTaxPct: number;
  insuranceAnnual: number;
  hoaMonthly: number;
  /** Front-end ratio: housing payment as a share of gross monthly income. */
  housingRatioPct: number;
  /** Back-end ratio: housing plus every other monthly debt. */
  totalDebtRatioPct: number;
  closingCostPct: number;
}

export interface AffordabilityResult {
  monthlyIncome: number;
  /** The lower of the two ratio limits — the payment we solve against. */
  maxPayment: number;
  /** Which ratio is doing the limiting. */
  limitedBy: "housing ratio" | "total debt ratio";
  maxHousingPayment: number;
  maxTotalDebtPayment: number;
  maxPrice: number;
  downPayment: number;
  closingCosts: number;
  cashToClose: number;
  payment: PaymentResult;
}

export function computeAffordability(input: AffordabilityInputs): AffordabilityResult {
  const monthlyIncome = Math.max(0, input.annualIncome) / 12;
  const maxHousingPayment = monthlyIncome * (input.housingRatioPct / 100);
  const maxTotalDebtPayment = Math.max(
    0,
    monthlyIncome * (input.totalDebtRatioPct / 100) - Math.max(0, input.monthlyDebts),
  );
  const maxPayment = Math.min(maxHousingPayment, maxTotalDebtPayment);
  const limitedBy =
    maxHousingPayment <= maxTotalDebtPayment ? "housing ratio" : "total debt ratio";

  const paymentAtPrice = (price: number) =>
    computePayment({
      program: input.program,
      homePrice: price,
      downPayment: price * (input.downPct / 100),
      rate: input.rate,
      termYears: input.termYears,
      propertyTaxPct: input.propertyTaxPct,
      insuranceAnnual: input.insuranceAnnual,
      hoaMonthly: input.hoaMonthly,
    }).total;

  // Monthly payment rises monotonically with price, so bisect on price.
  const maxPrice = maxPayment > 0 ? solveFor(paymentAtPrice, maxPayment, 0, 20_000_000) : 0;
  const downPayment = maxPrice * (input.downPct / 100);
  const closingCosts = maxPrice * (input.closingCostPct / 100);

  return {
    monthlyIncome,
    maxPayment,
    limitedBy,
    maxHousingPayment,
    maxTotalDebtPayment,
    maxPrice,
    downPayment,
    closingCosts,
    cashToClose: downPayment + closingCosts,
    payment: computePayment({
      program: input.program,
      homePrice: maxPrice,
      downPayment,
      rate: input.rate,
      termYears: input.termYears,
      propertyTaxPct: input.propertyTaxPct,
      insuranceAnnual: input.insuranceAnnual,
      hoaMonthly: input.hoaMonthly,
    }),
  };
}
