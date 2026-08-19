"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { groupDigits, parseNumber } from "@/lib/calc/format";

/* ------------------------------------------------------------------ */
/* Layout helpers                                                      */
/* ------------------------------------------------------------------ */

export function FieldGroup({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {title ? (
        <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted uppercase">{title}</h3>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

/** Full-width child inside a FieldGroup's two-column grid. */
export function FieldWide({ children }: { children: React.ReactNode }) {
  return <div className="sm:col-span-2">{children}</div>;
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-soft">
      {children}
    </label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs leading-5 text-muted">{children}</p>;
}

/* ------------------------------------------------------------------ */
/* Numeric input                                                       */
/* ------------------------------------------------------------------ */

/**
 * A number field that keeps its own display string so typing feels normal
 * (thousands separators, partial input like "6." while you're mid-decimal), and
 * re-syncs whenever the value is changed from outside — which linked fields do,
 * e.g. editing the down-payment percent rewrites the dollar field.
 */
function NumberInput({
  id,
  value,
  onChange,
  prefix,
  suffix,
  step,
  grouped,
}: {
  id: string;
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  grouped?: boolean;
}) {
  const format = (n: number) => (grouped ? groupDigits(n) : String(n));
  const [text, setText] = useState(() => format(value));
  const [lastValue, setLastValue] = useState(value);

  // Adjust the display when `value` changes from outside — React's documented
  // pattern for derived state, and correct here where an effect would be a
  // frame late (see react.dev "You Might Not Need an Effect").
  if (value !== lastValue) {
    setLastValue(value);
    if (parseNumber(text) !== value) setText(format(value));
  }

  return (
    <span className="mt-1 flex items-center rounded-md border border-line-strong bg-surface focus-within:border-accent-2">
      {prefix ? <span className="pl-3 text-sm text-muted">{prefix}</span> : null}
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={text}
        step={step}
        onChange={(e) => {
          setText(e.target.value);
          onChange(parseNumber(e.target.value));
        }}
        onBlur={() => setText(format(parseNumber(text)))}
        className="w-full min-w-0 bg-transparent px-3 py-2 text-ink outline-none"
      />
      {suffix ? <span className="pr-3 text-sm text-muted">{suffix}</span> : null}
    </span>
  );
}

export function CurrencyField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  hint?: React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <NumberInput id={id} value={value} onChange={onChange} prefix="$" grouped />
      {hint ? <Hint>{hint}</Hint> : null}
    </div>
  );
}

export function PercentField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  hint?: React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <NumberInput id={id} value={value} onChange={onChange} suffix="%" />
      {hint ? <Hint>{hint}</Hint> : null}
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  hint?: React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <NumberInput id={id} value={value} onChange={onChange} suffix={suffix} />
      {hint ? <Hint>{hint}</Hint> : null}
    </div>
  );
}

/** Percent field with a slider — good for down payment and time horizons. */
export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  hint?: React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <NumberInput id={id} value={value} onChange={onChange} suffix={suffix} />
      <input
        type="range"
        aria-label={`${label} slider`}
        min={min}
        max={max}
        step={step}
        value={Math.min(Math.max(value, min), max)}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line-strong accent-accent-2"
      />
      {hint ? <Hint>{hint}</Hint> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Choices                                                             */
/* ------------------------------------------------------------------ */

export function SelectField<T extends string | number>({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  hint?: React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={String(value)}
        onChange={(e) => {
          const picked = options.find((o) => String(o.value) === e.target.value);
          if (picked) onChange(picked.value);
        }}
        className="mt-1 w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-ink outline-none focus:border-accent-2"
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
      {hint ? <Hint>{hint}</Hint> : null}
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div>
      {label ? (
        <span className="block text-sm font-medium text-ink-soft">{label}</span>
      ) : null}
      <div
        role="group"
        aria-label={label}
        className={cn(
          "flex overflow-hidden rounded-md border border-line-strong",
          label && "mt-1",
        )}
      >
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium transition-colors",
              o.value === value
                ? "bg-accent text-white"
                : "bg-surface text-ink-soft hover:bg-accent-pale",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ToggleField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-strong accent-accent-2"
        />
        <span className="text-sm font-medium text-ink-soft">{label}</span>
      </label>
      {hint ? <Hint>{hint}</Hint> : null}
    </div>
  );
}

/** "Advanced options" disclosure — collapsed by default. */
export function Advanced({
  children,
  label = "Advanced options",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-line pt-5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-semibold text-accent-2 hover:text-accent-2-hover"
      >
        {label}
        <span aria-hidden="true" className={cn("transition-transform", open && "rotate-180")}>
          ▾
        </span>
      </button>
      {open ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div> : null}
    </div>
  );
}
