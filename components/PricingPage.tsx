"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { ArrowLink, PageKicker } from "@/components/MarketingPrimitives";

type PricingPlan = {
  id: string;
  name: string;
  price: string;
  cadence: string;
  description: string;
  includes: string;
  features: readonly string[];
  cta: string;
  featured?: boolean;
  note?: string;
};

const plans: readonly PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "₦0",
    cadence: "/ month",
    description: "Perfect for trying VOII.",
    includes: "A clear place to begin",
    features: ["30 recordings/month", "AI transcripts", "AI summaries", "Basic search", "Personal workspace", "1 project", "Export to PDF", "Community support"],
    cta: "Start for free",
    note: "No credit card required",
  },
  {
    id: "personal",
    name: "Personal",
    price: "₦8,500",
    cadence: "/ month",
    description: "For professionals and students.",
    includes: "Everything in Free, plus",
    features: ["150 recordings/month", "Unlimited projects", "AI chat with your knowledge", "Calendar integration", "Voice notes", "Priority processing", "Advanced search", "Meeting sharing"],
    cta: "Choose Personal",
    featured: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "₦22,500",
    cadence: "/ month",
    description: "For freelancers and consultants.",
    includes: "Everything in Personal, plus",
    features: ["500 recordings/month", "Client workspaces", "Client contacts", "Public meeting sharing", "Custom branding", "Task management", "AI follow-up drafts", "Email notifications", "Priority support"],
    cta: "Choose Pro",
  },
  {
    id: "team",
    name: "Team",
    price: "₦18,000",
    cadence: "per user / month",
    description: "For teams that need shared conversations, projects, and permissions.",
    includes: "Everything in Pro, plus",
    features: ["Minimum 3 users", "Shared workspace", "Team permissions", "Shared projects", "Team search", "Shared AI memory", "Organization dashboard", "Admin controls", "Audit logs", "Usage analytics", "Google Workspace support"],
    cta: "Bring in your team",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    cadence: "built around your organization",
    description: "For organizations that need security, controls, and custom integrations.",
    includes: "Everything in Team, plus",
    features: ["Unlimited usage", "SSO", "SCIM", "Dedicated infrastructure", "SLA", "Dedicated account manager", "Custom AI models", "Advanced security", "API access", "Custom integrations", "Priority onboarding"],
    cta: "Talk to VOII",
  },
] as const;

