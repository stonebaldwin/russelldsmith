import Link from "next/link";
import { PRIMARY_NAV } from "@/lib/routes";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
      <p className="font-serif text-6xl font-semibold text-accent">404</p>
      <h1 className="mt-4 font-serif text-2xl font-semibold text-ink">Page not found</h1>
      <p className="mt-3 text-muted">
        The page you&rsquo;re looking for may have moved. Try one of these:
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        <Link
          href="/"
          className="rounded-full border border-line-strong px-4 py-1.5 text-sm font-medium text-ink-soft hover:border-accent hover:text-accent"
        >
          Home
        </Link>
        {PRIMARY_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-full border border-line-strong px-4 py-1.5 text-sm font-medium text-ink-soft hover:border-accent hover:text-accent"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
