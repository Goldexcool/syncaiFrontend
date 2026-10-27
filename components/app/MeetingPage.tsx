"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import AppShell from "@/components/app/AppShell";
import { Markdown, formatClock, summaryToMarkdown } from "@/components/app/Notes";
import { Icon, formatDate, formatTime } from "@/components/app/kit";
import { ApiRequestError } from "@/lib/api/client";
import {
  askMeeting, correctMeeting, bulkUpdateActionItems, convertToTasks, createBoard, createProjectQuick, createShare, getBotStatus, getMeeting, getProcessingStatus, getSummary, getTranscript,
  listActionItems, listAllProjects, listTaskUpdates, listTasksForMeeting, decideTaskUpdate, listBoards, getBoard, reprocessMeeting, sendBot, updateActionItem, uploadRecording,
  type ActionItem, type BoardColumn, type TaskUpdateSuggestion, type MeetingDetail, type ProcessingStatus, type Segment, type Summary,
} from "@/lib/api/app";
import type { Project } from "@/lib/api/dashboard";

const WORKING = new Set(["uploaded", "queued", "processing", "transcribing", "summarizing", "extracting_action_items"]);
const DONE = new Set(["pending_review", "tasks_created", "completed"]);
/** Bot states while it is in the call (the transcript is arriving live). */
const LIVE = new Set(["joined", "recording"]);
const BOT_ACTIVE = new Set(["scheduled", "joining", "joined", "recording", "leaving"]);
const msg = (e: unknown) => (e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Something went wrong.");
type Tab = "overview" | "summary" | "action-items" | "tasks";

export default function MeetingPage({ id }: { id: string }) {
  const [title, setTitle] = useState("Meeting");
  return <AppShell crumbs={["Meetings", title]}><MeetingView id={id} onTitle={setTitle} /></AppShell>;
}

function MeetingView({ id, onTitle }: { id: string; onTitle: (t: string) => void }) {
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [items, setItems] = useState<ActionItem[]>([]);
  const [updates, setUpdates] = useState<TaskUpdateSuggestion[]>([]);
  const [tab, setTabState] = useState<Tab>("overview");
  const [error, setError] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [botStatus, setBotStatus] = useState<string | null>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && ["overview", "summary", "action-items", "tasks"].includes(t)) setTabState(t as Tab);
  }, []);
  const setTab = (t: Tab) => { setTabState(t); window.history.replaceState(null, "", `?tab=${t}`); };

  const loadOutputs = useCallback(async () => {
    const [s, t, a, u] = await Promise.allSettled([getSummary(id), getTranscript(id), listActionItems(id), listTaskUpdates(id)]);
    if (u.status === "fulfilled") setUpdates(u.value.updates ?? []);
    if (s.status === "fulfilled") setSummary(s.value.summary);
    if (t.status === "fulfilled") setSegments(t.value.segments ?? []);
    if (a.status === "fulfilled") setItems(a.value.actionItems ?? []);
  }, [id]);

  const load = useCallback(async () => {
    try {
      const { meeting } = await getMeeting(id);
      setMeeting(meeting);
      onTitle(meeting.title);
      if (DONE.has(meeting.status ?? "")) await loadOutputs();
    } catch (e) { setError(msg(e)); }
  }, [id, loadOutputs, onTitle]);

  useEffect(() => { void load(); }, [load]);

  // While a notetaker is in (or heading to) the call: follow its state, and pull
  // the live transcript every few seconds once it is recording.
  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const { botSession } = await getBotStatus(id);
        if (stop) return;
        const next = botSession?.status ?? null;
        setBotStatus((prev) => { if (prev && BOT_ACTIVE.has(prev) && next && !BOT_ACTIVE.has(next)) void load(); return next; });
        if (next && LIVE.has(next)) setSegments((await getTranscript(id)).segments ?? []);
        if (next && BOT_ACTIVE.has(next)) setTimeout(tick, 3000);
      } catch { if (!stop) setTimeout(tick, 6000); }
    };
    void tick();
    return () => { stop = true; };
  }, [id, load]);

  // Poll while the worker is busy; reload everything once it finishes.
  const working = WORKING.has(status?.stage ?? meeting?.status ?? "");
  useEffect(() => {
    if (!working) return;
    const timer = setInterval(async () => {
      try {
        const next = await getProcessingStatus(id);
        setStatus(next);
        if (!WORKING.has(next.stage)) { clearInterval(timer); setStatus(null); void load(); }
      } catch { /* keep polling */ }
    }, 3000);
    return () => clearInterval(timer);
  }, [id, working, load]);

  const speakers = useMemo(() => speakerShare(segments), [segments]);

  if (error && !meeting) return <p className="app-error">{error}</p>;
  if (!meeting) return <p className="app-muted">Opening…</p>;

  const isLecture = meeting.kind === "lecture";
  const markdown = summary ? summaryToMarkdown(summary) : "";
  const pendingItems = items.filter((i) => i.status === "pending_review").length + updates.filter((u) => u.state === "pending").length;
  const date = new Date(meeting.createdAt ?? Date.now()).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  const ready = DONE.has(meeting.status ?? "");
  const live = !!botStatus && LIVE.has(botStatus);
  const botActive = !!botStatus && BOT_ACTIVE.has(botStatus);
  const lowSpeech = summary?.model === "low-speech-check";
  const reprocess = async () => {
    try {
      await reprocessMeeting(id);
      setSummary(null);
      setStatus({ status: "queued", stage: "queued", progress: 0, message: "Queued again…" });
    } catch (e) { setError(msg(e)); }
  };

  return <>
    <header className="mtg-head">
      <div>
        <p className="app-eyebrow">
          <MeetingState botStatus={botStatus} meetingStatus={meeting.status ?? ""} working={working} />
          {isLecture ? <span className="chip chip--peach">Lecture</span> : null}
          {meeting.course ? <span>{meeting.course.code ? `${meeting.course.code} · ` : ""}{meeting.course.name}</span> : null}
        </p>
        <h1>{meeting.title}</h1>
        <p className="mtg-meta">
          <span><Icon name="calendar" size={14} />{date} · {formatTime(meeting.createdAt)}</span>
          {meeting.durationSec ? <span><Icon name="mic" size={14} />{formatClock(meeting.durationSec)}</span> : null}
          {speakers.length ? <span><Icon name="team" size={14} />{speakers.length} speaker{speakers.length === 1 ? "" : "s"}</span> : null}
        </p>
      </div>
      {ready ? <div className="mtg-actions">
        <button className="dashboard-quiet-button" type="button" onClick={() => setShareOpen((v) => !v)}><Icon name="share" size={15} />Share</button>
        <button className="dashboard-quiet-button" type="button" onClick={() => window.print()}><Icon name="download" size={15} />Export PDF</button>
      </div> : null}
    </header>

    {shareOpen ? <SharePanel meetingId={id} /> : null}
    {error ? <p className="app-error" role="alert">{error} <button className="dashboard-text-button" type="button" onClick={() => setError("")}>Dismiss</button></p> : null}

    {working ? <Progress status={status} /> : null}
    {meeting.status === "failed" ? <div className="app-card app-card--clay">
      <p>Processing failed. Your recording is safe.</p>
      <button className="dashboard-primary-button" type="button" onClick={() => void reprocess()}>Try again →</button>
    </div> : null}
    {lowSpeech && !working ? <div className="mtg-banner" role="status">
      <Icon name="mic" size={18} />
      <div>
        <strong>We heard very little speech</strong>
        <p>{summary?.short}</p>
      </div>
      <button className="dashboard-primary-button" type="button" onClick={() => void reprocess()}><Icon name="refresh" size={15} />Reprocess</button>
    </div> : null}
    {!botActive && ["draft", "scheduled", "ready_for_upload"].includes(meeting.status ?? "") ? <Capture meeting={meeting} onQueued={() => setStatus({ status: "queued", stage: "queued", progress: 0, message: "Queued…" })} onError={setError} /> : null}

    {ready || botActive || segments.length ? <div className="mtg-layout">
      <div className="mtg-main">
        {ready ? <>
          <nav className="tabs" role="tablist" aria-label="Meeting sections">
            {([
              ["overview", "Overview", "home"],
              ["summary", isLecture ? "Notes" : "Summary", "sparkles"],
              ["action-items", "Action items", "check"],
              ["tasks", "Tasks", "board"],
            ] as const).map(([value, label, icon]) => <button key={value} role="tab" aria-selected={tab === value} className={tab === value ? "is-active" : ""} onClick={() => setTab(value)}>
              <Icon name={icon} size={15} />{label}
              {value === "action-items" && pendingItems ? <span className="tabs__count">{pendingItems}</span> : null}
            </button>)}
          </nav>

          {tab === "overview" ? <Overview meeting={meeting} summary={summary} items={items} updates={updates} speakers={speakers} markdown={markdown} onTab={setTab} /> : null}
          {tab === "summary" ? <SummaryTab meeting={meeting} summary={summary} markdown={markdown} onShare={() => setShareOpen(true)} /> : null}
          {tab === "action-items" ? <>
            <BoardUpdates meetingId={id} updates={updates} setUpdates={setUpdates} onError={setError} />
            <ActionItemsReview meetingId={id} items={items} setItems={setItems} onError={setError} />
          </> : null}
          {tab === "tasks" ? <MeetingTasks meetingId={id} /> : null}
        </> : <section className="dashboard-surface mtg-livecard">
          <h2>{live ? "The meeting is happening now." : "Waiting for the notetaker."}</h2>
          <p className="app-muted">{live
            ? "The conversation appears on the right as people speak. Ask anything below — answers use what has been said so far. Notes, action items and the full transcript arrive when the call ends."
            : "Once someone admits VOII Notetaker into the call, the conversation will start appearing on the right."}</p>
          {speakers.length ? <p className="app-muted">{speakers.length} speaker{speakers.length === 1 ? "" : "s"} so far: {speakers.map((sp) => sp.name).join(", ")}</p> : null}
        </section>}

        <AskPanel meetingId={id} live={live} />
      </div>
      <TranscriptPanel meeting={meeting} segments={segments} live={live} onCorrected={load} onError={setError} />
    </div> : null}

    {/* Print-only document: what "Export PDF" produces. */}
    {markdown ? <section className="print-doc" aria-hidden="true">
      <header>
        <div className="print-doc__brand">VOII</div>
        <p>{isLecture ? "Lecture notes" : "Meeting notes"}{meeting.course ? ` · ${meeting.course.name}` : ""} · {date}</p>
        <h1>{meeting.title}</h1>
      </header>
      <Markdown>{markdown}</Markdown>
      {items.filter((i) => i.status !== "rejected").length ? <>
        <h2>Action items</h2>
        <ul>{items.filter((i) => i.status !== "rejected").map((i) => <li key={i.id}>{i.title}{i.ownerName ? ` — ${i.ownerName}` : ""}{i.dueDate ? ` (due ${new Date(i.dueDate).toLocaleDateString()})` : ""}</li>)}</ul>
      </> : null}
      <footer>Notes that show their work · usevoii.com</footer>
    </section> : null}
  </>;
}

