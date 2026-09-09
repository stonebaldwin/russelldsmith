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

      <p className="mt-6 font-serif text-xl leading-8 font-medium text-accent">
        Mortgage strategist. Family man. Business builder. Lifelong improver. Professional
        problem-solver.
      </p>

      {/* Portrait photo sits beside the copy rather than above it: Russell's
          photos are 3:4, and a full-width portrait would tower over the page. */}
      <div className="mt-8 grid gap-8 sm:grid-cols-[1fr_260px] sm:items-start">
        <div className="article-body">
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
        <figure className="sm:sticky sm:top-24">
          {/* eslint-disable-next-line @next/next/no-img-element -- local portrait */}
          <img
            src="/media/site/russell-smith-alcova-mortgage-branch-partner.webp"
            alt="Russell Smith, Branch Partner at ALCOVA Mortgage"
            className="w-full rounded-xl border border-line object-cover"
          />
          <figcaption className="mt-2 text-sm text-muted">
            Russell at the ALCOVA Mortgage office.
          </figcaption>
        </figure>
      </div>

      {/* Russell's own closing line — the most persuasive thing on the page, so
          it sits high rather than buried at the bottom. */}
      <blockquote className="mt-10 rounded-xl border border-line bg-accent-pale p-6 sm:p-8">
        <p className="font-serif text-lg leading-8 text-ink-soft italic sm:text-xl">
          &ldquo;After 32 years in the mortgage industry, I am now helping my clients&rsquo; children
          achieve their real estate dreams. I am looking forward to working with you for maybe your
          first home, your second, and possibly your investment home. As we get to know one another,
          just know it is a sincere privilege to become your loan officer for life.&rdquo;
        </p>
        <cite className="mt-4 block font-serif text-base font-medium text-accent not-italic">
          &mdash; {AUTHOR.name}
        </cite>
      </blockquote>

      <section className="mt-12">
        <h2 className="font-serif text-2xl font-medium text-accent">How I work</h2>
        <div className="article-body mt-4">
          <p>
            I&rsquo;m a lifelong improver, always looking for a better way to run an experience, a
            process, or myself. I geek out over creative financing strategies and the details that
            help people reach their goals.
          </p>
          <p>
            I always pull for the underdog &mdash; probably why I love Rocky, who fights through
            adversity and never stops moving forward. I&rsquo;m constantly quoting
            &ldquo;Rockyisms.&rdquo; Ask me about them.
          </p>
        </div>
      </section>

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
        <figure className="mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- local photo */}
          <img
            src="/media/site/russell-smith-mortgage-education-panel.webp"
            alt="Russell Smith recording an industry panel discussion with other mortgage professionals"
            loading="lazy"
            className="w-full rounded-xl border border-line object-cover"
          />
          <figcaption className="mt-2 text-sm text-muted">
            Talking strategy with fellow industry professionals.
          </figcaption>
        </figure>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl font-medium text-accent">The personal side of Russell</h2>
        <div className="article-body mt-4">
          <p>
            Many know me through business, and that I work extremely hard to build an amazing
            mortgage experience for clients and business partners. And I do. But let&rsquo;s skip to
            the good part!
          </p>
        </div>

        <div className="mt-8 space-y-8">
          <div>
            <h3 className="font-serif text-lg font-medium text-accent">Family</h3>
            <div className="article-body mt-2">
              <p>
                Newly married to my blessing, Caroline &mdash; together we&rsquo;re building a
                blended family with Andrew (also a loan officer on our team), Anna Lake, Brynnan,
                Drayton, and Harper, plus grandchildren Oakland and Ollie. At home, it&rsquo;s a
                happy houseful: Kash the Goldendoodle, Buddy the Yorkiepoo, Neko the cat, and
                currently six ducks.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-lg font-medium text-accent">Roots</h3>
            <div className="article-body mt-2">
              <p>
                Born in Danville, Virginia, and raised in southeastern North Carolina. Caroline and I
                call Whiteville home &mdash; Baseball Town USA, where my Waccamaw Academy class of
                twelve still stays connected today. I&rsquo;m a UNC Wilmington graduate, by way of
                Southeastern Community College.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-lg font-medium text-accent">Faith and foundation</h3>
            <div className="article-body mt-2">
              <p>
                My faith in Jesus guides my life, and I love recognizing the everyday moments when
                &ldquo;We Saw God Today.&rdquo; My parents, Dwight Smith and Libba Tait, taught me
                early: effort costs nothing &mdash; work hard, treat people right. I&rsquo;m one of
                three kids; my brother Jason is a Marine Corps veteran and musician, and my sister
                Amy leads our mortgage team as its sharpest processor.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-lg font-medium text-accent">Outside the office</h3>
            <div className="article-body mt-2">
              <p>
                Staying active keeps me young &mdash; working out, golfing, swimming, Bingo with my
                wife (it&rsquo;s a sport), or a game of make-believe with Harper, where I&rsquo;m
                known as &ldquo;Big Russ.&rdquo; I love traveling with my family, from Bald Head
                Island to Charleston, Savannah, Disney, Nashville, and skiing in Utah. I also
                invented Take the Lake Extreme, because apparently enjoying a lake wasn&rsquo;t
                challenging enough.
              </p>
            </div>
          </div>
        </div>

        <figure className="mt-8">
          {/* eslint-disable-next-line @next/next/no-img-element -- local family photo */}
          <img
            src="/media/site/russell-smith-family-coastal-carolina.webp"
            alt="Russell Smith with his family at a coastal North Carolina venue"
            loading="lazy"
            className="w-full rounded-xl border border-line object-cover"
          />
          <figcaption className="mt-2 text-sm text-muted">
            Family is the good part &mdash; home on the Carolina coast.
          </figcaption>
        </figure>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
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

      <section className="mt-12">
        <h2 className="font-serif text-2xl font-medium text-accent">What matters most to me</h2>
        <div className="article-body mt-4">
          <p>
            My constant goal is to surprise my wife, make sure my family knows they are loved and
            supported, and work extremely hard &mdash; and smart &mdash; to help my clients, team
            members, and business partners achieve their goals.
          </p>
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
