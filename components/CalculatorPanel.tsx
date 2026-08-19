import type { CSSProperties } from "react";
import type { Calculator } from "@/lib/calculators";

/**
 * Renders one of Russell's RebelIQ calculators on the page.
 *
 * RebelIQ's hosted calculators cannot be embedded cross-origin — they load but
 * paint blank in any third-party iframe (see the note in lib/calculators.ts), so
 * the default is a launch panel that opens the real calculator in a new tab.
 *
 * If RebelIQ ships an embeddable mode, flip EMBED to true: lib/calculators.ts
 * already carries measured frame heights and app/globals.css the `.calc-embed`
 * sizing rules, so inline embedding turns back on site-wide in one line.
 */
const EMBED = false;

/** Width delta between the first two measured height anchors (390px → 768px). */
const ANCHOR_SPAN = 768 - 390;

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-accent-2"
    >
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LaunchPanel({ calculator }: { calculator: Calculator }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <div className="border-b border-line bg-accent px-6 py-5 sm:px-8">
        <h2 className="font-serif text-xl font-medium text-white sm:text-2xl">Run the numbers</h2>
        <p className="mt-1 text-sm text-white/80">
          Free to use — no signup, no SSN, nothing to install.
        </p>
      </div>
      <div className="grid gap-8 px-6 py-7 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <ul className="space-y-3">
          {calculator.highlights.map((h) => (
            <li key={h} className="flex gap-3 text-[0.975rem] leading-6 text-ink-soft">
              <CheckIcon />
              <span>{h}</span>
            </li>
          ))}
        </ul>
        <div className="lg:text-right">
          <a
            href={calculator.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md bg-accent-2 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-accent-2-hover"
          >
            <span>
              Open the {calculator.title} <span aria-hidden="true">↗</span>
            </span>
          </a>
          <p className="mt-3 max-w-xs text-xs leading-5 text-muted lg:ml-auto">
            Opens in a new tab. Estimates only — not a commitment to lend.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmbedFrame({ calculator }: { calculator: Calculator }) {
  const [narrow, mid, wide] = calculator.embedHeights;
  const style = {
    "--calc-h-narrow": `${narrow}px`,
    "--calc-h-mid": `${mid}px`,
    "--calc-h-wide": `${wide}px`,
    "--calc-slope": (mid - narrow) / ANCHOR_SPAN,
  } as CSSProperties;

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <iframe
          src={calculator.url}
          title={calculator.title}
          className="calc-embed w-full border-0"
          style={style}
        />
      </div>
      <p className="mt-3 text-xs leading-5 text-muted">
        Estimates only — not a commitment to lend.{" "}
        <a
          href={calculator.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-accent-2 hover:underline"
        >
          Open this calculator in a new tab ↗
        </a>
      </p>
    </div>
  );
}

export function CalculatorPanel({ calculator }: { calculator: Calculator }) {
  return EMBED ? <EmbedFrame calculator={calculator} /> : <LaunchPanel calculator={calculator} />;
}
