"use client";

import Link from "next/link";
import { useMemo } from "react";
import { computePayment } from "@/lib/calc/mortgage";
import { DEFAULTS, vaFundingFeePct } from "@/lib/calc/rates";
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
  ToggleField,
} from "@/components/calc/fields";
import {
  CalcShell,
  DataTable,
  DetailSection,
  ResultCard,
  ResultRow,
} from "@/components/calc/CalcShell";

const defaults = {
  price: DEFAULTS.homePrice,
  downPct: 0,
  rate: DEFAULTS.rate,
  term: DEFAULTS.termYears,
  taxPct: DEFAULTS.propertyTaxPct,
  insurance: DEFAULTS.insuranceAnnual,
  hoa: DEFAULTS.hoaMonthly,
  use: "first" as "first" | "subsequent",
  exempt: false,
  financeFee: true,
  closingPct: DEFAULTS.closingCostPct,
};

export function VaLoanCalculator() {
  const { values: v, set, patch, reset, shareUrl } = useCalcState(defaults);
  const down = (v.price * v.downPct) / 100;

  const result = useMemo(
    () =>
      computePayment({
        program: "va",
        homePrice: v.price,
        downPayment: (v.price * v.downPct) / 100,
        rate: v.rate,
        termYears: v.term,
        propertyTaxPct: v.taxPct,
        insuranceAnnual: v.insurance,
        hoaMonthly: v.hoa,
        firstUse: v.use === "first",
        vaExempt: v.exempt,
        financeUpfrontFee: v.financeFee,
      }),
    [v],
  );

  const closingCosts = (v.price * v.closingPct) / 100;
  const feeIfNotExempt = vaFundingFeePct({
    downPct: v.downPct,
    firstUse: v.use === "first",
    exempt: false,
  });

  return (
    <CalcShell
      stickyLabel="Monthly payment"
      stickyValue={usd(result.total)}
      onReset={reset}
      onShare={shareUrl}
      inputs={
        <>
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
              hint="VA loans allow $0 down."
            />
            <SliderField
              label="Down payment %"
              value={Math.round(v.downPct * 100) / 100}
              onChange={(downPct) => set("downPct", downPct)}
              min={0}
              max={25}
              step={0.5}
              suffix="%"
              hint="5% down cuts the funding fee; 10% cuts it again."
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
              hint={`${usd((v.price * v.taxPct) / 100)} a year`}
            />
          </FieldGroup>

          <div className="space-y-4 border-t border-line pt-5">
            <Segmented
              label="VA entitlement"
              value={v.use}
              onChange={(use) => set("use", use)}
              options={[
                { value: "first", label: "First use" },
                { value: "subsequent", label: "Used before" },
              ]}
            />
            <ToggleField
              label="Exempt from the funding fee"
              checked={v.exempt}
              onChange={(exempt) => set("exempt", exempt)}
              hint="Veterans receiving VA compensation for a service-connected disability, certain surviving spouses, and some Purple Heart recipients are exempt."
            />
            <ToggleField
              label="Finance the funding fee into the loan"
              checked={v.financeFee}
              onChange={(financeFee) => set("financeFee", financeFee)}
              hint="The usual choice — otherwise it's due in cash at closing."
            />
          </div>

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
          sub={`${usd(result.loanAmount)} loan · ${usd(down)} down${
            v.downPct === 0 ? " · $0-down VA" : ` · ${pct(result.ltv)} LTV`
          }`}
          note="VA loans carry no monthly mortgage insurance — the one-time funding fee takes its place."
        >
          <ResultRow label="Principal & interest" value={usdCents(result.principalAndInterest)} />
          <ResultRow label="Property tax" value={usdCents(result.propertyTax)} />
          <ResultRow label="Home insurance" value={usdCents(result.insurance)} />
          {result.hoa > 0 ? <ResultRow label="HOA" value={usdCents(result.hoa)} /> : null}
          <ResultRow label="Total" value={`${usdCents(result.total)}/mo`} strong />
        </ResultCard>
      }
      details={
        <>
          <DetailSection
            title="Funding fee"
            description="A one-time fee that funds the VA loan program. It scales down with a larger down payment, and goes up on a second or later use of your entitlement."
          >
            <DataTable
              head={["", "Amount"]}
              rows={[
                ["Base loan amount", usd(result.baseLoan)],
                [
                  v.exempt
                    ? "Funding fee (exempt)"
                    : `Funding fee (${pct(result.upfrontFeePct, 2)})`,
                  v.exempt ? "$0 — exempt" : usd(result.upfrontFee),
                ],
                ...(v.exempt
                  ? [
                      [
                        "Fee if you weren't exempt",
                        `${usd((feeIfNotExempt / 100) * result.baseLoan)} (${pct(feeIfNotExempt, 2)})`,
                      ],
                    ]
                  : []),
                [
                  v.financeFee ? "Financed into the loan" : "Due in cash at closing",
                  usd(result.upfrontFee),
                ],
                ["Total loan amount", usd(result.loanAmount)],
                ["Interest over the full term", usd(result.totalInterest)],
              ]}
            />
          </DetailSection>

          <DetailSection
            title="Cash to close"
            description="VA limits which closing costs a veteran can pay, and the seller is allowed to cover more. Treat this as an upper bound."
          >
            <DataTable
              head={["", "Amount"]}
              rows={[
                ["Down payment", usd(down)],
                ...(v.financeFee ? [] : [["Funding fee (paid in cash)", usd(result.upfrontFee)]]),
                [`Closing costs (${pct(v.closingPct)})`, usd(closingCosts)],
                [
                  "Estimated cash to close",
                  usd(down + closingCosts + (v.financeFee ? 0 : result.upfrontFee)),
                ],
              ]}
            />
          </DetailSection>
        </>
      }
      footnote={
        <>
          Estimates only, not a commitment to lend. Funding fee percentages reflect the schedule
          effective April 7, 2023 — see the{" "}
          <Link href="/va-funding-fee-tables/" className="font-medium text-accent-2 hover:underline">
            full funding fee tables
          </Link>
          . Confirm your entitlement and exemption status with the VA.
        </>
      }
    />
  );
}
