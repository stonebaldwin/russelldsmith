/**
 * Rent vs. buy, modelled month by month.
 *
 * Method — both sides are measured the same way, as a change in net worth, so
 * neither gets a free pass:
 *
 *   cost = every dollar paid out  −  what you're holding at the end
 *
 * The buyer pays the down payment and closing costs up front, then the full
 * housing payment plus upkeep, and ends up holding the sale proceeds. The renter
 * keeps that same up-front cash invested, pays rent, and — in any month renting
 * is cheaper — invests the difference too, so both sides part with the same money
 * whenever they can. That's what makes the crossover month meaningful rather
 * than an artifact of the renter quietly spending less.
 *
 * Every assumption is an editable input, and the page lists them, because the
 * answer moves a lot with appreciation and investment return.
 */
import { monthlyPayment } from "./finance";
import { computePayment, type LoanProgram } from "./mortgage";

export interface RentVsBuyInputs {
  horizonYears: number;

  /* Renting */
  monthlyRent: number;
  rentGrowthPct: number;
  rentersInsuranceMonthly: number;

  /* Buying */
  program: Exclude<LoanProgram, "va">;
  homePrice: number;
  downPct: number;
  rate: number;
  termYears: number;
  propertyTaxPct: number;
  insuranceAnnual: number;
  hoaMonthly: number;
  /** Annual upkeep, as a % of home value. */
  maintenancePct: number;
  appreciationPct: number;
  /** Buyer's closing costs, as a % of price. */
  closingCostPct: number;
  /** Commission and costs on the eventual sale, as a % of the sale price. */
  sellingCostPct: number;

  /* Shared */
  /** Annual return on money not tied up in the house. */
  investmentReturnPct: number;
  /** Include the mortgage-interest and property-tax deduction. */
  includeTaxBenefit: boolean;
  marginalTaxRatePct: number;
  standardDeduction: number;
}

export interface RentVsBuyYear {
  year: number;
  cumulativeRentCost: number;
  cumulativeBuyCost: number;
  rentPaid: number;
  buyPaid: number;
  homeValue: number;
  loanBalance: number;
  equity: number;
  portfolioValue: number;
  taxBenefit: number;
}

export interface RentVsBuyResult {
  /** Month buying's running cost first drops below renting's. Null if it never does. */
  crossoverMonth: number | null;
  totalRentCost: number;
  totalBuyCost: number;
  /** Positive when buying costs less over the horizon. */
  buyingAdvantage: number;
  monthlyEquivalent: number;

  upfrontCash: number;
  firstMonthRent: number;
  firstMonthOwnership: number;

  finalHomeValue: number;
  finalEquity: number;
  saleProceeds: number;
  finalPortfolio: number;
  totalTaxBenefit: number;

  years: RentVsBuyYear[];
}

/** SALT deduction cap — property tax counts toward the itemized total only up to this. */
const SALT_CAP = 10_000;

