"use client";

import { useMemo } from "react";
import { computePayment } from "@/lib/calc/mortgage";
import { conventionalPmiPct, DEFAULTS } from "@/lib/calc/rates";
import { formatMonths } from "@/lib/calc/finance";
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
} from "@/components/calc/CalcShell";

const defaults = {
  program: "conventional" as "conventional" | "fha",
  price: DEFAULTS.homePrice,
  downPct: DEFAULTS.downPct,
  rate: DEFAULTS.rate,
  term: DEFAULTS.termYears,
  taxPct: DEFAULTS.propertyTaxPct,
  insurance: DEFAULTS.insuranceAnnual,
  hoa: DEFAULTS.hoaMonthly,
  pmiPct: -1, // -1 means "use the LTV-based estimate"
  closingPct: DEFAULTS.closingCostPct,
};

export function PaymentCalculator() {
  const { values: v, set, patch, reset, shareUrl } = useCalcState(defaults);

  const down = (v.price * v.downPct) / 100;
  const estimatedPmi = conventionalPmiPct(
    v.price > 0 ? ((v.price - down) / v.price) * 100 : 0,
  );

  const result = useMemo(
    () =>
      computePayment({
        program: v.program,
        homePrice: v.price,
        downPayment: (v.price * v.downPct) / 100,
        rate: v.rate,
        termYears: v.term,
        propertyTaxPct: v.taxPct,
        insuranceAnnual: v.insurance,
        hoaMonthly: v.hoa,
        pmiPct: v.pmiPct >= 0 ? v.pmiPct : undefined,
      }),
    [v],
  );

  const closingCosts = (v.price * v.closingPct) / 100;

  return (
    <CalcShell
      stickyLabel="Monthly payment"
      stickyValue={usd(result.total)}
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

          <FieldGroup>
            <CurrencyField
              label="Home price"
              value={v.price}
              onChange={(price) => set("price", price)}
            />
            <CurrencyField
              label="Down payment"
              value={Math.round(down)}
              onChange={(amount) =>
                patch({ downPct: v.price > 0 ? (amount / v.price) * 100 : 0 })
              }
              hint={`${pct(v.downPct)} of the price`}
            />
            <SliderField
              label="Down payment %"
              value={Math.round(v.downPct * 100) / 100}
              onChange={(downPct) => set("downPct", downPct)}
              min={0}
              max={50}
              step={0.5}
              suffix="%"
              hint={
                v.program === "fha"
                  ? "FHA allows as little as 3.5% down."
                  : "3% is the conventional floor; 20% avoids PMI."
              }
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
                { value: 10, label: "10 years" },
              ]}
            />
            <PercentField
              label="Property tax (annual)"
              value={v.taxPct}
              onChange={(taxPct) => set("taxPct", taxPct)}
              hint={`${usd((v.price * v.taxPct) / 100)} a year`}
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
            {v.program === "conventional" ? (
              <PercentField
                label="PMI rate (annual)"
                value={v.pmiPct >= 0 ? v.pmiPct : estimatedPmi}
                onChange={(pmiPct) => set("pmiPct", pmiPct)}
                hint="Estimated from your loan-to-value. Real pricing depends on credit score and coverage."
              />
            ) : null}
            <PercentField
              label="Closing costs (% of price)"
              value={v.closingPct}
              onChange={(closingPct) => set("closingPct", closingPct)}
              hint={`${usd(closingCosts)} — used for cash to close`}
            />
          </Advanced>
        </>
      }
      result={
        <ResultCard
          label="Estimated monthly payment"
          value={usdCents(result.total)}
          sub={`${usd(result.loanAmount)} loan · ${usd(down)} down · ${pct(result.ltv)} LTV`}
          note={result.miNote ?? undefined}
        >
          <ResultRow label="Principal & interest" value={usdCents(result.principalAndInterest)} />
          <ResultRow label="Property tax" value={usdCents(result.propertyTax)} />
          <ResultRow label="Home insurance" value={usdCents(result.insurance)} />
          {result.mortgageInsuranceLabel ? (
            <ResultRow
              label={result.mortgageInsuranceLabel}
              value={usdCents(result.mortgageInsurance)}
            />
          ) : null}
          {result.hoa > 0 ? <ResultRow label="HOA" value={usdCents(result.hoa)} /> : null}
          <ResultRow label="Total" value={`${usdCents(result.total)}/mo`} strong />
        </ResultCard>
      }
      details={
        <>
          <DetailSection title="Loan summary">
            <DataTable
              head={["", "Amount"]}
              rows={[
                ["Home price", usd(v.price)],
                ["Down payment", `${usd(down)} (${pct(v.downPct)})`],
                ["Base loan amount", usd(result.baseLoan)],
                ...(result.financedFee > 0
                  ? [
                      [
                        `${result.upfrontFeeLabel} (${pct(result.upfrontFeePct, 2)}, financed)`,
                        usd(result.financedFee),
                      ],
                    ]
                  : []),
                ["Total loan amount", usd(result.loanAmount)],
                ["Loan-to-value", pct(result.ltv)],
                ["Interest over the full term", usd(result.totalInterest)],
                [
                  result.mortgageInsuranceLabel
                    ? `${result.mortgageInsuranceLabel} drops off`
                    : "Mortgage insurance",
                  result.mortgageInsuranceLabel
                    ? result.miEndsMonth
                      ? `after ${formatMonths(result.miEndsMonth)}`
                      : "stays for the life of the loan"
                    : "none",
                ],
              ]}
            />
          </DetailSection>

          <DetailSection
            title="Cash to close"
            description="Your down payment plus estimated closing costs. Lender credits and seller-paid costs reduce this."
          >
            <DataTable
              head={["", "Amount"]}
              rows={[
                ["Down payment", usd(down)],
                [`Closing costs (${pct(v.closingPct)})`, usd(closingCosts)],
                ["Estimated cash to close", usd(down + closingCosts)],
              ]}
            />
          </DetailSection>
        </>
      }
      footnote={
        <>
          Estimates only, not a commitment to lend. Taxes and insurance are entered as estimates and
          your actual escrow will differ.{" "}
          {v.program === "fha"
            ? "FHA upfront MIP of 1.75% is financed into the loan; annual MIP is held at its first-year rate."
            : "PMI is estimated from loan-to-value at roughly a 740 credit score."}{" "}
          Rates, terms and programs change without notice.
        </>
      }
    />
  );
}
