import type { Metadata } from "next";
import { CALCULATORS, calculatorPath } from "@/lib/calculators";
import { getPostsMatching } from "@/lib/content";
import { CalculatorCards } from "@/components/CalculatorCards";
import { SectionRail } from "@/components/SectionRail";
import { CtaBlock } from "@/components/CtaBlock";
import { ApplyLink } from "@/components/ApplyLink";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, absoluteUrl } from "@/lib/seo";

/**
 * /mortgage-calculators/ — the calculator hub.
 *
 * This URL is a 301 destination for the old site's /mortgage-calculators/
 * (68 referring domains), so it must stay a live 200 forever. It lists Russell's
 * whole RebelIQ suite; each calculator gets its own page so it can rank for its
 * own intent ("VA loan calculator", "DSCR calculator", …).
 *
 * NB: "mortgage-calculators" is deliberately excluded from the [landing] route's
 * static params (see CUSTOM_LANDING_ROUTES in lib/routes.ts) so this static
 * route owns the path.
 */

export const metadata: Metadata = {
  title: "Mortgage Calculators",
  description:
    "Free mortgage calculators from Russell Smith: monthly payment, VA loan, home affordability, refinance, rent vs. buy, DSCR rental, and seller net proceeds.",
  alternates: { canonical: "/mortgage-calculators/" },
};

export default function CalculatorsHub() {
  const related = getPostsMatching(["calculator", "payment", "afford", "closing costs"], {
    limit: 6,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: "Mortgage Calculators", url: "/mortgage-calculators/" },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Mortgage calculators",
          itemListElement: CALCULATORS.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.title,
            url: absoluteUrl(calculatorPath(c.slug)),
          })),
        }}
      />

      <header className="max-w-3xl">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Mortgage Calculators
        </h1>
        <p className="mt-4 text-lg leading-8 text-ink-soft">
          Run your own numbers before you talk to anyone. Seven calculators covering the questions
          buyers, sellers, and investors ask most — payment, affordability, VA, refinance, rent vs.
          buy, rental cash flow, and seller proceeds. All free, no signup, no SSN.
        </p>
        <div className="mt-6">
          <ApplyLink className="inline-flex rounded-md bg-accent-2 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-2-hover">
            Get pre-qualified
          </ApplyLink>
        </div>
      </header>

      <section className="mt-12">
        <h2 className="border-b-2 border-accent/15 pb-2.5 font-serif text-2xl font-medium text-accent">
          Pick a calculator
        </h2>
        <div className="mt-6">
          <CalculatorCards />
        </div>
      </section>

      {related.length ? (
        <div className="mt-16">
          <SectionRail title="Related guides" href="/blog/" posts={related} />
        </div>
      ) : null}

      <div className="mt-16">
        <CtaBlock
          title="Numbers look close? Let's make them real."
          body="Send Russell your scenario and get a straight answer on what you actually qualify for."
        />
      </div>
    </div>
  );
}
