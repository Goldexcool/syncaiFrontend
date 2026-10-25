import type { ReactNode } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import ArcFooter from "@/components/arc/Footer";
import { Reveal } from "@/components/arc/motion";

type LegalPageKind = "privacy" | "terms" | "contact" | "careers";

type Section = { id: string; h: string; body: ReactNode[] };

type Doc = {
  kicker: string; title: string; intro: string; tint: string;
  sections: Section[]; email?: string;
};

const DOCS: Record<LegalPageKind, Doc> = {
  privacy: {
    kicker: "Your work stays yours",
    title: "Privacy, in plain language.",
    intro:
      "VOII is built for conversations that become useful work. This page explains the principles we use to handle the information that makes that possible.",
    tint: "var(--c-blue)",
    sections: [
      {
        id: "keep", h: "What VOII is designed to keep",
        body: ["VOII keeps conversations, transcripts, decisions, tasks, and project context together so the work can continue after a call ends. Your workspace content is used to provide those product experiences, not to sell your information."],
      },
      {
        id: "control", h: "Control and deletion",
        body: ["You should be able to find, correct, export, and delete the work you keep in VOII. Production storage, retention periods, subprocessors, and deletion guarantees will be published before recording is enabled for general use."],
      },
      {
        id: "prototype", h: "A note about this prototype",
        body: ["This public site is a product prototype. Do not submit confidential recordings or personal information through the demonstration forms. If you have a privacy question, contact the VOII team."],
      },
    ],
  },
  terms: {
    kicker: "The agreement",
    title: "Clear terms for a clear workspace.",
    intro: "These are the rules for recording, storing, sharing, and managing work in VOII.",
    tint: "var(--c-yellow)",
    sections: [
      {
        id: "permission", h: "Use VOII for work you are allowed to share",
        body: ["Only record or upload conversations when you have the right permissions and have followed the laws and agreements that apply to the people involved. You are responsible for consent and for the content you bring into a workspace."],
      },
      {
        id: "account", h: "Keep your account secure",
        body: ["Use accurate account details, protect your login, and tell us if you believe someone has accessed your workspace without permission. Do not use VOII to store content that you are not allowed to retain."],
      },
      {
        id: "prelaunch", h: "Product terms before launch",
        body: ["These principles describe the intended product relationship. The final service agreement, plan terms, service limits, and support commitments will be published before paid plans become available."],
      },
    ],
  },
  contact: {
    kicker: "Talk to VOII",
    title: "Questions are part of the work.",
    intro:
      "Whether you are exploring VOII, planning a team rollout, or want to tell us what should happen next, we would like to hear from you.",
    tint: "var(--c-magenta)",
    email: "hello@voii.app",
    sections: [
      {
        id: "start", h: "Start a conversation",
        body: [
          "For product questions, early access, team conversations, or privacy requests, email the VOII team.",
          "We are building the product around the work that happens after the words. Your context is useful to us too.",
        ],
      },
    ],
  },
  careers: {
    kicker: "Build the work after the words",
    title: "Come make the next layer of VOII.",
    intro:
      "We are interested in people who care about thoughtful tools, useful systems, and the space where conversation becomes progress.",
    tint: "var(--c-blue)",
    email: "hello@voii.app",
    sections: [
      {
        id: "care", h: "Build with care",
        body: [
          "VOII is growing deliberately. We are drawn to product thinkers, engineers, designers, and operators who can make complex work feel calmer without making it smaller.",
          <>
            There are no open roles listed right now. If the way we think about this product
            resonates with you, <a href="mailto:hello@voii.app">say hello</a> and tell us what you
            would like to build.
          </>,
        ],
      },
    ],
  },
};

export default function LegalPage({ kind }: { kind: LegalPageKind }) {
  const doc = DOCS[kind];

  return (
    <main className={`arc lg lg--${kind}`} id="main-content" style={{ "--tint": doc.tint } as React.CSSProperties}>
      <SiteHeader />

      <section className="lg-hero" aria-labelledby="lg-title">
        <p className="arc-kicker">{doc.kicker}</p>
        <h1 className="arc-in" id="lg-title">{doc.title}</h1>
        <p className="lg-hero__lede arc-in" style={{ "--d": "70ms" } as React.CSSProperties}>{doc.intro}</p>
      </section>

      <div className="lg-body">
        {/* Contents rail — useful on a document, and it anchors the page. */}
        <nav className="lg-rail" aria-label="On this page">
          <span className="lg-rail__label">On this page</span>
          <ol>
            {doc.sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`}><i>0{i + 1}</i>{s.h}</a>
              </li>
            ))}
          </ol>
          {doc.email ? (
            <a className="lg-rail__mail" href={`mailto:${doc.email}`}>{doc.email} <span aria-hidden="true">↗</span></a>
          ) : null}
        </nav>

        <article className="lg-doc">
          {doc.sections.map((s, i) => (
            <Reveal className="lg-sec" delay={i * 0.04} key={s.id}>
              <h2 id={s.id}>
                <span className="lg-sec__n">0{i + 1}</span>
                {s.h}
              </h2>
              {s.body.map((b, j) => <p key={j}>{b}</p>)}
              {doc.email && s.id === "start" ? (
                <a className="lg-mail" href={`mailto:${doc.email}`}>
                  {doc.email} <span aria-hidden="true">↗</span>
                </a>
              ) : null}
            </Reveal>
          ))}

          <div className="lg-cta">
            <p>Ready to see it work?</p>
            <Link className="arc-btn arc-btn--go" href="/signup">
              Start with a conversation <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </article>
      </div>

      <ArcFooter />
    </main>
  );
}
