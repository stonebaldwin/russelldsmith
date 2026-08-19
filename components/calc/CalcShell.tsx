"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Shared frame for every calculator: inputs on the left, the headline result on
 * the right, and any wide detail (tables, projections, scenarios) full-width
 * underneath.
 *
 * On mobile the columns stack, which would push the answer below a screenful of
 * inputs — so the headline also renders as a slim sticky bar that sits under the
 * site header while you're scrolling the inputs.
 */
export function CalcShell({
  stickyLabel,
  stickyValue,
  inputs,
  result,
  details,
  footnote,
  onReset,
  onShare,
}: {
  stickyLabel: string;
  stickyValue: string;
  inputs: React.ReactNode;
  result: React.ReactNode;
  details?: React.ReactNode;
  footnote?: React.ReactNode;
  onReset: () => void;
  onShare: () => string;
}) {
  return (
    <div>
      {/* Mobile-only running total. `top-16` clears the sticky site header. */}
      <div className="sticky top-16 z-30 -mx-4 mb-4 border-y border-accent/20 bg-accent-pale/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs font-semibold tracking-wider text-accent uppercase">
            {stickyLabel}
          </span>
          <span className="font-serif text-xl font-semibold text-accent">{stickyValue}</span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-7">
            <div className="space-y-6">{inputs}</div>
            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-line pt-5">
              <button
                type="button"
                onClick={onReset}
                className="text-sm font-medium text-muted hover:text-accent-2 hover:underline"
              >
                Reset to defaults
              </button>
              <ShareButton onShare={onShare} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-20">{result}</div>
        </div>
      </div>

      {details ? <div className="mt-10">{details}</div> : null}

      {footnote ? (
        <div className="mt-8 rounded-xl border border-line bg-canvas px-5 py-4 text-xs leading-6 text-muted">
          {footnote}
        </div>
      ) : null}
    </div>
  );
}

function ShareButton({ onShare }: { onShare: () => string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    const url = onShare();
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 2500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="text-sm font-medium text-accent-2 hover:underline"
    >
      {state === "copied"
        ? "Link copied ✓"
        : state === "failed"
          ? "Copy the address bar instead"
          : "Copy a link to these numbers"}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Result panel pieces                                                 */
/* ------------------------------------------------------------------ */

/** The blue headline card: one big number, then a breakdown. */
export function ResultCard({
  label,
  value,
  sub,
  children,
  note,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  children?: React.ReactNode;
  note?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-accent p-6 text-white sm:p-7">
      <p className="text-sm text-white/80">{label}</p>
      <p className="mt-1 font-serif text-4xl font-semibold tracking-tight">{value}</p>
      {sub ? <p className="mt-1.5 text-sm text-white/75">{sub}</p> : null}
      {children ? (
        <dl className="mt-5 space-y-2 border-t border-white/20 pt-4 text-sm">{children}</dl>
      ) : null}
      {note ? <p className="mt-4 text-xs leading-5 text-white/65">{note}</p> : null}
    </div>
  );
}

/** One line in a ResultCard breakdown. */
export function ResultRow({
  label,
  value,
  strong,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4",
        strong && "border-t border-white/20 pt-2 font-semibold",
      )}
    >
      <dt className={cn(strong ? "text-white" : "text-white/80")}>{label}</dt>
      <dd className={cn("text-right tabular-nums", strong ? "text-white" : "font-medium")}>
        {value}
      </dd>
    </div>
  );
}

/** A small stat tile, for the grids of secondary metrics (DSCR, cap rate…). */
export function StatTile({
  label,
  value,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "warn" | "bad";
  hint?: string;
}) {
  const toneClass = {
    neutral: "text-ink",
    good: "text-[#15803d]",
    warn: "text-[#b45309]",
    bad: "text-[#b91c1c]",
  }[tone];
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs font-semibold tracking-wider text-muted uppercase">{label}</p>
      <p className={cn("mt-1.5 font-serif text-2xl font-semibold tabular-nums", toneClass)}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs leading-5 text-muted">{hint}</p> : null}
    </div>
  );
}

/** Full-width detail section under the calculator. */
export function DetailSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 first:mt-0">
      <h3 className="font-serif text-xl font-medium text-accent">{title}</h3>
      {description ? <p className="mt-1.5 text-sm leading-6 text-muted">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Scrollable data table with the site's article-table styling. */
export function DataTable({
  head,
  rows,
}: {
  head: React.ReactNode[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[34rem] text-sm">
        <thead>
          <tr className="bg-canvas text-left">
            {head.map((h, i) => (
              <th
                key={i}
                className={cn(
                  "px-4 py-3 font-semibold text-ink",
                  i > 0 && "text-right tabular-nums",
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-t border-line">
              {row.map((cell, c) => (
                <td
                  key={c}
                  className={cn(
                    "px-4 py-2.5 text-ink-soft",
                    c > 0 && "text-right tabular-nums",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Tab strip for switching between detail views. */
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === active}
          onClick={() => onChange(t.id)}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            t.id === active
              ? "border-accent bg-accent text-white"
              : "border-line-strong text-ink-soft hover:border-accent hover:text-accent",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
