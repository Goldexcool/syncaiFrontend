"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type KeyboardEvent as ReactKeyboardEvent, type SetStateAction } from "react";
import Link from "next/link";
import type { Transition } from "motion/react";
import { AnimatePresence, motion } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { Logo, SiteFooter, SiteHeader } from "@/components/SiteHeader";
import {
  baseProductState,
  initialTasks,
  personaCopy,
  sceneIndexForProgress,
  storyScenes,
  type ConversationLine,
  type PersonaId,
  type Task,
} from "@/lib/story";

gsap.registerPlugin(ScrollTrigger);

const sceneMotion: {
  initial: { opacity: number; y: number };
  animate: { opacity: number; y: number };
  exit: { opacity: number; y: number };
  transition: Transition;
} = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
  transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
};

function scrollToTarget(target: HTMLElement | null, lenis: Lenis | null) {
  if (!target) return;

  if (lenis) {
    lenis.scrollTo(target, { offset: -24, duration: 1.1 });
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <section className="intro relative flex min-h-screen overflow-hidden" id="top" aria-labelledby="intro-title">
      <div className="intro__halo" aria-hidden="true" />
      <div className="intro__meta">
        <span>Workspace for the work between words</span>
        <span>Private beta · Nigeria</span>
      </div>
      <div className="intro__content">
        <p className="eyebrow">Turn conversations into organized work</p>
        <h1 id="intro-title">
          The conversation
          <br />
          becomes <em>work.</em>
        </h1>
        <p className="intro__lede">
          Record a meeting, lecture, or client call. VOII writes the summary, pulls out the decisions, and assigns tasks — with owners and dates already attached.
        </p>
        <div className="intro__actions">
          <button className="button button--primary" type="button" onClick={onStart}>
            Follow one conversation
            <span className="button__arrow" aria-hidden="true">↓</span>
          </button>
          <Link className="button button--outline" href="/signup">
            Start with a conversation <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
      <div className="intro__bottomline">
        <span className="scroll-cue" aria-hidden="true">
          <span />
        </span>
        <span>Scroll to let it unfold</span>
        <span className="intro__bottomline-rule" aria-hidden="true" />
        <span>Conversation · Knowledge · Tasks · Momentum</span>
      </div>
    </section>
  );
}

function StoryCopy({
  activeScene,
  persona,
  onReplay,
}: {
  activeScene: number;
  persona: PersonaId;
  onReplay: () => void;
}) {
  const scene = storyScenes[activeScene];
  const copy = personaCopy[persona];

  return (
    <div className="story-copy">
      <div className="story-copy__topline">
        <span className="story-copy__counter">0{activeScene + 1}</span>
        <span className="story-copy__line" aria-hidden="true" />
        <span>THE CONVERSATION BECOMES WORK</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div className="story-copy__content" key={scene.id} {...sceneMotion}>
          <p className="eyebrow">{scene.eyebrow}</p>
          <h2>{scene.title}</h2>
          <p className="story-copy__description">{scene.description}</p>
          {scene.id === "resolution" ? (
            <p className="story-copy__persona-note">
              <span>{copy.emphasis}</span> {copy.support}
            </p>
          ) : null}
        </motion.div>
      </AnimatePresence>
      <div className="story-copy__bottomline">
        <button className="text-button" type="button" onClick={onReplay}>
          <span className="text-button__icon" aria-hidden="true">
            ↺
          </span>
          Replay the story
        </button>
        <span className="story-copy__hint">Follow the chapter</span>
      </div>
    </div>
  );
}

function SceneNav({ activeScene, onSelect }: { activeScene: number; onSelect: (index: number) => void }) {
  return (
    <nav className="reduced-story-nav" aria-label="Story chapters">
      {storyScenes.map((scene, index) => (
        <button
          className={index === activeScene ? "is-active" : ""}
          key={scene.id}
          type="button"
          aria-current={index === activeScene ? "step" : undefined}
          onClick={() => onSelect(index)}
        >
          <span>0{index + 1}</span>
          {scene.id}
        </button>
      ))}
    </nav>
  );
}

function Avatar({ initials, tone = "green" }: { initials: string; tone?: "green" | "cream" | "ink" }) {
  return <span className={`avatar avatar--${tone}`}>{initials}</span>;
}

