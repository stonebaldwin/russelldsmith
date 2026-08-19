/**
 * DSCR (debt service coverage ratio) model for rental property.
 *
 * The ratio lenders underwrite to is gross scheduled rent divided by PITIA —
 * principal, interest, taxes, insurance and association dues. Vacancy,
 * management and repairs do NOT reduce the ratio (that's why a property can
 * qualify on a 1.25 DSCR and still be thin on cash flow), but they do come out
 * of cash flow, so both numbers are reported side by side.
 */
import { monthlyPayment, solveFor } from "./finance";

export interface DscrInputs {
  mode: "purchase" | "refinance";
  units: number;
  monthlyRentPerUnit: number;
  /** Purchase price, or the appraised value on a refinance. */
  propertyValue: number;
  downPct: number;
  rate: number;
  termYears: number;
  interestOnly: boolean;
  /** Annual property tax, as a % of value. */
  propertyTaxPct: number;
  /**
   * Annual insurance in dollars. Insurance prices off the structure's
   * replacement cost, not the purchase price, so it is held flat when solving
   * for a maximum price — property tax is the piece that scales with value.
   */
  insuranceAnnual: number;
  hoaMonthly: number;
  /** Lost rent, as a % of gross scheduled rent. */
  vacancyPct: number;
  /** Property management, as a % of collected rent (gross less vacancy). */
  managementPct: number;
  /** Annual repairs & capex, as a % of property value. */
  repairsPct: number;
  /** Closing costs as a % of value — part of cash invested. */
  closingCostPct: number;
}

export interface DscrResult {
  grossRent: number;
  loanAmount: number;
  ltv: number;

  principalAndInterest: number;
  propertyTax: number;
  insurance: number;
  hoa: number;
  /** Principal, interest, taxes, insurance, association dues — the DSCR denominator. */
  pitia: number;

  vacancy: number;
  management: number;
  repairs: number;
  /** Everything that isn't debt service. */
  operatingExpenses: number;
  /** Rent less operating expenses (before debt service). */
  noiMonthly: number;

  dscr: number;
  capRatePct: number;
  monthlyCashFlow: number;
  cashInvested: number;
  cashOnCashPct: number;

  /** Rent per unit needed to hit a given DSCR. */
  breakEvenRentPerUnit: (targetDscr: number) => number;
  /** Highest price at which this rent still hits a given DSCR. */
  maxValueForDscr: (targetDscr: number) => number;

  qualification: "Doesn't qualify" | "Marginal" | "Qualifies" | "Strong";
}

/** Most DSCR programs want 1.0 at a minimum and price best at 1.25 and up. */
export const DSCR_THRESHOLDS = { minimum: 1.0, preferred: 1.25, strong: 1.5 } as const;

function classify(dscr: number): DscrResult["qualification"] {
  if (dscr < DSCR_THRESHOLDS.minimum) return "Doesn't qualify";
  if (dscr < DSCR_THRESHOLDS.preferred) return "Marginal";
  if (dscr < DSCR_THRESHOLDS.strong) return "Qualifies";
  return "Strong";
}

