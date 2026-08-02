/**
 * Current VA funding fee tables. Rates reflect the schedule effective April 7,
 * 2023 (unchanged since). Russell should confirm against VA.gov at launch.
 */

const purchase = [
  { down: "Less than 5%", first: "2.15%", after: "3.30%" },
  { down: "5% – 9.99%", first: "1.50%", after: "1.50%" },
  { down: "10% or more", first: "1.25%", after: "1.25%" },
];

const refinance = [
  { type: "Cash-out refinance (first use)", fee: "2.15%" },
  { type: "Cash-out refinance (subsequent use)", fee: "3.30%" },
  { type: "Interest Rate Reduction Refinance (IRRRL)", fee: "0.50%" },
];

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function VAFundingFeeTable() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-serif text-xl font-semibold text-ink">Purchase &amp; construction loans</h2>
        <p className="mt-1 text-sm text-muted">Fee as a percentage of the loan amount, by down payment.</p>
        <div className="mt-4">
          <Table>
            <thead>
              <tr className="bg-canvas text-left">
                <th className="px-4 py-3 font-semibold text-ink">Down payment</th>
                <th className="px-4 py-3 font-semibold text-ink">First use</th>
                <th className="px-4 py-3 font-semibold text-ink">After first use</th>
              </tr>
            </thead>
            <tbody>
              {purchase.map((r) => (
                <tr key={r.down} className="border-t border-line">
                  <td className="px-4 py-3 text-ink-soft">{r.down}</td>
                  <td className="px-4 py-3 text-ink-soft">{r.first}</td>
                  <td className="px-4 py-3 text-ink-soft">{r.after}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-ink">Refinance loans</h2>
        <div className="mt-4">
          <Table>
            <thead>
              <tr className="bg-canvas text-left">
                <th className="px-4 py-3 font-semibold text-ink">Refinance type</th>
                <th className="px-4 py-3 font-semibold text-ink">Funding fee</th>
              </tr>
            </thead>
            <tbody>
              {refinance.map((r) => (
                <tr key={r.type} className="border-t border-line">
                  <td className="px-4 py-3 text-ink-soft">{r.type}</td>
                  <td className="px-4 py-3 text-ink-soft">{r.fee}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </section>

      <p className="rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted">
        <strong className="text-ink-soft">Exemptions:</strong> Veterans receiving VA compensation
        for a service-connected disability, certain surviving spouses, and some Purple Heart
        recipients are exempt from the funding fee. Confirm your status with the VA.
      </p>
    </div>
  );
}
