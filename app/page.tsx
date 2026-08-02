import Link from "next/link";
import { getAllPosts, getPostsByCategory } from "@/lib/content";
import { LANDING_PAGES } from "@/lib/routes";
import { HeroFeature } from "@/components/HeroFeature";
import { ArticleCard } from "@/components/ArticleCard";
import { SectionRail } from "@/components/SectionRail";
import { CtaBlock } from "@/components/CtaBlock";
import { JsonLd } from "@/components/JsonLd";
import { websiteJsonLd } from "@/lib/seo";

const HOME_RAILS = [
  { slug: "va-loans", title: "VA Loans" },
  { slug: "usda", title: "USDA Loans" },
  { slug: "fha", title: "FHA Loans" },
  { slug: "1st-time-buyers", title: "First-Time Buyers" },
];

export default function Home() {
  const posts = getAllPosts();

  if (!posts.length) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-serif text-3xl font-semibold text-ink">Russell D Smith</h1>
        <p className="mt-3 text-muted">Guides are being migrated. Check back shortly.</p>
      </div>
    );
  }

  const [hero, ...rest] = posts;
  const secondary = rest.slice(0, 2);
  const loanPrograms = LANDING_PAGES.filter((p) => p.kind === "loan");

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <JsonLd data={websiteJsonLd()} />
      <h1 className="sr-only">
        Russell D Smith — mortgage guides and loan insights
      </h1>

      {/* Lead story + secondary cards */}
      <section className="border-b border-line py-10 sm:py-14">
        <HeroFeature post={hero} />
        {secondary.length ? (
          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {secondary.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        ) : null}
      </section>

      {/* Loan-program quick links (internal links to high-authority pages) */}
      <nav aria-label="Loan programs" className="border-b border-line py-6">
        <ul className="flex flex-wrap gap-2.5">
          {loanPrograms.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/${p.slug}/`}
                className="inline-flex rounded-full border border-line-strong px-4 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent"
              >
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Topic rails */}
      <div className="space-y-16 py-14">
        {HOME_RAILS.map((rail) => (
          <SectionRail
            key={rail.slug}
            title={rail.title}
            href={`/blog/category/${rail.slug}/`}
            posts={getPostsByCategory(rail.slug).slice(0, 3)}
          />
        ))}

        <SectionRail title="Latest guides" href="/blog/" posts={posts.slice(0, 6)} />

        <CtaBlock />
      </div>
    </div>
  );
}
