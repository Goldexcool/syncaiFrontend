import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Logo, SiteFooter, SiteHeader } from "@/components/SiteHeader";

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

/** Deterministic bar heights so server and client render the same wave. */
const NOISY = [30, 72, 18, 90, 44, 62, 25, 80, 35, 95, 20, 58, 76, 28, 66, 40, 88, 22, 54, 70, 32, 84, 46, 26, 64, 92, 38, 50];
const CLEAN = [12, 14, 10, 52, 70, 64, 12, 10, 58, 80, 72, 14, 10, 12, 66, 74, 60, 12, 10, 48, 62, 12, 10, 12, 56, 70, 14, 10];

function Wave({ bars, clean = false }: { bars: number[]; clean?: boolean }) {
  return (
    <div className={`wave ${clean ? "wave--clean" : ""}`} aria-hidden="true">
      {bars.map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}
    </div>
  );
}

function Page({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </>
  );
}

function PageHero({ eyebrow, title, lede }: { eyebrow: string; title: ReactNode; lede: string }) {
  return (
    <section className="page-hero">
      <div className="wrap">
        <p className="eyebrow rise">{eyebrow}</p>
        <h1 className="rise" style={stagger(1)}>{title}</h1>
        <p className="rise" style={stagger(2)}>{lede}</p>
      </div>
    </section>
  );
}

function CloseCta({ title = <>The class is over. <em>The notes are ready.</em></> }: { title?: ReactNode }) {
  return (
    <section className="close" aria-labelledby="close-title">
      <h2 id="close-title">{title}</h2>
      <ul>
        <li>Free plan, no card</li>
        <li>Every line linked to its source</li>
        <li>Delete anything, any time</li>
      </ul>
      <div className="close__ctas">
        <Link className="btn btn--peach" href="/signup">Start free <span aria-hidden="true">→</span></Link>
        <Link className="btn btn--ghost" href="/contact">Talk to us</Link>
      </div>
    </section>
  );
}

