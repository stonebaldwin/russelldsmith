"use client";

import { useMemo } from "react";
import { computeSellerNet, sellerPriceScenarios, type SellerInputs } from "@/lib/calc/seller";
import { DEFAULTS } from "@/lib/calc/rates";
import { pct, usd } from "@/lib/calc/format";
import { useCalcState } from "@/lib/calc/useCalcState";
import {
  Advanced,
  CurrencyField,
  FieldGroup,
  PercentField,
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
  price: DEFAULTS.salePrice,
  balance: DEFAULTS.mortgageBalance,
  liens: 0,
  commission: DEFAULTS.commissionPct,
  transferTax: DEFAULTS.transferTaxPct,
  closing: DEFAULTS.sellerClosingCostPct,
  concessions: DEFAULTS.concessionsPct,
  prep: DEFAULTS.homePrepCost,
  moving: DEFAULTS.movingCost,
  other: 0,
};

export function SellerNetCalculator() {
  const { values: v, set, reset, shareUrl } = useCalcState(defaults);

  const inputs: SellerInputs = useMemo(
    () => ({
      salePrice: v.price,
      mortgageBalance: v.balance,
      otherLiens: v.liens,
      commissionPct: v.commission,
      transferTaxPct: v.transferTax,
      closingCostPct: v.closing,
      concessionsPct: v.concessions,
      homePrepCost: v.prep,
      movingCost: v.moving,
      otherCosts: v.other,
    }),
    [v],
  );

  const s = useMemo(() => computeSellerNet(inputs), [inputs]);
  const scenarios = useMemo(() => sellerPriceScenarios(inputs), [inputs]);

  return (
    <CalcShell
      stickyLabel="You'd net"
      stickyValue={usd(s.netProceeds)}
      onReset={reset}
      onShare={shareUrl}
      inputs={
        <>
          <FieldGroup title="The sale">
            <CurrencyField
              label="Sale price"
              value={v.price}
              onChange={(price) => set("price", price)}
            />
            <CurrencyField
              label="Mortgage payoff"
              value={v.balance}
              onChange={(balance) => set("balance", balance)}
              hint="Your payoff figure, not the last statement balance — it includes interest to the closing date."
            />
          </FieldGroup>

          <FieldGroup title="Costs of selling">
            <PercentField
              label="Agent commission"
              value={v.commission}
              onChange={(commission) => set("commission", commission)}
              hint={`${usd((v.price * v.commission) / 100)}`}
            />
            <PercentField
              label="Transfer / excise tax"
              value={v.transferTax}
              onChange={(transferTax) => set("transferTax", transferTax)}
              hint={`${usd((v.price * v.transferTax) / 100)}`}
            />
            <PercentField
              label="Closing costs"
              value={v.closing}
              onChange={(closing) => set("closing", closing)}
              hint={`Attorney, title, recording — ${usd((v.price * v.closing) / 100)}`}
            />
            <PercentField
              label="Seller concessions"
              value={v.concessions}
              onChange={(concessions) => set("concessions", concessions)}
              hint={`Credits toward the buyer's costs — ${usd((v.price * v.concessions) / 100)}`}
            />
          </FieldGroup>

          <Advanced label="Other costs">
            <CurrencyField
              label="Home prep & repairs"
              value={v.prep}
              onChange={(prep) => set("prep", prep)}
            />
            <CurrencyField
              label="Moving costs"
              value={v.moving}
              onChange={(moving) => set("moving", moving)}
            />
            <CurrencyField
              label="Second mortgage / HELOC payoff"
              value={v.liens}
              onChange={(liens) => set("liens", liens)}
            />
            <CurrencyField
              label="Anything else"
              value={v.other}
              onChange={(other) => set("other", other)}
            />
          </Advanced>
        </>
      }
      result={
        <ResultCard
          label="Estimated net proceeds"
          value={usd(s.netProceeds)}
          sub={`From a ${usd(s.salePrice)} sale — ${pct(s.proceedsPctOfSale)} of the price`}
          note="Capital gains tax isn't included. Most sellers of a primary residence owe none, but a former rental or a large gain is a conversation for your CPA."
        >
          <ResultRow label="Sale price" value={usd(s.salePrice)} />
          <ResultRow label="Loan payoff" value={`−${usd(s.payoff)}`} />
          <ResultRow label="Costs of selling" value={`−${usd(s.sellingCosts)}`} />
          {s.additionalCosts > 0 ? (
            <ResultRow label="Other costs" value={`−${usd(s.additionalCosts)}`} />
          ) : null}
          <ResultRow label="Net proceeds" value={usd(s.netProceeds)} strong />
        </ResultCard>
      }
      details={
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile label="Gross equity" value={usd(s.grossEquity)} hint="Price less the payoff" />
            <StatTile
              label="Total costs"
              value={usd(s.totalCosts)}
              hint={`${pct(s.costPctOfSale)} of the sale price`}
            />
            <StatTile
              label="You keep"
              value={pct(s.proceedsPctOfSale)}
              tone={s.netProceeds > 0 ? "good" : "bad"}
              hint="of the sale price"
            />
          </div>

          <DetailSection title="Where the money goes">
            <DataTable
              head={["", "Amount"]}
              rows={[
                ["Sale price", usd(s.salePrice)],
                ...(v.balance > 0 ? [["Mortgage payoff", `−${usd(v.balance)}`]] : []),
                ...(v.liens > 0 ? [["Second mortgage / HELOC", `−${usd(v.liens)}`]] : []),
                ["Gross equity", usd(s.grossEquity)],
                ...s.sellingCostLines.map((l) => [
                  l.pct !== undefined ? `${l.label} (${pct(l.pct, 2)})` : l.label,
                  `−${usd(l.amount)}`,
                ]),
                ...s.additionalCostLines.map((l) => [l.label, `−${usd(l.amount)}`]),
                ["Estimated net proceeds", usd(s.netProceeds)],
              ]}
            />
          </DetailSection>

          <DetailSection
            title="If it sells for more — or less"
            description="What a different sale price does to your bottom line, with the same costs applied."
          >
            <DataTable
              head={["Sale price", "Change", "Net proceeds", "vs. your estimate"]}
              rows={scenarios.map((sc) => [
                usd(sc.salePrice),
                sc.deltaPct === 0 ? "your estimate" : `${sc.deltaPct > 0 ? "+" : ""}${sc.deltaPct}%`,
                usd(sc.netProceeds),
                sc.deltaPct === 0
                  ? "—"
                  : `${sc.netProceeds - s.netProceeds > 0 ? "+" : "−"}${usd(
                      Math.abs(sc.netProceeds - s.netProceeds),
                    )}`,
              ])}
            />
          </DetailSection>
        </>
      }
      footnote={
        <>
          Estimates only. Prorated property tax, HOA dues, unpaid assessments, home warranty and any
          repair credits negotiated after inspection will all move the final number — your closing
          attorney&rsquo;s settlement statement is the one that counts.
        </>
      }
    />
  );
}