export function computeRentVsBuy(input: RentVsBuyInputs): RentVsBuyResult {
  const months = Math.max(1, Math.round(input.horizonYears * 12));
  const price = Math.max(0, input.homePrice);
  const down = price * (input.downPct / 100);
  const closingCosts = price * (input.closingCostPct / 100);
  const upfrontCash = down + closingCosts;

  // The buyer's loan and payment come from the same model the payment
  // calculator uses, so PMI, MIP and the funding-fee rules stay consistent.
  const payment = computePayment({
    program: input.program,
    homePrice: price,
    downPayment: down,
    rate: input.rate,
    termYears: input.termYears,
    propertyTaxPct: input.propertyTaxPct,
    insuranceAnnual: input.insuranceAnnual,
    hoaMonthly: input.hoaMonthly,
  });

  const loanRateMonthly = input.rate / 100 / 12;
  const piPayment = monthlyPayment(payment.loanAmount, input.rate, input.termYears);
  const investMonthly = Math.pow(1 + input.investmentReturnPct / 100, 1 / 12) - 1;
  const appreciateMonthly = Math.pow(1 + input.appreciationPct / 100, 1 / 12) - 1;

  let balance = payment.loanAmount;
  let homeValue = price;
  let portfolio = upfrontCash; // the renter keeps the buyer's up-front cash invested
  let rent = input.monthlyRent;

  let rentPaidCum = 0;
  let buyPaidCum = upfrontCash;
  let taxBenefitCum = 0;
  let crossoverMonth: number | null = null;

  // Tax deduction is assessed per calendar year, so accumulate within a year.
  let yearInterest = 0;
  let yearPropertyTax = 0;

  const years: RentVsBuyYear[] = [];
  let yearRentPaid = 0;
  let yearBuyPaid = 0;
  let yearTaxBenefit = 0;

  for (let m = 1; m <= months; m++) {
    /* --- buying --- */
    const interest = balance * loanRateMonthly;
    const principal = Math.min(Math.max(0, piPayment - interest), balance);
    balance = Math.max(0, balance - principal);

    const propertyTax = ((input.propertyTaxPct / 100) * homeValue) / 12;
    const insurance = payment.insurance;
    const maintenance = ((input.maintenancePct / 100) * homeValue) / 12;
    const mi =
      payment.miEndsMonth !== null && m > payment.miEndsMonth ? 0 : payment.mortgageInsurance;
    const ownershipCost =
      interest + principal + propertyTax + insurance + maintenance + mi + input.hoaMonthly;

    yearInterest += interest;
    yearPropertyTax += propertyTax;

    /* --- renting --- */
    const rentCost = rent + input.rentersInsuranceMonthly;
    // When owning costs more, the renter banks the difference — otherwise both
    // sides are paying out the same amount and there's nothing left to invest.
    const rentSurplus = Math.max(0, ownershipCost - rentCost);
    portfolio = portfolio * (1 + investMonthly) + rentSurplus;

    rentPaidCum += rentCost + rentSurplus;
    buyPaidCum += ownershipCost;
    yearRentPaid += rentCost + rentSurplus;
    yearBuyPaid += ownershipCost;

    homeValue = homeValue * (1 + appreciateMonthly);

    // The deduction lands at year end. Accrue it before the running comparison
    // below, so the crossover month and the headline totals use the same ledger.
    const yearEnd = m % 12 === 0;
    if (yearEnd && input.includeTaxBenefit) {
      const itemizable = yearInterest + Math.min(yearPropertyTax, SALT_CAP);
      const excess = Math.max(0, itemizable - input.standardDeduction);
      yearTaxBenefit = excess * (input.marginalTaxRatePct / 100);
      taxBenefitCum += yearTaxBenefit;
    }

    /* --- running net cost of each path, if you stopped here --- */
    const saleProceeds = homeValue * (1 - input.sellingCostPct / 100) - balance;
    const buyCostSoFar = buyPaidCum - taxBenefitCum - saleProceeds;
    // upfrontCash is on both sides of the ledger: the buyer paid it out (it's
    // already in buyPaidCum), the renter still holds it inside `portfolio`, so
    // only the portfolio's growth counts as a credit against rent paid.
    const rentCostSoFar = upfrontCash + rentPaidCum - portfolio;
    if (crossoverMonth === null && buyCostSoFar < rentCostSoFar) crossoverMonth = m;

    if (yearEnd) {
      years.push({
        year: m / 12,
        cumulativeRentCost: rentCostSoFar,
        cumulativeBuyCost: buyCostSoFar,
        rentPaid: yearRentPaid,
        buyPaid: yearBuyPaid,
        homeValue,
        loanBalance: balance,
        equity: homeValue - balance,
        portfolioValue: portfolio,
        taxBenefit: yearTaxBenefit,
      });
      yearInterest = 0;
      yearPropertyTax = 0;
      yearRentPaid = 0;
      yearBuyPaid = 0;
      yearTaxBenefit = 0;
      rent = rent * (1 + input.rentGrowthPct / 100);
    }
  }

  const saleProceeds = homeValue * (1 - input.sellingCostPct / 100) - balance;
  const totalBuyCost = buyPaidCum - taxBenefitCum - saleProceeds;
  const totalRentCost = upfrontCash + rentPaidCum - portfolio;

  return {
    crossoverMonth,
    totalRentCost,
    totalBuyCost,
    buyingAdvantage: totalRentCost - totalBuyCost,
    monthlyEquivalent: (totalRentCost - totalBuyCost) / months,
    upfrontCash,
    firstMonthRent: input.monthlyRent + input.rentersInsuranceMonthly,
    firstMonthOwnership:
      payment.total + ((input.maintenancePct / 100) * price) / 12,
    finalHomeValue: homeValue,
    finalEquity: homeValue - balance,
    saleProceeds,
    finalPortfolio: portfolio,
    totalTaxBenefit: taxBenefitCum,
    years,
  };
}
