"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

type Plan = { id: string; name: string; price: string; cadence: string; description: string; features: readonly string[]; cta: string; href: string; featured?: boolean };

const SOLO: readonly Plan[] = [
  { id: "free", name: "Free", price: "₦0", cadence: "/ month", description: "Try VOII on your next meeting or lecture.", features: ["30 recordings a month", "Transcripts and summaries", "Lecture mode with noise filtering", "Basic search", "Export to PDF"], cta: "Start free", href: "/signup" },
  { id: "personal", name: "Personal", price: "₦8,500", cadence: "/ month", description: "For students and professionals.", features: ["150 recordings a month", "Full lecture notes with equations", "Notes emailed after every class", "Ask questions across all your notes", "Calendar bot and voice notes"], cta: "Choose Personal", href: "/signup", featured: true },
  { id: "pro", name: "Pro", price: "₦22,500", cadence: "/ month", description: "For freelancers and consultants.", features: ["500 recordings a month", "Client workspaces and contacts", "Public, expiring share links", "Tasks and follow-up drafts", "Priority support"], cta: "Choose Pro", href: "/signup" },
];

const TEAM: readonly Plan[] = [
  { id: "team", name: "Team", price: "₦18,000", cadence: "per user / month", description: "Shared conversations, projects and permissions.", features: ["Minimum 3 users", "Shared workspace and memory", "Roles and admin controls", "Audit logs and usage analytics", "Google Workspace support"], cta: "Bring your team", href: "/signup", featured: true },
  { id: "campus", name: "Campus & Enterprise", price: "Custom", cadence: "", description: "For universities, departments and large organisations.", features: ["Volume pricing per student or seat", "SSO and SCIM", "Dedicated infrastructure and SLA", "API access and custom integrations", "Priority onboarding"], cta: "Talk to us", href: "/contact" },
];

const ROWS: readonly [string, readonly boolean[]][] = [
  ["Record meetings and lectures", [true, true, true, true, true]],
  ["Lecture mode (noise filtering)", [true, true, true, true, true]],
  ["Equations in notes", [false, true, true, true, true]],
  ["Ask your notes", [false, true, true, true, true]],
  ["Client workspaces", [false, false, true, true, true]],
  ["Shared team workspace", [false, false, false, true, true]],
  ["SSO", [false, false, false, false, true]],
];

export default function PricingPage() {
  const [audience, setAudience] = useState<"solo" | "team">("solo");
  const plans = audience === "solo" ? SOLO : TEAM;
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="page-hero">
          <div className="wrap">
            <p className="eyebrow">Pricing</p>
            <h1>Start free. <em>Pay when it earns it.</em></h1>
            <p>Every plan includes lecture mode, sourced notes and exports. Student pricing is the Personal plan — no proof of enrolment needed.</p>
          </div>
        </section>
        <section className="paper section">
          <div className="wrap">
            <div className="seg" role="group" aria-label="Plan type">
              <button type="button" aria-pressed={audience === "solo"} onClick={() => setAudience("solo")}>Individuals & students</button>
              <button type="button" aria-pressed={audience === "team"} onClick={() => setAudience("team")}>Teams & campuses</button>
            </div>
            <div className="plans">
              {plans.map((plan) => (
                <article className={`plan ${plan.featured ? "plan--featured" : ""}`} key={plan.id}>
                  <h3>{plan.name}</h3>
                  <p>{plan.description}</p>
                  <div className="plan__price">{plan.price}{plan.cadence ? <small>{plan.cadence}</small> : null}</div>
                  <ul className="ticks">{plan.features.map((f) => <li key={f}>{f}</li>)}</ul>
                  <Link className="btn btn--primary" href={plan.href}>{plan.cta} <span aria-hidden="true">→</span></Link>
                </article>
              ))}
            </div>
            <div className="table-wrap">
              <table className="compare">
                <thead><tr><th scope="col">Compare</th>{[...SOLO, ...TEAM].map((p) => <th scope="col" key={p.id}>{p.name}</th>)}</tr></thead>
                <tbody>
                  {ROWS.map(([feature, values]) => (
                    <tr key={feature}>
                      <th scope="row">{feature}</th>
                      {values.map((v, i) => <td className={v ? "" : "no"} key={i}>{v ? "✓" : "—"}<span className="sr-only">{v ? "Included" : "Not included"}</span></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
