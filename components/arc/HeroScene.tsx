"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { calendarEvent, conversation, initialTasks, knowledgeEntries, project } from "@/lib/story";

/**
 * The hero canvas — the VOII workspace, live.
 *
 * The three brand colours identify people and port types, never decoration:
 * each participant owns a colour (their cursor, and the glow on whatever
 * they are editing), and each output port is coloured by what it carries.
 * The canvas stays dark in both themes, the way an editor viewport does.
 *
 * Every value comes from lib/story.ts.
 */

const PEOPLE = [
  { name: "Jordan Lee", initials: "JL", c: "var(--c-yellow)" },
  { name: "Maya Chen", initials: "MC", c: "var(--c-magenta)" },
  { name: "Sam Okafor", initials: "SO", c: "var(--c-blue)" },
];

type Port = { label: string; c: string };
type Row = { k?: string; v: string; control?: "select" | "stepper" | "text" };

type Node = {
  id: string; x: number; y: number; w: number; at: number;
  name: string; rows: Row[]; ports?: Port[]; owner?: number;
};

const NODES: Node[] = [
  {
    id: "source", x: 2, y: 33, w: 23, at: 0, name: "Conversation", owner: 0,
    rows: [
      { v: conversation.title, control: "select" },
      { k: "length", v: conversation.duration },
      { k: "people", v: String(conversation.participants.length) },
    ],
    ports: [{ label: "transcript", c: "var(--c-blue)" }],
  },
  {
    id: "transcript", x: 31, y: 29, w: 29, at: 1, name: "Transcript",
    rows: conversation.lines.map((l) => ({ k: l.time, v: l.text })),
    ports: [
      { label: "decision", c: "var(--c-yellow)" },
      { label: "commitment", c: "var(--c-magenta)" },
      { label: "schedule", c: "var(--c-blue)" },
    ],
  },
  {
    id: "knowledge", x: 66, y: 6, w: 27, at: 2, name: "Knowledge",
    rows: [{ v: knowledgeEntries[0].title, control: "text" }, { k: "source", v: knowledgeEntries[0].sourceLabel }],
  },
  {
    id: "tasks", x: 66, y: 37, w: 27, at: 3, name: "Tasks", owner: 1,
    rows: initialTasks.map((t) => ({ k: t.ownerInitials, v: `${t.title} · ${t.due}` })),
  },
  {
    id: "calendar", x: 66, y: 72, w: 27, at: 4, name: "Calendar",
    rows: [{ v: calendarEvent.title, control: "text" }, { k: "when", v: `${calendarEvent.date} · ${calendarEvent.time}`, control: "stepper" }],
  },
];

/** Node heights are derived from row count so nothing floats in dead space. */
const H = (n: Node) => 10 + n.rows.length * 6.1 + (n.ports ? n.ports.length * 4.4 : 0);

const VW = 1600, VH = 620;
const px = (p: number) => (p * VW) / 100;
const py = (p: number) => (p * VH) / 100;
const byId = (id: string) => NODES.find((n) => n.id === id)!;

const edge = (from: Node, to: Node, fromPort = 0) => {
  const fh = H(from);
  const y1p = from.y + 13 + (from.ports ? fh - 13 - (from.ports.length - fromPort - 0.5) * 5.2 : fh / 2);
  const x1 = px(from.x + from.w), y1 = py(Math.min(from.y + fh - 2, y1p));
  const x2 = px(to.x), y2 = py(to.y + H(to) / 2);
  const dx = Math.max(55, (x2 - x1) * 0.62);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
};

const EDGES = [
  { id: "e1", d: edge(byId("source"), byId("transcript")), at: 1, c: "var(--c-blue)" },
  { id: "e2", d: edge(byId("transcript"), byId("knowledge"), 0), at: 2, c: "var(--c-yellow)" },
  { id: "e3", d: edge(byId("transcript"), byId("tasks"), 1), at: 3, c: "var(--c-magenta)" },
  { id: "e4", d: edge(byId("transcript"), byId("calendar"), 2), at: 4, c: "var(--c-blue)" },
];

/** Where each cursor drifts, as canvas percentages. */
const CURSOR_PATH = [
  [{ x: 27, y: 62 }, { x: 44, y: 40 }, { x: 33, y: 74 }],
  [{ x: 72, y: 52 }, { x: 88, y: 66 }, { x: 70, y: 44 }],
  [{ x: 50, y: 82 }, { x: 38, y: 30 }, { x: 58, y: 66 }],
];

const STEPS = [1300, 1400, 1250, 1250, 1250, 3400];
const LAST = STEPS.length - 1;

