"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { calendarEvent, conversation, initialTasks, knowledgeEntries } from "@/lib/story";
import { Reveal } from "@/components/arc/motion";

/**
 * Why VOII — one tall block per point: a marker, a heading and a short
 * paragraph on the left, one large visual on the right. Each block carries
 * one of the canvas colours so the page and the hero read as one system.
 */

function Receipt() {
  const k = knowledgeEntries[0];
  return (
    <div className="wp">
      <header className="wp__bar">
        <span className="wp__title">Knowledge</span>
        <span className="wp__meta">linked to 1 source</span>
      </header>

      <div className="wp__entry">
        <span className="wp__kind">Entry</span>
        <strong>{k.title}</strong>
        <span className="wp__body">{k.body}</span>
        <span className="wp__from">{k.sourceLabel}</span>
      </div>

      <span className="wp__jump" aria-hidden="true">↳ jump to source</span>

      <ul className="wp__lines">
        {conversation.lines.map((l) => (
          <li className={l.id === k.sourceLineId ? "is-lit" : ""} key={l.id}>
            <i>{l.initials}</i>
            <span className="wp__t">{l.time}</span>
            <span className="wp__say">{l.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Owners() {
  return (
    <div className="wp">
      <header className="wp__bar">
        <span className="wp__title">Tasks</span>
        <span className="wp__meta">{initialTasks.length} open · 0 typed</span>
      </header>

      <ul className="wp__tasks">
        {initialTasks.map((t) => (
          <li key={t.id}>
            <span className="wp__box" aria-hidden="true" />
            <span className="wp__task">{t.title}</span>
            <i>{t.ownerInitials}</i>
            <span className="wp__due">{t.due}</span>
          </li>
        ))}
      </ul>

      <div className="wp__cal">
        <span className="wp__kind">Calendar hold</span>
        <strong>{calendarEvent.title}</strong>
        <span className="wp__body">{calendarEvent.date} · {calendarEvent.time}</span>
      </div>
    </div>
  );
}

function Thread() {
  return (
    <div className="wp">
      <header className="wp__bar">
        <span className="wp__title">One thread</span>
        <span className="wp__meta">4 objects · 3 links</span>
      </header>

      <div className="wp__graph">
        <svg viewBox="0 0 300 200" aria-hidden="true">
          <path d="M 62 40 C 150 40, 150 100, 238 100" />
          <path d="M 62 40 C 150 40, 150 160, 238 160" />
          <path d="M 62 100 C 140 100, 160 160, 238 160" />
        </svg>
        <span className="wp__node wp__node--a">Conversation</span>
        <span className="wp__node wp__node--b">Knowledge</span>
        <span className="wp__node wp__node--c">Tasks</span>
        <span className="wp__node wp__node--d">Calendar</span>
      </div>

      <ul className="wp__legend">
        <li><i style={{ background: "var(--c-blue)" }} />Conversation</li>
        <li><i style={{ background: "var(--c-yellow)" }} />Decision</li>
        <li><i style={{ background: "var(--c-magenta)" }} />Commitment</li>
      </ul>
    </div>
  );
}

const BLOCKS = [
  {
    id: "receipt", n: "01", tint: "var(--c-yellow)",
    title: "Every answer shows its receipt",
    body: "Open any task or decision and VOII jumps to the exact second it was said. Nothing is ever just asserted.",
    from: "3 spoken lines", to: "1 filed decision",
    facts: ["Timestamped", "Speaker attributed", "One click back"],
    Visual: Receipt,
  },
  {
    id: "owners", n: "02", tint: "var(--c-magenta)",
    title: "Owners and dates, already filled in",
    body: "A promise made out loud arrives as a task assigned to the person who made it, dated. You confirm; you don’t type.",
    from: "3 promises", to: "3 owned tasks",
    facts: ["Assigned", "Dated", "Nothing typed"],
    Visual: Owners,
  },
  {
    id: "thread", n: "03", tint: "var(--c-blue)",
    title: "Everything stays connected",
    body: "Conversation, knowledge, tasks and calendar stay linked, so anyone can see what was decided and what moves next.",
    from: "1 conversation", to: "4 linked objects",
    facts: ["One thread", "Shared", "Searchable"],
    Visual: Thread,
  },
];

/** One card in the stack. It pins, then the next card rides up over it while
 *  this one settles back a little, so the pile reads as depth. */
function Card({ block, i }: { block: (typeof BLOCKS)[number]; i: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 18%", "end 42%"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.93]);
  const dim = useTransform(scrollYProgress, [0, 1], [0, 0.45]);
  const { Visual } = block;

  return (
    <div className="wv__slot" ref={ref} style={{ "--i": i, "--tint": block.tint } as React.CSSProperties}>
      <motion.article className="wv__card2" style={reduce ? undefined : { scale }}>
        <div className="wv__copy">
          <span className="wv__top">
            <span className="wv__mark" aria-hidden="true" />
            <span className="wv__idx">{block.n}</span>
          </span>

          <h3>{block.title}</h3>
          <p>{block.body}</p>

          <span className="wv__flow" aria-hidden="true">
            <b>{block.from}</b>
            <i>→</i>
            <b className="is-out">{block.to}</b>
          </span>

          <ul className="wv__facts" aria-hidden="true">
            {block.facts.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </div>
        <div className="wv__viz">
          <div className="wv__panel">
            <Visual />
          </div>
        </div>
        {!reduce ? <motion.span className="wv__veil" style={{ opacity: dim }} aria-hidden="true" /> : null}
      </motion.article>
    </div>
  );
}

export default function WhySection() {
  return (
    <section className="wv" aria-labelledby="wv-title">
      <Reveal className="wv__head">
        <p className="arc-kicker">Why VOII</p>
        <h2 id="wv-title">The work after the words, handled.</h2>
      </Reveal>

      <div className="wv__stack">
        {BLOCKS.map((block, i) => <Card block={block} i={i} key={block.id} />)}
      </div>
    </section>
  );
}
