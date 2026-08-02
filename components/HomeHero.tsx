import Link from "next/link";
import { CTA } from "@/lib/site";

/**
 * Homepage hero — modeled closely on the old teammovemortgage.com hero:
 * a deep-navy panel (Futura headline in light blue + Russell's quote) beside
 * the team photo. Full-bleed, edge to edge.
 */
export function HomeHero() {
  return (
    <section className="grid lg:grid-cols-2">
      <div className="flex flex-col justify-center bg-accent px-6 py-14 sm:px-10 lg:px-16 lg:py-24">
        <h1 className="font-serif text-4xl leading-[1.05] font-medium text-accent-light sm:text-5xl lg:text-6xl">
          Find A Mortgage
          <br />
          To Fit Your Life
        </h1>
        <p className="mt-8 max-w-lg text-lg leading-8 text-white/90">
          &ldquo;Everything in the mortgage process comes down to two common
          denominators &mdash; communication and execution. That&rsquo;s where we
          excel in creating the best purchase, building, &amp; refinance
          experience.&rdquo;
        </p>
        <p className="mt-6 font-serif text-xl font-medium text-accent-light">
          &mdash; Russell D Smith &mdash;
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href={CTA.href}
            className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent-light"
          >
            {CTA.label}
          </Link>
          <Link
            href="/blog/"
            className="rounded-md border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Explore guides
          </Link>
        </div>
      </div>

      <div className="relative min-h-[340px] bg-accent-deep lg:min-h-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- preserved local team photo */}
        <img
          src="/media/site/team-move-mortgage-pic.jpg"
          alt="Russell D Smith and his mortgage team"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      </div>
    </section>
  );
}