type SpeakerStat = { name: string; secs: number; share: number };
function speakerShare(segments: Segment[]): SpeakerStat[] {
  const by = new Map<string, number>();
  for (const s of segments) by.set(s.speaker, (by.get(s.speaker) ?? 0) + Math.max(0, s.endSec - s.startSec));
  const total = [...by.values()].reduce((a, b) => a + b, 0) || 1;
  return [...by.entries()].map(([name, secs]) => ({ name, secs, share: Math.round((secs / total) * 100) })).sort((a, b) => b.secs - a.secs);
}
const initialsOf = (name: string) => name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

function Overview({ meeting, summary, items, updates, speakers, markdown, onTab }: {
  meeting: MeetingDetail; summary: Summary | null; items: ActionItem[]; updates: TaskUpdateSuggestion[]; speakers: SpeakerStat[]; markdown: string; onTab: (t: Tab) => void;
}) {
  const pending = items.filter((i) => i.status === "pending_review");
  const pendingUpdates = updates.filter((u) => u.state === "pending");
  const highlights: Array<[string, string[], string]> = [
    ["Decisions", (summary?.decisions ?? []).map((d) => d.title), "sage"],
    ["Blockers", (summary?.blockers ?? []).map((b) => b.title), "clay"],
    ["Open questions", (summary?.questions ?? []).map((q) => q.question), "info"],
  ];
  // One column: the page already gives the transcript its own column on the right.
  return <div className="dash-col">
      {summary?.model === "low-speech-check" ? null : <section className="dashboard-surface">
        <div className="dashboard-section-heading"><h2>{meeting.kind === "lecture" ? "In short" : "Summary"}</h2>{summary?.model ? <span className="dashboard-count">{summary.model}</span> : null}</div>
        {summary?.short ? <p className="lead">{summary.short}</p> : markdown ? <p className="lead">{markdown.slice(0, 280)}…</p> : <p className="app-muted">No summary for this recording.</p>}
        <button className="dashboard-text-button" type="button" onClick={() => onTab("summary")}>{meeting.kind === "lecture" ? "Read the full notes" : "Read the full summary"} <Icon name="arrow" size={13} /></button>
      </section>}
      <section className="review-card">
        <header><span className="chip chip--peach"><Icon name="sparkles" size={12} /> {pending.length + pendingUpdates.length} to review</span></header>
        <p>{pending.length ? `VOII found ${pending.length} action item${pending.length === 1 ? "" : "s"} in this conversation.` : "No new action items waiting."}{pendingUpdates.length ? ` It also spotted ${pendingUpdates.length} update${pendingUpdates.length === 1 ? "" : "s"} to existing tasks.` : ""} Approve them to put them on a board.</p>
        {pending.length ? <ul>{pending.slice(0, 3).map((a) => <li key={a.id}><span className="review-card__box" />{a.title}{a.ownerName ? <small>{a.ownerName}</small> : null}</li>)}</ul> : null}
        <footer><button className="dashboard-primary-button" type="button" onClick={() => onTab("action-items")}>Review all <Icon name="arrow" size={14} /></button></footer>
      </section>
      {highlights.some(([, list]) => list.length) ? <section className="dashboard-surface">
        <div className="dashboard-section-heading"><h2>Highlights</h2></div>
        {highlights.filter(([, list]) => list.length).map(([label, list, tone]) => <div key={label} className="highlight">
          <p className={`highlight__label tone-${tone}`}>{label} <span>{list.length}</span></p>
          <ol>{list.map((t, i) => <li key={i}><span className="mono">{String(i + 1).padStart(2, "0")}</span>{t}</li>)}</ol>
        </div>)}
      </section> : null}
      {speakers.length ? <section className="dashboard-surface">
        <div className="dashboard-section-heading"><h2>Speakers</h2></div>
        <div className="dash-rows">{speakers.map((s) => <div key={s.name} className="dash-row">
          <span className="dashboard-avatar">{initialsOf(s.name)}</span>
          <span className="dash-row__main"><strong>{s.name}</strong><small>{formatClock(s.secs)} talking</small></span>
          <span className="mono app-muted">{s.share}%</span>
        </div>)}</div>
      </section> : null}
  </div>;
}

