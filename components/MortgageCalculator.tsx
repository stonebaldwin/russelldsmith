"use client";

import { useMemo, useState } from "react";

function num(v: string, fallback = 0): number {
  const n = parseFloat(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}
const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function Field({
  label,
  value,
  onChange,
  prefix,
  suffix,
  inputMode = "decimal",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  inputMode?: "decimal" | "numeric";
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      <span className="mt-1 flex items-center rounded-md border border-line-strong bg-surface focus-within:border-accent-2">
        {prefix ? <span className="pl-3 text-muted">{prefix}</span> : null}
        <input
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent px-3 py-2 text-ink outline-none"
        />
        {suffix ? <span className="pr-3 text-muted">{suffix}</span> : null}
      </span>
    </label>
  );
}

export function MortgageCalculator() {
  const [price, setPrice] = useState("350,000");
  const [downPct, setDownPct] = useState("10");
  const [rate, setRate] = useState("6.5");
  const [term, setTerm] = useState("30");
  const [taxPct, setTaxPct] = useState("1.0");
  const [insurance, setInsurance] = useState("1,400");
  const [hoa, setHoa] = useState("0");

  const result = useMemo(() => {
    const P = num(price);
    const down = (num(downPct) / 100) * P;
    const loan = Math.max(0, P - down);
    const r = num(rate) / 100 / 12;
    const n = num(term) * 12;
    const pi = r > 0 ? (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : loan / n || 0;
    const tax = (num(taxPct) / 100) * P / 12;
    const ins = num(insurance) / 12;
    const hoaM = num(hoa);
    const total = pi + tax + ins + hoaM;
    return { loan, down, pi, tax, ins, hoaM, total };
  }, [price, downPct, rate, term, taxPct, insurance, hoa]);

  const rows = [
    { label: "Principal & interest", value: result.pi },
    { label: "Property taxes", value: result.tax },
    { label: "Homeowners insurance", value: result.ins },
    ...(result.hoaM > 0 ? [{ label: "HOA", value: result.hoaM }] : []),
  ];

  return (
    <div className="grid gap-8 rounded-2xl border border-line bg-surface p-6 sm:p-8 lg:grid-cols-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Home price" value={price} onChange={setPrice} prefix="$" />
        <Field label="Down payment" value={downPct} onChange={setDownPct} suffix="%" />
        <Field label="Interest rate" value={rate} onChange={setRate} suffix="%" />
        <Field label="Loan term" value={term} onChange={setTerm} suffix="yrs" inputMode="numeric" />
        <Field label="Property tax (annual)" value={taxPct} onChange={setTaxPct} suffix="%" />
        <Field label="Insurance (annual)" value={insurance} onChange={setInsurance} prefix="$" />
        <Field label="HOA (monthly)" value={hoa} onChange={setHoa} prefix="$" />
      </div>

      <div className="flex flex-col justify-center rounded-xl bg-accent p-6 text-white">
        <p className="text-sm text-white/80">Estimated monthly payment</p>
        <p className="mt-1 font-serif text-4xl font-semibold">{usd(result.total)}</p>
        <p className="mt-1 text-sm text-white/70">
          {usd(result.loan)} loan · {usd(result.down)} down
        </p>
        <dl className="mt-5 space-y-2 border-t border-white/20 pt-4 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between">
              <dt className="text-white/80">{row.label}</dt>
              <dd className="font-medium">{usd(row.value)}/mo</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs leading-5 text-white/60">
          Estimate only. Excludes PMI/MIP and any escrow specifics. Not a commitment to lend.
        </p>
      </div>
    </div>
  );
}
