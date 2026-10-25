"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import ArcFooter from "@/components/arc/Footer";
import { Magnetic, Reveal, Squish } from "@/components/arc/motion";
import { personaCopy, type PersonaId } from "@/lib/story";

/**
 * All four audiences carry equal weight, so they get equal space: a 2×2 of
 * full cards rather than a tab strip that hides three of them. Each card
 * shows the object that audience actually ends up with.
 */

const DETAIL: Record<PersonaId, {
  kicker: string; tint: string; stat: string; statLabel: string; scene: string;
}> = {
  individual: {
    kicker: "For your own work", tint: "var(--c-blue)",
    stat: "1 thread", statLabel: "from thought to next move",
    scene: "A voice note at 11pm",
  },
  student: {
    kicker: "For learning together", tint: "var(--c-yellow)",
    stat: "4 ideas", statLabel: "kept after the room empties",
    scene: "A seminar you can’t re-attend",
  },
  freelancer: {
    kicker: "For client work", tint: "var(--c-magenta)",
    stat: "3 promises", statLabel: "with owners and dates",
    scene: "A client call with three promises in it",
  },
  organization: {
    kicker: "For the whole organization", tint: "var(--c-blue)",
    stat: "1 source", statLabel: "everyone can return to",
    scene: "A kickoff nobody wrote up",
  },
};

const IDS: PersonaId[] = ["individual", "student", "freelancer", "organization"];

const PRINCIPLES = [
  { title: "Keep the source.", copy: "Open any decision or task and return to the conversation that created it." },
  { title: "Keep it human.", copy: "VOII reduces the cleanup after a call, so people can spend time on the work itself." },
  { title: "Keep moving.", copy: "Owners and due dates turn conversation notes into work someone can act on." },
];

export default function ForYouPage() {
  return (
    <main className="arc fy" id="main-content">
      <SiteHeader />

      <section className="fy-hero" aria-labelledby="fy-title">
        <p className="arc-kicker">For you</p>
        <h1 className="arc-in" id="fy-title">Different work. The same <em>thread.</em></h1>
        <p className="fy-hero__lede arc-in" style={{ "--d": "70ms" } as React.CSSProperties}>
          Use VOII for your own notes, classes, client work, or team conversations. The same
          system turns what was said into searchable work.
        </p>
        <div className="arc-actions arc-in" style={{ "--d": "140ms" } as React.CSSProperties}>
          <Magnetic><Squish>
            <Link className="arc-btn arc-btn--go" href="/signup">
              Start with a conversation <span aria-hidden="true">↗</span>
            </Link>
          </Squish></Magnetic>
          <Link className="arc-btn arc-btn--quiet" href="/how-it-works">See how it works</Link>
        </div>
      </section>

      <section className="fy-grid" aria-label="Ways to use VOII">
        {IDS.map((id, i) => {
          const copy = personaCopy[id];
          const d = DETAIL[id];
          return (
            <Reveal className="fy-cell" delay={i * 0.05} key={id}>
              <article className="fy-card" style={{ "--tint": d.tint } as React.CSSProperties}>
                <header className="fy-card__top">
                  <span className="fy-card__who">{copy.label}</span>
                  <span className="fy-card__kicker">{d.kicker}</span>
                </header>

                <h2>{copy.emphasis}</h2>
                <p className="fy-card__copy">{copy.support}</p>

                <div className="fy-panel">
                  <span className="fy-panel__scene">{d.scene}</span>
                  <div className="fy-object">
                    <span className="fy-object__kind">{copy.payload.label}</span>
                    <strong>{copy.payload.title}</strong>
                    <span className="fy-object__detail">{copy.payload.detail}</span>
                    <span className="fy-object__meta">{copy.payload.meta}</span>
                  </div>
                  <div className="fy-stat">
                    <strong>{d.stat}</strong>
                    <span>{d.statLabel}</span>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </section>

      <section className="fy-principles" aria-labelledby="fy-pr-title">
        <Reveal>
          <p className="arc-kicker">What stays constant</p>
          <h2 id="fy-pr-title">The same system, wherever the work starts.</h2>
        </Reveal>
        <ol className="fy-principles__list">
          {PRINCIPLES.map((p, i) => (
            <Reveal className="fy-principle" delay={i * 0.05} key={p.title}>
              <span className="fy-principle__n">0{i + 1}</span>
              <strong>{p.title}</strong>
              <span>{p.copy}</span>
            </Reveal>
          ))}
        </ol>
      </section>

      <ArcFooter />
    </main>
  );
}
