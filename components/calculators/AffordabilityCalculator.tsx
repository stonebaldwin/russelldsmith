"use client";

import Link from "next/link";
import { useMemo } from "react";
import { computeAffordability } from "@/lib/calc/mortgage";
import { DEFAULTS } from "@/lib/calc/rates";
import { pct, usd, usdCents } from "@/lib/calc/format";
import { useCalcState } from "@/lib/calc/useCalcState";
import {
  Advanced,
  CurrencyField,
  FieldGroup,
  PercentField,
  Segmented,
  SelectField,
  SliderField,
} from "@/components/calc/fields";
import {
  CalcShell,
  DataTable,
  DetailSection,
  ResultCard,
  ResultRow,
  StatTile,
} from "@/components/calc/CalcShell";

const defaults = {
  program: "conventional" as "conventional" | "fha",
  income: DEFAULTS.annualIncome,
  debts: DEFAULTS.monthlyDebts,
  downPct: DEFAULTS.downPct,
  rate: DEFAULTS.rate,
  term: DEFAULTS.termYears,
  taxPct: DEFAULTS.propertyTaxPct,
  insurance: DEFAULTS.insuranceAnnual,
  hoa: DEFAULTS.hoaMonthly,
  housingRatio: DEFAULTS.housingRatioPct,
  debtRatio: DEFAULTS.totalDebtRatioPct,
  closingPct: DEFAULTS.closingCostPct,
};

export function AffordabilityCalculator() {
  const { values: v, set, reset, shareUrl } = useCalcState(defaults);

  const result = useMemo(
    () =>
      computeAffordability({
        program: v.program,
        annualIncome: v.income,
        monthlyDebts: v.debts,
        downPct: v.downPct,
        rate: v.rate,
        termYears: v.term,
        propertyTaxPct: v.taxPct,
        insuranceAnnual: v.insurance,
        hoaMonthly: v.hoa,
        housingRatioPct: v.housingRatio,
        totalDebtRatioPct: v.debtRatio,
        closingCostPct: v.closingPct,
      }),
    [v],
  );

  const p = result.payment;
  // A "comfortable" band most people can live with, either side of the maximum.
  const comfortable = result.maxPrice * 0.85;

  return (
    <CalcShell
      stickyLabel="You could afford"
      stickyValue={usd(result.maxPrice)}
      onReset={reset}
      onShare={shareUrl}
      inputs={
        <>
          <Segmented
            label="Loan type"
            value={v.program}
            onChange={(program) => set("program", program)}
            options={[
              { value: "conventional", label: "Conventional" },
              { value: "fha", label: "FHA" },
            ]}
          />

          <FieldGroup title="Your income and debts">
            <CurrencyField
              label="Annual gross income"
              value={v.income}
              onChange={(income) => set("income", income)}
              hint={`${usd(v.income / 12)} a month before tax`}
            />
            <CurrencyField
              label="Other monthly debts"
              value={v.debts}
              onChange={(debts) => set("debts", debts)}
              hint="Car, student loan and credit card minimums — not utilities or groceries."
            />
          </FieldGroup>

          <FieldGroup title="The loan">
            <SliderField
              label="Down payment %"
              value={v.downPct}
              onChange={(downPct) => set("downPct", downPct)}
              min={v.program === "fha" ? 3.5 : 3}
              max={50}
              step={0.5}
              suffix="%"
              hint={`${usd(result.downPayment)} on a ${usd(result.maxPrice)} home`}
            />
            <PercentField
              label="Interest rate"
              value={v.rate}
              onChange={(rate) => set("rate", rate)}
            />
            <SelectField
              label="Loan term"
              value={v.term}
              onChange={(term) => set("term", term)}
              options={[
                { value: 30, label: "30 years" },
                { value: 20, label: "20 years" },
                { value: 15, label: "15 years" },
              ]}
            />
            <PercentField
              label="Property tax (annual)"
              value={v.taxPct}
              onChange={(taxPct) => set("taxPct", taxPct)}
            />
          </FieldGroup>

          <Advanced>
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
              label="Housing ratio limit"
              value={v.housingRatio}
              onChange={(housingRatio) => set("housingRatio", housingRatio)}
              hint="Housing payment as a share of gross income. 28% is the classic guide."
            />
            <PercentField
              label="Total debt ratio limit"
              value={v.debtRatio}
              onChange={(debtRatio) => set("debtRatio", debtRatio)}
              hint="Housing plus all other debt. Many programs stretch past 43% with strong credit and reserves."
            />
            <PercentField
              label="Closing costs (% of price)"
              value={v.closingPct}
              onChange={(closingPct) => set("closingPct", closingPct)}
            />
          </Advanced>
        </>
      }
      result={
        <ResultCard
          label="You could afford a home up to"
          value={usd(result.maxPrice)}
          sub={`Limited by your ${result.limitedBy} at ${pct(
            result.limitedBy === "housing ratio" ? v.housingRatio : v.debtRatio,
          )}`}
          note={`A more comfortable target is around ${usd(
            comfortable,
          )}, which leaves room for maintenance, savings and rate changes.`}
        >
          <ResultRow label="Principal & interest" value={usdCents(p.principalAndInterest)} />
          <ResultRow label="Property tax" value={usdCents(p.propertyTax)} />
          <ResultRow label="Home insurance" value={usdCents(p.insurance)} />
          {p.mortgageInsuranceLabel ? (
            <ResultRow label={p.mortgageInsuranceLabel} value={usdCents(p.mortgageInsurance)} />
          ) : null}
          {p.hoa > 0 ? <ResultRow label="HOA" value={usdCents(p.hoa)} /> : null}
          <ResultRow label="Monthly payment" value={`${usdCents(p.total)}/mo`} strong />
        </ResultCard>
      }
      details={
        <>
          <DetailSection title="How the two ratios compare">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatTile
                label="Housing ratio cap"
                value={usd(result.maxHousingPayment)}
                hint={`${pct(v.housingRatio)} of ${usd(result.monthlyIncome)} monthly income`}
                tone={result.limitedBy === "housing ratio" ? "warn" : "neutral"}
              />
              <StatTile
                label="Total debt cap"
                value={usd(result.maxTotalDebtPayment)}
                hint={`${pct(v.debtRatio)} of income, less ${usd(v.debts)} of debts`}
                tone={result.limitedBy === "total debt ratio" ? "warn" : "neutral"}
              />
              <StatTile
                label="Payment we solved for"
                value={usd(result.maxPayment)}
                hint="The lower of the two — that's your ceiling"
              />
            </div>
          </DetailSection>

          <DetailSection
            title="Cash to close"
            description="What you'd need at the closing table at the top of your range. Down payment assistance and seller-paid costs can cut this substantially."
          >
            <DataTable
              head={["", "Amount"]}
              rows={[
                ["Purchase price", usd(result.maxPrice)],
                [`Down payment (${pct(v.downPct)})`, usd(result.downPayment)],
                [`Closing costs (${pct(v.closingPct)})`, usd(result.closingCosts)],
                ["Estimated cash to close", usd(result.cashToClose)],
                ["Loan amount", usd(p.loanAmount)],
              ]}
            />
          </DetailSection>
        </>
      }
      footnote={
        <>
          Estimates only, not a pre-approval or a commitment to lend. Real qualifying depends on
          credit, documented income, assets, reserves and the specific program — a pre-approval is
          the only way to know your true ceiling.{" "}
          <Link href="/down-payment-assistance/" className="font-medium text-accent-2 hover:underline">
            Down payment assistance
          </Link>{" "}
          may change the picture.
        </>
      }
    />
  );
}