export default function HeroScene() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [live, setLive] = useState(true);
  const at = reduce ? LAST : step;
  const done = at >= LAST;

  useEffect(() => {
    const sync = () => setLive(!document.hidden);
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  useEffect(() => {
    if (reduce || !live) return;
    const id = window.setTimeout(() => setStep((s) => (s >= LAST ? 0 : s + 1)), STEPS[step]);
    return () => window.clearTimeout(id);
  }, [step, live, reduce]);

  return (
    <div
      className="wc"
      role="img"
      aria-label="A simulation of the VOII workspace: a recorded client kickoff feeding a transcript node, which produces a linked knowledge entry, three tasks with owners and due dates, and a calendar event, with teammates editing alongside."
    >
      <header className="wc__bar" aria-hidden="true">
        <span className="wc__mark"><i /><i /><i /></span>
        <nav className="wc__tabs"><span className="is-on">Workspace</span><span>Edit</span><span>Help</span></nav>
        <span className="wc__crumb"><b>‹</b>{conversation.title}<b>›</b></span>
        <span className="wc__ghost">Share</span>
        <span className="wc__solid">Open workspace</span>
      </header>

      <div className="wc__canvas">
        <span className="wc__version" aria-hidden="true">{project.name} · v3</span>

        <span className="wc__crew" aria-hidden="true">
          <i className="wc__crew-live" />
          {PEOPLE.map((p) => (
            <i className="wc__crew-face" key={p.name} style={{ borderColor: p.c }}>{p.initials}</i>
          ))}
          <b>+1</b>
        </span>

        <svg className="wc__edges" viewBox={`0 0 ${VW} ${VH}`} aria-hidden="true">
          {EDGES.filter((e) => at >= e.at).map((e) => (
            <g key={e.id}>
              <path className="wc__edge" d={e.d} pathLength={1} />
              {!reduce ? <path className="wc__flow" d={e.d} pathLength={1} style={{ stroke: e.c }} /> : null}
            </g>
          ))}
        </svg>

        {NODES.map((n) => {
          const on = at >= n.at;
          const owner = n.owner !== undefined ? PEOPLE[n.owner] : null;
          return (
            <motion.article
              className={`wc__node ${on ? "is-on" : ""} ${owner && on ? "is-held" : ""}`}
              key={n.id}
              style={{
                left: `${n.x}%`, top: `${n.y}%`, width: `${n.w}%`, height: `${H(n)}%`,
                ...(owner ? ({ "--held": owner.c } as React.CSSProperties) : {}),
              }}
              initial={false}
              animate={on ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0.2, y: 8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              aria-hidden="true"
            >
              <header className="wc__nhead">
                <span className="wc__ndot" />{n.name}
              </header>

              <div className="wc__panel">
                {n.ports ? (
                  <ul className="wc__ports">
                    {n.ports.map((p) => (
                      <li key={p.label}>{p.label}<i style={{ background: p.c }} /></li>
                    ))}
                  </ul>
                ) : null}

                {n.rows.map((r) => (
                  <div className={`wc__row ${r.control ? `is-${r.control}` : ""}`} key={r.k ?? "" + r.v}>
                    {r.k ? <span className="wc__rk">{r.k}</span> : null}
                    <span className="wc__rv">{r.v}</span>
                    {r.control === "select" ? <span className="wc__chev">▾</span> : null}
                    {r.control === "stepper" ? <span className="wc__step"><b>‹</b><b>›</b></span> : null}
                  </div>
                ))}
              </div>

              <span className="wc__pin wc__pin--in" />
              <span className="wc__pin wc__pin--out" />
            </motion.article>
          );
        })}

        {!reduce
          ? PEOPLE.map((p, i) => (
              <motion.span
                className="wc__cursor"
                key={p.name}
                style={{ color: p.c }}
                animate={{
                  left: CURSOR_PATH[i].map((c) => `${c.x}%`),
                  top: CURSOR_PATH[i].map((c) => `${c.y}%`),
                }}
                transition={{ duration: 11 + i * 2.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                aria-hidden="true"
              >
                <svg viewBox="0 0 12 12" width="13" height="13"><path d="M1 1l10 4-4.2 1.6L5.2 11z" fill="currentColor" /></svg>
                <b style={{ background: p.c }}>{p.name.split(" ")[0]}</b>
              </motion.span>
            ))
          : null}

        <div className="wc__stats" aria-hidden="true">
          <span>N: {NODES.filter((n) => at >= n.at).length} ({NODES.length})</span>
          <span>E: {EDGES.filter((e) => at >= e.at).length}</span>
          <span>W: 0</span>
        </div>

        <div className="wc__dock" aria-hidden="true">
          <span className="is-on">Graph</span><span>Transcript</span><span>Tasks</span>
          <i />
          <span className={done ? "wc__pill is-done" : "wc__pill"}>{done ? "Complete" : "Processing"}</span>
        </div>
      </div>
    </div>
  );
}
