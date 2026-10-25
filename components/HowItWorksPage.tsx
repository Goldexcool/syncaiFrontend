"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import ArcFooter from "@/components/arc/Footer";
import { Magnetic, Reveal, Squish } from "@/components/arc/motion";
import { calendarEvent, conversation, initialTasks, knowledgeEntries, project } from "@/lib/story";

/* ── Stage panels, built from the real Northstar kickoff ─────────── */

function ConversationPanel() {
  return (
    <div className="hw-panel">
      <header className="hw-panel__bar">
        <span className="hw-panel__title">{conversation.title}</span>
        <span className="hw-panel__meta">{conversation.duration} · {conversation.participants.length} people</span>
      </header>
      <ul className="hw-lines">
        {conversation.lines.map((l) => (
          <li className={l.tone !== "neutral" ? "is-marked" : ""} key={l.id}>
            <i>{l.initials}</i>
            <span className="hw-t">{l.time}</span>
            <span className="hw-say">{l.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KnowledgePanel() {
  const k = knowledgeEntries[0];
  const line = conversation.lines.find((l) => l.id === k.sourceLineId)!;
  return (
    <div className="hw-panel">
      <header className="hw-panel__bar">
        <span className="hw-panel__title">Knowledge</span>
        <span className="hw-panel__meta">linked to 1 source</span>
      </header>
      <div className="hw-card is-lit">
        <span className="hw-kind">Entry</span>
        <strong>{k.title}</strong>
        <span className="hw-body">{k.body}</span>
      </div>
      <span className="hw-tether" aria-hidden="true" />
      <div className="hw-card">
        <span className="hw-kind">Source · {line.time}</span>
        <strong>“{line.text}”</strong>
        <span className="hw-body">{line.speaker}</span>
      </div>
    </div>
  );
}

function TasksPanel() {
  return (
    <div className="hw-panel">
      <header className="hw-panel__bar">
        <span className="hw-panel__title">Tasks</span>
        <span className="hw-panel__meta">{initialTasks.length} open · 0 typed</span>
      </header>
      <ul className="hw-tasks">
        {initialTasks.map((t) => (
          <li key={t.id}>
            <span className="hw-box" aria-hidden="true" />
            <span className="hw-task">{t.title}</span>
            <i>{t.ownerInitials}</i>
            <span className="hw-due">{t.due}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MomentumPanel() {
  return (
    <div className="hw-panel">
      <header className="hw-panel__bar">
        <span className="hw-panel__title">{project.name}</span>
        <span className="hw-panel__meta">4 objects · 3 links</span>
      </header>
      <div className="hw-map">
        <svg viewBox="0 0 300 190" aria-hidden="true">
          <path d="M 60 38 C 148 38, 148 95, 236 95" />
          <path d="M 60 38 C 148 38, 148 152, 236 152" />
          <path d="M 60 95 C 138 95, 158 152, 236 152" />
        </svg>
        <span className="hw-node hw-node--a">Conversation</span>
        <span className="hw-node hw-node--b">Knowledge</span>
        <span className="hw-node hw-node--c">Tasks</span>
        <span className="hw-node hw-node--d">Calendar</span>
      </div>
      <div className="hw-card">
        <span className="hw-kind">Next</span>
        <strong>{calendarEvent.title}</strong>
        <span className="hw-body">{calendarEvent.date} · {calendarEvent.time}</span>
      </div>
    </div>
  );
}

const STAGES = [
  {
    id: "conversation", n: "01", label: "Conversation", tint: "var(--c-blue)",
    title: "Start with what was said.",
    copy: "VOII saves the speakers, timestamps, and transcript together, so every decision has a clear source.",
    Panel: ConversationPanel,
  },
  {
    id: "knowledge", n: "02", label: "Knowledge", tint: "var(--c-yellow)",
    title: "Keep what matters.",
    copy: "A decision becomes a searchable Knowledge entry, still linked to the conversation that produced it.",
    Panel: KnowledgePanel,
  },
  {
    id: "tasks", n: "03", label: "Tasks", tint: "var(--c-magenta)",
    title: "Make the next move visible.",
    copy: "Commitments become tasks with clear owners and due dates, so the next move is visible to everyone involved.",
    Panel: TasksPanel,
  },
  {
    id: "momentum", n: "04", label: "Momentum", tint: "var(--c-blue)",
    title: "Let the work keep moving.",
    copy: "The project connects the source conversation, Knowledge, Tasks, and calendar event in one workspace.",
    Panel: MomentumPanel,
  },
];

const PROOF = [
  { title: "Source, not noise.", copy: "Open any decision or task and return to the exact sentence, person, and moment it came from." },
  { title: "Context, not clutter.", copy: "Keep a concise decision searchable without losing the conversation that explains it." },
  { title: "Action, not ambiguity.", copy: "Owners and due dates turn a good conversation into work someone can act on." },
];

export default function HowItWorksPage() {
  return (
    <main className="arc hw" id="main-content">
      <SiteHeader />

      <section className="hw-hero" aria-labelledby="hw-title">
        <p className="arc-kicker">How it works</p>
        <h1 className="arc-in" id="hw-title">A conversation has an <em>afterlife.</em></h1>
        <p className="hw-hero__lede arc-in" style={{ "--d": "70ms" } as React.CSSProperties}>
          VOII turns a meeting, lecture, or client call into a searchable transcript, clear
          decisions, and tasks with owners and dates.
        </p>
        <div className="arc-actions arc-in" style={{ "--d": "140ms" } as React.CSSProperties}>
          <Magnetic><Squish>
            <Link className="arc-btn arc-btn--go" href="/signup">
              Start with a conversation <span aria-hidden="true">↗</span>
            </Link>
          </Squish></Magnetic>
          <Link className="arc-btn arc-btn--quiet" href="/pricing">See pricing</Link>
        </div>
      </section>

      {/* One spine, four stages, alternating sides. */}
      <section className="hw-flow" aria-labelledby="hw-flow-title">
        <Reveal className="hw-flow__head">
          <p className="arc-kicker">The thread</p>
          <h2 id="hw-flow-title">Nothing important has to disappear between the call and the work.</h2>
        </Reveal>

        <ol className="hw-stages">
          {STAGES.map(({ id, n, label, tint, title, copy, Panel }, i) => (
            <li className={`hw-stage ${i % 2 ? "is-flip" : ""}`} key={id} style={{ "--tint": tint } as React.CSSProperties}>
              <span className="hw-stage__spine" aria-hidden="true"><i /></span>

              <Reveal className="hw-stage__copy">
                <span className="hw-stage__n">{n}</span>
                <span className="hw-stage__label">{label}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </Reveal>

              <Reveal className="hw-stage__viz" delay={0.06}>
                <Panel />
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      <section className="hw-proof" aria-labelledby="hw-proof-title">
        <Reveal>
          <p className="arc-kicker">Why it holds</p>
          <h2 id="hw-proof-title">Find the source behind every decision and task.</h2>
        </Reveal>
        <div className="hw-proof__grid">
          {PROOF.map((p, i) => (
            <Reveal className="hw-proof__card" delay={i * 0.05} key={p.title}>
              <h3>{p.title}</h3>
              <p>{p.copy}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <ArcFooter />
    </main>
  );
}
