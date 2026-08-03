import type { Metadata } from "next";
import { AUTHOR, CONTACT, COMPLIANCE } from "@/lib/site";
import { ApplyLink } from "@/components/ApplyLink";

export const metadata: Metadata = {
  title: "Contact Russell D Smith",
  description:
    "Get in touch with Russell D Smith to talk through your mortgage options or start a secure pre-qualification.",
  alternates: { canonical: "/contact/" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink">
        Let&rsquo;s talk about your mortgage
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">
        Whether you&rsquo;re just getting started or comparing options, {AUTHOR.name} can help you
        understand what you qualify for — with no pressure. Serving {AUTHOR.servingArea}.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <a
          href={CONTACT.phoneHref}
          className="block rounded-xl border border-line bg-surface p-6 transition-colors hover:border-accent"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Call or text</h2>
          <p className="mt-2 text-lg font-medium text-accent">{CONTACT.phone}</p>
        </a>
        <a
          href={CONTACT.emailHref}
          className="block rounded-xl border border-line bg-surface p-6 transition-colors hover:border-accent"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Email</h2>
          <p className="mt-2 text-lg font-medium break-words text-accent">{CONTACT.email}</p>
        </a>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-accent-pale p-6 sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-xl font-medium text-accent">Ready to get started?</h2>
          <p className="mt-1 text-ink-soft">
            Begin your secure pre-qualification through ALCOVA HomeHub.
          </p>
        </div>
        <ApplyLink className="mt-4 inline-flex shrink-0 rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-2-hover sm:mt-0">
          Get pre-qualified
        </ApplyLink>
      </div>

      <p className="mt-10 max-w-2xl text-xs leading-5 text-muted">
        {AUTHOR.name}, {AUTHOR.role} · NMLS #{COMPLIANCE.nmlsId}. {COMPLIANCE.disclaimer}
      </p>
    </div>
  );
}
