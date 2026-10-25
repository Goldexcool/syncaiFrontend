"use client";

import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { useRef, useState } from "react";
import { calendarEvent, conversation, initialTasks, knowledgeEntries } from "@/lib/story";

/**
 * The deck: three cards side by side, upright, the next one peeking off the
 * right edge. Scroll advances it; so does dragging. Widths are declared in
 * vw so the track offset is exact without measuring the DOM.
 */


/* Each stage gets its own small screen rather than a list of grey pills. */

function CaptureScreen() {
  return (
    <div className="sc">
      <div className="sc__bar">
        <span className="sc__rec"><i />Recording</span>
        <span className="sc__clock">34:12</span>
      </div>
      <div className="sc__wave" aria-hidden="true">
        {Array.from({ length: 96 }, (_, i) => (
          <span key={i} style={{ "--h": `${16 + Math.abs(Math.sin(i * 0.8) * Math.cos(i * 0.23)) * 82}%`, "--d": `${(i % 11) * -0.08}s` } as React.CSSProperties} />
        ))}
      </div>
      <ul className="sc__lines">
        {conversation.lines.map((l) => (
          <li key={l.id}>
            <i>{l.initials}</i>
            <span className="sc__t">{l.time}</span>
            <span className="sc__say">{l.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KeepScreen() {
  const k = knowledgeEntries[0];
  const line = conversation.lines.find((l) => l.id === k.sourceLineId)!;
  return (
    <div className="sc sc--keep">
      <div className="sc__entry">
        <span className="sc__kind">Knowledge</span>
        <strong>{k.title}</strong>
        <span className="sc__body">{k.body}</span>
      </div>
      <span className="sc__tether" aria-hidden="true" />
      <div className="sc__quote">
        <span className="sc__kind">Source · {line.time}</span>
        <strong>“{line.text}”</strong>
        <span className="sc__who"><i>{line.initials}</i>{line.speaker}</span>
      </div>
    </div>
  );
}

function DeliverScreen() {
  return (
    <div className="sc">
      <ul className="sc__tasks">
        {initialTasks.map((t) => (
          <li key={t.id}>
            <span className="sc__check" aria-hidden="true" />
            <span className="sc__task">{t.title}</span>
            <i>{t.ownerInitials}</i>
            <span className="sc__due">{t.due}</span>
          </li>
        ))}
      </ul>
      <div className="sc__cal">
        <span className="sc__kind">Calendar</span>
        <strong>{calendarEvent.title}</strong>
        <span className="sc__body">{calendarEvent.date} · {calendarEvent.time}</span>
      </div>
    </div>
  );
}

const CARDS = [
  {
    id: "capture", n: "01", title: "Capture", tint: "var(--c-magenta)",
    Screen: CaptureScreen,
    footTitle: "Record without thinking about it",
    footBody:
      "Start the recording and forget it. VOII keeps every speaker, timestamp and the exact words you may need to find later.",
  },
  {
    id: "keep", n: "02", title: "Keep", tint: "var(--c-yellow)",
    Screen: KeepScreen,
    footTitle: "Decisions stop evaporating",
    footBody:
      "What the room agreed becomes a searchable Knowledge entry, still linked to the conversation that produced it.",
  },
  {
    id: "deliver", n: "03", title: "Deliver", tint: "var(--c-blue)",
    Screen: DeliverScreen,
    footTitle: "Agreeing leads straight to doing",
    footBody:
      "Commitments arrive as tasks with clear owners and due dates, and the follow-up is on the calendar before the call ends.",
  },
];

export default function StackSection() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setIndex(Math.min(CARDS.length - 1, Math.max(0, Math.floor(p * CARDS.length))));
  });

  const go = (dir: number) => setIndex((i) => Math.min(CARDS.length - 1, Math.max(0, i + dir)));

  return (
    <section className="stk" aria-labelledby="stk-title" ref={ref}>
      <div className="stk__pin">
        <div className="stk__head">
          <p className="arc-kicker">How to</p>
          <h2 id="stk-title">From the call to the follow-up,<br />in one thread.</h2>
          <p className="stk__sub">
            Drag the deck, or keep scrolling — the same conversation moves through every stage.
          </p>
        </div>

        <div className="stk__viewport">
          <div className="stk__track">
            {CARDS.map((card, i) => {
              const offset = i - index;
              const pose = reduce
                ? { x: 0, rotate: 0, opacity: offset === 0 ? 1 : 0, scale: 1 }
                : offset === 0
                  ? { x: "0vw", rotate: 0, opacity: 1, scale: 1 }
                  : offset > 0
                    ? { x: `${58 + (offset - 1) * 14}vw`, rotate: 5, opacity: offset === 1 ? 0.6 : 0, scale: 0.97 }
                    : { x: `${offset * 2.5}vw`, y: `${offset * -1.4}rem`, rotate: offset * 2.5, opacity: Math.max(0, 0.32 + offset * 0.12), scale: 1 + offset * 0.05 };
              return (
              <motion.article
                className={`stk__card ${i === index ? "is-front" : ""}`}
                key={card.id}
                style={{ "--tint": card.tint, zIndex: offset <= 0 ? 10 + offset : 10 - offset } as React.CSSProperties}
                animate={pose}
                transition={{ type: "spring", stiffness: 190, damping: 28 }}
                drag={reduce || offset !== 0 ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.14}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) go(1);
                  else if (info.offset.x > 80) go(-1);
                }}
                aria-hidden={i !== index}
              >
                <header className="stk__cardbar">
                  <span className="stk__n">({card.n})</span>
                  <span className="stk__title">{card.title}</span>
                  <span className="stk__icons" aria-hidden="true"><i /><i /><i /></span>
                </header>

                <div className="stk__body">
                  <card.Screen />
                </div>

                <footer className="stk__foot">
                  <span className="stk__arrow" aria-hidden="true">↘</span>
                  <div>
                    <strong>{card.footTitle}</strong>
                    <p>{card.footBody}</p>
                  </div>
                </footer>
              </motion.article>
              );
            })}
          </div>

          {!reduce ? (
            <button className="stk__drag" onClick={() => go(1)} type="button" aria-label="Next stage">
              <span aria-hidden="true">✋</span>
              Drag
            </button>
          ) : null}
        </div>

        <div className="stk__dots" role="tablist" aria-label="Stage">
          {CARDS.map((c, i) => (
            <button
              aria-label={c.title}
              aria-selected={index === i}
              className={index === i ? "is-on" : ""}
              key={c.id}
              onClick={() => setIndex(i)}
              role="tab"
              type="button"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
