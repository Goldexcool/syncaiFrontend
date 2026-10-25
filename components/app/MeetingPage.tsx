"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { Logo } from "@/components/SiteHeader";
import { Markdown, formatClock, summaryToMarkdown } from "@/components/app/Notes";
import { ApiRequestError } from "@/lib/api/client";
import {
  convertToTasks, createBoard, createProjectQuick, createShare, getBotStatus, getMeeting, getProcessingStatus, getSummary, getTranscript,
  listActionItems, listAllProjects, listBoards, getBoard, reprocessMeeting, sendBot, updateActionItem, uploadRecording,
  type ActionItem, type MeetingDetail, type ProcessingStatus, type Segment, type Summary,
} from "@/lib/api/app";
import type { Project } from "@/lib/api/dashboard";

const WORKING = new Set(["uploaded", "queued", "processing", "transcribing", "summarizing", "extracting_action_items"]);
const DONE = new Set(["pending_review", "tasks_created", "completed"]);
const msg = (e: unknown) => (e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Something went wrong.");

export default function MeetingPage({ id }: { id: string }) {
  return <AuthGate><MeetingView id={id} /></AuthGate>;
}

function MeetingView({ id }: { id: string }) {
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [items, setItems] = useState<ActionItem[]>([]);
  const [tab, setTab] = useState<"notes" | "approve" | "transcript">("notes");
  const [error, setError] = useState("");
  const [shareOpen, setShareOpen] = useState(false);

  const loadOutputs = useCallback(async () => {
    const [s, t, a] = await Promise.allSettled([getSummary(id), getTranscript(id), listActionItems(id)]);
    if (s.status === "fulfilled") setSummary(s.value.summary);
    if (t.status === "fulfilled") setSegments(t.value.segments ?? []);
    if (a.status === "fulfilled") setItems(a.value.actionItems ?? []);
  }, [id]);

  const load = useCallback(async () => {
    try {
      const { meeting } = await getMeeting(id);
      setMeeting(meeting);
      if (DONE.has(meeting.status ?? "")) await loadOutputs();
    } catch (e) { setError(msg(e)); }
  }, [id, loadOutputs]);

  useEffect(() => { void load(); }, [load]);

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

  if (error && !meeting) return <Frame><p className="app-error">{error}</p></Frame>;
  if (!meeting) return <Frame><p className="app-muted">Opening…</p></Frame>;

  const markdown = summary ? summaryToMarkdown(summary) : "";
  const pending = items.filter((i) => i.status === "pending_review").length;
  const date = new Date(meeting.createdAt ?? Date.now()).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

  return <Frame>
    <header className="mtg-head">
      <div>
        <p className="app-eyebrow">
          {meeting.kind === "lecture" ? <span className="chip chip--peach">Lecture</span> : <span className="chip">Meeting</span>}
          {meeting.course ? <span>{meeting.course.code ? `${meeting.course.code} · ` : ""}{meeting.course.name}</span> : null}
          <span>{date}</span>
          {meeting.durationSec ? <span className="mono">{formatClock(meeting.durationSec)}</span> : null}
        </p>
        <h1>{meeting.title}</h1>
      </div>
      {DONE.has(meeting.status ?? "") ? <div className="mtg-actions">
        <button className="dashboard-quiet-button" type="button" onClick={() => setShareOpen((v) => !v)}>Share</button>
        <button className="dashboard-primary-button" type="button" onClick={() => window.print()}>Download PDF →</button>
      </div> : null}
    </header>

    {shareOpen ? <SharePanel meetingId={id} /> : null}
    {error ? <p className="app-error" role="alert">{error}</p> : null}

    {working ? <Progress status={status} /> : null}
    {meeting.status === "failed" ? <div className="app-card app-card--clay">
      <p>Processing failed. Your recording is safe.</p>
      <button className="dashboard-primary-button" type="button" onClick={async () => { try { await reprocessMeeting(id); setStatus({ status: "queued", stage: "queued", progress: 0, message: "Queued again…" }); } catch (e) { setError(msg(e)); } }}>Try again →</button>
    </div> : null}
    {["draft", "scheduled", "ready_for_upload"].includes(meeting.status ?? "") ? <Capture meeting={meeting} onQueued={() => setStatus({ status: "queued", stage: "queued", progress: 0, message: "Queued…" })} onError={setError} /> : null}

    {DONE.has(meeting.status ?? "") ? <>
      <nav className="app-tabs" role="tablist">
        <button role="tab" aria-selected={tab === "notes"} className={tab === "notes" ? "is-active" : ""} onClick={() => setTab("notes")}>{meeting.kind === "lecture" ? "Notes" : "Summary"}</button>
        <button role="tab" aria-selected={tab === "approve"} className={tab === "approve" ? "is-active" : ""} onClick={() => setTab("approve")}>Tasks to approve {pending ? <span className="chip chip--peach">{pending}</span> : null}</button>
        <button role="tab" aria-selected={tab === "transcript"} className={tab === "transcript" ? "is-active" : ""} onClick={() => setTab("transcript")}>Transcript</button>
      </nav>
      {tab === "notes" ? (markdown ? <article className="app-card app-card--paper"><Markdown>{markdown}</Markdown></article> : <p className="app-muted">No notes were produced for this recording.</p>) : null}
      {tab === "approve" ? <Approvals meetingId={id} items={items} setItems={setItems} onError={setError} /> : null}
      {tab === "transcript" ? <Transcript segments={segments} /> : null}
    </> : null}

    {/* Print-only document: what "Download PDF" produces. */}
    {markdown ? <section className="print-doc" aria-hidden="true">
      <header>
        <div className="print-doc__brand">VOII</div>
        <p>{meeting.kind === "lecture" ? "Lecture notes" : "Meeting notes"}{meeting.course ? ` · ${meeting.course.name}` : ""} · {date}</p>
        <h1>{meeting.title}</h1>
      </header>
      <Markdown>{markdown}</Markdown>
      {items.filter((i) => i.status !== "rejected").length ? <>
        <h2>Action items</h2>
        <ul>{items.filter((i) => i.status !== "rejected").map((i) => <li key={i.id}>{i.title}{i.ownerName ? ` — ${i.ownerName}` : ""}{i.dueDate ? ` (due ${new Date(i.dueDate).toLocaleDateString()})` : ""}</li>)}</ul>
      </> : null}
      <footer>Notes that show their work · voii.app</footer>
    </section> : null}
  </Frame>;
}

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="app-page" id="main-content">
    <header className="app-bar"><Link href="/dashboard" aria-label="Back to workspace"><Logo /></Link><Link className="dashboard-text-button" href="/dashboard">← Workspace</Link></header>
    <main className="app-main">{children}</main>
  </div>;
}

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

  async function upload(file: Blob, name: string) {
    setBusy("Uploading… 0%");
    try {
      await uploadRecording(meeting.id, file, name, (f) => setBusy(`Uploading… ${Math.round(f * 100)}%`));
      onQueued();
    } catch (e) { onError(msg(e)); } finally { setBusy(""); }
  }

  useEffect(() => {
    if (!bot || ["completed", "failed", "cancelled", "processing_queued"].includes(bot)) return;
    const t = setInterval(async () => {
      try { const r = await getBotStatus(meeting.id); setBot(r.botSession?.status ?? bot); if (r.botSession?.status === "processing_queued") onQueued(); } catch { /* keep polling */ }
    }, 5000);
    return () => clearInterval(t);
  }, [bot, meeting.id, onQueued]);

  return <div className="app-card capture">
    {meeting.meetingUrl ? <div>
      <h2>Send VOII to the call</h2>
      <p className="app-muted">A notetaker joins <span className="mono">{meeting.meetingUrl}</span>, records, and leaves when the call ends. Tasks wait for your approval before anything reaches the board.</p>
      {bot ? <p className="chip chip--sage">Bot: {bot.replace(/_/g, " ")}</p> : <button className="dashboard-primary-button" type="button" disabled={!!busy} onClick={async () => { try { const r = await sendBot(meeting.id); setBot(r.botSession.status); } catch (e) { onError(msg(e)); } }}>Join the call now →</button>}
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

/** Nothing reaches the board until a person approves it. */
function Approvals({ meetingId, items, setItems, onError }: { meetingId: string; items: ActionItem[]; setItems: (f: (i: ActionItem[]) => ActionItem[]) => void; onError: (m: string) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState("");

  useEffect(() => { listAllProjects().then((r) => { setProjects(r.projects); setProjectId((p) => p || r.projects[0]?.id || ""); }).catch(() => undefined); }, []);

  async function decide(item: ActionItem, status: "approved" | "rejected") {
    try {
      await updateActionItem(meetingId, item.id, { status });
      setItems((all) => all.map((i) => (i.id === item.id ? { ...i, status } : i)));
    } catch (e) { onError(msg(e)); }
  }

  async function sendToBoard() {
    const approved = items.filter((i) => i.status === "approved");
    if (!approved.length) return;
    setSaving(true);
    try {
      let pid = projectId;
      if (!pid) pid = (await createProjectQuick("My work")).project.id;
      const boards = (await listBoards(pid)).boards;
      const boardId = boards[0]?.id ?? (await createBoard(pid, "Board")).board.id;
      const board = (await getBoard(boardId)).board;
      const columnId = board.columns[0]?.id;
      if (!columnId) throw new Error("That board has no columns yet.");
      await convertToTasks(meetingId, { itemIds: approved.map((i) => i.id), projectId: pid, boardId, columnId });
      setItems((all) => all.map((i) => (i.status === "approved" ? { ...i, status: "converted" } : i)));
      setDone(boardId);
    } catch (e) { onError(msg(e)); } finally { setSaving(false); }
  }

  if (!items.length) return <p className="app-muted">No action items were found in this recording.</p>;
  const approvedCount = items.filter((i) => i.status === "approved").length;

  return <div className="app-card">
    <ul className="approve-list">
      {items.map((i) => <li key={i.id} data-status={i.status}>
        <div>
          <h3>{i.title}</h3>
          <p className="app-muted">{[i.ownerName, i.dueDate && `due ${new Date(i.dueDate).toLocaleDateString()}`, i.priority].filter(Boolean).join(" · ")}</p>
          {i.sourceQuote?.text ? <blockquote className="src">“{i.sourceQuote.text}”<span className="mono"> · {formatClock(i.sourceQuote.time ?? 0)}{i.sourceQuote.speaker ? ` · ${i.sourceQuote.speaker}` : ""}</span></blockquote> : null}
        </div>
        {i.status === "pending_review" ? <div className="approve-list__actions">
          <button className="dashboard-quiet-button" type="button" onClick={() => decide(i, "rejected")}>Dismiss</button>
          <button className="dashboard-primary-button" type="button" onClick={() => decide(i, "approved")}>Approve</button>
        </div> : <span className={`chip ${i.status === "rejected" ? "" : "chip--sage"}`}>{i.status === "converted" ? "On the board" : i.status}</span>}
      </li>)}
    </ul>
    <div className="approve-foot">
      <label>Board for approved tasks
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          {!projects.length ? <option value="">New project “My work”</option> : null}
        </select>
      </label>
      <button className="dashboard-primary-button" type="button" disabled={!approvedCount || saving} onClick={() => void sendToBoard()}>{saving ? "Adding…" : `Add ${approvedCount || ""} to board →`}</button>
    </div>
    {done ? <p className="chip chip--sage" role="status">Added. <Link href={`/board?board=${done}`}>Open the board →</Link></p> : null}
  </div>;
}

function Transcript({ segments }: { segments: Segment[] }) {
  if (!segments.length) return <p className="app-muted">No transcript.</p>;
  return <ol className="app-card transcript">
    {segments.map((s) => <li key={s.id}><span className="src mono">{formatClock(s.startSec)} · {s.speaker}</span><p>{s.text}</p></li>)}
  </ol>;
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
