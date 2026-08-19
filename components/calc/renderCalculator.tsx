import { PaymentCalculator } from "@/components/calculators/PaymentCalculator";
import { VaLoanCalculator } from "@/components/calculators/VaLoanCalculator";
import { AffordabilityCalculator } from "@/components/calculators/AffordabilityCalculator";
import { RefinanceCalculator } from "@/components/calculators/RefinanceCalculator";
import { RentVsBuyCalculator } from "@/components/calculators/RentVsBuyCalculator";
import { DscrCalculator } from "@/components/calculators/DscrCalculator";
import { SellerNetCalculator } from "@/components/calculators/SellerNetCalculator";
import type { CalculatorSlug } from "@/lib/calculators";

/**
 * Maps a calculator slug to its component. Kept in one place so the hub page and
 * the per-calculator pages can't drift, and so a new entry in lib/calculators.ts
 * fails the type check here until its calculator exists.
 */
const CALCULATOR_COMPONENTS: Record<CalculatorSlug, () => React.ReactElement> = {
  payment: PaymentCalculator,
  "va-loan": VaLoanCalculator,
  "home-affordability": AffordabilityCalculator,
  refinance: RefinanceCalculator,
  "rent-vs-buy": RentVsBuyCalculator,
  dscr: DscrCalculator,
  "seller-net-proceeds": SellerNetCalculator,
};

export function renderCalculator(slug: string): React.ReactElement | null {
  const Component = CALCULATOR_COMPONENTS[slug as CalculatorSlug];
  return Component ? <Component /> : null;
}
