/**
 * Core mortgage math. Pure functions, no React — so the numbers can be reasoned
 * about (and checked) independently of the UI that renders them.
 *
 * Convention: rates are whole percents (6.5 means 6.5%), amounts are dollars,
 * terms are years, and anything called `monthly` is a per-month dollar figure.
 */

/** Monthly principal & interest on a fully amortizing loan. */
export function monthlyPayment(principal: number, annualRatePct: number, years: number): number {
  const n = Math.round(years * 12);
  if (principal <= 0 || n <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / n;
  const factor = Math.pow(1 + r, n);
  return (principal * r * factor) / (factor - 1);
}

/** Balance left after `monthsPaid` payments of a loan's regular payment. */
export function remainingBalance(
  principal: number,
  annualRatePct: number,
  years: number,
  monthsPaid: number,
): number {
  const n = Math.round(years * 12);
  const k = Math.min(Math.max(0, Math.round(monthsPaid)), n);
  if (principal <= 0 || n <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const pmt = monthlyPayment(principal, annualRatePct, years);
  if (r === 0) return Math.max(0, principal - pmt * k);
  const factor = Math.pow(1 + r, k);
  return Math.max(0, principal * factor - pmt * ((factor - 1) / r));
}

/** Total interest paid over the full term. */
export function totalInterest(principal: number, annualRatePct: number, years: number): number {
  const n = Math.round(years * 12);
  return Math.max(0, monthlyPayment(principal, annualRatePct, years) * n - principal);
}

/**
 * Interest paid over the first `months` payments — used to compare a refinance
 * against the loan someone already has, and for the mortgage-interest deduction.
 */
export function interestOverMonths(
  principal: number,
  annualRatePct: number,
  years: number,
  months: number,
): number {
  const n = Math.round(years * 12);
  const k = Math.min(Math.max(0, Math.round(months)), n);
  const pmt = monthlyPayment(principal, annualRatePct, years);
  const paid = pmt * k;
  const principalPaid = principal - remainingBalance(principal, annualRatePct, years, k);
  return Math.max(0, paid - principalPaid);
}

/**
 * The payment on a loan whose remaining term is `monthsRemaining` — i.e. what
 * someone is paying today, mid-way through an older mortgage.
 */
export function paymentForRemainingTerm(
  balance: number,
  annualRatePct: number,
  monthsRemaining: number,
): number {
  return monthlyPayment(balance, annualRatePct, monthsRemaining / 12);
}

export interface YearRow {
  year: number;
  interest: number;
  principal: number;
  /** Balance at the end of the year. */
  balance: number;
}

/** Year-by-year interest / principal / balance for the first `years` years. */
export function yearlySchedule(
  principal: number,
  annualRatePct: number,
  termYears: number,
  years: number,
): YearRow[] {
  const rows: YearRow[] = [];
  let balance = principal;
  const r = annualRatePct / 100 / 12;
  const pmt = monthlyPayment(principal, annualRatePct, termYears);
  const totalMonths = Math.round(termYears * 12);
  let month = 0;

  for (let y = 1; y <= Math.ceil(years); y++) {
    let interest = 0;
    let principalPaid = 0;
    for (let m = 0; m < 12 && month < totalMonths; m++, month++) {
      const monthInterest = balance * r;
      const monthPrincipal = Math.min(pmt - monthInterest, balance);
      interest += monthInterest;
      principalPaid += monthPrincipal;
      balance = Math.max(0, balance - monthPrincipal);
    }
    rows.push({ year: y, interest, principal: principalPaid, balance });
  }
  return rows;
}

/**
 * The month a loan's balance first falls to `targetLtv`% of the original value —
 * i.e. when PMI comes off. Returns null if it never does within the term.
 */
export function monthReachingLtv(
  principal: number,
  originalValue: number,
  annualRatePct: number,
  termYears: number,
  targetLtv: number,
): number | null {
  if (originalValue <= 0 || principal <= 0) return null;
  const target = (targetLtv / 100) * originalValue;
  if (principal <= target) return 0;
  const n = Math.round(termYears * 12);
  for (let k = 1; k <= n; k++) {
    if (remainingBalance(principal, annualRatePct, termYears, k) <= target) return k;
  }
  return null;
}

/**
 * Smallest input in [lo, hi] where `f` crosses `target`, by bisection. Used to
 * invert the payment formula — "what price gives this payment", "what price
 * gives a 1.25 DSCR" — where a closed form would have to ignore the fact that
 * taxes, insurance and mortgage insurance all move with the price.
 *
 * Assumes `f` is non-decreasing over the range.
 */
export function solveFor(
  f: (x: number) => number,
  target: number,
  lo = 0,
  hi = 10_000_000,
  iterations = 60,
): number {
  let low = lo;
  let high = hi;
  for (let i = 0; i < iterations; i++) {
    const mid = (low + high) / 2;
    if (f(mid) > target) high = mid;
    else low = mid;
  }
  return (low + high) / 2;
}

/** Months → "6 years, 7 months". */
export function formatMonths(months: number): string {
  const m = Math.max(0, Math.round(months));
  const years = Math.floor(m / 12);
  const rem = m % 12;
  const parts: string[] = [];
  if (years) parts.push(`${years} year${years === 1 ? "" : "s"}`);
  if (rem || !years) parts.push(`${rem} month${rem === 1 ? "" : "s"}`);
  return parts.join(", ");
}