/** The product, working: a lecture note with a formula and its sources. */
function ProductWindow() {
  return (
    <div className="win" role="img" aria-label="The VOII workspace showing lecture notes with formulas, each linked to the moment it was said">
      <aside className="win__side" aria-hidden="true">
        <div className="win__brand"><Logo /></div>
        <div className="win__ask"><span>Ask your notes…</span><kbd>⌘K</kbd></div>
        <span className="win__nav">Today</span>
        <span className="win__nav">Conversations</span>
        <span className="win__nav is-on">Lectures <span className="chip chip--peach">New</span></span>
        <span className="win__nav">Knowledge</span>
        <span className="win__nav">Tasks</span>
        <p className="win__label">Courses</p>
        <span className="win__nav">MTH 201 · Calculus II</span>
        <span className="win__nav">ECO 104 · Micro</span>
        <span className="win__nav">CSC 210 · Algorithms</span>
      </aside>

      <div className="win__main">
        <div className="win__bar">
          <span>Lectures / MTH 201</span>
          <span className="chip chip--sage"><span className="dot" />Speaker isolated · 94% clean</span>
        </div>
        <h2 className="win__title">Lecture 7 — Integration by parts</h2>
        <div className="win__meta">
          <span className="chip">48 min</span>
          <span className="chip">Dr. A. Adeyemi</span>
          <span className="chip">3 worked examples</span>
          <span className="chip">2 assignments</span>
        </div>
        <p className="win__p">
          The rule comes from reversing the product rule. Choose <mark>u</mark> as the factor that gets simpler when
          differentiated — logs, then inverse trig, then algebraic terms (LIATE).
        </p>
        <div className="formula">
          <div className="formula__eq">∫ u dv = uv − ∫ v du</div>
          <span className="src">12:04 · stated on the board</span>
        </div>
        <h3 className="win__h">Worked example 2</h3>
        <div className="formula">
          <div className="formula__eq">∫ x e<sup>x</sup> dx = x e<sup>x</sup> − e<sup>x</sup> + C</div>
          <span className="src">19:41 · u = x, dv = eˣ dx</span>
        </div>
      </div>

      <aside className="win__sources" aria-hidden="true">
        <div className="win__sources-head"><span>Sources</span><span>14 linked</span></div>
        <div className="srccard">
          <div className="srccard__top"><span>12:04</span><span className="chip chip--sage">Verified</span></div>
          <q>So the whole thing is just the product rule, run backwards…</q>
        </div>
        <div className="srccard">
          <div className="srccard__top"><span>19:41</span><span className="chip chip--sage">Verified</span></div>
          <q>Let u be x, because its derivative is one — it disappears.</q>
        </div>
        <div className="srccard">
          <div className="srccard__top"><span>44:10</span><span className="chip chip--peach">Due Fri</span></div>
          <q>Problem set four, questions one to nine, by Friday.</q>
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Home                                                                */
/* ------------------------------------------------------------------ */

const FAQ = [
  ["Does VOII work in a noisy lecture hall?", "Yes. Lecture mode separates the main speaker from crowd noise, fans and side conversations before anything is transcribed. You see how clean the recording was, and every note links back to the moment so you can listen yourself."],
  ["Can it handle maths, formulas and calculations?", "Lecture notes render equations properly — integrals, fractions, matrices, chemical formulas — and keep each worked example step by step, with the timestamp where it was written or said."],
  ["Is it only for students?", "No. The same engine powers meeting notes, client calls, action items and follow-ups for teams. Students and teams just get different templates on top."],
  ["Do I need permission to record?", "You are responsible for consent. Many universities and companies have recording policies — check yours, and tell the room you are recording."],
  ["Can I delete my recordings?", "Yes. Delete a recording, a note or your whole account at any time. Shared links can expire or be password-protected."],
] as const;

export function HomePage() {
  return (
    <Page>
      <section className="hero">
        <div className="hero__copy">
          <h1 className="rise">The notes that show <em>their work.</em></h1>
          <p className="hero__lede rise" style={stagger(1)}>
            VOII records your meetings, client calls and lectures, isolates the voice that matters, and
            returns notes, tasks and formulas — each linked to the moment it was said.
          </p>
          <form className="capture rise" style={stagger(2)} action="/signup" method="get">
            <label className="sr-only" htmlFor="hero-email">Email address</label>
            <input id="hero-email" name="email" type="email" placeholder="Your email" autoComplete="email" />
            <button className="btn" type="submit">Start free <span aria-hidden="true">→</span></button>
          </form>
          <Link className="hero__sub rise" style={stagger(3)} href="/how-it-works">See how it works <span aria-hidden="true">→</span></Link>
        </div>
        <div className="hero__stage rise" style={stagger(4)}><ProductWindow /></div>
      </section>

      <section className="ink strip" aria-label="Who VOII is for">
        <p>One engine, built for every room where something important gets said</p>
        <ul>
          <li>Founders</li><li>Agencies</li><li>Consultants</li><li>Sales teams</li><li>University students</li><li>Researchers</li>
        </ul>
      </section>

      <section className="ink section" aria-labelledby="pillars-title" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">How it is different</p>
            <h2 id="pillars-title">Hears the speaker. <em>Ignores the room.</em></h2>
            <p>Most note-takers transcribe everything they hear. VOII decides what was worth hearing first.</p>
          </div>
          <div className="grid-3">
            <article className="card">
              <div className="card__art" aria-hidden="true">
                <div className="wave-label"><span>Room audio</span><span>chairs · chatter · fan</span></div>
                <Wave bars={NOISY} />
                <div className="wave-label"><span>After VOII</span><span>lecturer only</span></div>
                <Wave bars={CLEAN} clean />
              </div>
              <h3>Isolates the voice</h3>
              <p>Noise suppression and speaker separation pull the lecturer or the client out of a busy room before a word is transcribed.</p>
            </article>
            <article className="card">
              <div className="card__art" aria-hidden="true">
                <p className="win__p">Renewal pricing moves to <mark>₦18,000 per seat</mark> from January.</p>
                <div className="srccard">
                  <div className="srccard__top"><span>Client call · 23:17</span><span className="chip chip--sage">Verified</span></div>
                  <q>Let’s lock eighteen per seat starting January.</q>
                </div>
              </div>
              <h3>Shows its work</h3>
              <p>Every line in a note links to the second it was said. Tap it, hear it, trust it.</p>
            </article>
            <article className="card">
              <div className="card__art" aria-hidden="true">
                <div className="row-item"><span>Send revised proposal</span><span className="chip chip--sage">Done</span></div>
                <div className="row-item"><span>Problem set 4 · Q1–9</span><span className="chip chip--peach">Due Fri</span></div>
                <div className="row-item"><span>Book follow-up with Northstar</span><span className="chip">Needs you</span></div>
              </div>
              <h3>Turns talk into tasks</h3>
              <p>Deadlines, owners and follow-ups are pulled out and waiting for your approval — nothing is assigned behind your back.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="paper section" aria-labelledby="aud-title">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Two rooms, one product</p>
            <h2 id="aud-title">From the meeting room <em>to the lecture hall.</em></h2>
          </div>
          <div className="aud">
            <article className="aud__panel aud__panel--paper">
              <p className="eyebrow">For teams & client work</p>
              <h3>Every promise, kept.</h3>
              <p>Meetings and client calls become summaries, decisions and commitments with owners and dates.</p>
              <ul className="ticks">
                <li>A bot joins Google Meet, Zoom and Teams from your calendar</li>
                <li>Action items you approve before they become tasks</li>
                <li>Client workspaces and shareable, expiring links</li>
                <li>Projects, boards and reminders in the same place</li>
              </ul>
              <Link className="btn btn--primary" href="/signup">Start for your team <span aria-hidden="true">→</span></Link>
            </article>
            <article className="aud__panel aud__panel--ink">
              <p className="eyebrow">For students</p>
              <h3>Lecture notes you’d actually <em>study from.</em></h3>
              <p>Press record in class. VOII filters the hall down to your lecturer and writes structured notes — maths included.</p>
              <ul className="ticks">
                <li>Lecture mode removes crowd noise and side talk</li>
                <li>Equations and worked examples, step by step</li>
                <li>Definitions, key ideas and likely exam questions</li>
                <li>Notes emailed to you and saved to each course</li>
              </ul>
              <Link className="btn btn--primary" href="/for-you#students">See lecture mode <span aria-hidden="true">→</span></Link>
            </article>
          </div>
        </div>
      </section>

      <section className="ink section" aria-labelledby="flow-title">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">From the room to the record</p>
            <h2 id="flow-title">Four steps. <em>None of them yours.</em></h2>
          </div>
          <ol className="steps">
            <li><h3>Record</h3><p>Tap record on your phone in class, or let the VOII bot join your call.</p></li>
            <li><h3>Isolate</h3><p>The main speaker is separated from the room. You see how clean it was.</p></li>
            <li><h3>Write</h3><p>Structured notes, formulas, decisions and tasks — each with its timestamp.</p></li>
            <li><h3>Deliver</h3><p>Notes land in your inbox and your workspace, searchable forever.</p></li>
          </ol>
        </div>
      </section>

      <section className="paper section" aria-labelledby="tools-title">
        <div className="wrap">
          <div className="sec-head sec-head--center">
            <p className="eyebrow">Everything around the notes</p>
            <h2 id="tools-title">The rest of the work, <em>already there.</em></h2>
          </div>
          <div className="grid-3">
            {[
              ["Ask your notes", "Search or ask a question across every meeting and lecture you’ve kept."],
              ["Calendar bot", "Connect Google Calendar and VOII joins the meetings you choose."],
              ["Tasks & boards", "Approved action items become tasks on a board, with owners and dates."],
              ["Client workspaces", "Keep each client’s calls, projects and commitments together."],
              ["Share safely", "Share a note by link — with an expiry date or a password."],
              ["Exports", "Send notes to PDF for revision, a client or your records."],
            ].map(([title, body]) => (
              <article className="card card--tile" key={title}><h3>{title}</h3><p>{body}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="paper section" aria-labelledby="faq-title" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head sec-head--center">
            <p className="eyebrow">Before you ask</p>
            <h2 id="faq-title">Straight answers.</h2>
          </div>
          <div className="faq">
            {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </div>
      </section>

      <CloseCta />
    </Page>
  );
}

/* ------------------------------------------------------------------ */
/* How it works                                                        */
/* ------------------------------------------------------------------ */

export function HowItWorksPage() {
  return (
    <Page>
      <PageHero
        eyebrow="How it works"
        title={<>From what was said <em>to what happens next.</em></>}
        lede="VOII is one pipeline with two templates: one for meetings and client work, one for lectures. Both start with clean audio and end with notes you can verify."
      />
      <section className="ink section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <ol className="steps">
            <li><h3>Capture</h3><p>Record in the browser or on your phone, upload a file, or send the VOII bot to a calendar meeting.</p></li>
            <li><h3>Clean</h3><p>Noise suppression and speaker separation keep the voice that matters — the lecturer, the client, the team.</p></li>
            <li><h3>Understand</h3><p>A speech model transcribes with timestamps; a language model writes the notes, maths and action items.</p></li>
            <li><h3>Act</h3><p>You approve tasks, share notes, and search everything later. Every line links back to its source.</p></li>
          </ol>
        </div>
      </section>
      <section className="paper section">
        <div className="wrap grid-2">
          <article className="card">
            <p className="eyebrow">Meeting template</p>
            <h3>Summary, decisions, commitments.</h3>
            <ul className="ticks">
              <li>A short summary anyone can read in a minute</li>
              <li>Decisions with who made them and when</li>
              <li>Action items with owners and due dates, pending your approval</li>
              <li>Follow-up email drafts for clients</li>
            </ul>
          </article>
          <article className="card">
            <p className="eyebrow">Lecture template</p>
            <h3>Notes worth revising from.</h3>
            <ul className="ticks">
              <li>Outline of the lecture, section by section</li>
              <li>Definitions, theorems and key ideas</li>
              <li>Equations and worked examples, rendered properly</li>
              <li>Assignments, deadlines and likely exam questions</li>
            </ul>
          </article>
        </div>
      </section>
      <CloseCta title={<>Record the next one. <em>Read it tonight.</em></>} />
    </Page>
  );
}

/* ------------------------------------------------------------------ */
/* For you — teams & students                                          */
/* ------------------------------------------------------------------ */

export function ForYouPage() {
  return (
    <Page>
      <PageHero
        eyebrow="Teams & students"
        title={<>Built for two kinds of <em>important rooms.</em></>}
        lede="Whether it is a client call or a 300-seat lecture, the job is the same: hear the right person clearly, and keep what they said in a form you can use."
      />
      <section className="paper section" id="teams">
        <div className="wrap aud">
          <article className="aud__panel aud__panel--paper">
            <p className="eyebrow">Teams, agencies & consultants</p>
            <h3>The work after the meeting.</h3>
            <p>VOII keeps the decisions, the commitments and the client context together — and nudges the right person before a promise slips.</p>
            <ul className="ticks">
              <li>Calendar bot for Meet, Zoom and Teams</li>
              <li>Approved action items become tasks on your boards</li>
              <li>Client records, contacts and shared notes</li>
              <li>Team workspaces with roles and permissions</li>
            </ul>
            <Link className="btn btn--primary" href="/signup">Start for your team <span aria-hidden="true">→</span></Link>
          </article>
          <article className="aud__panel aud__panel--ink" id="students">
            <p className="eyebrow">Students — lecture mode</p>
            <h3>Sit at the back. <em>Hear the front.</em></h3>
            <p>Record on your phone. VOII strips out the hall — chatter, fans, chairs — keeps your lecturer, and writes the notes you wish you had taken.</p>
            <ul className="ticks">
              <li>Speaker isolation tuned for big, echoey rooms</li>
              <li>Equations, derivations and worked examples in full</li>
              <li>Notes organised by course, emailed after each class</li>
              <li>Ask questions across a whole semester of lectures</li>
            </ul>
            <Link className="btn btn--primary" href="/signup">Start free as a student <span aria-hidden="true">→</span></Link>
          </article>
        </div>
      </section>
      <section className="ink section" style={{ paddingTop: 0 }}>
        <div className="wrap"><ProductWindow /></div>
      </section>
      <CloseCta />
    </Page>
  );
}

/* ------------------------------------------------------------------ */
/* About                                                               */
/* ------------------------------------------------------------------ */

export function AboutPage() {
  return (
    <Page>
      <PageHero
        eyebrow="About VOII"
        title={<>Words are cheap. <em>Remembering them isn’t.</em></>}
        lede="Important things are said out loud every day — in meetings, on client calls, in lecture halls — and most of it is gone by evening. VOII exists to keep it."
      />
      <section className="paper section">
        <div className="wrap prose-layout">
          <nav className="rail" aria-label="On this page">
            <a href="#why">Why we built it</a>
            <a href="#how">How we build</a>
            <a href="#who">Who it’s for</a>
          </nav>
          <article className="prose">
            <section>
              <h2 id="why">Why we built it</h2>
              <p>Notes are usually written by the person least able to write them: the one who is also trying to listen, decide or learn. VOII takes the writing off their hands so they can stay in the room.</p>
              <p>But an AI summary you can’t check is just a confident guess. So every line VOII writes carries its source — a timestamp you can tap and hear.</p>
            </section>
            <section>
              <h2 id="how">How we build</h2>
              <p>Clean audio first, then transcription, then writing. Humans approve anything that creates work for someone else. Your recordings are yours to export and delete.</p>
            </section>
            <section>
              <h2 id="who">Who it’s for</h2>
              <p>Teams and client-facing businesses who need promises kept, and students who need lectures they can actually revise from. Same engine, two templates.</p>
            </section>
          </article>
        </div>
      </section>
      <CloseCta />
    </Page>
  );
}

/* ------------------------------------------------------------------ */
/* Legal & simple pages                                                */
/* ------------------------------------------------------------------ */

type LegalKind = "privacy" | "terms" | "contact" | "careers";
type Doc = { eyebrow: string; title: string; intro: string; sections: { id: string; h: string; body: ReactNode[] }[] };

const DOCS: Record<LegalKind, Doc> = {
  privacy: {
    eyebrow: "Privacy",
    title: "Privacy, in plain language.",
    intro: "VOII handles recordings of real conversations and real classes. Here is how we treat them.",
    sections: [
      { id: "keep", h: "What VOII keeps", body: ["Recordings, transcripts, notes, tasks and the context around them, so the work can continue after the conversation ends. Your content is used to provide VOII to you — never sold."] },
      { id: "control", h: "Control and deletion", body: ["You can find, export and delete what you keep in VOII, including your whole account. Retention periods, storage regions and subprocessors will be published before general availability."] },
      { id: "prototype", h: "Before launch", body: ["VOII is in early access. Please don’t upload confidential recordings you are not permitted to share. Questions: hello@voii.app."] },
    ],
  },
  terms: {
    eyebrow: "Terms",
    title: "Clear terms for a clear workspace.",
    intro: "The rules for recording, storing, sharing and managing work in VOII.",
    sections: [
      { id: "permission", h: "Record only what you may", body: ["Only record or upload conversations and lectures when you have the right to. You are responsible for consent and for following your organisation’s or university’s recording policy."] },
      { id: "account", h: "Keep your account secure", body: ["Use accurate details, protect your login, and tell us if you think someone else has accessed your workspace."] },
      { id: "prelaunch", h: "Before paid plans", body: ["The final service agreement, plan limits and support commitments will be published before paid plans go live."] },
    ],
  },
  contact: {
    eyebrow: "Contact",
    title: "Talk to the VOII team.",
    intro: "Product questions, team rollouts, campus partnerships or privacy requests — we read everything.",
    sections: [
      { id: "start", h: "Email us", body: [<>Write to <a href="mailto:hello@voii.app">hello@voii.app</a> and tell us what you are trying to keep hold of.</>] },
    ],
  },
  careers: {
    eyebrow: "Careers",
    title: "Help build the next layer of VOII.",
    intro: "We care about calm tools, careful engineering, and the moment where talk becomes progress.",
    sections: [
      { id: "care", h: "Build with care", body: [<>There are no open roles right now. If this resonates, <a href="mailto:hello@voii.app">say hello</a> and tell us what you would build.</>] },
    ],
  },
};

export function LegalPage({ kind }: { kind: LegalKind }) {
  const doc = DOCS[kind];
  return (
    <Page>
      <PageHero eyebrow={doc.eyebrow} title={doc.title} lede={doc.intro} />
      <section className="paper section">
        <div className="wrap prose-layout">
          <nav className="rail" aria-label="On this page">
            {doc.sections.map((s) => <a href={`#${s.id}`} key={s.id}>{s.h}</a>)}
          </nav>
          <article className="prose">
            {doc.sections.map((s) => (
              <section key={s.id}>
                <h2 id={s.id}>{s.h}</h2>
                {s.body.map((b, i) => <p key={i}>{b}</p>)}
              </section>
            ))}
          </article>
        </div>
      </section>
    </Page>
  );
}
