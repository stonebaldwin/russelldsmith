"use client";

import Link from "next/link";
import { useMemo } from "react";
import { computeRefinance } from "@/lib/calc/refinance";
import { DEFAULTS } from "@/lib/calc/rates";
import { formatMonths } from "@/lib/calc/finance";
import { usd, usdCents } from "@/lib/calc/format";
import { useCalcState } from "@/lib/calc/useCalcState";
import {
  Advanced,
  CurrencyField,
  FieldGroup,
  NumberField,
  PercentField,
  SelectField,
  ToggleField,
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
  balance: DEFAULTS.currentBalance,
  currentRate: DEFAULTS.currentRate,
  monthsLeft: DEFAULTS.monthsRemaining,
  newRate: DEFAULTS.newRate,
  newTerm: DEFAULTS.termYears,
  costs: DEFAULTS.refiClosingCosts,
  rollIn: false,
  cashOut: 0,
};

export function RefinanceCalculator() {
  const { values: v, set, reset, shareUrl } = useCalcState(defaults);

  const r = useMemo(
    () =>
      computeRefinance({
        currentBalance: v.balance,
        currentRate: v.currentRate,
        monthsRemaining: v.monthsLeft,
        newRate: v.newRate,
        newTermYears: v.newTerm,
        closingCosts: v.costs,
        rollCostsIn: v.rollIn,
        cashOut: v.cashOut,
      }),
    [v],
  );

  const saves = r.monthlySavings > 0;

  return (
    <CalcShell
      stickyLabel={saves ? "Monthly savings" : "Monthly change"}
      stickyValue={`${saves ? "" : "+"}${usd(Math.abs(r.monthlySavings))}`}
      onReset={reset}
      onShare={shareUrl}
      inputs={
        <>
          <FieldGroup title="Your current mortgage">
            <CurrencyField
              label="Balance remaining"
              value={v.balance}
              onChange={(balance) => set("balance", balance)}
            />
            <PercentField
              label="Interest rate"
              value={v.currentRate}
              onChange={(currentRate) => set("currentRate", currentRate)}
            />
            <NumberField
              label="Payments remaining"
              value={v.monthsLeft}
              onChange={(monthsLeft) => set("monthsLeft", monthsLeft)}
              suffix="mo"
              hint={`${formatMonths(v.monthsLeft)} left — your payment works out to ${usdCents(
                r.currentPayment,
              )}`}
            />
          </FieldGroup>

          <FieldGroup title="The new loan">
            <PercentField
              label="New interest rate"
              value={v.newRate}
              onChange={(newRate) => set("newRate", newRate)}
            />
            <SelectField
              label="New term"
              value={v.newTerm}
              onChange={(newTerm) => set("newTerm", newTerm)}
              options={[
                { value: 30, label: "30 years" },
                { value: 25, label: "25 years" },
                { value: 20, label: "20 years" },
                { value: 15, label: "15 years" },
                { value: 10, label: "10 years" },
              ]}
            />
            <CurrencyField
              label="Closing costs"
              value={v.costs}
              onChange={(costs) => set("costs", costs)}
            />
          </FieldGroup>

          <Advanced>
            <CurrencyField
              label="Cash out"
              value={v.cashOut}
              onChange={(cashOut) => set("cashOut", cashOut)}
              hint="Extra you'd take at closing. It raises the balance, so the payment comparison shifts."
            />
            <ToggleField
              label="Roll the closing costs into the loan"
              checked={v.rollIn}
              onChange={(rollIn) => set("rollIn", rollIn)}
              hint="Nothing due at closing, but you finance the costs — the break-even below still counts them."
            />
          </Advanced>
        </>
      }
      result={
        <ResultCard
          label={saves ? "Estimated monthly savings" : "Your payment would go up by"}
          value={usdCents(Math.abs(r.monthlySavings))}
          sub={
            r.breakEvenMonths !== null
              ? r.breakEvenMonths > 0
                ? `Closing costs earned back in ${formatMonths(r.breakEvenMonths)}`
                : "No closing costs to earn back"
              : "A lower payment isn't what this scenario delivers"
          }
          note={
            r.termChangeMonths > 0
              ? `Heads up: this stretches your payoff out by ${formatMonths(
                  r.termChangeMonths,
                )}, which is where part of the monthly saving comes from.`
              : r.termChangeMonths < 0
                ? `This shortens your payoff by ${formatMonths(-r.termChangeMonths)}.`
                : undefined
          }
        >
          <ResultRow label="Current payment" value={usdCents(r.currentPayment)} />
          <ResultRow label="New payment" value={usdCents(r.newPayment)} />
          <ResultRow label="New loan amount" value={usd(r.newLoanAmount)} />
          <ResultRow label="Due at closing" value={usd(r.cashAtClosing)} />
          <ResultRow
            label={saves ? "Monthly saving" : "Monthly increase"}
            value={`${usdCents(Math.abs(r.monthlySavings))}/mo`}
            strong
          />
        </ResultCard>
      }
      details={
        <>
          <DetailSection
            title="Interest over the same window"
            description={`Comparing a fresh ${v.newTerm}-year loan against ${formatMonths(
              v.monthsLeft,
            )} of remaining payments isn't like for like — a longer term always looks cheaper monthly. So this measures both loans over the same ${formatMonths(
              r.comparisonMonths,
            )}.`}
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <StatTile
                label="Interest — current loan"
                value={usd(r.currentInterestOverWindow)}
              />
              <StatTile label="Interest — new loan" value={usd(r.newInterestOverWindow)} />
              <StatTile
                label="Interest saved"
                value={usd(r.interestSavedOverWindow)}
                tone={r.interestSavedOverWindow > 0 ? "good" : "bad"}
              />
            </div>
          </DetailSection>

          <DetailSection title="Side by side">
            <DataTable
              head={["", "Current loan", "New loan"]}
              rows={[
                ["Balance", usd(v.balance), usd(r.newLoanAmount)],
                ["Rate", `${v.currentRate}%`, `${v.newRate}%`],
                ["Term left", formatMonths(v.monthsLeft), formatMonths(v.newTerm * 12)],
                ["Monthly payment", usdCents(r.currentPayment), usdCents(r.newPayment)],
                [
                  "Interest to payoff",
                  usd(r.currentInterestRemaining),
                  usd(r.newInterestTotal),
                ],
              ]}
            />
          </DetailSection>
        </>
      }
      footnote={
        <>
          Estimates only, not a commitment to lend. Real closing costs, escrow set-up and the timing
          of your first new payment all shift the true break-even. Veterans should also look at the{" "}
          <Link href="/va-loans/" className="font-medium text-accent-2 hover:underline">
            VA IRRRL
          </Link>
          , which carries a 0.50% funding fee and usually skips the appraisal.
        </>
      }
    />
  );
}
