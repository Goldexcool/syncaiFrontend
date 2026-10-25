"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { calendarEvent, conversation, initialTasks, knowledgeEntries, project } from "@/lib/story";
import type { AuthMode } from "@/components/AuthPage";

/**
 * The right half of every auth route: not an illustration beside the form but
 * the product's own viewport, running. It keeps the canvas rules from the
 * homepage hero — dark in both themes, one brand colour per object type,
 * every value read from lib/story.ts — and it answers the form as you fill it,
 * so the workspace you are about to own has your name on it before you submit.
 */

export type StageIdentity = { name?: string; workspace?: string };

const CAPTION: Record<AuthMode, { label: string; note: string }> = {
  login: { label: "Your workspace", note: "Everything here was filed the last time you spoke. It has been waiting." },
  signup: { label: "What one conversation becomes", note: "Record it once. Every object below is produced from it, and links back to it." },
  "forgot-password": { label: "Nothing was lost", note: "Your workspace is intact. We are only opening the door again." },
  "reset-password": { label: "Nothing was lost", note: "Your workspace is intact. We are only opening the door again." },
};

const STEPS = [850, 850, 850, 850, 4400];
const LAST = STEPS.length - 1;

const CREW = [
  { initials: "MC", c: "var(--c-magenta)" },
  { initials: "SO", c: "var(--c-blue)" },
];

/** "Jordan Lee" → "JL"; a single word gives one letter. Blank until it's usable. */
function initialsOf(name?: string) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function Conversation() {
  return (
    <>
      <strong>{conversation.title}</strong>
      <span className="av-obj__meta">{conversation.duration} · {conversation.participants.length} people</span>
      <ul className="av-obj__lines">
        {conversation.lines.map((l) => (
          <li key={l.id}>
            <i>{l.initials}</i>
            <span className="av-obj__t">{l.time}</span>
            <span className="av-obj__say">{l.text}</span>
          </li>
        ))}
      </ul>
      <span className="av-obj__ports" aria-hidden="true">
        <b style={{ background: "var(--c-yellow)" }} />decision
        <b style={{ background: "var(--c-magenta)" }} />commitment
        <b style={{ background: "var(--c-blue)" }} />schedule
      </span>
    </>
  );
}

function Knowledge() {
  const k = knowledgeEntries[0];
  const line = conversation.lines.find((l) => l.id === k.sourceLineId)!;
  return (
    <>
      <strong>{k.title}</strong>
      <span className="av-obj__body">{k.body}</span>
      <span className="av-obj__from">↳ {k.sourceLabel} · {line.time}</span>
    </>
  );
}

function Tasks() {
  return (
    <ul className="av-obj__tasks">
      {initialTasks.map((t) => (
        <li key={t.id}>
          <span className="av-obj__box" aria-hidden="true" />
          <span className="av-obj__task">{t.title}</span>
          <i>{t.ownerInitials}</i>
          <span className="av-obj__due">{t.due}</span>
        </li>
      ))}
    </ul>
  );
}

function Calendar() {
  return (
    <>
      <strong>{calendarEvent.title}</strong>
      <span className="av-obj__meta">{calendarEvent.date} · {calendarEvent.time}</span>
    </>
  );
}

const OBJECTS = [
  { id: "conversation", kind: "Conversation", tint: "var(--c-blue)", Body: Conversation },
  { id: "knowledge", kind: "Knowledge", tint: "var(--c-yellow)", Body: Knowledge },
  { id: "tasks", kind: "Tasks", tint: "var(--c-magenta)", Body: Tasks },
  { id: "calendar", kind: "Calendar", tint: "var(--c-blue)", Body: Calendar },
];

export default function AuthStage({ mode, identity }: { mode: AuthMode; identity?: StageIdentity }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [live, setLive] = useState(true);
  const at = reduce ? LAST : step;
  const done = at >= LAST;
  const caption = CAPTION[mode];

  const you = initialsOf(identity?.name);
  const workspace = identity?.workspace?.trim() || project.name;

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

  const shown = OBJECTS.filter((_, i) => at >= i).length;

  return (
    <div
      className="av-stage"
      role="img"
      aria-label="The VOII workspace: a recorded client kickoff becomes a sourced knowledge entry, three owned tasks and a calendar hold."
    >
      <header className="av-stage__bar" aria-hidden="true">
        <span className="av-stage__mark"><i /><i /><i /></span>
        <nav className="av-stage__tabs"><span className="is-on">Workspace</span><span>Edit</span><span>Help</span></nav>
        <span className="av-stage__crew">
          {you ? <i className="is-you" title="you">{you}</i> : null}
          {CREW.map((p) => <i key={p.initials} style={{ borderColor: p.c }}>{p.initials}</i>)}
        </span>
      </header>

      <div className="av-stage__crumb" aria-hidden="true">
        <span className="av-stage__live"><i />live</span>
        <b>‹</b>{workspace} · v3<b>›</b>
      </div>

      <div className="av-stage__canvas">
        <div className="av-stage__spine" aria-hidden="true">
          <motion.i
            animate={{ scaleY: shown <= 1 ? 0 : (shown - 1) / (OBJECTS.length - 1) }}
            initial={false}
            transition={{ type: "spring", stiffness: 160, damping: 24 }}
          />
        </div>

        <ol className="av-stage__objects">
          {OBJECTS.map((o, i) => {
            const on = at >= i;
            const { Body } = o;
            return (
              <motion.li
                animate={on ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0.14, x: 12, scale: 0.98 }}
                className={`av-obj ${on ? "is-on" : ""}`}
                initial={false}
                key={o.id}
                style={{ "--tint": o.tint } as React.CSSProperties}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                aria-hidden="true"
              >
                <span className="av-obj__dot" />
                <span className="av-obj__kind">{o.kind}</span>
                <Body />
              </motion.li>
            );
          })}
        </ol>
      </div>

      <div className="av-stage__cap" aria-hidden="true">
        <span>{caption.label}</span>
        <p>{caption.note}</p>
      </div>

      <footer className="av-stage__dock" aria-hidden="true">
        <span>N: {shown} ({OBJECTS.length})</span>
        <span>E: {Math.max(0, shown - 1)}</span>
        <span>W: 0</span>
        <i />
        <span className={done ? "av-stage__pill is-done" : "av-stage__pill"}>{done ? "Complete" : "Processing"}</span>
      </footer>
    </div>
  );
}
