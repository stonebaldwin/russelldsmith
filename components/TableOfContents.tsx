"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { TocItem } from "@/lib/toc";

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive((e.target as HTMLElement).id);
          }
        }
      },
      { rootMargin: "0px 0px -75% 0px", threshold: 0 },
    );
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  if (items.length < 3) return null;

  return (
    <nav aria-label="Table of contents" className="text-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">On this page</p>
      <ul>
        {items.map((item) => (
          <li key={item.id} className={item.depth === 3 ? "ml-3" : ""}>
            <a
              href={`#${item.id}`}
              className={cn(
                "block border-l-2 py-1 pl-3 leading-snug transition-colors",
                active === item.id
                  ? "border-accent-2 font-medium text-accent"
                  : "border-line text-muted hover:border-line-strong hover:text-ink",
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