export function computeDscr(input: DscrInputs): DscrResult {
  const value = Math.max(0, input.propertyValue);
  const units = Math.max(1, Math.round(input.units));
  const grossRent = units * Math.max(0, input.monthlyRentPerUnit);

  const loanAmount = value * (1 - input.downPct / 100);
  const ltv = value > 0 ? (loanAmount / value) * 100 : 0;

  const debtService = (loan: number) =>
    input.interestOnly
      ? (loan * input.rate) / 100 / 12
      : monthlyPayment(loan, input.rate, input.termYears);

  const principalAndInterest = debtService(loanAmount);
  const propertyTax = ((input.propertyTaxPct / 100) * value) / 12;
  const insurance = Math.max(0, input.insuranceAnnual) / 12;
  const hoa = Math.max(0, input.hoaMonthly);
  const pitia = principalAndInterest + propertyTax + insurance + hoa;

  const vacancy = grossRent * (input.vacancyPct / 100);
  const management = (grossRent - vacancy) * (input.managementPct / 100);
  const repairs = ((input.repairsPct / 100) * value) / 12;
  const operatingExpenses = propertyTax + insurance + hoa + vacancy + management + repairs;
  const noiMonthly = grossRent - operatingExpenses;

  const dscr = pitia > 0 ? grossRent / pitia : 0;
  const monthlyCashFlow = noiMonthly - principalAndInterest;
  const cashInvested = value * (input.downPct / 100 + input.closingCostPct / 100);
  const cashOnCashPct = cashInvested > 0 ? ((monthlyCashFlow * 12) / cashInvested) * 100 : 0;

  /** PITIA at an arbitrary value, holding the percentage assumptions fixed. */
  const pitiaAtValue = (v: number) => {
    const loan = v * (1 - input.downPct / 100);
    return (
      debtService(loan) + ((input.propertyTaxPct / 100) * v) / 12 + insurance + hoa
    );
  };

  return {
    grossRent,
    loanAmount,
    ltv,
    principalAndInterest,
    propertyTax,
    insurance,
    hoa,
    pitia,
    vacancy,
    management,
    repairs,
    operatingExpenses,
    noiMonthly,
    dscr,
    capRatePct: value > 0 ? ((noiMonthly * 12) / value) * 100 : 0,
    monthlyCashFlow,
    cashInvested,
    cashOnCashPct,
    breakEvenRentPerUnit: (target) => (pitia * target) / units,
    // PITIA grows with value, so bisect for the value whose PITIA equals the
    // rent the target ratio allows.
    maxValueForDscr: (target) =>
      target > 0 ? solveFor(pitiaAtValue, grossRent / target, 0, 50_000_000) : 0,
    qualification: classify(dscr),
  };
}

export interface DscrProjectionRow {
  year: number;
  grossRent: number;
  operatingExpenses: number;
  debtService: number;
  cashFlow: number;
  propertyValue: number;
  loanBalance: number;
  equity: number;
}

/** Five-year (or N-year) outlook with rent, expense and value growth applied. */
export function projectDscr(
  input: DscrInputs,
  { years = 5, rentGrowthPct = 3, expenseGrowthPct = 3, appreciationPct = 3 } = {},
): DscrProjectionRow[] {
  const base = computeDscr(input);
  const rows: DscrProjectionRow[] = [];
  const r = input.rate / 100 / 12;

  let balance = base.loanAmount;
  for (let y = 1; y <= years; y++) {
    const rentFactor = Math.pow(1 + rentGrowthPct / 100, y - 1);
    const expenseFactor = Math.pow(1 + expenseGrowthPct / 100, y - 1);
    const grossRent = base.grossRent * 12 * rentFactor;
    // Vacancy and management scale with rent; taxes, insurance, HOA and repairs
    // with general expense inflation.
    const rentLinked = (base.vacancy + base.management) * 12 * rentFactor;
    const valueLinked =
      (base.propertyTax + base.insurance + base.hoa + base.repairs) * 12 * expenseFactor;
    const operatingExpenses = rentLinked + valueLinked;
    const debtService = base.principalAndInterest * 12;

    if (input.interestOnly) {
      // Interest-only: the balance doesn't amortize.
    } else {
      for (let m = 0; m < 12; m++) {
        const interest = balance * r;
        balance = Math.max(0, balance - Math.max(0, base.principalAndInterest - interest));
      }
    }

    const propertyValue = input.propertyValue * Math.pow(1 + appreciationPct / 100, y);
    rows.push({
      year: y,
      grossRent,
      operatingExpenses,
      debtService,
      cashFlow: grossRent - operatingExpenses - debtService,
      propertyValue,
      loanBalance: balance,
      equity: propertyValue - balance,
    });
  }
  return rows;
}
