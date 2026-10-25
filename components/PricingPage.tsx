"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { SiteHeader } from "@/components/SiteHeader";
import ArcFooter from "@/components/arc/Footer";
import { BOUNCE, Magnetic, Reveal, Squish } from "@/components/arc/motion";

type Plan = {
  id: string; name: string; price: string; cadence: string; description: string;
  includes: string; features: readonly string[]; cta: string; href: string;
  featured?: boolean; note?: string; tint?: string;
};

const SOLO: readonly Plan[] = [
  {
    id: "free", name: "Free", price: "₦0", cadence: "/ month",
    description: "Perfect for trying VOII.", includes: "A clear place to begin",
    features: ["30 recordings/month", "AI transcripts", "AI summaries", "Basic search", "Personal workspace", "1 project", "Export to PDF", "Community support"],
    cta: "Start for free", href: "/signup", note: "No credit card required",
  },
  {
    id: "personal", name: "Personal", price: "₦8,500", cadence: "/ month",
    description: "For professionals and students.", includes: "Everything in Free, plus",
    features: ["150 recordings/month", "Unlimited projects", "AI chat with your knowledge", "Calendar integration", "Voice notes", "Priority processing", "Advanced search", "Meeting sharing"],
    cta: "Choose Personal", href: "/signup", featured: true, tint: "var(--c-magenta)",
  },
  {
    id: "pro", name: "Pro", price: "₦22,500", cadence: "/ month",
    description: "For freelancers and consultants.", includes: "Everything in Personal, plus",
    features: ["500 recordings/month", "Client workspaces", "Client contacts", "Public meeting sharing", "Custom branding", "Task management", "AI follow-up drafts", "Email notifications", "Priority support"],
    cta: "Choose Pro", href: "/signup", tint: "var(--c-yellow)",
  },
];

const TEAM: readonly Plan[] = [
  {
    id: "team", name: "Team", price: "₦18,000", cadence: "per user / month",
    description: "For teams that need shared conversations, projects, and permissions.",
    includes: "Everything in Pro, plus",
    features: ["Minimum 3 users", "Shared workspace", "Team permissions", "Shared projects", "Team search", "Shared AI memory", "Organization dashboard", "Admin controls", "Audit logs", "Usage analytics", "Google Workspace support"],
    cta: "Bring in your team", href: "/signup", tint: "var(--c-blue)",
  },
  {
    id: "enterprise", name: "Enterprise", price: "Custom", cadence: "built around your organization",
    description: "For organizations that need security, controls, and custom integrations.",
    includes: "Everything in Team, plus",
    features: ["Unlimited usage", "SSO", "SCIM", "Dedicated infrastructure", "SLA", "Dedicated account manager", "Custom AI models", "Advanced security", "API access", "Custom integrations", "Priority onboarding"],
    cta: "Talk to VOII", href: "/contact", tint: "var(--c-magenta)",
  },
];

const ALL_PLANS = [...SOLO, ...TEAM] as const;

const CORE = [
  "Record any conversation", "AI transcripts", "AI summaries",
  "Search what was said", "Knowledge with its source", "Export to PDF",
];

const ROWS = [
  { feature: "Record meetings", values: [true, true, true, true, true] },
  { feature: "AI summaries", values: [true, true, true, true, true] },
  { feature: "Search conversations", values: [true, true, true, true, true] },
  { feature: "AI chat", values: [false, true, true, true, true] },
  { feature: "Voice notes", values: [false, true, true, true, true] },
  { feature: "Client workspaces", values: [false, false, true, true, true] },
  { feature: "Shared workspace", values: [false, false, false, true, true] },
  { feature: "Team permissions", values: [false, false, false, true, true] },
  { feature: "Analytics", values: [false, false, false, true, true] },
  { feature: "API", values: [false, false, false, false, true] },
  { feature: "SSO", values: [false, false, false, false, true] },
] as const;

const FAQ = [
  ["What counts as a recording?", "One captured conversation counts as one recording. Every plan turns those conversations into searchable memory and organized work."],
  ["Can I start without a credit card?", "Yes. The Free plan is designed for trying VOII without a card, and you can move up when the work asks for more."],
  ["Can I move from Personal to Team?", "Yes. Start with your own work, then bring in the people and projects you choose when a shared workspace makes sense."],
];

