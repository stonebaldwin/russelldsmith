"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { computeDscr, projectDscr, DSCR_THRESHOLDS, type DscrInputs } from "@/lib/calc/dscr";
import { DEFAULTS } from "@/lib/calc/rates";
import { pct, ratio, usd, usdCompact } from "@/lib/calc/format";
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
  ResultCard,
  ResultRow,
  StatTile,
  Tabs,
} from "@/components/calc/CalcShell";

const defaults = {
  mode: "purchase" as "purchase" | "refinance",
  units: DEFAULTS.units,
  rent: DEFAULTS.monthlyRentPerUnit,
  value: 300_000,
  downPct: DEFAULTS.investorDownPct,
  rate: DEFAULTS.investorRate,
  term: DEFAULTS.termYears,
  io: false,
  taxPct: DEFAULTS.propertyTaxPct,
  insurance: DEFAULTS.rentalInsuranceAnnual,
  hoa: DEFAULTS.hoaMonthly,
  vacancy: DEFAULTS.vacancyPct,
  management: DEFAULTS.managementPct,
  repairs: DEFAULTS.repairsPct,
  closingPct: DEFAULTS.closingCostPct,
};

export function DscrCalculator() {
  const { values: v, set, reset, shareUrl } = useCalcState(defaults);
  const [tab, setTab] = useState("overview");

  const inputs: DscrInputs = useMemo(
    () => ({
      mode: v.mode,
      units: v.units,
      monthlyRentPerUnit: v.rent,
      propertyValue: v.value,
      downPct: v.downPct,
      rate: v.rate,
      termYears: v.term,
      interestOnly: v.io,
      propertyTaxPct: v.taxPct,
      insuranceAnnual: v.insurance,
      hoaMonthly: v.hoa,
      vacancyPct: v.vacancy,
      managementPct: v.management,
      repairsPct: v.repairs,
      closingCostPct: v.closingPct,
    }),
    [v],
  );

  const d = useMemo(() => computeDscr(inputs), [inputs]);
  const projection = useMemo(() => projectDscr(inputs, { years: 5 }), [inputs]);

  const tone =
    d.dscr >= DSCR_THRESHOLDS.strong
      ? "good"
      : d.dscr >= DSCR_THRESHOLDS.preferred
        ? "good"
        : d.dscr >= DSCR_THRESHOLDS.minimum
          ? "warn"
          : "bad";

  return (
    <CalcShell
      stickyLabel="DSCR"
      stickyValue={ratio(d.dscr)}
      onReset={reset}
      onShare={shareUrl}
      inputs={
        <>
          <Segmented
            label="Transaction"
            value={v.mode}
            onChange={(mode) => set("mode", mode)}
            options={[
              { value: "purchase", label: "Purchase" },
              { value: "refinance", label: "Refinance" },
            ]}
          />

          <FieldGroup title="The property">
            <SelectField
              label="Units"
              value={v.units}
              onChange={(units) => set("units", units)}
              options={[1, 2, 3, 4].map((n) => ({
                value: n,
                label: n === 1 ? "1 unit" : `${n} units`,
              }))}
            />
            <CurrencyField
              label="Monthly rent per unit"
              value={v.rent}
              onChange={(rent) => set("rent", rent)}
              hint={`${usd(d.grossRent)} gross rent a month`}
            />
            <CurrencyField
              label={v.mode === "purchase" ? "Purchase price" : "Appraised value"}
              value={v.value}
              onChange={(value) => set("value", value)}
            />
            <SliderField
              label={v.mode === "purchase" ? "Down payment %" : "Equity left in %"}
              value={v.downPct}
              onChange={(downPct) => set("downPct", downPct)}
              min={15}
              max={50}
              step={1}
              suffix="%"
              hint={`${usd((v.value * v.downPct) / 100)} — ${pct(d.ltv)} LTV`}
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
                { value: 40, label: "40 years" },
                { value: 20, label: "20 years" },
                { value: 15, label: "15 years" },
              ]}
            />
          </FieldGroup>

          <div className="border-t border-line pt-5">
            <ToggleField
              label="Interest-only payment"
              checked={v.io}
              onChange={(io) => set("io", io)}
              hint="Common on DSCR programs — it lifts the ratio because the payment is smaller, but the balance never comes down."
            />
          </div>

          <Advanced label="Operating expenses">
            <PercentField
              label="Property tax (annual)"
              value={v.taxPct}
              onChange={(taxPct) => set("taxPct", taxPct)}
              hint={`${usd(d.propertyTax)} a month`}
            />
            <CurrencyField
              label="Insurance (annual)"
              value={v.insurance}
              onChange={(insurance) => set("insurance", insurance)}
              hint={`${usd(d.insurance)} a month`}
            />
            <CurrencyField
              label="HOA dues (monthly)"
              value={v.hoa}
              onChange={(hoa) => set("hoa", hoa)}
            />
            <PercentField
              label="Vacancy (% of rent)"
              value={v.vacancy}
              onChange={(vacancy) => set("vacancy", vacancy)}
              hint={`${usd(d.vacancy)} a month`}
            />
            <PercentField
              label="Management (% of collected rent)"
              value={v.management}
              onChange={(management) => set("management", management)}
              hint={`${usd(d.management)} a month`}
            />
            <PercentField
              label="Repairs & capex (annual % of value)"
              value={v.repairs}
              onChange={(repairs) => set("repairs", repairs)}
              hint={`${usd(d.repairs)} a month`}
            />
            <PercentField
              label="Closing costs (% of value)"
              value={v.closingPct}
              onChange={(closingPct) => set("closingPct", closingPct)}
              hint="Counted in cash invested for the cash-on-cash return."
            />
          </Advanced>
        </>
      }
      result={
        <ResultCard
          label="Debt service coverage ratio"
          value={ratio(d.dscr)}
          sub={`${d.qualification} — ${usd(d.grossRent)} rent against ${usd(d.pitia)} PITIA`}
          note={`Lenders divide gross rent by principal, interest, taxes, insurance and HOA. Vacancy, management and repairs don't count against the ratio — but they do come out of your cash flow.`}
        >
          <ResultRow label="Gross rent" value={usd(d.grossRent)} />
          <ResultRow label="Principal & interest" value={usd(d.principalAndInterest)} />
          <ResultRow label="Taxes, insurance, HOA" value={usd(d.propertyTax + d.insurance + d.hoa)} />
          <ResultRow label="Vacancy, management, repairs" value={usd(d.vacancy + d.management + d.repairs)} />
          <ResultRow label="Monthly cash flow" value={`${usd(d.monthlyCashFlow)}/mo`} strong />
        </ResultCard>
      }
      details={
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="DSCR" value={ratio(d.dscr)} tone={tone} hint={d.qualification} />
            <StatTile label="Cap rate" value={pct(d.capRatePct)} hint="NOI ÷ value" />
            <StatTile
              label="Cash on cash"
              value={pct(d.cashOnCashPct)}
              tone={d.cashOnCashPct > 0 ? "good" : "bad"}
              hint={`On ${usd(d.cashInvested)} invested`}
            />
            <StatTile
              label="Monthly cash flow"
              value={usd(d.monthlyCashFlow)}
              tone={d.monthlyCashFlow > 0 ? "good" : "bad"}
            />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-serif text-xl font-medium text-accent">The detail</h3>
            <Tabs
              tabs={[
                { id: "overview", label: "Break-even points" },
                { id: "cashflow", label: "Cash flow" },
                { id: "projection", label: "5-year projection" },
              ]}
              active={tab}
              onChange={setTab}
            />
          </div>

          <div className="mt-4">
            {tab === "overview" ? (
              <>
                <DataTable
                  head={["Target DSCR", "Rent needed per unit", "Max price at this rent"]}
                  rows={[DSCR_THRESHOLDS.minimum, DSCR_THRESHOLDS.preferred, DSCR_THRESHOLDS.strong].map(
                    (t) => [
                      `${ratio(t)} — ${
                        t === DSCR_THRESHOLDS.minimum
                          ? "program minimum"
                          : t === DSCR_THRESHOLDS.preferred
                            ? "best pricing"
                            : "strong"
                      }`,
                      usd(d.breakEvenRentPerUnit(t)),
                      usd(d.maxValueForDscr(t)),
                    ],
                  )}
                />
                <p className="mt-3 text-sm leading-6 text-muted">
                  You&rsquo;re at {usd(v.rent)} per unit on a {usd(v.value)} property.{" "}
                  {v.rent >= d.breakEvenRentPerUnit(DSCR_THRESHOLDS.preferred)
                    ? `That's ${usd(
                        v.rent - d.breakEvenRentPerUnit(DSCR_THRESHOLDS.preferred),
                      )} per unit above the ${ratio(DSCR_THRESHOLDS.preferred)} threshold.`
                    : `You'd need ${usd(
                        d.breakEvenRentPerUnit(DSCR_THRESHOLDS.preferred) - v.rent,
                      )} more per unit to reach ${ratio(DSCR_THRESHOLDS.preferred)}.`}
                </p>
              </>
            ) : null}

            {tab === "cashflow" ? (
              <DataTable
                head={["", "Monthly", "Annual"]}
                rows={[
                  ["Gross scheduled rent", usd(d.grossRent), usd(d.grossRent * 12)],
                  ["Vacancy", `−${usd(d.vacancy)}`, `−${usd(d.vacancy * 12)}`],
                  ["Property tax", `−${usd(d.propertyTax)}`, `−${usd(d.propertyTax * 12)}`],
                  ["Insurance", `−${usd(d.insurance)}`, `−${usd(d.insurance * 12)}`],
                  ...(d.hoa > 0 ? [["HOA", `−${usd(d.hoa)}`, `−${usd(d.hoa * 12)}`]] : []),
                  ["Management", `−${usd(d.management)}`, `−${usd(d.management * 12)}`],
                  ["Repairs & capex", `−${usd(d.repairs)}`, `−${usd(d.repairs * 12)}`],
                  ["Net operating income", usd(d.noiMonthly), usd(d.noiMonthly * 12)],
                  [
                    "Debt service",
                    `−${usd(d.principalAndInterest)}`,
                    `−${usd(d.principalAndInterest * 12)}`,
                  ],
                  ["Cash flow", usd(d.monthlyCashFlow), usd(d.monthlyCashFlow * 12)],
                ]}
              />
            ) : null}

            {tab === "projection" ? (
              <>
                <DataTable
                  head={["Year", "Rent", "Expenses", "Debt service", "Cash flow", "Equity"]}
                  rows={projection.map((row) => [
                    `Year ${row.year}`,
                    usdCompact(row.grossRent),
                    usdCompact(row.operatingExpenses),
                    usdCompact(row.debtService),
                    usdCompact(row.cashFlow),
                    usdCompact(row.equity),
                  ])}
                />
                <p className="mt-3 text-sm leading-6 text-muted">
                  Assumes 3% a year on rent, expenses and property value.
                </p>
              </>
            ) : null}
          </div>
        </>
      }
      footnote={
        <>
          Estimates only, not a commitment to lend. DSCR programs qualify the property on its rent
          rather than your tax returns, but guidelines differ by lender on minimum ratio, reserves,
          short-term rental income and whether market rent or the lease controls.{" "}
          <Link
            href="/investment-property-loans/"
            className="font-medium text-accent-2 hover:underline"
          >
            Talk through the specifics
          </Link>{" "}
          before you write an offer.
        </>
      }
    />
  );
}
