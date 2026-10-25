import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import ArcFooter from "@/components/arc/Footer";
import { Reveal } from "@/components/arc/motion";
import { calendarEvent, conversation, initialTasks, knowledgeEntries } from "@/lib/story";

export const metadata: Metadata = {
  title: "About VOII — The work after the words",
  description:
    "Why VOII turns recorded conversations into searchable knowledge, assigned tasks, and project context.",
};

/** The four object types are product vocabulary, not decoration. */
const CHAIN = [
  {
    label: "Conversation",
    tint: "var(--c-blue)",
    note: "What was said, kept whole.",
    holds: ["Every speaker", "Every timestamp", "The exact words"],
  },
  {
    label: "Knowledge",
    tint: "var(--c-yellow)",
    note: "What was decided, still sourced.",
    holds: ["The decision", "The line it came from", "Searchable forever"],
  },
  {
    label: "Tasks",
    tint: "var(--c-magenta)",
    note: "What was promised, owned and dated.",
    holds: ["An owner", "A due date", "A link back"],
  },
  {
    label: "Momentum",
    tint: "var(--c-blue)",
    note: "What happens next, already scheduled.",
    holds: ["The follow-up", "The people", "The context"],
  },
];

const PRINCIPLES = [
  {
    n: "01",
    tint: "var(--c-yellow)",
    title: "Nothing is asserted without a source",
    body: "Every entry VOII files points back to the second it was said. If we cannot show you where something came from, we do not put it in front of you.",
  },
  {
    n: "02",
    tint: "var(--c-magenta)",
    title: "The product does the typing",
    body: "A promise made out loud should arrive as a task with the right name and the right date on it. Retyping what you already said is the work we are trying to delete.",
  },
  {
    n: "03",
    tint: "var(--c-blue)",
    title: "One thread, not four tools",
    body: "The transcript, the decision, the owner and the follow-up belong to the same object. Splitting them across apps is how context goes missing.",
  },
  {
    n: "04",
    tint: "var(--c-yellow)",
    title: "You confirm — VOII does not decide",
    body: "Everything arrives as a proposal you can accept, edit or throw away. The workspace stays yours, and so does the judgement.",
  },
];

/** The left half of the comparison: what a recording is on its own. */
function BeforePanel() {
  return (
    <div className="ab-panel ab-panel--before">
      <header className="ab-panel__bar">
        <span className="ab-panel__title">Without VOII</span>
        <span className="ab-panel__meta">an hour later</span>
      </header>

      <div className="ab-panel__body">
        <div className="ab-scrap">
          <span className="ab-scrap__kind">Recording</span>
          <strong>client-kickoff.m4a</strong>
          <span className="ab-scrap__note">{conversation.duration} · never opened again</span>
        </div>

        <div className="ab-scrap ab-scrap--note">
          <span className="ab-scrap__kind">Someone’s notes</span>
          <strong>brand assets — maya? + draft thurs</strong>
          <span className="ab-scrap__note">Half a line, no owner, no date.</span>
        </div>

        <div className="ab-scrap ab-scrap--chat">
          <span className="ab-scrap__kind">Team chat, 4 days later</span>
          <strong>“Did we agree Thursday or Friday?”</strong>
        </div>

        <div className="ab-empty">
          <span>Tasks</span>
          <i>Nothing filed</i>
        </div>
        <div className="ab-empty">
          <span>Calendar</span>
          <i>Nothing scheduled</i>
        </div>
      </div>

      <footer className="ab-panel__foot">One file, and a memory of it.</footer>
    </div>
  );
}