function PlanCard({ plan, wide = false }: { plan: Plan; wide?: boolean }) {
  return (
    <article
      className={`pr-card ${plan.featured ? "is-featured" : ""} ${wide ? "is-wide" : ""}`}
      style={{ "--tint": plan.tint ?? "var(--line-strong)" } as React.CSSProperties}
    >
      <header className="pr-card__top">
        <span className="pr-card__name">{plan.name}</span>
        {plan.featured ? <span className="pr-card__flag">Most chosen</span> : null}
      </header>

      <p className="pr-card__price">
        <strong>{plan.price}</strong>
        <small>{plan.cadence}</small>
      </p>
      <p className="pr-card__desc">{plan.description}</p>

      <Magnetic><Squish>
        <Link className="pr-card__cta" href={plan.href}>
          {plan.cta} <span aria-hidden="true">↗</span>
        </Link>
      </Squish></Magnetic>

      <p className="pr-card__includes">{plan.includes}</p>
      <ul className="pr-card__list">
        {plan.features.map((f) => (
          <li key={f}><span aria-hidden="true" />{f}</li>
        ))}
      </ul>
      {plan.note ? <p className="pr-card__note">{plan.note}</p> : null}
    </article>
  );
}

export default function PricingPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <main className="arc pr" id="main-content">
      <SiteHeader />

      <section className="pr-hero" aria-labelledby="pr-title">
        <p className="arc-kicker">Pricing</p>
        <h1 className="arc-in" id="pr-title">
          Start free.<br />Grow when the work asks for it.
        </h1>
        <p className="pr-hero__lede arc-in" style={{ "--d": "70ms" } as React.CSSProperties}>
          Every plan includes the core memory engine: capture what was said, find it again,
          and turn it into organized work.
        </p>
        <span className="pr-hero__chip arc-in" style={{ "--d": "140ms" } as React.CSSProperties}>
          All prices in NGN · billed monthly
        </span>
      </section>

      <section className="pr-plans" aria-label="Plans for individuals">
        <div className="pr-grid pr-grid--solo">
          {SOLO.map((p, i) => (
            <Reveal delay={i * 0.05} key={p.id}><PlanCard plan={p} /></Reveal>
          ))}
        </div>
        <div className="pr-grid pr-grid--team">
          {TEAM.map((p, i) => (
            <Reveal delay={i * 0.05} key={p.id}><PlanCard plan={p} wide /></Reveal>
          ))}
        </div>
      </section>

      <section className="pr-core" aria-labelledby="pr-core-title">
        <Reveal>
          <p className="arc-kicker">In every plan</p>
          <h2 id="pr-core-title">The engine never changes. Only how much of it you need.</h2>
        </Reveal>
        <ul className="pr-core__list">
          {CORE.map((c) => <li key={c}><span aria-hidden="true" />{c}</li>)}
        </ul>
      </section>

      <section className="pr-compare" aria-labelledby="pr-compare-title">
        <Reveal>
          <p className="arc-kicker">Feature comparison</p>
          <h2 id="pr-compare-title">The thread stays intact as the work gets bigger.</h2>
        </Reveal>

        <div className="pr-compare__scroll">
          <table>
            <caption className="sr-only">VOII feature comparison across all five plans</caption>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                {ALL_PLANS.map((p) => <th scope="col" key={p.id}>{p.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.feature}>
                  <th scope="row">{row.feature}</th>
                  {row.values.map((on, i) => (
                    <td key={`${row.feature}-${ALL_PLANS[i].id}`}>
                      <span className={on ? "pr-yes" : "pr-no"} aria-label={`${ALL_PLANS[i].name}: ${on ? "included" : "not included"}`}>
                        {on ? "✓" : "—"}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="pr-faq" aria-labelledby="pr-faq-title">
        <Reveal>
          <p className="arc-kicker">Questions worth asking</p>
          <h2 id="pr-faq-title">No surprises in the small print.</h2>
        </Reveal>

        <ul className="pr-faq__list">
          {FAQ.map(([q, a], i) => (
            <li className={open === i ? "is-open" : ""} key={q}>
              <button aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} type="button">
                <span className="pr-faq__n">0{i + 1}</span>
                <strong>{q}</strong>
                <i aria-hidden="true">{open === i ? "−" : "+"}</i>
              </button>
              <AnimatePresence initial={false}>
                {open === i ? (
                  <motion.div
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    initial={{ height: 0, opacity: 0 }}
                    style={{ overflow: "hidden" }}
                    transition={BOUNCE}
                  >
                    <p>{a}</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </li>
          ))}
        </ul>
      </section>

      <ArcFooter />
    </main>
  );
}
