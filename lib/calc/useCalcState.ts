"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Value = number | string | boolean;
export type CalcValues = Record<string, Value>;

/**
 * Calculator state, with the whole scenario mirrored into the query string so a
 * visitor (or Russell) can copy the URL and send someone the exact numbers.
 *
 * Reads the URL once on mount and writes back with history.replaceState — no
 * router involvement, so it works on these statically prerendered pages and
 * never pushes entries onto the back button.
 */
export function useCalcState<T extends CalcValues>(defaults: T) {
  const [values, setValues] = useState<T>(defaults);
  const defaultsRef = useRef(defaults);

  // Seed from the URL on mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (![...params.keys()].length) return;
    const next = { ...defaultsRef.current };
    let changed = false;
    for (const [key, fallback] of Object.entries(defaultsRef.current)) {
      const raw = params.get(key);
      if (raw === null) continue;
      if (typeof fallback === "number") {
        const n = parseFloat(raw);
        if (Number.isFinite(n)) {
          (next as CalcValues)[key] = n;
          changed = true;
        }
      } else if (typeof fallback === "boolean") {
        (next as CalcValues)[key] = raw === "1" || raw === "true";
        changed = true;
      } else {
        (next as CalcValues)[key] = raw;
        changed = true;
      }
    }
    if (changed) setValues(next);
  }, []);

  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** Replace several fields at once — used by linked inputs (down $ ↔ down %). */
  const patch = useCallback((changes: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...changes }));
  }, []);

  const reset = useCallback(() => {
    setValues(defaultsRef.current);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  /** Only non-default values go in the URL, so shared links stay readable. */
  const shareUrl = useCallback(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(values)) {
      const fallback = defaultsRef.current[key];
      if (value === fallback) continue;
      params.set(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
    }
    const query = params.toString();
    const { origin, pathname } = window.location;
    return query ? `${origin}${pathname}?${query}` : `${origin}${pathname}`;
  }, [values]);

  // Keep the address bar in step, so a plain copy-paste of the URL also works.
  useEffect(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(values)) {
      const fallback = defaultsRef.current[key];
      if (value === fallback) continue;
      params.set(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
    }
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      query ? `${window.location.pathname}?${query}` : window.location.pathname,
    );
  }, [values]);

  return { values, set, patch, reset, shareUrl };
}