function ProductChrome({ activeScene, taskProgress }: { activeScene: number; taskProgress: number }) {
  const sections = ["Conversations", "Knowledge", "Tasks", "Calendar"];
  const activeSection = activeScene <= 1 ? 0 : activeScene <= 3 ? 1 : activeScene === 4 ? 2 : 3;

  return (
    <>
      <div className="product-stage__topbar">
        <div className="product-stage__workspace-name">
          <Logo compact />
          <span className="product-stage__slash">/</span>
          <span>Northstar launch</span>
        </div>
        <div className="product-stage__topbar-right">
          <span className="product-stage__sync-dot" />
          <span>Saved just now</span>
          <Avatar initials="JL" tone="cream" />
        </div>
      </div>
      <aside className="product-stage__sidebar" aria-label="VOII workspace navigation">
        <div className="product-stage__project">
          <span className="product-stage__project-mark">N</span>
          <span>
            <strong>Northstar launch</strong>
            <small>Client workspace</small>
          </span>
          <span className="product-stage__chevron" aria-hidden="true">
            ↘
          </span>
        </div>
        <div className="product-stage__section-label">Workspace</div>
        <div className="product-stage__sections">
          {sections.map((section, index) => (
            <div className={`product-stage__section ${activeSection === index ? "is-active" : ""}`} key={section}>
              <span className="product-stage__section-icon" aria-hidden="true">
                {index === 0 ? "◌" : index === 1 ? "⌁" : index === 2 ? "□" : "▦"}
              </span>
              <span>{section}</span>
              {section === "Tasks" ? <span className="product-stage__section-count">3</span> : null}
            </div>
          ))}
        </div>
        <div className="product-stage__sidebar-bottom">
          <div className="product-stage__section-label">Project pulse</div>
          <div className="mini-progress">
            <div className="mini-progress__row">
              <span>Northstar</span>
              <span>{taskProgress}%</span>
            </div>
            <div className="mini-progress__track">
              <motion.span animate={{ width: `${taskProgress}%` }} transition={{ duration: 0.45 }} />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function Transcript({ lines, highlightedSource }: { lines: ConversationLine[]; highlightedSource: string | null }) {
  return (
    <div className="transcript" aria-label="Conversation transcript">
      {lines.map((line, index) => (
        <div
          className={`transcript__line transcript__line--${line.tone} ${
            highlightedSource === line.id ? "is-highlighted" : ""
          }`}
          data-source-line={line.id}
          key={line.id}
        >
          <Avatar initials={line.initials} tone={index === 1 ? "cream" : index === 2 ? "ink" : "green"} />
          <div className="transcript__body">
            <div className="transcript__meta">
              <strong>{line.speaker}</strong>
              <span>{line.time}</span>
            </div>
            <p>{line.text}</p>
          </div>
          {line.tone !== "neutral" ? <span className="transcript__signal" aria-label={line.tone} /> : null}
        </div>
      ))}
    </div>
  );
}

function ConversationHeader({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`conversation-header ${compact ? "conversation-header--compact" : ""}`}>
      <div className="conversation-header__title">
        <span className="live-recording" aria-label="Recording stopped">
          <span />
        </span>
        <div>
          <span className="product-label">Conversation</span>
          <h3>Client kickoff</h3>
        </div>
      </div>
      <div className="conversation-header__details">
        <span>Today, 10:04 AM</span>
        <span>34 min</span>
      </div>
    </div>
  );
}

function SourcePill({ label = "Client kickoff" }: { label?: string }) {
  return (
    <span className="source-pill">
      <span className="source-pill__link" aria-hidden="true">
        ↗
      </span>
      {label}
    </span>
  );
}

function TaskRow({
  task,
  onToggle,
  onFocus,
  onBlur,
}: {
  task: Task;
  onToggle: (taskId: string) => void;
  onFocus: (sourceLineId: string) => void;
  onBlur: () => void;
}) {
  return (
    <motion.button
      className={`task-row ${task.status === "complete" ? "is-complete" : ""}`}
      type="button"
      aria-pressed={task.status === "complete"}
      onClick={() => onToggle(task.id)}
      onPointerEnter={() => onFocus(task.sourceLineId)}
      onPointerLeave={onBlur}
      onFocus={() => onFocus(task.sourceLineId)}
      onBlur={onBlur}
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
    >
      <span className="task-row__check" aria-hidden="true">
        {task.status === "complete" ? "✓" : ""}
      </span>
      <span className="task-row__main">
        <span className="task-row__title">{task.title}</span>
        <span className="task-row__meta">
          <Avatar initials={task.ownerInitials} tone="cream" />
          {task.owner}
          <span className="task-row__dot">·</span>
          {task.due}
        </span>
      </span>
      <span className="task-row__source" aria-label={`Source: ${task.sourceLineId}`}>
        ↗
      </span>
    </motion.button>
  );
}

function ProductStage({
  activeScene,
  tasks,
  highlightedSource,
  onToggleTask,
  onSourceFocus,
  onSourceBlur,
}: {
  activeScene: number;
  tasks: Task[];
  highlightedSource: string | null;
  onToggleTask: (taskId: string) => void;
  onSourceFocus: (sourceLineId: string) => void;
  onSourceBlur: () => void;
}) {
  const completedCount = tasks.filter((task) => task.status === "complete").length;
  const taskProgress = Math.round((completedCount / tasks.length) * 100);
  const scene = storyScenes[activeScene];

  return (
    <div className="product-stage" data-active-scene={scene.id} aria-label="Simulated VOII workspace">
      <ProductChrome activeScene={activeScene} taskProgress={taskProgress} />
      <div className="product-stage__canvas">
        <div className="product-stage__canvas-head">
          <div>
            <span className="product-label">Project</span>
            <h3>Northstar launch</h3>
          </div>
          <div className="canvas-head__actions">
            <span className="canvas-head__privacy">Private workspace · ready</span>
          </div>
        </div>

        <div className="product-stage__scene-space">
          <div className="scene-glow" aria-hidden="true" />

          <div className="story-layer story-layer--arrival" data-story-layer="arrival">
            <div className="arrival-card">
              <div className="arrival-card__kicker">
                <span className="arrival-card__pulse" />
                Workspace ready
              </div>
              <h4>Your next conversation has somewhere to go.</h4>
              <p className="arrival-card__body">Record the call, then keep the decision, tasks, and progress attached to the project.</p>
              <div className="object-trail" aria-label="Conversation to momentum">
                <span className="object-trail__item object-trail__item--conversation">Conversation</span>
                <span className="object-trail__line" aria-hidden="true" />
                <span className="object-trail__item object-trail__item--knowledge">Knowledge</span>
                <span className="object-trail__line" aria-hidden="true" />
                <span className="object-trail__item object-trail__item--task">Task</span>
              </div>
              <div className="arrival-card__footer">
                <span>Northstar launch</span>
                <span>Ready when you are</span>
              </div>
            </div>
          </div>

          <div className="story-layer story-layer--capture" data-story-layer="capture">
            <div className="conversation-card">
              <ConversationHeader />
              <div className="participant-row">
                <span>Participants</span>
                <span className="participant-row__avatars">
                  <Avatar initials="MC" tone="green" />
                  <Avatar initials="SO" tone="cream" />
                  <Avatar initials="JL" tone="ink" />
                </span>
                <span className="participant-row__names">Maya, Sam, Jordan</span>
              </div>
              <Transcript lines={baseProductState.conversation.lines} highlightedSource={highlightedSource} />
              <div className="conversation-card__footer">
                <span className="conversation-card__status">
                  <span />
                  Recording complete
                </span>
                <span>3 people · 3 useful moments</span>
              </div>
            </div>
          </div>

          <div className="story-layer story-layer--understand" data-story-layer="understand">
            <div className="understand-layout">
              <div className="conversation-card conversation-card--compact">
                <ConversationHeader compact />
                <Transcript lines={baseProductState.conversation.lines} highlightedSource={highlightedSource} />
              </div>
              <div className="understanding-card">
                <div className="understanding-card__head">
                  <span className="product-label">VOII understood</span>
                  <span className="understanding-card__signal" aria-hidden="true" />
                </div>
                <h4>One clear direction.</h4>
                <p>Keep the launch focused on the product story.</p>
                <div className="understanding-card__divider" />
                <div className="understanding-card__signals">
                  <span>
                    <i className="signal-dot signal-dot--primary" /> Decision
                  </span>
                  <span>
                    <i className="signal-dot signal-dot--ink" /> 2 commitments
                  </span>
                </div>
                <SourcePill />
              </div>
            </div>
          </div>

          <div className="story-layer story-layer--knowledge" data-story-layer="knowledge">
            <div className="knowledge-layout">
              <div className="source-mini-card">
                <div className="source-mini-card__line" />
                <span className="product-label">Source conversation</span>
                <h4>Client kickoff</h4>
                <span>34 min · Today</span>
              </div>
              <div className="relationship-arrow" aria-hidden="true">
                <span />
                <span />
              </div>
              <div className="knowledge-card">
                <div className="knowledge-card__topline">
                  <span className="object-badge object-badge--knowledge">K</span>
                  <span className="product-label">Knowledge</span>
                  <span className="knowledge-card__menu">···</span>
                </div>
                <h4>Northstar launch direction</h4>
                <p>Keep the launch focused on the product story.</p>
                <div className="knowledge-card__footer">
                  <SourcePill />
                  <span>Just now</span>
                </div>
              </div>
            </div>
          </div>

          <div className="story-layer story-layer--action" data-story-layer="action">
            <div className="task-layout">
              <div className="task-intro-card">
                <span className="object-badge object-badge--task">T</span>
                <span className="product-label">Tasks from the call</span>
                <h4>Make the next move visible.</h4>
                <p>Three promises. Three owners. One shared project.</p>
                <div className="task-intro-card__count">
                  <strong>{tasks.filter((task) => task.status === "complete").length}</strong>
                  <span>of {tasks.length} complete</span>
                </div>
              </div>
              <div className="task-card">
                <div className="task-card__head">
                  <div>
                    <span className="product-label">Northstar launch</span>
                    <h4>Open tasks</h4>
                  </div>
                  <span className="task-card__progress">{taskProgress}%</span>
                </div>
                <div className="task-card__progress-bar">
                  <motion.span animate={{ width: `${taskProgress}%` }} transition={{ duration: 0.4 }} />
                </div>
                <div className="task-list">
                  {tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggle={onToggleTask}
                      onFocus={onSourceFocus}
                      onBlur={onSourceBlur}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="story-layer story-layer--momentum" data-story-layer="momentum">
            <div className="momentum-layout">
              <div className="momentum-map" aria-label="Connected project objects">
                <div className="map-line map-line--conversation" aria-hidden="true" />
                <div className="map-line map-line--knowledge" aria-hidden="true" />
                <div className="map-line map-line--task" aria-hidden="true" />
                <div className="map-node map-node--conversation">
                  <span className="object-badge object-badge--conversation">C</span>
                  <strong>Client kickoff</strong>
                  <small>Conversation</small>
                </div>
                <div className="map-node map-node--knowledge">
                  <span className="object-badge object-badge--knowledge">K</span>
                  <strong>Launch direction</strong>
                  <small>Knowledge</small>
                </div>
                <div className="map-node map-node--task">
                  <span className="object-badge object-badge--task">T</span>
                  <strong>3 next steps</strong>
                  <small>Tasks</small>
                </div>
                <div className="map-node map-node--project">
                  <span className="object-badge object-badge--project">N</span>
                  <strong>Northstar launch</strong>
                  <small>Project · {taskProgress}% in motion</small>
                </div>
              </div>
              <div className="calendar-card">
                <div className="calendar-card__head">
                  <span className="object-badge object-badge--calendar">14</span>
                  <span className="product-label">Calendar event</span>
                </div>
                <h4>Northstar launch review</h4>
                <p>Thursday, 14 Nov · 2:00 PM – 2:45 PM</p>
                <div className="calendar-card__footer">
                  <SourcePill />
                  <span className="calendar-card__state">Added to project</span>
                </div>
              </div>
            </div>
          </div>

          <div className="story-layer story-layer--resolution" data-story-layer="resolution">
            <div className="resolution-layout">
              <div className="resolution-heading">
                <span className="product-label">Northstar launch</span>
                <h4>The thread is still warm.</h4>
                <p>Everything useful from the kickoff is ready for the next move.</p>
              </div>
              <div className="resolution-grid">
                <div className="resolution-stat resolution-stat--large">
                  <span className="object-badge object-badge--conversation">C</span>
                  <strong>1</strong>
                  <span>conversation captured</span>
                </div>
                <div className="resolution-stat">
                  <span className="object-badge object-badge--knowledge">K</span>
                  <strong>1</strong>
                  <span>direction kept</span>
                </div>
                <div className="resolution-stat">
                  <span className="object-badge object-badge--task">T</span>
                  <strong>3</strong>
                  <span>next steps visible</span>
                </div>
              </div>
              <div className="resolution-footer">
                <span className="resolution-footer__check">✓</span>
                <span>From what was said to what moves next.</span>
                <span className="resolution-footer__progress">{taskProgress}% project pulse</span>
              </div>
            </div>
          </div>
        </div>

        <div className="product-stage__footer">
          <span>Northstar launch / Project overview</span>
          <span className="product-stage__footer-status">
            <span /> All changes saved
          </span>
          <span>{scene.id === "arrival" ? "A living workspace" : `Scene ${String(activeScene + 1).padStart(2, "0")}`}</span>
        </div>
      </div>
    </div>
  );
}

function ProofSection({
  tasks,
  highlightedSource,
  onToggleTask,
  onSourceFocus,
  onSourceBlur,
}: {
  tasks: Task[];
  highlightedSource: string | null;
  onToggleTask: (taskId: string) => void;
  onSourceFocus: (sourceLineId: string) => void;
  onSourceBlur: () => void;
}) {
  const completedCount = tasks.filter((task) => task.status === "complete").length;

  return (
    <section className="proof-section section-band" id="proof" aria-labelledby="proof-title">
      <div className="proof-section__intro">
        <p className="eyebrow">Show before explain</p>
        <h2 id="proof-title">One conversation. Clear work.</h2>
        <p>Record a meeting once. VOII gives you a searchable transcript and summary, pulls out the decisions, and creates tasks with owners and due dates.</p>
        <p className="proof-section__metric" aria-label="A 34 minute conversation became one decision and three tasks with zero minutes of writing it up">
          <strong>34 min</strong><span>conversation</span><b aria-hidden="true">→</b><strong>1</strong><span>decision</span><b aria-hidden="true">·</b><strong>3</strong><span>tasks</span><b aria-hidden="true">·</b><strong>0</strong><span>minutes of writing it up</span>
        </p>
        <p className="proof-section__trust"><strong>Private by default.</strong> Read how VOII handles your conversations <Link href="/privacy">before you begin.</Link></p>
        <Link className="arrow-link" href="/how-it-works">See the full system <span className="arrow-link__icon" aria-hidden="true">↗</span></Link>
      </div>
      <div className="proof-stage">
        <article className="proof-card proof-card--conversation" aria-labelledby="proof-conversation-title">
          <ConversationHeader />
          <h3 id="proof-conversation-title" className="sr-only">Client kickoff transcript</h3>
          <Transcript lines={baseProductState.conversation.lines} highlightedSource={highlightedSource} />
        </article>
        <article className="proof-card proof-card--tasks" aria-labelledby="proof-tasks-title">
          <div className="proof-card__head">
            <div>
              <span className="product-label">Tasks from the call</span>
              <h3 id="proof-tasks-title">What comes next</h3>
            </div>
            <span className="proof-card__count">{completedCount} / {tasks.length}</span>
          </div>
          <p className="proof-card__hint">Focus a task to see the sentence it came from.</p>
          <div className="task-list">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} onToggle={onToggleTask} onFocus={onSourceFocus} onBlur={onSourceBlur} />
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function StorySection({
  activeScene,
  setActiveScene,
  persona,
  tasks,
  highlightedSource,
  onToggleTask,
  onSourceFocus,
  onSourceBlur,
  onReplay,
  reducedMotion,
}: {
  activeScene: number;
  setActiveScene: Dispatch<SetStateAction<number>>;
  persona: PersonaId;
  tasks: Task[];
  highlightedSource: string | null;
  onToggleTask: (taskId: string) => void;
  onSourceFocus: (sourceLineId: string) => void;
  onSourceBlur: () => void;
  onReplay: () => void;
  reducedMotion: boolean;
}) {
  const storyRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const updateLayout = () => setIsMobileLayout(mediaQuery.matches);
    updateLayout();
    mediaQuery.addEventListener("change", updateLayout);
    return () => mediaQuery.removeEventListener("change", updateLayout);
  }, []);

  useEffect(() => {
    if (reducedMotion || isMobileLayout) return;

    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.085,
      smoothWheel: true,
      syncTouch: false,
    });

    lenisRef.current = lenis;
    const onScroll = () => ScrollTrigger.update();
    const raf = (time: number) => lenis.raf(time * 1000);

    lenis.on("scroll", onScroll);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [isMobileLayout, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || isMobileLayout) return;

    const root = storyRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const context = gsap.context(() => {
      gsap.set("[data-story-layer]", { autoAlpha: 0, y: 24 });
      gsap.set('[data-story-layer="arrival"]', { autoAlpha: 1, y: 0 });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => `+=${root.offsetHeight}`,
          pin: stage,
          pinSpacing: false,
          scrub: 1.05,
          snap: {
            snapTo: [...storyScenes.map((scene) => scene.start), 1],
            delay: 0.08,
            duration: { min: 0.2, max: 0.45 },
            ease: "power2.out",
          },
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (trigger) => {
            const nextScene = sceneIndexForProgress(trigger.progress);
            setActiveScene((currentScene) => (currentScene === nextScene ? currentScene : nextScene));
          },
        },
      });

      timeline.to(".scene-glow", { scale: 1.18, opacity: 0.86, duration: 1, ease: "none" }, 0);
      timeline.to(".product-stage__scene-space", { borderRadius: 34, duration: 1, ease: "none" }, 0);

      storyScenes.forEach((scene, sceneIndex) => {
        if (sceneIndex === 0) return;
        const previousScene = storyScenes[sceneIndex - 1];
        const fadeOutDuration = Math.min(0.07, (scene.end - scene.start) * 0.5);
        timeline.to(
          `[data-story-layer="${previousScene.id}"]`,
          { autoAlpha: 0, y: -20, duration: fadeOutDuration, ease: "power2.inOut" },
          scene.start,
        );
        timeline.to(
          `[data-story-layer="${scene.id}"]`,
          { autoAlpha: 1, y: 0, duration: fadeOutDuration, ease: "power3.out" },
          scene.start + fadeOutDuration,
        );
      });

      timeline.to(".product-stage__sidebar", { backgroundColor: "var(--ultramarine-pressed)", duration: 0.22, ease: "none" }, 0.72);
      timeline.to(".product-stage__sidebar", { color: "var(--cream)", duration: 0.22, ease: "none" }, 0.72);
    }, root);

    return () => context.revert();
  }, [isMobileLayout, reducedMotion, setActiveScene]);

  const handleReplay = useCallback(() => {
    onReplay();
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
  }, [onReplay]);

  const handleManualScene = useCallback(
    (index: number) => {
      setActiveScene(index);
    },
    [setActiveScene],
  );

  return (
    <section
      className={`story-section relative overflow-hidden ${reducedMotion || isMobileLayout ? "story-section--manual" : ""}`}
      id="story"
      ref={storyRef}
      aria-label="How a VOII conversation becomes work"
    >
      <div className="story-section__backdrop" aria-hidden="true">
        <span className="story-section__backdrop-word">after</span>
        <span className="story-section__backdrop-word">the</span>
        <span className="story-section__backdrop-word">call</span>
      </div>
      <div className="story-stage relative grid h-screen" ref={stageRef}>
        <StoryCopy activeScene={activeScene} persona={persona} onReplay={handleReplay} />
        <div className="story-visual-column">
          <div className="story-progress" aria-label={`Story progress: scene ${activeScene + 1} of ${storyScenes.length}`}>
            <span className="story-progress__label">Story</span>
            <div className="story-progress__track" aria-hidden="true">
              {storyScenes.map((scene, index) => (
                <span className={index <= activeScene ? "is-active" : ""} key={scene.id} />
              ))}
            </div>
            <span className="story-progress__count">
              {String(activeScene + 1).padStart(2, "0")} / {String(storyScenes.length).padStart(2, "0")}
            </span>
          </div>
          <ProductStage
            activeScene={activeScene}
            tasks={tasks}
            highlightedSource={highlightedSource}
            onToggleTask={onToggleTask}
            onSourceFocus={onSourceFocus}
            onSourceBlur={onSourceBlur}
          />
        </div>
        {reducedMotion || isMobileLayout ? <SceneNav activeScene={activeScene} onSelect={handleManualScene} /> : null}
      </div>
    </section>
  );
}

