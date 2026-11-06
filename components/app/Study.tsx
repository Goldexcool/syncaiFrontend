"use client";

import { useState, type FormEvent } from "react";
import { Icon, getErrorMessage } from "@/components/app/kit";
import { checkUnderstanding, getLesson, getQuiz, type Lesson, type Quiz, type UnderstandingCheck } from "@/lib/api/app";

type Mode = "quiz" | "lesson" | "check";

/** Models tend to put the right answer first. */
function shuffled(quiz: Quiz): Quiz {
  return { questions: quiz.questions.map((q) => {
    const order = q.options.map((_, i) => i).sort(() => Math.random() - 0.5);
    return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) };
  }) };
}

const VERDICT: Record<UnderstandingCheck["verdict"], string> = { solid: "You've got it.", partly: "Nearly there.", not_yet: "Not quite yet." };

/** Quiz, lesson and "check my understanding", all made from this one set of notes. */
export function StudyTools({ meetingId }: { meetingId: string }) {
  const [mode, setMode] = useState<Mode>("quiz");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(task: () => Promise<void>) {
    setBusy(true); setError("");
    try { await task(); } catch (e) { setError(getErrorMessage(e)); } finally { setBusy(false); }
  }

  return <div className="dash-col">
    <div className="seg" role="tablist" aria-label="Study tools">
      {([["quiz", "Quiz"], ["lesson", "Lesson"], ["check", "Check my understanding"]] as const).map(([id, label]) =>
        <button key={id} role="tab" aria-selected={mode === id} className={mode === id ? "is-active" : ""} onClick={() => { setMode(id); setError(""); }}>{label}</button>)}
    </div>
    {error ? <p className="app-error" role="alert">{error}</p> : null}

    {mode === "quiz" ? (quiz
      ? <QuizView key={quiz.questions[0]?.question} quiz={quiz} busy={busy} onAgain={() => void run(async () => setQuiz(shuffled(await getQuiz(meetingId))))} />
      : <Start title="Test yourself" body="Five questions from these notes, with the reason for each answer." label={busy ? "Writing your quiz…" : "Start a quiz"} busy={busy} onStart={() => void run(async () => setQuiz(shuffled(await getQuiz(meetingId))))} />) : null}

    {mode === "lesson" ? (lesson
      ? <article className="dashboard-surface study-lesson">
        <h2>{lesson.title}</h2>
        {lesson.sections.map((s) => <section key={s.heading}><h3>{s.heading}</h3><p>{s.explain}</p>{s.example ? <p className="study-lesson__example"><strong>Example:</strong> {s.example}</p> : null}</section>)}
      </article>
      : <Start title="Learn it step by step" body="VOII teaches these notes from the start, in plain language." label={busy ? "Preparing your lesson…" : "Start the lesson"} busy={busy} onStart={() => void run(async () => setLesson(await getLesson(meetingId)))} />) : null}

    {mode === "check" ? <Check meetingId={meetingId} /> : null}
  </div>;
}

function Start({ title, body, label, busy, onStart }: { title: string; body: string; label: string; busy: boolean; onStart: () => void }) {
  return <section className="dashboard-surface study-start">
    <h2>{title}</h2>
    <p className="app-muted">{body}</p>
    <button className="dashboard-primary-button" type="button" disabled={busy} onClick={onStart}><Icon name="sparkles" size={15} />{label}</button>
  </section>;
}

function QuizView({ quiz, busy, onAgain }: { quiz: Quiz; busy: boolean; onAgain: () => void }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const answered = Object.keys(picked).length;
  const score = quiz.questions.filter((q, i) => picked[i] === q.answer).length;
  return <section className="dashboard-surface study-quiz">
    <ol>
      {quiz.questions.map((q, i) => <li key={q.question}>
        <p className="study-quiz__q">{q.question}</p>
        <div className="study-quiz__options">
          {q.options.map((o, n) => {
            const state = picked[i] === undefined ? "" : n === q.answer ? "is-right" : picked[i] === n ? "is-wrong" : "";
            return <button key={o} type="button" className={state} disabled={picked[i] !== undefined} onClick={() => setPicked((p) => ({ ...p, [i]: n }))}>{o}</button>;
          })}
        </div>
        {picked[i] !== undefined ? <p className="app-muted">{picked[i] === q.answer ? "Correct. " : "Not quite. "}{q.why}</p> : null}
      </li>)}
    </ol>
    {answered === quiz.questions.length ? <div className="study-quiz__end">
      <strong>{score} out of {quiz.questions.length}</strong>
      <button className="dashboard-primary-button" type="button" disabled={busy} onClick={onAgain}>{busy ? "Writing…" : "New quiz"}</button>
    </div> : null}
  </section>;
}

function Check({ meetingId }: { meetingId: string }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<UnderstandingCheck | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try { setResult(await checkUnderstanding(meetingId, text.trim())); } catch (err) { setError(getErrorMessage(err)); } finally { setBusy(false); }
  }
  return <section className="dashboard-surface study-start">
    <h2>Explain it in your own words</h2>
    <p className="app-muted">Write what you understood. VOII compares it with the notes.</p>
    <form method="post" className="note-fix" onSubmit={submit}>
      <textarea rows={6} maxLength={4000} value={text} onChange={(e) => setText(e.target.value)} aria-label="Your explanation" placeholder="In this lecture…" />
      {error ? <p className="app-error" role="alert">{error}</p> : null}
      <div className="tp-fix__actions"><button className="dashboard-primary-button" type="submit" disabled={busy || text.trim().length < 10}>{busy ? "Checking…" : "Check it"}</button></div>
    </form>
    {result ? <div className="study-result" role="status">
      <h3>{VERDICT[result.verdict]}</h3>
      {result.right.length ? <><strong>What you got right</strong><ul>{result.right.map((r) => <li key={r}>{r}</li>)}</ul></> : null}
      {result.missing.length ? <><strong>What to look at again</strong><ul>{result.missing.map((r) => <li key={r}>{r}</li>)}</ul></> : null}
      <p><strong>Next:</strong> {result.next}</p>
    </div> : null}
  </section>;
}
