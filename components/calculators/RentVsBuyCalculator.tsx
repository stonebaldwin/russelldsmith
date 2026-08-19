"use client";

import { useMemo, useState } from "react";
import { computeRentVsBuy } from "@/lib/calc/rentVsBuy";
import { DEFAULTS } from "@/lib/calc/rates";
import { formatMonths } from "@/lib/calc/finance";
import { pct, usd, usdCompact } from "@/lib/calc/format";
import { useCalcState } from "@/lib/calc/useCalcState";
import {
  Advanced,
  CurrencyField,
  FieldGroup,
  PercentField,
  SliderField,
  ToggleField,
} from "@/components/calc/fields";
import {
  CalcShell,
  DataTable,
  ResultCard,
  ResultRow,
  StatTile,
  Tabs,
} from "@/components/calc/CalcShell";

const defaults = {
  years: DEFAULTS.horizonYears,
  rent: DEFAULTS.monthlyRent,
  rentGrowth: DEFAULTS.rentGrowthPct,
  rentersIns: DEFAULTS.rentersInsuranceMonthly,
  price: DEFAULTS.homePrice,
  downPct: DEFAULTS.downPct,
  rate: DEFAULTS.rate,
  term: DEFAULTS.termYears,
  taxPct: DEFAULTS.propertyTaxPct,
  insurance: DEFAULTS.insuranceAnnual,
  hoa: DEFAULTS.hoaMonthly,
  maintenancePct: DEFAULTS.maintenancePct,
  appreciation: DEFAULTS.appreciationPct,
  closingPct: DEFAULTS.closingCostPct,
  sellingPct: DEFAULTS.sellingCostPct,
  investReturn: DEFAULTS.investmentReturnPct,
  taxBenefit: true,
  marginalRate: 24,
  standardDeduction: 15_000,
};

