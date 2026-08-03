import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LANDING_PAGES, LANDING_SLUGS } from "@/lib/routes";
import { getPostsMatching } from "@/lib/content";
import { SectionRail } from "@/components/SectionRail";
import { CtaBlock } from "@/components/CtaBlock";
import { ApplyLink } from "@/components/ApplyLink";
import { MortgageCalculator } from "@/components/MortgageCalculator";
import { VAFundingFeeTable } from "@/components/VAFundingFeeTable";
import { VideoPlayer } from "@/components/VideoPlayer";
import { getPlaylistForTopic } from "@/lib/youtube";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return LANDING_SLUGS.map((landing) => ({ landing }));
}

function findPage(slug: string) {
  return LANDING_PAGES.find((p) => p.slug === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ landing: string }>;
}): Promise<Metadata> {
  const { landing } = await params;
  const page = findPage(landing);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/${page.slug}/` },
  };
}

// Extra keyword hints for surfacing related guides per landing page.
const KEYWORDS: Record<string, string[]> = {
  "va-loans": ["va", "veteran", "irrrl", "funding fee"],
  "usda-loans": ["usda", "rural", "income limit"],
  "fha-loans": ["fha", "pmi", "credit score"],
  "renovation-loans": ["renovation", "rehab", "203k", "construction"],
  "construction-perm": ["construction", "build", "lot", "modular", "manufactured"],
  "down-payment-assistance": ["down payment", "assistance", "dpa", "grant", "first-time"],
  "reverse-mortgages": ["reverse", "hecm", "62"],
  "jumbo-loans": ["jumbo", "conforming loan limit", "high balance"],
  "investment-property-loans": ["rental", "investment", "dscr", "multifamily"],
  "mortgage-calculators": ["calculator", "payment", "afford"],
  "va-funding-fee-tables": ["va", "funding fee", "irrrl"],
};

export default async function LandingPage({
  params,
}: {
  params: Promise<{ landing: string }>;
}) {
  const { landing } = await params;
  const page = findPage(landing);
  if (!page) notFound();

  const related = getPostsMatching(KEYWORDS[page.slug] ?? [page.slug.replace(/-/g, " ")], {
    category: page.category,
    limit: 6,
  });
  const playlist = getPlaylistForTopic(page.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: page.title, url: `/${page.slug}/` },
        ])}
      />

      <header className="max-w-3xl">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          {page.title}
        </h1>
        <p className="mt-4 text-lg leading-8 text-ink-soft">{page.description}</p>
        <div className="mt-6">
          <ApplyLink className="inline-flex rounded-md bg-accent-2 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-2-hover">
            Get pre-qualified
          </ApplyLink>
        </div>
      </header>

      {page.slug === "mortgage-calculators" ? (
        <div className="mt-10">
          <MortgageCalculator />
        </div>
      ) : null}

      {page.slug === "va-funding-fee-tables" ? (
        <div className="mt-10">
          <VAFundingFeeTable />
        </div>
      ) : null}

      {playlist && playlist.videos.length ? (
        <section className="mt-16">
          <h2 className="border-b-2 border-accent/15 pb-2.5 font-serif text-2xl font-medium text-accent">
            Watch: {page.title} on video
          </h2>
          <p className="mt-3 max-w-2xl text-muted">
            {playlist.videos.length} short video guides from Russell&rsquo;s {page.title} series.
          </p>
          <div className="mt-6">
            <VideoPlayer playlist={playlist} />
          </div>
        </section>
      ) : null}

      {related.length ? (
        <div className="mt-16">
          <SectionRail
            title="Related guides"
            href={page.category ? `/blog/category/${page.category}/` : "/blog/"}
            posts={related}
          />
        </div>
      ) : null}

      <div className="mt-16">
        <CtaBlock />
      </div>
    </div>
  );
}
