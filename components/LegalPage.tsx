import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

type LegalPageKind = "privacy" | "terms" | "contact" | "careers";

const pageContent: Record<LegalPageKind, { kicker: string; title: string; intro: string }> = {
  privacy: {
    kicker: "Your work stays yours",
    title: "Privacy, in plain language.",
    intro: "VOII is built for conversations that become useful work. This page explains the principles we use to handle the information that makes that possible.",
  },
  terms: {
    kicker: "The agreement",
    title: "Clear terms for a clear workspace.",
    intro: "These are the rules for recording, storing, sharing, and managing work in VOII.",
  },
  contact: {
    kicker: "Talk to VOII",
    title: "Questions are part of the work.",
    intro: "Whether you are exploring VOII, planning a team rollout, or want to tell us what should happen next, we would like to hear from you.",
  },
  careers: {
    kicker: "Build the work after the words",
    title: "Come make the next layer of VOII.",
    intro: "We are interested in people who care about thoughtful tools, useful systems, and the space where conversation becomes progress.",
  },
};

function PrivacyContent() {
  return (
    <div className="legal-page__body">
      <h2>What VOII is designed to keep</h2>
      <p>VOII keeps conversations, transcripts, decisions, tasks, and project context together so the work can continue after a call ends. Your workspace content is used to provide those product experiences, not to sell your information.</p>
      <h2>Control and deletion</h2>
      <p>You should be able to find, correct, export, and delete the work you keep in VOII. Production storage, retention periods, subprocessors, and deletion guarantees will be published before recording is enabled for general use.</p>
      <h2>A note about this prototype</h2>
      <p>This public site is a product prototype. Do not submit confidential recordings or personal information through the demonstration forms. If you have a privacy question, contact the VOII team.</p>
    </div>
  );
}

function TermsContent() {
  return (
    <div className="legal-page__body">
      <h2>Use VOII for work you are allowed to share</h2>
      <p>Only record or upload conversations when you have the right permissions and have followed the laws and agreements that apply to the people involved. You are responsible for consent and for the content you bring into a workspace.</p>
      <h2>Keep your account secure</h2>
      <p>Use accurate account details, protect your login, and tell us if you believe someone has accessed your workspace without permission. Do not use VOII to store content that you are not allowed to retain.</p>
      <h2>Product terms before launch</h2>
      <p>These principles describe the intended product relationship. The final service agreement, plan terms, service limits, and support commitments will be published before paid plans become available.</p>
    </div>
  );
}

function ContactContent() {
  return (
    <div className="legal-page__body legal-page__body--contact">
      <h2>Start a conversation</h2>
      <p>For product questions, early access, team conversations, or privacy requests, email the VOII team.</p>
      <a className="legal-page__email" href="mailto:hello@voii.app">hello@voii.app <span aria-hidden="true">↗</span></a>
      <p>We are building the product around the work that happens after the words. Your context is useful to us too.</p>
    </div>
  );
}

function CareersContent() {
  return (
    <div className="legal-page__body">
      <h2>Build with care</h2>
      <p>VOII is growing deliberately. We are drawn to product thinkers, engineers, designers, and operators who can make complex work feel calmer without making it smaller.</p>
      <p>There are no open roles listed right now. If the way we think about this product resonates with you, <a href="mailto:hello@voii.app">say hello</a> and tell us what you would like to build.</p>
    </div>
  );
}

export default function LegalPage({ kind }: { kind: LegalPageKind }) {
  const content = pageContent[kind];

  return (
    <main className={`marketing-page legal-page legal-page--${kind} bg-cream text-ink`} id="main-content">
      <SiteHeader />
      <section className="legal-page__hero">
        <div className="legal-page__meta"><span>VOII / {kind.toUpperCase()}</span><span>THE WORK AFTER THE WORDS</span></div>
        <div className="legal-page__hero-content">
          <p className="eyebrow">{content.kicker}</p>
          <h1>{content.title}</h1>
          <p>{content.intro}</p>
        </div>
      </section>
      <section className="legal-page__content">
        {kind === "privacy" ? <PrivacyContent /> : null}
        {kind === "terms" ? <TermsContent /> : null}
        {kind === "contact" ? <ContactContent /> : null}
        {kind === "careers" ? <CareersContent /> : null}
        <Link className="arrow-link" href="/signup">Start with a conversation <span className="arrow-link__icon" aria-hidden="true">↗</span></Link>
      </section>
      <SiteFooter />
    </main>
  );
}
