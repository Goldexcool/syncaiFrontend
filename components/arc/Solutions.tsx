"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { personaCopy, type PersonaId } from "@/lib/story";
import { BOUNCE, Magnetic, Squish } from "@/components/arc/motion";

/** The four audiences from lib/story.ts, one tab each. */
const IDS: PersonaId[] = ["individual", "student", "freelancer", "organization"];

const SCENE: Record<PersonaId, { scene: string; tint: string }> = {
  individual: { scene: "A voice note at 11pm", tint: "var(--c-blue)" },
  student: { scene: "A seminar you can’t re-attend", tint: "var(--c-yellow)" },
  freelancer: { scene: "A client call with three promises in it", tint: "var(--c-magenta)" },
  organization: { scene: "A kickoff nobody wrote up", tint: "var(--c-blue)" },
};

export default function Solutions() {
  const [who, setWho] = useState<PersonaId>("freelancer");
  const copy = personaCopy[who];
  const meta = SCENE[who];

  return (
    <section className="sol" aria-labelledby="sol-title" style={{ "--tint": meta.tint } as React.CSSProperties}>
      <div className="sol__head">
        <p className="arc-kicker">Who it’s for</p>
        <h2 id="sol-title">VOII is for anyone who talks<br />and then has to remember.</h2>
      </div>

      <div className="sol__tabs" role="tablist" aria-label="Choose an audience">
        {IDS.map((id) => (
          <button
            aria-controls="sol-panel"
            aria-selected={who === id}
            className={`sol__tab ${who === id ? "is-on" : ""}`}
            id={`sol-tab-${id}`}
            key={id}
            onClick={() => setWho(id)}
            role="tab"
            type="button"
          >
            {personaCopy[id].label}
            {who === id ? <motion.span className="sol__rule" layoutId="sol-rule" transition={BOUNCE} /> : null}
          </button>
        ))}
      </div>

      <div aria-labelledby={`sol-tab-${who}`} className="sol__panel" id="sol-panel" role="tabpanel" tabIndex={0}>
        <AnimatePresence mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="sol__grid"
            exit={{ opacity: 0, y: -14 }}
            initial={{ opacity: 0, y: 20 }}
            key={who}
            transition={BOUNCE}
          >
            <div className="sol__stage">
              <span className="sol__scene">{meta.scene}</span>
              <div className="sol__object">
                <span className="sol__kind">{copy.payload.label}</span>
                <strong>{copy.payload.title}</strong>
                <span className="sol__detail">{copy.payload.detail}</span>
                <span className="sol__meta">{copy.payload.meta}</span>
              </div>
            </div>

            <div className="sol__copy">
              <h3>{copy.emphasis}</h3>
              <p>{copy.support}</p>
              <div className="arc-actions">
                <Magnetic><Squish>
                  <Link className="arc-btn arc-btn--go" href="/signup">
                    Start with a conversation <span aria-hidden="true">↗</span>
                  </Link>
                </Squish></Magnetic>
                <Link className="arc-btn arc-btn--quiet" href="/for-you">See every way in</Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