function TranscriptPanel({ meeting, segments, live, onCorrected, onError }: { meeting: MeetingDetail; segments: Segment[]; live: boolean; onCorrected: () => Promise<void>; onError: (m: string) => void }) {
  const [q, setQ] = useState("");
  const [fixing, setFixing] = useState<{ from: string; to: string; remember: boolean } | null>(null);
  const [renaming, setRenaming] = useState<{ from: string; to: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fixes = meeting.autoCorrections ?? [];
  async function correct(body: Parameters<typeof correctMeeting>[1]) {
    setBusy(true);
    try { await correctMeeting(meeting.id, body); setFixing(null); setRenaming(null); await onCorrected(); }
    catch (e) { onError(msg(e)); }
    finally { setBusy(false); }
  }
  function openFix() {
    const picked = window.getSelection()?.toString().trim() ?? "";
    setFixing({ from: picked.length <= 60 ? picked : "", to: "", remember: true });
  }
  const listRef = useRef<HTMLOListElement>(null);
  const shown = q ? segments.filter((s) => s.text.toLowerCase().includes(q.toLowerCase()) || s.speaker.toLowerCase().includes(q.toLowerCase())) : segments;
  const mark = (text: string) => {
    if (!q) return text;
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((p, i) => (p.toLowerCase() === q.toLowerCase() ? <mark key={i}>{p}</mark> : p));
  };
  // Live: follow the conversation, unless the reader has scrolled up to read.
  useEffect(() => {
    const el = listRef.current;
    if (live && el && el.scrollHeight - el.scrollTop - el.clientHeight < 120) el.scrollTop = el.scrollHeight;
  }, [segments.length, live]);
  function download() {
    const txt = segments.map((s) => `[${formatClock(s.startSec)}] ${s.speaker}: ${s.text}`).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" }));
    a.download = `${meeting.title.replace(/[^\w-]+/g, "-")}-transcript.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  return <aside className="dashboard-surface mtg-side" aria-label="Transcript">
    <div className="dashboard-section-heading">
      <h2>{live ? <><span className="live-dot" aria-hidden="true" />Live transcript</> : "Transcript"}</h2>
      {segments.length && !live ? <span className="tp-actions">
        <button className="dashboard-text-button" type="button" onMouseDown={(e) => e.preventDefault()} onClick={openFix}><Icon name="sparkles" size={14} />Fix a word</button>
        <button className="dashboard-text-button" type="button" onClick={download}><Icon name="download" size={14} />.txt</button>
      </span> : null}
    </div>
    {fixes.length ? <details className="tp-fixes">
      <summary>VOII corrected {fixes.length} word{fixes.length === 1 ? "" : "s"} from the conversation</summary>
      <ul>{fixes.map((c) => <li key={`${c.from}→${c.to}`}>
        <span><s>{c.from}</s> → <strong>{c.to}</strong>{c.reason ? <small> · {c.reason}</small> : null}</span>
        <button className="dashboard-text-button" type="button" disabled={busy} onClick={() => void correct({ kind: "word", from: c.to, to: c.from, forget: true })}>Undo</button>
      </li>)}</ul>
    </details> : null}
    {fixing ? <form method="post" className="tp-fix" onSubmit={(e) => { e.preventDefault(); if (fixing.from.trim() && fixing.to.trim()) void correct({ kind: "word", from: fixing.from, to: fixing.to, remember: fixing.remember }); }}>
      <div className="tp-fix__row">
        <input autoFocus value={fixing.from} onChange={(e) => setFixing({ ...fixing, from: e.target.value })} placeholder="What VOII heard" aria-label="What VOII heard" />
        <span aria-hidden="true">→</span>
        <input value={fixing.to} onChange={(e) => setFixing({ ...fixing, to: e.target.value })} placeholder="What was said" aria-label="What was said" />
      </div>
      <label className="app-check"><input type="checkbox" checked={fixing.remember} onChange={(e) => setFixing({ ...fixing, remember: e.target.checked })} /> Always spell it this way</label>
      <div className="tp-fix__actions">
        <button className="dashboard-quiet-button" type="button" onClick={() => setFixing(null)}>Cancel</button>
        <button className="dashboard-primary-button" type="submit" disabled={busy || !fixing.from.trim() || !fixing.to.trim()}>{busy ? "Fixing…" : "Fix everywhere"}</button>
      </div>
    </form> : null}
    {segments.length ? <label className="kb__search"><span aria-hidden="true">⌕</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search what was said" aria-label="Search transcript" /></label> : null}
    <ol className="transcript mtg-side__list" ref={listRef} aria-live={live ? "polite" : undefined}>
      {shown.map((s) => <li key={s.id} className="tline">
        <span className="mono tline__time">{formatClock(s.startSec)}</span>
        <span className="dashboard-avatar">{initialsOf(s.speaker)}</span>
        <div>
          {renaming?.from === s.speaker ? <form method="post" className="tp-rename" onSubmit={(e) => { e.preventDefault(); if (renaming.to.trim() && renaming.to.trim() !== s.speaker) void correct({ kind: "speaker", from: s.speaker, to: renaming.to.trim() }); }}>
            <input autoFocus value={renaming.to} onChange={(e) => setRenaming({ ...renaming, to: e.target.value })} aria-label={`Rename ${s.speaker}`} onKeyDown={(e) => e.key === "Escape" && setRenaming(null)} />
            <button className="dashboard-text-button" type="submit" disabled={busy}>Rename</button>
          </form> : <button type="button" className="tline__speaker" title="Rename this speaker everywhere in the meeting" disabled={live} onClick={() => setRenaming({ from: s.speaker, to: s.speaker })}>{s.speaker}</button>}
          <p>{mark(s.text)}</p>
        </div>
      </li>)}
      {!segments.length ? <li className="app-muted">{live ? "Listening… lines appear here as people speak." : "No transcript for this recording."}</li> : null}
      {q && segments.length && !shown.length ? <li className="app-muted">No lines match “{q}”.</li> : null}
    </ol>
  </aside>;
}

/** Ask about this meeting — mid-call it answers from what has been said so far. */
function AskPanel({ meetingId, live }: { meetingId: string; live: boolean }) {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [thread, setThread] = useState<Array<{ q: string; a?: string; error?: string }>>([]);
  async function ask(e: FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (q.length < 2 || busy) return;
    setQuestion("");
    setBusy(true);
    setThread((t) => [...t, { q }]);
    try {
      const { answer } = await askMeeting(meetingId, q);
      setThread((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, a: answer } : x)));
    } catch (err) {
      setThread((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, error: msg(err) } : x)));
    } finally { setBusy(false); }
  }
  return <section className="dashboard-surface mtg-ask" aria-label="Ask about this meeting">
    {thread.length ? <ol className="mtg-ask__thread">{thread.map((t, i) => <li key={i}>
      <p className="mtg-ask__q">{t.q}</p>
      {t.a ? <p className="mtg-ask__a">{t.a}</p> : t.error ? <p className="app-error">{t.error}</p> : <p className="app-muted">Thinking…</p>}
    </li>)}</ol> : null}
    <form method="post" className="ai-input" onSubmit={ask}>
      <Icon name="sparkles" size={17} />
      <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={live ? "Ask about what’s being said…" : "Ask about this meeting…"} aria-label="Ask about this meeting" maxLength={500} />
      <button className="dashboard-primary-button" type="submit" disabled={busy || question.trim().length < 2}>{busy ? "…" : "Ask"}</button>
    </form>
  </section>;
}

/** One small pill that says where the meeting is: live, waiting, processing, ready. */
function MeetingState({ botStatus, meetingStatus, working }: { botStatus: string | null; meetingStatus: string; working: boolean }) {
  const [label, tone] =
    botStatus && LIVE.has(botStatus) ? ["Live — recording", "live"]
    : botStatus === "joining" ? ["Joining the call", "wait"]
    : botStatus === "scheduled" ? ["Notetaker scheduled", "wait"]
    : botStatus === "leaving" ? ["Wrapping up", "wait"]
    : working ? ["Processing recording", "wait"]
    : DONE.has(meetingStatus) ? ["Ready", "ok"]
    : meetingStatus === "failed" || botStatus === "failed" ? ["Failed", "bad"]
    : botStatus === "recording_ready" || botStatus === "processing_queued" || botStatus === "left" ? ["Processing recording", "wait"]
    : ["Not recorded yet", "idle"];
  return <span className={`mstate mstate--${tone}`}>{tone === "live" ? <span className="live-dot" aria-hidden="true" /> : null}{label}</span>;
}

function SummaryTab({ meeting, summary, markdown }: { meeting: MeetingDetail; summary: Summary | null; markdown: string; onShare: () => void }) {
  if (!summary) return <p className="app-muted">No summary for this recording.</p>;
  const isLecture = meeting.kind === "lecture";
  // One readable column; Share and Export already sit in the page header.
  return <div className="dash-col">
    {!isLecture && summary.short ? <section className="dashboard-surface"><div className="dashboard-section-heading"><h2>TL;DR</h2></div><p className="lead">{summary.short}</p></section> : null}
    {summary.topics?.length ? <div className="chips">{summary.topics.map((t) => <span key={t} className="chip">{t}</span>)}</div> : null}
    <article className="app-card app-card--paper"><Markdown>{markdown}</Markdown></article>
  </div>;
}

type Draft = ActionItem;

/** The review: nothing becomes a task until a person approves it, then picks where it lives. */
function ActionItemsReview({ meetingId, items, setItems, onError }: { meetingId: string; items: Draft[]; setItems: (f: (i: Draft[]) => Draft[]) => void; onError: (m: string) => void }) {
  const [groupBy, setGroupBy] = useState<"order" | "owner" | "priority">("order");
  const [showQuotes, setShowQuotes] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [sentBoard, setSentBoard] = useState<string | null>(null);

  const open = items.filter((i) => i.status !== "converted");
  const approved = items.filter((i) => i.status === "approved");
  const rejected = items.filter((i) => i.status === "rejected");
  const pending = items.filter((i) => i.status === "pending_review");
  const converted = items.filter((i) => i.status === "converted");

  async function patch(item: Draft, change: Parameters<typeof updateActionItem>[2]) {
    const before = item;
    setItems((all) => all.map((x) => (x.id === item.id ? { ...x, ...change } as Draft : x)));
    try { await updateActionItem(meetingId, item.id, change); }
    catch (e) { setItems((all) => all.map((x) => (x.id === item.id ? before : x))); onError(msg(e)); }
  }
  async function bulk(status: "approved" | "pending_review") {
    const ids = open.map((i) => i.id);
    if (!ids.length) return;
    setItems((all) => all.map((x) => (ids.includes(x.id) ? { ...x, status } : x)));
    try { await bulkUpdateActionItems(meetingId, ids, status); } catch (e) { onError(msg(e)); }
  }

  const groups = useMemo(() => {
    if (groupBy === "order") return [["", open]] as Array<[string, Draft[]]>;
    const key = (i: Draft) => (groupBy === "owner" ? i.ownerName || "Unassigned" : i.priority);
    const order = groupBy === "priority" ? ["urgent", "high", "medium", "low"] : [...new Set(open.map(key))];
    return order.map((k) => [k, open.filter((i) => key(i) === k)] as [string, Draft[]]).filter(([, l]) => l.length);
  }, [open, groupBy]);

  if (!items.length) return <section className="dashboard-surface"><p className="app-muted">VOII didn’t find any action items in this recording.</p></section>;

  return <div className="review">
    <div className="review-bar">
      <span className="dash-row__icon"><Icon name="sparkles" size={16} /></span>
      <span className="dash-row__main"><strong>Suggested by VOII</strong><small>Approve, edit or dismiss each one. Approved items become tasks on a board.</small></span>
      <span className="review-dots" aria-label={`${approved.length} approved, ${rejected.length} dismissed, ${pending.length} left`}>{open.map((i) => <span key={i.id} className={`review-dot is-${i.status}`} />)}</span>
      <div className="seg">{(["order", "owner", "priority"] as const).map((g) => <button key={g} type="button" className={groupBy === g ? "is-active" : ""} onClick={() => setGroupBy(g)}>{g === "order" ? "Order" : g === "owner" ? "Owner" : "Priority"}</button>)}</div>
      <button className="dashboard-icon-button" type="button" aria-pressed={showQuotes} title="Show source quotes" onClick={() => setShowQuotes((v) => !v)}><Icon name="conversation" size={16} /></button>
    </div>

    {sentBoard && open.length ? <div className="review-done" role="status">
      <span className="dash-row__icon"><Icon name="check" size={16} /></span>
      <span className="dash-row__main"><strong>Added to the board</strong><small>{converted.length} task{converted.length === 1 ? "" : "s"} from this meeting so far. Keep reviewing the rest below.</small></span>
      <Link className="dashboard-primary-button" href={`/board?board=${sentBoard}`}>Open board</Link>
    </div> : null}

    {converted.length && !open.some((i) => i.status === "pending_review" || i.status === "approved") ? <div className="review-done">
      <span className="dash-row__icon"><Icon name="check" size={16} /></span>
      <span className="dash-row__main"><strong>{converted.length} task{converted.length === 1 ? "" : "s"} created · {rejected.length} dismissed</strong><small>They stay linked to this meeting.</small></span>
      {sentBoard ? <Link className="dashboard-primary-button" href={`/board?board=${sentBoard}`}>Open board</Link> : <Link className="dashboard-quiet-button" href="/tasks">View tasks</Link>}
    </div> : null}

    {sendOpen ? <SendToBoard meetingId={meetingId} items={approved} onCancel={() => setSendOpen(false)} onError={onError}
      onDone={(boardId) => { setSendOpen(false); setSentBoard(boardId); setItems((all) => all.map((x) => (x.status === "approved" ? { ...x, status: "converted" } : x))); }} /> : null}

    {groups.map(([label, list]) => <div key={label || "all"} className="review-group">
      {label ? <p className="review-group__label">{label} <span>{list.length}</span></p> : null}
      {list.map((item) => <ActionCard key={item.id} item={item} showQuote={showQuotes} editing={editing === item.id}
        onEdit={() => setEditing(editing === item.id ? null : item.id)}
        onApprove={() => void patch(item, { status: item.status === "approved" ? "pending_review" : "approved" })}
        onReject={() => void patch(item, { status: item.status === "rejected" ? "pending_review" : "rejected" })}
        onChange={(c) => void patch(item, c)} />)}
    </div>)}

    {converted.length && open.length && !sentBoard ? <p className="app-muted">{converted.length} already on a board.</p> : null}

    {open.length && !sendOpen ? <div className="review-toolbar" role="toolbar" aria-label="Review actions">
      <span><strong>{approved.length}</strong> approved · <strong>{rejected.length}</strong> dismissed · <span className="app-muted">{pending.length} left</span></span>
      <button className="dashboard-text-button" type="button" onClick={() => void bulk("approved")}>Approve all</button>
      <button className="dashboard-text-button" type="button" onClick={() => void bulk("pending_review")}>Reset</button>
      <button className="dashboard-primary-button" type="button" disabled={!approved.length} onClick={() => setSendOpen(true)}>Send {approved.length || ""} to board <Icon name="arrow" size={14} /></button>
    </div> : null}
  </div>;
}

function ActionCard({ item, showQuote, editing, onEdit, onApprove, onReject, onChange }: {
  item: Draft; showQuote: boolean; editing: boolean; onEdit: () => void; onApprove: () => void; onReject: () => void; onChange: (c: Parameters<typeof updateActionItem>[2]) => void;
}) {
  const confidence = typeof item.confidence === "number" ? Math.round(item.confidence * 100) : null;
  return <article className={`action-card is-${item.status} ${editing ? "is-editing" : ""}`}>
    <button className={`action-card__check ${item.status === "approved" ? "is-on" : ""}`} type="button" aria-pressed={item.status === "approved"} aria-label={item.status === "approved" ? "Unapprove" : `Approve ${item.title}`} onClick={onApprove}>{item.status === "approved" ? "✓" : ""}</button>
    <div className="action-card__main">
      {editing ? <input className="action-card__title-input" defaultValue={item.title} autoFocus aria-label="Title"
        onBlur={(e) => e.target.value.trim().length >= 2 && e.target.value.trim() !== item.title && onChange({ title: e.target.value.trim() })}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
        : <h3 onClick={onEdit}>{item.title}</h3>}
      {item.description ? <p className="action-card__desc">{item.description}</p> : null}
      <div className="action-card__meta">
        <span className="meta-chip"><Icon name="clients" size={12} />{item.ownerName || "No owner"}</span>
        {editing ? <>
          <input className="meta-input" type="date" defaultValue={item.dueDate?.slice(0, 10) ?? ""} aria-label="Due date" onChange={(e) => onChange({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })} />
          <select className="meta-input" defaultValue={item.priority} aria-label="Priority" onChange={(e) => onChange({ priority: e.target.value })}>{["urgent", "high", "medium", "low"].map((p) => <option key={p} value={p}>{p}</option>)}</select>
        </> : <>
          <span className={`meta-chip ${item.dueDate ? "" : "is-empty"}`}><Icon name="calendar" size={12} />{item.dueDate ? formatDate(item.dueDate) : "No due date"}</span>
          <span className={`prio prio--${item.priority}`}>{item.priority}</span>
        </>}
      </div>
      {showQuote && item.sourceQuote?.text ? <blockquote className="action-card__quote"><strong>{item.sourceQuote.speaker ?? "Speaker"} ({formatClock(item.sourceQuote.time ?? 0)}):</strong> “{item.sourceQuote.text}”</blockquote> : null}
    </div>
    <div className="action-card__side">
      {confidence !== null ? <span className={`confidence ${confidence < 75 ? "is-low" : ""}`} title="How sure VOII is"><span><span style={{ width: `${confidence}%` }} /></span>{confidence}%</span> : null}
      <div className="action-card__buttons">
        <button className="dashboard-icon-button" type="button" title={editing ? "Done" : "Edit"} aria-label={editing ? "Done editing" : "Edit"} onClick={onEdit}><Icon name={editing ? "check" : "knowledge"} size={15} /></button>
        <button className="dashboard-icon-button" type="button" title={item.status === "rejected" ? "Restore" : "Dismiss"} aria-label={item.status === "rejected" ? "Restore" : "Dismiss"} onClick={onReject}><Icon name={item.status === "rejected" ? "refresh" : "close"} size={15} /></button>
      </div>
    </div>
  </article>;
}

/** Step two of review: choose where approved items live. They stay linked to the meeting. */
function SendToBoard({ meetingId, items, onCancel, onDone, onError }: { meetingId: string; items: Draft[]; onCancel: () => void; onDone: (boardId: string) => void; onError: (m: string) => void }) {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [projectId, setProjectId] = useState("");
  const [newProject, setNewProject] = useState("");
  const [boards, setBoards] = useState<Array<{ id: string; name: string }>>([]);
  const [boardId, setBoardId] = useState("");
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [columnId, setColumnId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { listAllProjects().then((r) => { setProjects(r.projects); setProjectId(r.projects[0]?.id ?? "new"); }).catch(() => { setProjects([]); setProjectId("new"); }); }, []);
  useEffect(() => {
    if (!projectId || projectId === "new") { setBoards([]); setBoardId(""); return; }
    listBoards(projectId).then((r) => { setBoards(r.boards); setBoardId(r.boards[0]?.id ?? ""); }).catch(() => setBoards([]));
  }, [projectId]);
  useEffect(() => {
    if (!boardId) { setColumns([]); setColumnId(""); return; }
    getBoard(boardId).then((r) => { setColumns(r.board.columns); setColumnId(r.board.columns[0]?.id ?? ""); }).catch(() => setColumns([]));
  }, [boardId]);

  async function create() {
    setSaving(true);
    try {
      let pid = projectId, bid = boardId, cid = columnId;
      if (pid === "new") pid = (await createProjectQuick(newProject.trim() || "My work")).project.id;
      if (!bid) { const b = (await createBoard(pid, "Board")).board; bid = b.id; cid = (await getBoard(bid)).board.columns[0]?.id ?? ""; }
      if (!cid) throw new Error("That board has no columns yet.");
      await convertToTasks(meetingId, { itemIds: items.map((i) => i.id), projectId: pid, boardId: bid, columnId: cid });
      onDone(bid);
    } catch (e) { onError(msg(e)); setSaving(false); }
  }

  const columnName = columns.find((c) => c.id === columnId)?.name ?? "the first column";
  return <section className="send-board" ref={(el) => { if (el && !el.dataset.shown) { el.dataset.shown = "1"; el.scrollIntoView({ behavior: "smooth", block: "center" }); } }}>
    <header><span className="dash-row__icon"><Icon name="arrow" size={15} /></span><span className="dash-row__main"><strong>Send {items.length} approved item{items.length === 1 ? "" : "s"} to a board</strong><small>Choose where these tasks live. They stay linked to this meeting.</small></span><button className="dashboard-icon-button" type="button" aria-label="Close" onClick={onCancel}><Icon name="close" size={16} /></button></header>
    <div className="field-grid field-grid--3">
      <label className="field"><span>Project</span><select value={projectId} onChange={(e) => setProjectId(e.target.value)}>{(projects ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}<option value="new">+ New project</option></select></label>
      {projectId === "new" ? <label className="field"><span>Project name</span><input value={newProject} onChange={(e) => setNewProject(e.target.value)} placeholder="Northstar website" /></label>
        : <label className="field"><span>Board</span><select value={boardId} onChange={(e) => setBoardId(e.target.value)}>{boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}{!boards.length ? <option value="">New board</option> : null}</select></label>}
      <label className="field"><span>Column</span><select value={columnId} onChange={(e) => setColumnId(e.target.value)} disabled={!columns.length}>{columns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}{!columns.length ? <option value="">To Do</option> : null}</select></label>
    </div>
    <div className="send-board__preview">
      <p className="dashboard-location">{items.length} task{items.length === 1 ? "" : "s"} will be created in {columnName}</p>
      {items.map((i) => <div key={i.id} className="send-board__row"><Icon name="check" size={13} /><span className="truncate">{i.title}</span>{i.ownerName ? <small>{i.ownerName}</small> : null}<span className={`prio prio--${i.priority}`}>{i.priority}</span></div>)}
    </div>
    <footer><button className="dashboard-text-button" type="button" onClick={onCancel}>Back to review</button><button className="dashboard-primary-button" type="button" disabled={saving} onClick={() => void create()}>{saving ? "Creating…" : `Create ${items.length} task${items.length === 1 ? "" : "s"}`} <Icon name="arrow" size={14} /></button></footer>
  </section>;
}

function MeetingTasks({ meetingId }: { meetingId: string }) {
  const [tasks, setTasks] = useState<Awaited<ReturnType<typeof listTasksForMeeting>>["tasks"] | null>(null);
  useEffect(() => { listTasksForMeeting(meetingId).then((r) => setTasks(r.tasks)).catch(() => setTasks([])); }, [meetingId]);
  if (tasks === null) return <p className="app-muted">Loading…</p>;
  if (!tasks.length) return <section className="dashboard-surface"><p className="app-muted">No tasks yet — approve action items and send them to a board.</p></section>;
  return <section className="dashboard-surface">
    <div className="mlist">
      <div className="mlist__head mlist__head--tasks" aria-hidden="true"><span>Task</span><span>Status</span><span>Priority</span><span>Due</span></div>
      {tasks.map((t) => <Link key={t.id} href={t.boardId ? `/board?board=${t.boardId}&task=${t.id}` : "/tasks"} className="mlist__row mlist__row--tasks">
        <strong className="truncate">{t.title}</strong>
        <span className={`chip ${t.status === "done" ? "chip--sage" : t.status === "in_progress" ? "chip--info" : ""}`}>{(t.status ?? "todo").replaceAll("_", " ")}</span>
        <span className={`prio prio--${t.priority ?? "medium"}`}>{t.priority ?? "medium"}</span>
        <span className="app-muted">{t.dueDate ? formatDate(t.dueDate) : "—"}</span>
      </Link>)}
    </div>
  </section>;
}

const STATUS_LABEL: Record<string, string> = { todo: "To do", in_progress: "In progress", in_review: "In review", done: "Done" };

function Progress({ status }: { status: ProcessingStatus | null }) {
  const pct = Math.max(4, status?.progress ?? 5);
  return <div className="app-card" role="status" aria-live="polite">
    <p>{status?.message ?? "Working on it…"}</p>
    <div className="progress"><span style={{ width: `${pct}%` }} /></div>
    <p className="app-muted">You can leave this page — we’ll email you when it’s ready.</p>
  </div>;
}

/** No recording yet: upload one, record in the browser, or send the bot to the call. */
function Capture({ meeting, onQueued, onError }: { meeting: MeetingDetail; onQueued: () => void; onError: (m: string) => void }) {
  const [busy, setBusy] = useState("");
  const [bot, setBot] = useState<string | null>(null);
  const [botError, setBotError] = useState("");

  async function upload(file: Blob, name: string) {
    setBusy("Uploading… 0%");
    try {
      await uploadRecording(meeting.id, file, name, (f) => setBusy(`Uploading… ${Math.round(f * 100)}%`));
      onQueued();
    } catch (e) { onError(msg(e)); } finally { setBusy(""); }
  }

  // Reloading mid-call should show the bot that's already there, not offer a second one.
  useEffect(() => {
    if (!meeting.meetingUrl) return;
    getBotStatus(meeting.id).then((r) => {
      const s = r.botSession?.status;
      if (!s || s === "cancelled") return;
      setBot(s);
      if (s === "failed") setBotError(r.botSession?.failureReason || "The notetaker couldn’t join.");
    }).catch(() => undefined);
  }, [meeting.id, meeting.meetingUrl]);

  useEffect(() => {
    if (!bot || ["completed", "failed", "cancelled", "processing_queued"].includes(bot)) return;
    const t = setInterval(async () => {
      try {
        const r = await getBotStatus(meeting.id);
        setBot(r.botSession?.status ?? bot);
        if (r.botSession?.status === "failed") setBotError(r.botSession.failureReason || "The notetaker couldn’t join.");
        if (r.botSession?.status === "processing_queued") onQueued();
      } catch { /* keep polling */ }
    }, 5000);
    return () => clearInterval(t);
  }, [bot, meeting.id, onQueued]);

  return <div className="app-card capture">
    {meeting.meetingUrl ? <div>
      <h2>Send VOII to the call</h2>
      <p className="app-muted">A notetaker joins <span className="mono">{meeting.meetingUrl}</span>, records, and leaves when the call ends. Tasks wait for your approval before anything reaches the board.</p>
      {botError ? <div className="bot-error" role="alert"><p className="app-error">{botError}</p><button className="dashboard-quiet-button" type="button" onClick={() => { setBot(null); setBotError(""); }}>Try again</button></div>
        : bot ? <p className="chip chip--sage" role="status">Notetaker: {bot.replace(/_/g, " ")}</p> : <button className="dashboard-primary-button" type="button" disabled={!!busy} onClick={async () => { try { const r = await sendBot(meeting.id); setBot(r.botSession.status); } catch (e) { onError(msg(e)); } }}>Join the call now →</button>}
    </div> : null}
    <div>
      <h2>{meeting.meetingUrl ? "Or add a recording" : "Add the recording"}</h2>
      <div className="capture__row">
        <label className="dashboard-quiet-button">Upload a file<input hidden type="file" accept="audio/*,video/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f, f.name); }} /></label>
        <Recorder disabled={!!busy} onDone={(blob) => upload(blob, `recording-${Date.now()}.webm`)} />
      </div>
      {busy ? <p className="app-muted" role="status">{busy}</p> : null}
    </div>
  </div>;
}

/** Native MediaRecorder with the browser's own noise suppression — the free first layer of cleanup. */
function Recorder({ onDone, disabled }: { onDone: (b: Blob) => void; disabled: boolean }) {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    if (!rec) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [rec]);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true } });
    const r = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    r.ondataavailable = (e) => chunks.push(e.data);
    r.onstop = () => { stream.getTracks().forEach((t) => t.stop()); onDone(new Blob(chunks, { type: r.mimeType.split(";")[0] || "audio/webm" })); };
    r.start(1000);
    setSecs(0);
    setRec(r);
  }

  return rec
    ? <button className="dashboard-primary-button rec-on" type="button" onClick={() => { rec.stop(); setRec(null); }}>■ Stop · <span className="mono">{formatClock(secs)}</span></button>
    : <button className="dashboard-primary-button" type="button" disabled={disabled} onClick={() => void start()}>● Record here</button>;
}

/** Existing tasks this conversation moved along. Approve and the card moves on the board. */
function BoardUpdates({ meetingId, updates, setUpdates, onError }: {
  meetingId: string; updates: TaskUpdateSuggestion[];
  setUpdates: (f: (u: TaskUpdateSuggestion[]) => TaskUpdateSuggestion[]) => void; onError: (m: string) => void;
}) {
  if (!updates.length) return null;
  async function decide(u: TaskUpdateSuggestion, decision: "apply" | "dismiss") {
    try {
      await decideTaskUpdate(meetingId, u.id, decision);
      setUpdates((all) => all.map((x) => (x.id === u.id ? { ...x, state: decision === "apply" ? "applied" : "dismissed" } : x)));
    } catch (e) { onError(msg(e)); }
  }
  return <div className="app-card">
    <h2>Board updates</h2>
    <p className="app-muted">Things said in this conversation that move existing tasks. Nothing changes until you approve.</p>
    <ul className="approve-list">
      {updates.map((u) => <li key={u.id} data-status={u.state === "dismissed" ? "rejected" : u.state}>
        <div>
          <h3>{u.task.title}</h3>
          <p className="status-move">{u.state === "pending" ? <><span>{STATUS_LABEL[u.task.status] ?? u.task.status}</span> → </> : "Moved to "}<strong>{STATUS_LABEL[u.toStatus] ?? u.toStatus}</strong></p>
          {u.quote ? <blockquote className="src">“{u.quote}”</blockquote> : null}
        </div>
        {u.state === "pending" ? <div className="approve-list__actions">
          <button className="dashboard-quiet-button" type="button" onClick={() => decide(u, "dismiss")}>Dismiss</button>
          <button className="dashboard-primary-button" type="button" onClick={() => decide(u, "apply")}>Apply</button>
        </div> : <span className={`chip ${u.state === "applied" ? "chip--sage" : ""}`}>{u.state === "applied" ? "Moved on the board" : "Dismissed"}</span>}
      </li>)}
    </ul>
    {updates.some((u) => u.state === "applied" && u.task.boardId) ? <Link className="dashboard-text-button" href={`/board?board=${updates.find((u) => u.state === "applied" && u.task.boardId)!.task.boardId}`}>Open the board →</Link> : null}
  </div>;
}

function SharePanel({ meetingId }: { meetingId: string }) {
  const [url, setUrl] = useState("");
  const [withTranscript, setWithTranscript] = useState(false);
  const [error, setError] = useState("");
  return <div className="app-card">
    <h2>Share these notes</h2>
    <p className="app-muted">Anyone with the link can read the notes — no account needed. Links expire after 30 days.</p>
    <label className="app-check"><input type="checkbox" checked={withTranscript} onChange={(e) => setWithTranscript(e.target.checked)} /> Include the full transcript</label>
    {url ? <div className="copy-row"><input readOnly value={url} onFocus={(e) => e.target.select()} /><button className="dashboard-primary-button" type="button" onClick={() => navigator.clipboard.writeText(url)}>Copy</button></div>
      : <button className="dashboard-primary-button" type="button" onClick={async () => {
        try {
          const { share } = await createShare(meetingId, { includeTranscript: withTranscript, includeTasks: true, expiresAt: new Date(Date.now() + 30 * 864e5).toISOString() });
          setUrl(share.publicUrl ?? "");
        } catch (e) { setError(msg(e)); }
      }}>Create link →</button>}
    {error ? <p className="app-error">{error}</p> : null}
  </div>;
}