const comparisonRows = [
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

const questions = [
  ["What counts as a recording?", "One captured conversation counts as one recording. Every plan turns those conversations into searchable memory and organized work."],
  ["Can I start without a credit card?", "Yes. The Free plan is designed for trying VOII without a card, and you can move up when the work asks for more."],
  ["Can I move from Personal to Team?", "Yes. Start with your own work, then bring in the people and projects you choose when a shared workspace makes sense."],
];

export default function PricingPage() {
  const [openQuestion, setOpenQuestion] = useState<number | null>(0);

  return (
    <main className="marketing-page pricing-page bg-cream text-ink" id="main-content">
      <SiteHeader />
      <section className="pricing-hero">
        <div className="pricing-hero__meta"><span>VOII / PRICING</span><span>ONE PLATFORM / FIVE WAYS IN</span></div>
        <div className="pricing-hero__content"><PageKicker>Memory for the work ahead</PageKicker><h1>Choose the plan that fits how you <em>work.</em></h1><p>Start with Free to try VOII, choose Personal or Pro for individual and client work, then move to Team or Enterprise when your workspace is shared.</p></div>
        <div className="pricing-hero__note">Every plan includes VOII&apos;s core memory engine</div>
      </section>

      <section className="pricing-plans-section" id="plans" aria-labelledby="plans-title">
        <div className="pricing-plans-section__top"><div><PageKicker>Plans for different kinds of work</PageKicker><h2 id="plans-title">Start with memory. Grow into momentum.</h2><p className="pricing-plans-section__intro">The value is not in how many minutes you store. It is in what stays useful after the conversation ends.</p></div><span className="pricing-billing-note">All prices in NGN · billed monthly</span></div>
        <div className="pricing-grid">
          {plans.map((plan, index) => <motion.article className={`pricing-card ${plan.featured ? "pricing-card--featured" : ""}`} key={plan.id} layout transition={{ duration: 0.35 }}>
            {plan.featured ? <span className="pricing-card__flag">The clear next step</span> : null}
            <div className="pricing-card__head"><span className="pricing-card__name">{plan.name}</span><span className="pricing-card__index">0{index + 1}</span></div>
            <div className="pricing-card__price"><strong>{plan.price}</strong><small>{plan.cadence}</small></div>
            <p>{plan.description}</p>
            <p className="pricing-card__includes">{plan.includes}</p>
            <ul>{plan.features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
            {plan.note ? <p className="pricing-card__note">{plan.note}</p> : null}
            <Link className="pricing-card__cta" href={plan.id === "enterprise" ? "/contact" : "/signup"}>{plan.cta}<span aria-hidden="true">↗</span></Link>
          </motion.article>)}
        </div>
        <p className="pricing-plans-section__note">Every plan includes the core VOII memory engine: capture what was said, find it again, and turn it into organized work.</p>
      </section>

      <section className="pricing-comparison" aria-labelledby="comparison-title"><div className="pricing-comparison__top"><div><PageKicker>Feature comparison</PageKicker><h2 id="comparison-title">The thread stays intact as your work gets bigger.</h2></div><p>Start with the essentials, then add the collaboration, accountability, and control your work needs.</p></div><div className="pricing-comparison__scroll"><table><caption className="sr-only">VOII feature comparison across Free, Personal, Pro, Team, and Enterprise plans</caption><thead><tr><th scope="col">Feature</th>{plans.map((plan) => <th scope="col" key={plan.id}>{plan.name}</th>)}</tr></thead><tbody>{comparisonRows.map((row) => <tr key={row.feature}><th scope="row">{row.feature}</th>{row.values.map((included, index) => <td key={`${row.feature}-${plans[index].id}`} aria-label={`${plans[index].name}: ${included ? "included" : "not included"}`}>{included ? <span className="comparison-check" aria-hidden="true">✓</span> : <span className="comparison-dash" aria-hidden="true">—</span>}</td>)}</tr>)}</tbody></table></div></section>

      <section className="pricing-value-band"><div><PageKicker>Included in every plan</PageKicker><h2>Every plan includes VOII&apos;s core memory engine.</h2></div><div className="pricing-value-band__details"><p>Captured. Searchable. Organized.</p><p>Every conversation is captured, searchable, and transformed into organized work — so the value compounds after the call ends.</p><ArrowLink href="/how-it-works">See how the thread works</ArrowLink></div></section>

      <section className="faq-section" aria-labelledby="faq-title"><div className="faq-section__heading"><PageKicker>Questions worth asking</PageKicker><h2 id="faq-title">No surprises hidden in the small print.</h2></div><div className="faq-list">{questions.map(([question, answer], index) => <div className={`faq-row ${openQuestion === index ? "is-open" : ""}`} key={question}><button type="button" aria-expanded={openQuestion === index} onClick={() => setOpenQuestion(openQuestion === index ? null : index)}><span>0{index + 1}</span><strong>{question}</strong><i aria-hidden="true">{openQuestion === index ? "−" : "+"}</i></button><AnimatePresence initial={false}>{openQuestion === index ? <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>{answer}</motion.p> : null}</AnimatePresence></div>)}</div></section>
      <section className="dark-cta-band"><PageKicker>There is no perfect time to begin</PageKicker><h2>Start with the next conversation.</h2><ArrowLink href="/signup" inverse>Start with VOII</ArrowLink></section>
      <SiteFooter />
    </main>
  );
}
