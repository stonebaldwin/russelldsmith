import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CALCULATORS,
  CALCULATOR_SLUGS,
  calculatorPath,
  getCalculator,
} from "@/lib/calculators";
import { getPostsMatching } from "@/lib/content";
import { CalculatorPanel } from "@/components/CalculatorPanel";
import { SectionRail } from "@/components/SectionRail";
import { CtaBlock } from "@/components/CtaBlock";
import { ApplyLink } from "@/components/ApplyLink";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

/** One page per calculator — each targets its own search intent. */

export const dynamicParams = false;

export function generateStaticParams() {
  return CALCULATOR_SLUGS.map((tool) => ({ tool }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const { tool } = await params;
  const calc = getCalculator(tool);
  if (!calc) return {};
  return {
    title: calc.title,
    description: calc.description,
    alternates: { canonical: calculatorPath(calc.slug) },
  };
}

export default async function CalculatorPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool } = await params;
  const calc = getCalculator(tool);
  if (!calc) notFound();

  const related = getPostsMatching(calc.keywords, { limit: 3 });
  const others = CALCULATORS.filter((c) => c.slug !== calc.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: "Mortgage Calculators", url: "/mortgage-calculators/" },
          { name: calc.title, url: calculatorPath(calc.slug) },
        ])}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/mortgage-calculators/" className="font-medium text-accent-2 hover:underline">
          ← All calculators
        </Link>
      </nav>

      <header className="mt-5 max-w-3xl">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          {calc.title}
        </h1>
        <p className="mt-4 text-lg leading-8 text-ink-soft">{calc.description}</p>
      </header>

      <div className="mt-8">
        <CalculatorPanel calculator={calc} />
      </div>

      {calc.seeAlso?.length ? (
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {calc.seeAlso.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="inline-flex rounded-md border border-accent/25 px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:border-accent hover:bg-accent-pale/50"
            >
              {s.label}
            </Link>
          ))}
          <ApplyLink className="inline-flex rounded-md border border-accent/25 px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:border-accent hover:bg-accent-pale/50">
            Get pre-qualified
          </ApplyLink>
        </div>
      ) : null}

      <section className="mt-16">
        <h2 className="border-b-2 border-accent/15 pb-2.5 font-serif text-2xl font-medium text-accent">
          Other calculators
        </h2>
        <ul className="mt-5 flex flex-wrap gap-2.5">
          {others.map((c) => (
            <li key={c.slug}>
              <Link
                href={calculatorPath(c.slug)}
                className="inline-flex rounded-full border border-line-strong px-4 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent"
              >
                {c.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {related.length ? (
        <div className="mt-16">
          <SectionRail title="Related guides" href="/blog/" posts={related} />
        </div>
      ) : null}

      <div className="mt-16">
        <CtaBlock />
      </div>
    </div>
  );
}
