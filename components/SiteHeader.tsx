import Link from "next/link";
import { Wordmark } from "./Wordmark";
import { MobileMenu } from "./MobileMenu";
import { ApplyLink } from "./ApplyLink";
import { SearchBar } from "./SearchBar";
import { PRIMARY_NAV } from "@/lib/routes";
import { CTA } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/85 backdrop-blur supports-[backdrop-filter]:bg-canvas/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
        <Wordmark />
        <nav className="ml-auto hidden items-center gap-6 lg:flex" aria-label="Primary">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5 lg:ml-6">
          <SearchBar />
          <ApplyLink className="hidden rounded-md bg-accent-2 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-2-hover sm:inline-flex">
            {CTA.label}
          </ApplyLink>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
