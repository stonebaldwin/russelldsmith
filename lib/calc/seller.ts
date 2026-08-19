/**
 * Seller net proceeds — what's actually left after the payoff and the costs of
 * selling.
 *
 * Capital gains tax is deliberately not modelled: the primary-residence
 * exclusion, basis, improvements and depreciation recapture on a former rental
 * all turn it into a return-preparation question rather than a calculator one.
 * The page says so and points sellers at their CPA.
 */

export interface SellerInputs {
  salePrice: number;
  mortgageBalance: number;
  /** Second mortgage, HELOC or lien to be paid off at closing. */
  otherLiens: number;
  /** Total agent commission, as a % of the sale price. */
  commissionPct: number;
  /** Deed / excise / transfer tax, as a % of the sale price. */
  transferTaxPct: number;
  /** Seller-side closing costs (attorney, title, recording), as a % of price. */
  closingCostPct: number;
  /** Credits toward the buyer's costs, as a % of price. */
  concessionsPct: number;
  homePrepCost: number;
  movingCost: number;
  otherCosts: number;
}

export interface SellerLine {
  label: string;
  amount: number;
  /** The % the amount came from, when it was entered as one. */
  pct?: number;
}

export interface SellerResult {
  salePrice: number;
  payoff: number;
  grossEquity: number;
  /** Commission, transfer tax, closing costs and concessions. */
  sellingCosts: number;
  sellingCostLines: SellerLine[];
  /** Prep, moving and anything else out of pocket. */
  additionalCosts: number;
  additionalCostLines: SellerLine[];
  totalCosts: number;
  netProceeds: number;
  costPctOfSale: number;
  proceedsPctOfSale: number;
}

export function computeSellerNet(input: SellerInputs): SellerResult {
  const salePrice = Math.max(0, input.salePrice);
  const pct = (p: number) => (Math.max(0, p) / 100) * salePrice;

  const sellingCostLines: SellerLine[] = [
    { label: "Agent commission", amount: pct(input.commissionPct), pct: input.commissionPct },
    { label: "Transfer tax", amount: pct(input.transferTaxPct), pct: input.transferTaxPct },
    { label: "Closing costs", amount: pct(input.closingCostPct), pct: input.closingCostPct },
    { label: "Seller concessions", amount: pct(input.concessionsPct), pct: input.concessionsPct },
  ].filter((l) => l.amount > 0);

  const additionalCostLines: SellerLine[] = [
    { label: "Home prep & repairs", amount: Math.max(0, input.homePrepCost) },
    { label: "Moving costs", amount: Math.max(0, input.movingCost) },
    { label: "Other costs", amount: Math.max(0, input.otherCosts) },
  ].filter((l) => l.amount > 0);

  const payoff = Math.max(0, input.mortgageBalance) + Math.max(0, input.otherLiens);
  const sellingCosts = sellingCostLines.reduce((sum, l) => sum + l.amount, 0);
  const additionalCosts = additionalCostLines.reduce((sum, l) => sum + l.amount, 0);
  const totalCosts = sellingCosts + additionalCosts;

  return {
    salePrice,
    payoff,
    grossEquity: salePrice - payoff,
    sellingCosts,
    sellingCostLines,
    additionalCosts,
    additionalCostLines,
    totalCosts,
    netProceeds: salePrice - payoff - totalCosts,
    costPctOfSale: salePrice > 0 ? (totalCosts / salePrice) * 100 : 0,
    proceedsPctOfSale: salePrice > 0 ? ((salePrice - payoff - totalCosts) / salePrice) * 100 : 0,
  };
}

/** The same sale at a spread of prices — what a higher or lower offer nets. */
export function sellerPriceScenarios(
  input: SellerInputs,
  deltas = [-0.05, -0.025, 0, 0.025, 0.05],
): { deltaPct: number; salePrice: number; netProceeds: number }[] {
  return deltas.map((d) => {
    const salePrice = input.salePrice * (1 + d);
    return {
      deltaPct: d * 100,
      salePrice,
      netProceeds: computeSellerNet({ ...input, salePrice }).netProceeds,
    };
  });
}
