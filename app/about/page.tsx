import type { Metadata } from "next";
import { AUTHOR } from "@/lib/site";
import { CtaBlock } from "@/components/CtaBlock";
import { JsonLd } from "@/components/JsonLd";
import { personJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About Russell Smith",
  description: AUTHOR.bio,
  alternates: { canonical: "/about/" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <JsonLd data={personJsonLd()} />
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- local headshot */}
        <img
          src={AUTHOR.photo}
          alt={AUTHOR.name}
          className="h-20 w-20 shrink-0 rounded-full border border-line object-cover"
        />
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">{AUTHOR.name}</h1>
          <p className="text-muted">
            {AUTHOR.role} · NMLS #{AUTHOR.nmls}
          </p>
          <p className="text-sm text-muted">Serving {AUTHOR.servingArea}</p>
        </div>
      </div>

      <figure className="mt-8">
        {/* eslint-disable-next-line @next/next/no-img-element -- preserved local team photo */}
        <img
          src="/media/site/team-move-mortgage-about-page-pic.jpg"
          alt="Russell Smith and his mortgage team"
          className="w-full rounded-xl border border-line object-cover"
        />
        <figcaption className="mt-2 text-sm text-muted">
          Russell Smith and his mortgage team.
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
