import type { Metadata } from "next";
import { AUTHOR, SITE } from "@/lib/site";
import { CtaBlock } from "@/components/CtaBlock";
import { JsonLd } from "@/components/JsonLd";
import { personJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About Russell D Smith",
  description: AUTHOR.bio,
  alternates: { canonical: "/about/" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <JsonLd data={personJsonLd()} />
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-accent font-serif text-lg font-semibold text-white"
        >
          {SITE.shortName}
        </span>
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">{AUTHOR.name}</h1>
          <p className="text-muted">{AUTHOR.role}</p>
        </div>
      </div>

      <figure className="mt-8">
        {/* eslint-disable-next-line @next/next/no-img-element -- preserved local team photo */}
        <img
          src="/media/site/team-move-mortgage-about-page-pic.jpg"
          alt="Russell D Smith and his mortgage team"
          className="w-full rounded-xl border border-line object-cover"
        />
        <figcaption className="mt-2 text-sm text-muted">
          Russell D Smith and his mortgage team.
        </figcaption>
      </figure>

      <div className="article-body mt-8">
        <p>{AUTHOR.bio}</p>
        <p>
          This site is a library of practical mortgage guidance — plain-English answers to the
          questions buyers actually ask about VA, USDA, FHA, conventional, construction, jumbo, and
          investment property financing. If you have a specific scenario, the best next step is to
          reach out directly.
        </p>
      </div>

      <div className="mt-12">
        <CtaBlock title="Have a question about your situation?" />
      </div>
    </div>
  );
}