export function RentVsBuyCalculator() {
  const { values: v, set, reset, shareUrl } = useCalcState(defaults);
  const [tab, setTab] = useState("costs");

  const r = useMemo(
    () =>
      computeRentVsBuy({
        horizonYears: v.years,
        monthlyRent: v.rent,
        rentGrowthPct: v.rentGrowth,
        rentersInsuranceMonthly: v.rentersIns,
        program: "conventional",
        homePrice: v.price,
        downPct: v.downPct,
        rate: v.rate,
        termYears: v.term,
        propertyTaxPct: v.taxPct,
        insuranceAnnual: v.insurance,
        hoaMonthly: v.hoa,
        maintenancePct: v.maintenancePct,
        appreciationPct: v.appreciation,
        closingCostPct: v.closingPct,
        sellingCostPct: v.sellingPct,
        investmentReturnPct: v.investReturn,
        includeTaxBenefit: v.taxBenefit,
        marginalTaxRatePct: v.marginalRate,
        standardDeduction: v.standardDeduction,
      }),
    [v],
  );

  const buyingWins = r.buyingAdvantage > 0;
  const crossover =
    r.crossoverMonth !== null && r.crossoverMonth <= v.years * 12
      ? formatMonths(r.crossoverMonth)
      : null;

  return (
    <CalcShell
      stickyLabel={buyingWins ? "Buying saves" : "Renting saves"}
      stickyValue={usd(Math.abs(r.buyingAdvantage))}
      onReset={reset}
      onShare={shareUrl}
      inputs={
        <>
          <SliderField
            label="How long you'd stay"
            value={v.years}
            onChange={(years) => set("years", years)}
            min={1}
            max={30}
            step={1}
            suffix="yrs"
            hint="The single biggest lever — buying needs time to beat the cost of getting in and out."
          />

          <FieldGroup title="Renting">
            <CurrencyField
              label="Monthly rent"
              value={v.rent}
              onChange={(rent) => set("rent", rent)}
            />
            <PercentField
              label="Rent increases (annual)"
              value={v.rentGrowth}
              onChange={(rentGrowth) => set("rentGrowth", rentGrowth)}
            />
          </FieldGroup>

          <FieldGroup title="Buying">
            <CurrencyField
              label="Home price"
              value={v.price}
              onChange={(price) => set("price", price)}
            />
            <SliderField
              label="Down payment %"
              value={v.downPct}
              onChange={(downPct) => set("downPct", downPct)}
              min={3}
              max={50}
              step={0.5}
              suffix="%"
              hint={`${usd((v.price * v.downPct) / 100)} down`}
            />
            <PercentField
              label="Interest rate"
              value={v.rate}
              onChange={(rate) => set("rate", rate)}
            />
            <PercentField
              label="Home appreciation (annual)"
              value={v.appreciation}
              onChange={(appreciation) => set("appreciation", appreciation)}
            />
            <PercentField
              label="Property tax (annual)"
              value={v.taxPct}
              onChange={(taxPct) => set("taxPct", taxPct)}
            />
            <PercentField
              label="Upkeep (annual % of value)"
              value={v.maintenancePct}
              onChange={(maintenancePct) => set("maintenancePct", maintenancePct)}
            />
          </FieldGroup>

          <Advanced>
            <CurrencyField
              label="Renters insurance (monthly)"
              value={v.rentersIns}
              onChange={(rentersIns) => set("rentersIns", rentersIns)}
            />
            <CurrencyField
              label="Home insurance (annual)"
              value={v.insurance}
              onChange={(insurance) => set("insurance", insurance)}
            />
            <CurrencyField
              label="HOA dues (monthly)"
              value={v.hoa}
              onChange={(hoa) => set("hoa", hoa)}
            />
            <PercentField
              label="Investment return (annual)"
              value={v.investReturn}
              onChange={(investReturn) => set("investReturn", investReturn)}
              hint="What the renter earns on the cash a buyer would put down."
            />
            <PercentField
              label="Buying closing costs (% of price)"
              value={v.closingPct}
              onChange={(closingPct) => set("closingPct", closingPct)}
            />
            <PercentField
              label="Selling costs (% of price)"
              value={v.sellingPct}
              onChange={(sellingPct) => set("sellingPct", sellingPct)}
              hint="Commission and seller costs when you eventually sell."
            />
            <ToggleField
              label="Include the mortgage interest & property tax deduction"
              checked={v.taxBenefit}
              onChange={(taxBenefit) => set("taxBenefit", taxBenefit)}
              hint="Only helps if itemizing beats the standard deduction. Not tax advice."
            />
            <PercentField
              label="Marginal tax rate"
              value={v.marginalRate}
              onChange={(marginalRate) => set("marginalRate", marginalRate)}
            />
            <CurrencyField
              label="Standard deduction"
              value={v.standardDeduction}
              onChange={(standardDeduction) => set("standardDeduction", standardDeduction)}
            />
          </Advanced>
        </>
      }
      result={
        <ResultCard
          label={`Over ${v.years} year${v.years === 1 ? "" : "s"}, ${
            buyingWins ? "buying costs less by" : "renting costs less by"
          }`}
          value={usd(Math.abs(r.buyingAdvantage))}
          sub={`About ${usd(Math.abs(r.monthlyEquivalent))} a month`}
          note={
            crossover
              ? `Buying pulls ahead after ${crossover}. Sell sooner than that and renting would have won.`
              : `Buying doesn't pull ahead inside ${v.years} year${
                  v.years === 1 ? "" : "s"
                } on these assumptions — try a longer stay or a different appreciation rate.`
          }
        >
          <ResultRow label="Net cost of renting" value={usd(r.totalRentCost)} />
          <ResultRow label="Net cost of buying" value={usd(r.totalBuyCost)} />
          <ResultRow label="Cash needed to buy" value={usd(r.upfrontCash)} />
          <ResultRow
            label={buyingWins ? "Buying advantage" : "Renting advantage"}
            value={usd(Math.abs(r.buyingAdvantage))}
            strong
          />
        </ResultCard>
      }
      details={
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-serif text-xl font-medium text-accent">The detail</h3>
            <Tabs
              tabs={[
                { id: "costs", label: "Cost over time" },
                { id: "equity", label: "Equity & wealth" },
                { id: "monthly", label: "Month one" },
              ]}
              active={tab}
              onChange={setTab}
            />
          </div>

          <div className="mt-4">
            {tab === "costs" ? (
              <DataTable
                head={["Year", "Buying (net)", "Renting (net)", "Difference"]}
                rows={r.years.map((y) => [
                  `Year ${y.year}`,
                  usdCompact(y.cumulativeBuyCost),
                  usdCompact(y.cumulativeRentCost),
                  <span
                    key="d"
                    className={
                      y.cumulativeRentCost - y.cumulativeBuyCost > 0
                        ? "font-semibold text-[#15803d]"
                        : "font-semibold text-[#b91c1c]"
                    }
                  >
                    {y.cumulativeRentCost - y.cumulativeBuyCost > 0 ? "buy " : "rent "}
                    {usdCompact(Math.abs(y.cumulativeRentCost - y.cumulativeBuyCost))}
                  </span>,
                ])}
              />
            ) : null}

            {tab === "equity" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatTile
                    label="Home value at sale"
                    value={usd(r.finalHomeValue)}
                    hint={`${pct(v.appreciation)} a year`}
                  />
                  <StatTile
                    label="Proceeds after selling"
                    value={usd(r.saleProceeds)}
                    hint={`Net of the payoff and ${pct(v.sellingPct)} selling costs`}
                  />
                  <StatTile
                    label="Renter's portfolio"
                    value={usd(r.finalPortfolio)}
                    hint={`Down payment invested at ${pct(v.investReturn)}`}
                  />
                </div>
                <div className="mt-4">
                  <DataTable
                    head={["Year", "Home value", "Loan balance", "Equity", "Renter portfolio"]}
                    rows={r.years.map((y) => [
                      `Year ${y.year}`,
                      usdCompact(y.homeValue),
                      usdCompact(y.loanBalance),
                      usdCompact(y.equity),
                      usdCompact(y.portfolioValue),
                    ])}
                  />
                </div>
              </>
            ) : null}

            {tab === "monthly" ? (
              <DataTable
                head={["", "Amount"]}
                rows={[
                  ["Rent plus renters insurance", usd(r.firstMonthRent)],
                  ["Owning — payment plus upkeep", usd(r.firstMonthOwnership)],
                  [
                    "Difference in month one",
                    usd(Math.abs(r.firstMonthOwnership - r.firstMonthRent)) +
                      (r.firstMonthOwnership > r.firstMonthRent
                        ? " more to own"
                        : " more to rent"),
                  ],
                  ["Cash needed up front to buy", usd(r.upfrontCash)],
                  ...(v.taxBenefit
                    ? [["Tax benefit over the whole period", usd(r.totalTaxBenefit)]]
                    : []),
                ]}
              />
            ) : null}
          </div>
        </>
      }
      footnote={
        <>
          <strong className="text-ink-soft">How this is measured:</strong> both paths are scored the
          same way — everything you pay out, less what you&rsquo;re holding at the end. The buyer
          ends with the sale proceeds; the renter keeps the down payment invested and also invests
          the difference in any month owning costs more, so neither side gets credit for simply
          spending less. Estimates only, and the answer moves a lot with appreciation and investment
          return — not tax or investment advice.
        </>
      }
    />
  );
}
