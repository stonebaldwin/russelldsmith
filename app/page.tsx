import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, getPostsByCategory } from "@/lib/content";
import { LANDING_PAGES } from "@/lib/routes";
import { HomeHero } from "@/components/HomeHero";
import { ArticleCard } from "@/components/ArticleCard";
import { SectionRail } from "@/components/SectionRail";
import { CtaBlock } from "@/components/CtaBlock";
import { VideoSection } from "@/components/VideoSection";
import { ExperienceSection } from "@/components/ExperienceSection";
import { Testimonials } from "@/components/Testimonials";
import { JsonLd } from "@/components/JsonLd";
import { websiteJsonLd, localBusinessJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const HOME_RAILS = [
  { slug: "va-loans", title: "VA Loans" },
  { slug: "usda", title: "USDA Loans" },
  { slug: "fha", title: "FHA Loans" },
  { slug: "1st-time-buyers", title: "First-Time Buyers" },
];

export default function Home() {
  const posts = getAllPosts();
  const loanPrograms = LANDING_PAGES.filter((p) => p.kind === "loan");

  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={localBusinessJsonLd()} />
      <HomeHero />

      {/* Loan-program band */}
      <section className="bg-accent-pale">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <h2 className="font-serif text-2xl font-medium text-accent">Explore loan programs</h2>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {loanPrograms.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/${p.slug}/`}
                  className="inline-flex rounded-full border border-accent/20 bg-white px-4 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The best mortgage lender experience */}
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <ExperienceSection />
      </div>

      {/* Resources / blog */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between border-b-2 border-accent pt-14 pb-3">
          <h2 className="font-serif text-3xl font-medium text-accent sm:text-4xl">
            Resources from Russell Smith
          </h2>
          <Link
            href="/blog/"
            className="hidden shrink-0 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-2-hover sm:inline-flex"
          >
            View Blog
          </Link>
        </div>

        {posts.length ? (
          <div className="space-y-16 py-14">
            <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {posts.slice(0, 3).map((post) => (
                <ArticleCard key={post.slug} post={post} priority />
              ))}
            </div>

            {HOME_RAILS.map((rail) => (
              <SectionRail
                key={rail.slug}
                title={rail.title}
                href={`/blog/category/${rail.slug}/`}
                posts={getPostsByCategory(rail.slug).slice(0, 3)}
              />
            ))}

            <SectionRail title="Latest guides" href="/blog/" posts={posts.slice(0, 6)} />

            <VideoSection />

            <Testimonials title="What our clients think" limit={6} />

            <CtaBlock />
          </div>
        ) : (
          <p className="py-16 text-muted">Guides are being migrated. Check back shortly.</p>
        )}
      </div>
    </>
  );
}
