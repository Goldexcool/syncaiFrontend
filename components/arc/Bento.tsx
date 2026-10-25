"use client";

import { conversation, initialTasks, knowledgeEntries } from "@/lib/story";
import { Reveal } from "@/components/arc/motion";

/**
 * The toolkit grid. Mixed spans and alternating fills so the eye moves
 * diagonally rather than reading a uniform row of boxes. Every capability
 * listed here is one the product actually ships (see components/PricingPage).
 */

function Waves() {
  return (
    <div className="bn__wave" aria-hidden="true">
      {Array.from({ length: 128 }, (_, i) => (
        <span key={i} style={{ "--h": `${14 + Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.21)) * 86}%`, "--d": `${(i % 13) * -0.09}s` } as React.CSSProperties} />
      ))}
    </div>
  );
}

function SearchMini() {
  const line = conversation.lines[1];
  return (
    <div className="bn__search" aria-hidden="true">
      <span className="bn__field">“brand assets”</span>
      <div className="bn__hit">
        <i>{line.initials}</i>
        <span className="bn__hitT">{line.time}</span>
        <span className="bn__hitS">{line.text}</span>
      </div>
    </div>
  );
}

function TaskMini() {
  return (
    <ul className="bn__tasks" aria-hidden="true">
      {initialTasks.slice(0, 3).map((t) => (
        <li key={t.id}>
          <span className="bn__box" />
          <span className="bn__tn">{t.title}</span>
          <i>{t.ownerInitials}</i>
        </li>
      ))}
    </ul>
  );
}

function KnowMini() {
  return (
    <div className="bn__know" aria-hidden="true">
      <span className="bn__kind">Knowledge</span>
      <strong>{knowledgeEntries[0].title}</strong>
      <span className="bn__src">{knowledgeEntries[0].sourceLabel}</span>
    </div>
  );
}

function ChatMini() {
  return (
    <div className="bn__chat" aria-hidden="true">
      <span className="bn__ask">What did we agree about the launch?</span>
      <span className="bn__ans">
        Keep it focused on the product story.
        <b>10:12 · Jordan Lee</b>
      </span>
    </div>
  );
}

function ShareMini() {
  return (
    <div className="bn__share" aria-hidden="true">
      <span className="bn__people">
        {conversation.participants.map((p) => <i key={p}>{p.split(" ").map((w) => w[0]).join("")}</i>)}
      </span>
      <span className="bn__link">voii.app/c/northstar-kickoff</span>
    </div>
  );
}

const CELLS = [
  {
    id: "transcript", span: "wide", tone: "plain", tint: "var(--c-magenta)",
    title: "Transcripts you can trust",
    body: "Every speaker, every timestamp, every word — captured while you stay in the conversation.",
    Visual: Waves,
  },
  {
    id: "search", span: "", tone: "invert", tint: "var(--c-blue)",
    title: "Find the sentence, not the file",
    body: "Search what was said and land on the exact moment it was said.",
    Visual: SearchMini,
  },
  {
    id: "knowledge", span: "", tone: "plain", tint: "var(--c-yellow)",
    title: "Decisions that keep their source",
    body: "Filed as Knowledge, still tied to the line that produced it.",
    Visual: KnowMini,
  },
  {
    id: "tasks", span: "wide", tone: "plain", tint: "var(--c-magenta)",
    title: "Tasks with owners and dates",
    body: "Commitments arrive assigned and dated. You confirm rather than type.",
    Visual: TaskMini,
  },
  {
    id: "chat", span: "wide", tone: "invert", tint: "var(--c-blue)",
    title: "Ask your own conversations",
    body: "Put a question to everything you have ever recorded, and get the answer with its receipt attached.",
    Visual: ChatMini,
  },
  {
    id: "share", span: "", tone: "plain", tint: "var(--c-yellow)",
    title: "Share the record, not the recording",
    body: "Client workspaces and shareable links, so nobody sits through 34 minutes again.",
    Visual: ShareMini,
  },
];

export default function Bento() {
  return (
    <section className="bn" aria-labelledby="bn-title">
      <Reveal className="bn__head">
        <p className="arc-kicker">Toolkit</p>
        <h2 id="bn-title">Everything the work after the words needs.</h2>
        <p className="bn__sub">
          One recording feeds all of it. Nothing here asks you to write anything up.
        </p>
      </Reveal>

      <div className="bn__grid">
        {CELLS.map(({ id, span, tone, tint, title, body, Visual }, i) => (
          <Reveal
            className={`bn__cell ${span ? "is-wide" : ""} is-${tone}`}
            delay={i * 0.04}
            key={id}
          >
            <div className="bn__inner" style={{ "--tint": tint } as React.CSSProperties}>
              <h3>{title}</h3>
              <p>{body}</p>
              <div className="bn__viz"><Visual /></div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