/** The right half: the same minutes, unpacked. */
function AfterPanel() {
  const k = knowledgeEntries[0];
  return (
    <div className="ab-panel ab-panel--after">
      <header className="ab-panel__bar">
        <span className="ab-panel__title">With VOII</span>
        <span className="ab-panel__meta">before the call ends</span>
      </header>

      <div className="ab-panel__body">
        <div className="ab-obj" style={{ "--tint": "var(--c-yellow)" } as React.CSSProperties}>
          <span className="ab-obj__kind">Knowledge</span>
          <strong>{k.title}</strong>
          <span className="ab-obj__body">{k.body}</span>
          <span className="ab-obj__from">↳ {k.sourceLabel} · {conversation.lines[0].time}</span>
        </div>

        <div className="ab-obj" style={{ "--tint": "var(--c-magenta)" } as React.CSSProperties}>
          <span className="ab-obj__kind">Tasks · {initialTasks.length} owned</span>
          <ul className="ab-obj__tasks">
            {initialTasks.map((t) => (
              <li key={t.id}>
                <span className="ab-obj__box" aria-hidden="true" />
                <span className="ab-obj__task">{t.title}</span>
                <i>{t.ownerInitials}</i>
                <span className="ab-obj__due">{t.due}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="ab-obj" style={{ "--tint": "var(--c-blue)" } as React.CSSProperties}>
          <span className="ab-obj__kind">Calendar</span>
          <strong>{calendarEvent.title}</strong>
          <span className="ab-obj__body">{calendarEvent.date} · {calendarEvent.time}</span>
        </div>
      </div>

      <footer className="ab-panel__foot">
        Four linked objects, each traceable to the second it was said.
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <main className="arc ab" id="main-content">
      <SiteHeader />

      <section className="ab-hero" aria-labelledby="ab-title">
        <p className="arc-kicker arc-in">About VOII</p>
        <h1 className="arc-in" id="ab-title" style={{ "--d": "40ms" } as React.CSSProperties}>
          The conversation was never the hard part. What comes <em>after</em> is.
        </h1>
        <p className="ab-hero__lede arc-in" style={{ "--d": "110ms" } as React.CSSProperties}>
          VOII is built for the hour after the call — the part where decisions get forgotten,
          promises go unassigned, and someone ends up rebuilding the plan from memory.
        </p>
        <ul className="ab-rail arc-in" style={{ "--d": "180ms" } as React.CSSProperties}>
          {CHAIN.map((c) => (
            <li key={c.label} style={{ "--tint": c.tint } as React.CSSProperties}>
              <i aria-hidden="true" />
              {c.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="ab-start" aria-labelledby="ab-start-title">
        <Reveal className="ab-start__lead">
          <p className="arc-kicker">Our starting point</p>
          <h2 id="ab-start-title">
            Most work does not disappear in the meeting. It disappears in the space after it.
          </h2>
        </Reveal>

        <Reveal className="ab-start__copy" delay={0.06}>
          <p>
            We are building VOII around one practical job: reduce the gap between understanding a
            conversation and acting on it. That gap is where the cost sits — not in the talking,
            but in the reconstruction afterwards.
          </p>
          <p>
            The product shows the transcript, decision, owner and due date together, then keeps
            each one linked to the source conversation. You should never have to take our word
            for what was agreed. You should be able to hear it.
          </p>
          <Link className="ab-link" href="/how-it-works">
            See how VOII works <span aria-hidden="true">↗</span>
          </Link>
        </Reveal>
      </section>

      <section className="ab-gap" aria-labelledby="ab-gap-title">
        <Reveal className="ab-gap__head">
          <p className="arc-kicker">The gap</p>
          <h2 id="ab-gap-title">The same 34 minutes, twice.</h2>
          <p className="ab-gap__sub">
            Nothing about the conversation changes. What changes is what is left of it once
            everyone has moved on to the next thing.
          </p>
        </Reveal>

        <div className="ab-gap__pair">
          <Reveal><BeforePanel /></Reveal>
          <Reveal delay={0.08}><AfterPanel /></Reveal>
        </div>
      </section>

      <section className="ab-quote" aria-label="What we believe">
        <Reveal>
          <span className="ab-quote__mark" aria-hidden="true">
            <i /><i /><i />
          </span>
          <blockquote>
            The conversation is not the end of the work. It is where the work gets its direction.
          </blockquote>
          <cite>VOII</cite>
        </Reveal>
      </section>

      <section className="ab-chain" aria-labelledby="ab-chain-title">
        <Reveal>
          <p className="arc-kicker">What we build</p>
          <h2 id="ab-chain-title">Four objects, joined end to end.</h2>
          <p className="ab-gap__sub">
            Each one is produced by the one before it, and every one of them can be opened back
            to the moment it came from.
          </p>
        </Reveal>

        <ol className="ab-flow">
          {CHAIN.map((c, i) => (
            <Reveal className="ab-flow__cell" delay={i * 0.06} key={c.label}>
              <article className="ab-flow__card" style={{ "--tint": c.tint } as React.CSSProperties}>
                <span className="ab-flow__top">
                  <span className="ab-flow__n">0{i + 1}</span>
                  <span className="ab-flow__dot" aria-hidden="true" />
                </span>
                <strong>{c.label}</strong>
                <span className="ab-flow__note">{c.note}</span>
                <ul className="ab-flow__holds">
                  {c.holds.map((h) => <li key={h}>{h}</li>)}
                </ul>
              </article>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="ab-rules" aria-labelledby="ab-rules-title">
        <Reveal className="ab-rules__head">
          <p className="arc-kicker">How we build</p>
          <h2 id="ab-rules-title">Four rules we don’t bend.</h2>
        </Reveal>

        <ul className="ab-rules__list">
          {PRINCIPLES.map((p, i) => (
            <Reveal className="ab-rule" delay={i * 0.05} key={p.n}>
              <span className="ab-rule__inner" style={{ "--tint": p.tint } as React.CSSProperties}>
                <span className="ab-rule__n">{p.n}</span>
                <strong>{p.title}</strong>
                <span className="ab-rule__body">{p.body}</span>
              </span>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="ab-close" aria-labelledby="ab-close-title">
        <Reveal className="ab-close__inner">
          <h2 id="ab-close-title">
            If it was worth saying out loud, it is worth <em>keeping.</em>
          </h2>
          <p>
            VOII is early, and we are building it in the open with the people using it. If the
            hour after your calls looks like the left-hand panel above, we would like to hear
            from you.
          </p>
          <div className="arc-actions">
            <Link className="arc-btn arc-btn--go" href="/signup">
              Start with a conversation <span aria-hidden="true">↗</span>
            </Link>
            <Link className="arc-btn arc-btn--quiet" href="/contact">Talk to us</Link>
          </div>
        </Reveal>
      </section>

      <ArcFooter />
    </main>
  );
}
