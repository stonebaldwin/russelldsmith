/**
 * Refinance comparison.
 *
 * The trap in refinance math is comparing a fresh 30-year loan against a
 * mortgage that only has 22 years left: the payment always looks better because
 * the term got longer. So this reports three things rather than one — the monthly
 * change, how long the closing costs take to earn back, and the interest cost
 * over a matched window as well as over each loan's full remaining life.
 */
import {
  interestOverMonths,
  monthlyPayment,
  paymentForRemainingTerm,
  totalInterest,
} from "./finance";

export interface RefinanceInputs {
  currentBalance: number;
  currentRate: number;
  /** Payments left on the existing mortgage. */
  monthsRemaining: number;
  newRate: number;
  newTermYears: number;
  closingCosts: number;
  /** Roll the closing costs into the new loan instead of paying cash. */
  rollCostsIn: boolean;
  /** Extra cash taken out at closing. */
  cashOut: number;
}

export interface RefinanceResult {
  currentPayment: number;
  newLoanAmount: number;
  newPayment: number;
  /** Positive means the new payment is lower. */
  monthlySavings: number;

  /** Months for the monthly savings to cover the closing costs. */
  breakEvenMonths: number | null;
  cashAtClosing: number;

  /** Interest left on the current loan over its remaining term. */
  currentInterestRemaining: number;
  /** Interest on the new loan over its full term. */
  newInterestTotal: number;
  /** Interest on each loan over the same window — the honest comparison. */
  comparisonMonths: number;
  currentInterestOverWindow: number;
  newInterestOverWindow: number;
  interestSavedOverWindow: number;

  /** How much longer (or shorter) the new loan runs, in months. */
  termChangeMonths: number;
}

export function computeRefinance(input: RefinanceInputs): RefinanceResult {
  const balance = Math.max(0, input.currentBalance);
  const monthsRemaining = Math.max(1, Math.round(input.monthsRemaining));
  const currentPayment = paymentForRemainingTerm(balance, input.currentRate, monthsRemaining);

  const newLoanAmount =
    balance + Math.max(0, input.cashOut) + (input.rollCostsIn ? Math.max(0, input.closingCosts) : 0);
  const newPayment = monthlyPayment(newLoanAmount, input.newRate, input.newTermYears);
  const monthlySavings = currentPayment - newPayment;

  const newTermMonths = Math.round(input.newTermYears * 12);
  // Compare over the shorter of the two horizons, so neither loan gets credit
  // for interest the other one isn't being charged yet.
  const comparisonMonths = Math.min(monthsRemaining, newTermMonths);

  const currentInterestOverWindow = interestOverMonths(
    balance,
    input.currentRate,
    monthsRemaining / 12,
    comparisonMonths,
  );
  const newInterestOverWindow = interestOverMonths(
    newLoanAmount,
    input.newRate,
    input.newTermYears,
    comparisonMonths,
  );

  return {
    currentPayment,
    newLoanAmount,
    newPayment,
    monthlySavings,
    breakEvenMonths:
      monthlySavings > 0
        ? input.closingCosts > 0
          ? input.closingCosts / monthlySavings
          : 0
        : null,
    cashAtClosing: input.rollCostsIn ? 0 : Math.max(0, input.closingCosts),
    currentInterestRemaining: interestOverMonths(
      balance,
      input.currentRate,
      monthsRemaining / 12,
      monthsRemaining,
    ),
    newInterestTotal: totalInterest(newLoanAmount, input.newRate, input.newTermYears),
    comparisonMonths,
    currentInterestOverWindow,
    newInterestOverWindow,
    interestSavedOverWindow: currentInterestOverWindow - newInterestOverWindow,
    termChangeMonths: newTermMonths - monthsRemaining,
  };
}