function ThreadSection() {
  return (
    <section className="thread-section section-band relative grid" aria-labelledby="thread-title">
      <div className="thread-section__intro">
        <p className="eyebrow">One thread, many useful forms</p>
        <h2 id="thread-title">
          The value of a conversation is what it makes <em>possible.</em>
        </h2>
        <p>
          VOII keeps the context attached as the shape of the work changes, so every useful object knows where it came from.
        </p>
      </div>
      <div className="thread-section__note">
        <span className="thread-section__note-label">The source stays attached</span>
        <p>No copy-pasting the important part into five different places.</p>
        <span className="thread-section__note-meta">Context moves with the work.</span>
      </div>
    </section>
  );
}

function PrincipleSection() {
  const principles = [
    {
      number: "01",
      title: "Show before explain.",
      copy: "The product reveals its logic in the moment you need it: a line becomes a decision, a decision becomes a next step.",
    },
    {
      number: "02",
      title: "Keep the thread warm.",
      copy: "Every useful object keeps a relationship to its source, so context does not disappear when the meeting does.",
    },
    {
      number: "03",
      title: "Make momentum visible.",
      copy: "See what moved since the last conversation without asking anyone to reconstruct it for you.",
    },
  ];

  return (
    <section className="principles-section section-band relative grid" aria-labelledby="principles-title">
      <div className="principles-section__heading">
        <p className="eyebrow">The way it should feel</p>
        <h2 id="principles-title">Calm enough to think. Precise enough to move.</h2>
      </div>
      <div className="principles-list">
        {principles.map((principle) => (
          <article className="principle-row" key={principle.number}>
            <span className="principle-row__number">{principle.number}</span>
            <h3>{principle.title}</h3>
            <p>{principle.copy}</p>
            <span className="principle-row__mark" aria-hidden="true" />
          </article>
        ))}
      </div>
    </section>
  );
}

