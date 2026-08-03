import { RatingBadge } from "./RatingBadge";

const PILLARS = [
  {
    title: "Communication",
    body: "Clear, honest answers at every step — you always know exactly where your loan stands.",
  },
  {
    title: "Responsiveness",
    body: "Fast replies and a team that stays on top of your file so nothing slips through.",
  },
  {
    title: "Efficiency",
    body: "A proven process that gets you approved and to the closing table on time.",
  },
  {
    title: "Execution",
    body: "Creative strategies that solve tough scenarios — and actually close the deal.",
  },
];

/** "The best mortgage lender experience" — value-prop pillars + rating. */
export function ExperienceSection() {
  return (
    <section>
      <div className="border-b-2 border-accent/15 pb-2.5">
        <h2 className="font-serif text-2xl font-medium text-accent">
          The best mortgage lender experience
        </h2>
      </div>
      <p className="mt-3 max-w-2xl text-lg leading-8 text-ink-soft">
        Everything in the mortgage process comes down to two common denominators — communication and
        execution. That&rsquo;s where Russell and his team excel, creating the best purchase,
        building, and refinance experience.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((p) => (
          <div key={p.title} className="rounded-xl border border-line bg-surface p-6">
            <h3 className="font-serif text-lg font-medium text-accent">{p.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{p.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <RatingBadge />
      </div>
    </section>
  );
}
