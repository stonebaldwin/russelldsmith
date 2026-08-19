import Link from "next/link";
import { CALCULATORS, calculatorPath, getCalculators, type Calculator } from "@/lib/calculators";

/** A single calculator card — title, the question it answers, and a nudge. */
function CalculatorCard({ calculator }: { calculator: Calculator }) {
  return (
    <Link
      href={calculatorPath(calculator.slug)}
      className="group flex flex-col rounded-xl border border-line bg-surface p-5 transition-colors hover:border-accent hover:bg-accent-pale/40"
    >
      <h3 className="font-serif text-lg leading-snug font-medium text-accent">
        {calculator.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-ink-soft">{calculator.answers}</p>
      <span className="mt-4 text-sm font-semibold text-accent-2 group-hover:underline">
        Run the numbers →
      </span>
    </Link>
  );
}

/** The full calculator grid — used on the /mortgage-calculators/ hub. */
export function CalculatorCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CALCULATORS.map((c) => (
        <CalculatorCard key={c.slug} calculator={c} />
      ))}
    </div>
  );
}

/**
 * A compact row of calculator buttons, for dropping a relevant calculator onto
 * a loan landing page (e.g. the DSCR calculator on the investor page).
 */
export function CalculatorLinks({
  slugs,
  label = "Run the numbers",
}: {
  slugs: string[];
  label?: string;
}) {
  const list = getCalculators(slugs);
  if (!list.length) return null;
  return (
    <div className="rounded-xl border border-line bg-accent-pale/50 p-5">
      <p className="text-xs font-semibold tracking-wider text-accent uppercase">{label}</p>
      <ul className="mt-3 flex flex-wrap gap-2.5">
        {list.map((c) => (
          <li key={c.slug}>
            <Link
              href={calculatorPath(c.slug)}
              className="inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-2-hover"
            >
              {c.title}
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/mortgage-calculators/"
            className="inline-flex items-center rounded-md border border-accent/25 bg-white px-4 py-2 text-sm font-medium text-accent transition-colors hover:border-accent"
          >
            All calculators
          </Link>
        </li>
      </ul>
    </div>
  );
}
