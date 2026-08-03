import type { Metadata } from "next";
import { AUTHOR } from "@/lib/site";
import { CtaBlock } from "@/components/CtaBlock";
import { Testimonials } from "@/components/Testimonials";
import { RatingBadge } from "@/components/RatingBadge";
import { JsonLd } from "@/components/JsonLd";
import { personJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About Russell Smith",
  description: AUTHOR.bio,
  alternates: { canonical: "/about/" },
};

const QUOTES = [
  {
    text: "Arise, shine; for thy light is come, and the glory of the Lord is risen upon thee.",
    cite: "Isaiah 60:1",
  },
  {
    text: "Going in one more round when you don't think you can. That's what makes all the difference in your life.",
    cite: "Rocky Balboa",
  },
  {
    text: "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.",
    cite: "Maya Angelou",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <JsonLd data={personJsonLd()} />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- local headshot */}
        <img
          src={AUTHOR.photo}
          alt={AUTHOR.name}
          className="h-24 w-24 shrink-0 rounded-full border border-line object-cover"
        />
        <div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink">{AUTHOR.name}</h1>
          <p className="mt-1 text-muted">
            {AUTHOR.role} · NMLS #{AUTHOR.nmls} · Serving {AUTHOR.servingArea}
          </p>
          <div className="mt-2">
            <RatingBadge />
          </div>
        </div>
      </div>

      <div className="article-body mt-8">
        <p>
          Thinking about buying, building, refinancing, renovating, or investing? Choose my
          team&rsquo;s top-notch experience. Reach out to start a discussion and experience the
          difference &mdash; communication, responsiveness, efficiency, and execution.
        </p>
        <p>
          I want to get to know our clients and their needs so that we can create a strategic plan.
          Our goal is to provide the solutions that make home ownership a reality and affordable for
          more people.
        </p>
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

      <section className="mt-12">
        <h2 className="font-serif text-2xl font-medium text-accent">Realtor benefits</h2>
        <div className="article-body mt-4">
          <p>
            Another area I focus on is providing top-level service and education to real estate
            professionals. Often a successful real estate sale starts with a high-level strategy
            discussion &mdash; even before the purchase process begins. By explaining potential
            strategies and pitfalls, a Realtor can pass that valuable information along to their
            buyer or seller. Realtors who provide education win more business, and I&rsquo;m here to
            help you do exactly that.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl font-medium text-accent">The personal side of Russell</h2>
        <div className="article-body mt-4">
          <p>
            Many know me through business, and that I work extremely hard to build an amazing
            mortgage experience for clients and business partners. And I do. But let&rsquo;s skip to
            the good part! Those close to me know I love and value my personal life. My favorite
            activities include travel &mdash; mountains, beach, cruises, and wherever the road leads
            &mdash; snow skiing, golf, and great restaurants.
          </p>
          <p>
            I have two children, Andrew and Anna, who are the loves of my life. It is a privilege to
            witness them grow into the amazing people they are. I am a Christian man and, even though
            I am not perfect, I will always strive to give a perfect effort. All things are possible
            through our Lord Jesus Christ, and above all I want to be the servant we are called to
            be.
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {QUOTES.map((q) => (
            <blockquote
              key={q.cite}
              className="rounded-xl border border-line bg-surface p-5 text-sm leading-6 text-ink-soft italic"
            >
              &ldquo;{q.text}&rdquo;
              <cite className="mt-2 block text-xs font-medium text-accent not-italic">
                &mdash; {q.cite}
              </cite>
            </blockquote>
          ))}
        </div>
      </section>

      <div className="mt-14">
        <Testimonials limit={6} />
      </div>

      <div className="mt-14">
        <CtaBlock title="Ready to get started?" />
      </div>
    </div>
  );
}
