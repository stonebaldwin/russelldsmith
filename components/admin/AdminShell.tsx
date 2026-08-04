"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: GridIcon, exact: true },
  { href: "/admin/posts/new", label: "New post", icon: PlusIcon },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-line bg-white lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            RS
          </span>
          <span className="font-semibold text-ink">Russell Smith</span>
          <span className="ml-auto rounded bg-accent-pale px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
            CMS
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-accent text-white" : "text-ink-soft hover:bg-accent-pale hover:text-accent"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-line p-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-accent-pale hover:text-accent"
          >
            <ExternalIcon className="h-[18px] w-[18px]" />
            View site
          </a>
          <button
            onClick={logout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <LogoutIcon className="h-[18px] w-[18px]" />
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white">
            RS
          </span>
          <span className="font-semibold text-ink">CMS</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/posts/new" className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white">
            New
          </Link>
          <button onClick={logout} className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink-soft">
            Sign out
          </button>
        </div>
      </header>

      <div className="flex-1 pt-14 lg:pl-60 lg:pt-0">{children}</div>
    </div>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" />
    </svg>
  );
}
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}
function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4H4.5A1.5 1.5 0 003 5.5v10A1.5 1.5 0 004.5 17h10a1.5 1.5 0 001.5-1.5V13" />
      <path d="M12 3h5v5M17 3l-8 8" />
    </svg>
  );
}
function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 17H5a2 2 0 01-2-2V5a2 2 0 012-2h3" />
      <path d="M13 14l4-4-4-4M17 10H8" />
    </svg>
  );
}
