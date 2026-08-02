import type { Metadata } from "next";
import { AUTHOR, COMPLIANCE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Russell D Smith",
  description:
    "Get in touch with Russell D Smith to talk through your mortgage options or start a pre-qualification.",
  alternates: { canonical: "/contact/" },
};

// Placeholders for Russell to fill in (kept obvious on purpose).
const CONTACT = {
  phone: "{{PHONE}}",
  email: "{{EMAIL}}",
  applyUrl: "{{APPLICATION_URL}}",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink">
        Let&rsquo;s talk about your mortgage
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">
        Whether you&rsquo;re just getting started or comparing options, {AUTHOR.name} can help you
        understand what you qualify for — with no pressure.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Call or text</h2>
          <p className="mt-2 text-lg font-medium text-ink">{CONTACT.phone}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Email</h2>
          <p className="mt-2 text-lg font-medium text-ink break-words">{CONTACT.email}</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-surface p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Start an application
        </h2>
        <p className="mt-2 text-ink-soft">
          Ready to move forward? Begin a secure pre-qualification at{" "}
          <span className="font-medium text-ink">{CONTACT.applyUrl}</span>.
        </p>
      </div>

      <p className="mt-10 max-w-2xl text-xs leading-5 text-muted">
        NMLS ID {COMPLIANCE.nmlsId}. {COMPLIANCE.disclaimer}
      </p>
    </div>
  );
}
