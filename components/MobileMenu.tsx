"use client";

import { useState } from "react";
import Link from "next/link";
import { PRIMARY_NAV } from "@/lib/routes";
import { CTA } from "@/lib/site";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink hover:bg-line/60"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          )}
        </svg>
      </button>
      {open && (
        <div
          id="mobile-nav"
          className="absolute inset-x-0 top-16 border-b border-line bg-canvas shadow-sm"
        >
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4" aria-label="Primary mobile">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-base font-medium text-ink hover:bg-line/60"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={CTA.href}
              onClick={() => setOpen(false)}
              className="mt-2 rounded-md bg-accent-2 px-3 py-2.5 text-center text-base font-semibold text-white hover:bg-accent-2-hover"
            >
              {CTA.label}
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