function PersonaSection({ persona, onSelect }: { persona: PersonaId; onSelect: (persona: PersonaId) => void }) {
  const current = personaCopy[persona];
  const personas = Object.keys(personaCopy) as PersonaId[];

  const handleTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowDown" && event.key !== "ArrowLeft" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = (index + direction + personas.length) % personas.length;
    const nextPersona = personas[nextIndex];
    onSelect(nextPersona);
    window.requestAnimationFrame(() => document.getElementById(`persona-tab-${nextPersona}`)?.focus());
  };

  return (
    <section className="persona-section section-band relative grid" id="personas" aria-labelledby="persona-title">
      <div className="persona-section__panel" id="persona-panel" role="tabpanel" aria-labelledby={`persona-tab-${persona}`} tabIndex={0}>
        <div className="persona-section__copy">
          <p className="eyebrow">Make it yours</p>
          <h2 id="persona-title">A better way to keep your head in the work.</h2>
          <AnimatePresence mode="wait">
            <motion.p className="persona-section__support" key={persona} {...sceneMotion}>
              {current.support}
            </motion.p>
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait">
          <motion.article className="persona-section__payload" key={persona} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}>
            <div className="persona-section__payload-head">
              <span className={`persona-section__payload-badge persona-section__payload-badge--${current.payload.type}`} aria-hidden="true">{current.payload.initial}</span>
              <div>
                <span className="product-label">{current.payload.label}</span>
                <strong>{current.payload.title}</strong>
              </div>
              <span className="persona-section__payload-status">VOII</span>
            </div>
            <p>{current.payload.detail}</p>
            <div className="persona-section__payload-footer">
              <span>{current.payload.meta}</span>
              <span>↗ Source attached</span>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
      <div className="persona-selector" role="tablist" aria-label="Choose your VOII perspective">
        {personas.map((item) => (
          <button
            className={item === persona ? "is-active" : ""}
            id={`persona-tab-${item}`}
            key={item}
            type="button"
            role="tab"
            aria-controls="persona-panel"
            aria-selected={item === persona}
            tabIndex={item === persona ? 0 : -1}
            onClick={() => onSelect(item)}
            onKeyDown={(event) => handleTabKeyDown(event, personas.indexOf(item))}
          >
            <span className="persona-selector__dot" aria-hidden="true" />
            {personaCopy[item].label}
            <span className="persona-selector__arrow" aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
      <div className="persona-section__signature" aria-hidden="true">
        <span>{current.emphasis}</span>
        <span>VOII</span>
      </div>
    </section>
  );
}

function PricingPreview() {
  const plans = [
    { name: "Free", price: "₦0", note: "Try the core memory engine" },
    { name: "Personal", price: "₦8,500", note: "For professionals and students" },
    { name: "Pro", price: "₦22,500", note: "For freelancers and consultants" },
  ];

  return (
    <section className="pricing-preview section-band" aria-labelledby="pricing-preview-title">
      <div className="pricing-preview__intro">
        <p className="eyebrow">Start where you are</p>
        <h2 id="pricing-preview-title">Memory first. More momentum when you need it.</h2>
        <p>Every plan includes the same core: record conversations, search the transcript, and turn decisions into organized work.</p>
        <Link className="arrow-link" href="/pricing">Compare all five plans <span className="arrow-link__icon" aria-hidden="true">↗</span></Link>
      </div>
      <div className="pricing-preview__plans">
        {plans.map((plan) => (
          <Link className="pricing-preview__plan" href="/pricing" key={plan.name}>
            <span>{plan.name}</span>
            <strong>{plan.price}<small>/ month</small></strong>
            <p>{plan.note}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Finale() {
  return (
    <section className="finale relative flex min-h-screen items-center justify-center overflow-hidden" aria-labelledby="finale-title">
      <div className="finale__orb finale__orb--one" aria-hidden="true" />
      <div className="finale__orb finale__orb--two" aria-hidden="true" />
      <div className="finale__meta">
        <span>VOII / 2026</span>
        <span>Make the next move visible.</span>
      </div>
      <div className="finale__content">
        <p className="eyebrow">A little less to carry</p>
        <h2 id="finale-title">
          Start with a
          <br />
          <em>conversation.</em>
        </h2>
        <p>Leave with a searchable record, clear decisions, and tasks already assigned.</p>
        <div className="finale__actions">
          <Link className="button button--cream" href="/signup">
            Start with a conversation <span aria-hidden="true">↗</span>
          </Link>
          <Link className="button button--outline-cream" href="/how-it-works">
            See how VOII works <span aria-hidden="true">↓</span>
          </Link>
        </div>
      </div>
      <div className="finale__footer">
        <Logo />
        <span>Conversation · Knowledge · Tasks · Momentum</span>
        <span>Made for the work after the words.</span>
      </div>
    </section>
  );
}

export default function VoiiExperience() {
  const [activeScene, setActiveScene] = useState(0);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [highlightedSource, setHighlightedSource] = useState<string | null>(null);
  const [persona, setPersona] = useState<PersonaId>("individual");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  const resetStory = useCallback(() => {
    setTasks(initialTasks.map((task) => ({ ...task, status: "open" })));
    setHighlightedSource(null);
    setActiveScene(0);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const startStory = useCallback(() => {
    scrollToTarget(document.getElementById("story"), null);
  }, []);

  const toggleTask = useCallback((taskId: string) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, status: task.status === "complete" ? "open" : "complete" } : task,
      ),
    );
  }, []);

  return (
    <main className="voii-page min-h-screen bg-cream font-sans text-ink" id="main-content">
      <SiteHeader />
      <Intro onStart={startStory} />
      <ProofSection
        tasks={tasks}
        highlightedSource={highlightedSource}
        onToggleTask={toggleTask}
        onSourceFocus={setHighlightedSource}
        onSourceBlur={() => setHighlightedSource(null)}
      />
      <StorySection
        activeScene={activeScene}
        setActiveScene={setActiveScene}
        persona={persona}
        tasks={tasks}
        highlightedSource={highlightedSource}
        onToggleTask={toggleTask}
        onSourceFocus={setHighlightedSource}
        onSourceBlur={() => setHighlightedSource(null)}
        onReplay={resetStory}
        reducedMotion={reducedMotion}
      />
      <ThreadSection />
      <PrincipleSection />
      <PersonaSection persona={persona} onSelect={setPersona} />
      <PricingPreview />
      <Finale />
      <SiteFooter />
    </main>
  );
}
