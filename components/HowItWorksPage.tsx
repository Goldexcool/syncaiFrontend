"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { ArrowLink, ObjectBadge, PageKicker, ProgressDots } from "@/components/MarketingPrimitives";

const flowSteps = [
  {
    id: "conversation",
    number: "01",
    label: "Conversation",
    title: "Start with what was said.",
    copy: "VOII saves the speakers, timestamps, and transcript together, so every decision has a clear source.",
  },
  {
    id: "knowledge",
    number: "02",
    label: "Knowledge",
    title: "Keep what matters.",
    copy: "A decision becomes a searchable Knowledge entry, still linked to the conversation that produced it.",
  },
  {
    id: "task",
    number: "03",
    label: "Tasks",
    title: "Make the next move visible.",
    copy: "Commitments become tasks with clear owners and due dates, so the next move is visible to everyone involved.",
  },
  {
    id: "momentum",
    number: "04",
    label: "Momentum",
    title: "Let the work keep moving.",
    copy: "The project connects the source conversation, Knowledge, Tasks, and calendar event in one workspace.",
  },
] as const;

function ConversationMini() {
  return (
    <div className="flow-object flow-object--conversation">
      <div className="flow-object__topline">
        <ObjectBadge type="conversation">C</ObjectBadge>
        <div><span className="product-label">Conversation</span><strong>Client kickoff</strong></div>
        <span className="flow-object__dot" />
      </div>
      <div className="flow-transcript-line flow-transcript-line--strong">Let’s keep the launch focused on the product story.</div>
      <div className="flow-transcript-line">Maya will send the final brand assets today.</div>
      <div className="flow-transcript-line">We’ll review the first draft on Thursday.</div>
      <div className="flow-object__meta">Maya · Sam · Jordan <span>34 min</span></div>
    </div>
  );
}

function KnowledgeMini() {
  return (
    <div className="flow-object flow-object--knowledge">
      <div className="flow-object__topline">
        <ObjectBadge type="knowledge">K</ObjectBadge>
        <div><span className="product-label">Knowledge</span><strong>Northstar launch direction</strong></div>
      </div>
      <p>Keep the launch focused on the product story.</p>
      <div className="flow-object__meta"><span>↗ Client kickoff</span><span>Just now</span></div>
    </div>
  );
}

function TaskMini() {
  return (
    <div className="flow-object flow-object--task">
      <div className="flow-object__topline">
        <ObjectBadge type="task">T</ObjectBadge>
        <div><span className="product-label">Next steps</span><strong>Northstar launch</strong></div>
        <span className="flow-object__count">3</span>
      </div>
      <div className="mini-task-row"><span />Send final brand assets <small>Maya · Today</small></div>
      <div className="mini-task-row"><span />Prepare first launch draft <small>Sam · Friday</small></div>
      <div className="mini-task-row"><span />Review first draft <small>Jordan · Thursday</small></div>
    </div>
  );
}

function MomentumMini() {
  return (
    <div className="flow-object flow-object--momentum">
      <div className="momentum-mini-map">
        <div className="momentum-mini-node momentum-mini-node--conversation"><ObjectBadge type="conversation">C</ObjectBadge><span>Client kickoff</span></div>
        <div className="momentum-mini-node momentum-mini-node--knowledge"><ObjectBadge type="knowledge">K</ObjectBadge><span>Direction</span></div>
        <div className="momentum-mini-node momentum-mini-node--task"><ObjectBadge type="task">T</ObjectBadge><span>3 tasks</span></div>
        <div className="momentum-mini-node momentum-mini-node--project"><ObjectBadge type="project">N</ObjectBadge><span>Northstar launch</span></div>
        <span className="momentum-mini-line momentum-mini-line--one" /><span className="momentum-mini-line momentum-mini-line--two" /><span className="momentum-mini-line momentum-mini-line--three" />
      </div>
      <div className="flow-object__meta"><span>Everything stays connected</span><span>Progress follows the work</span></div>
    </div>
  );
}

function FlowObject({ activeStep }: { activeStep: number }) {
  const step = flowSteps[activeStep];
  return (
    <div className="flow-object-stage" data-flow-step={step.id}>
      <AnimatePresence mode="wait">
        <motion.div className="flow-object-stage__inner" key={step.id} initial={{ opacity: 0, y: 26, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 1.02 }} transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}>
          {activeStep === 0 ? <ConversationMini /> : null}
          {activeStep === 1 ? <KnowledgeMini /> : null}
          {activeStep === 2 ? <TaskMini /> : null}
          {activeStep === 3 ? <MomentumMini /> : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <main className="marketing-page how-page bg-cream text-ink" id="main-content">
      <SiteHeader />
      <section className="marketing-hero marketing-hero--how">
        <div className="marketing-hero__ambient" aria-hidden="true" />
        <div className="marketing-hero__meta"><span>VOII / HOW IT WORKS</span><span>01 — 04</span></div>
        <div className="marketing-hero__content">
          <PageKicker>The work after the words</PageKicker>
          <h1>A conversation has an <em>afterlife.</em></h1>
          <p>VOII turns a meeting, lecture, or client call into a searchable transcript, clear decisions, and tasks with owners and dates.</p>
          <ArrowLink href="#flow">See the thread unfold</ArrowLink>
        </div>
        <div className="marketing-hero__edge"><span>Conversation</span><span>Knowledge</span><span>Tasks</span><span>Momentum</span></div>
      </section>

      <section className="flow-section" id="flow" aria-labelledby="flow-title">
        <div className="flow-section__intro">
          <PageKicker>One conversation / four useful forms</PageKicker>
          <h2 id="flow-title">Nothing important has to disappear between the call and the work.</h2>
          <p>Select a stage to see the transcript become a decision, a task, and connected project progress.</p>
          <ProgressDots count={flowSteps.length} active={activeStep} />
          <div className="flow-step-list" role="tablist" aria-label="VOII flow steps">
            {flowSteps.map((item, index) => (
              <button className={activeStep === index ? "is-active" : ""} key={item.id} type="button" role="tab" aria-selected={activeStep === index} onClick={() => setActiveStep(index)}>
                <span>{item.number}</span><span>{item.label}</span><i aria-hidden="true">↗</i>
              </button>
            ))}
          </div>
        </div>
        <div className="flow-section__stage">
          <FlowObject activeStep={activeStep} />
          <div className="flow-section__stage-caption"><span>{flowSteps[activeStep].number} / {flowSteps[activeStep].label}</span><span>{flowSteps[activeStep].title}</span></div>
        </div>
      </section>

      <section className="how-proof-section">
        <div className="how-proof-section__heading"><PageKicker>Designed around the real objects of work</PageKicker><h2>Find the source behind every decision and task.</h2></div>
        <div className="how-proof-grid">
          <article><ObjectBadge type="conversation">C</ObjectBadge><h3>Source, not noise.</h3><p>Open any decision or task and return to the exact sentence, person, and moment it came from.</p></article>
          <article><ObjectBadge type="knowledge">K</ObjectBadge><h3>Context, not clutter.</h3><p>Keep a concise decision searchable without losing the conversation that explains it.</p></article>
          <article><ObjectBadge type="task">T</ObjectBadge><h3>Action, not ambiguity.</h3><p>Owners and due dates turn a good conversation into work someone can act on.</p></article>
        </div>
      </section>

      <section className="dark-cta-band"><PageKicker>See what VOII does for your work</PageKicker><h2>Start with a conversation.</h2><ArrowLink href="/signup" inverse>Start with VOII</ArrowLink></section>
      <SiteFooter />
    </main>
  );
}
