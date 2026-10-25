"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Logo } from "@/components/SiteHeader";
import { Markdown, formatClock, summaryToMarkdown } from "@/components/app/Notes";
import { ApiRequestError } from "@/lib/api/client";
import { getPublicPortal, getPublicShare, postPortalMessage, type PublicPortal, type PublicShare } from "@/lib/api/app";

const errorText = (e: unknown) => (e instanceof ApiRequestError ? e.message : "This link could not be opened.");

function PaperFrame({ children }: { children: React.ReactNode }) {
  return <div className="pub" id="main-content">
    <header className="pub__bar"><Logo /></header>
    <main className="pub__main">{children}</main>
    <footer className="pub__foot"><span className="dot" /> Shared with VOII — notes that show their work.</footer>
  </div>;
}

const STAGES = ["todo", "in_progress", "in_review", "done"] as const;
const STAGE_LABEL: Record<string, string> = { todo: "Not started", in_progress: "In progress", in_review: "In review", done: "Done" };

/** What a client sees: progress on their project, and one thread with the team. */
export function PortalPage({ slug }: { slug: string }) {
  const [data, setData] = useState<PublicPortal | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(() => getPublicPortal(slug).then(setData).catch((e) => setError(errorText(e))), [slug]);
  useEffect(() => {
    try { setName(localStorage.getItem("voii-portal-name") ?? ""); } catch { /* private mode */ }
    void load();
    const t = setInterval(() => void load(), 20000);
    return () => clearInterval(t);
  }, [load]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      try { localStorage.setItem("voii-portal-name", name); } catch { /* private mode */ }
      await postPortalMessage(slug, text.trim(), name.trim() || undefined);
      setText("");
      await load();
    } catch (err) { setError(errorText(err)); } finally { setSending(false); }
  }

  if (error && !data) return <PaperFrame><p className="app-error">{error}</p></PaperFrame>;
  if (!data) return <PaperFrame><p className="app-muted">Opening…</p></PaperFrame>;

  const done = data.tasks.filter((t) => t.status === "done").length;
  const pct = data.tasks.length ? Math.round((done / data.tasks.length) * 100) : 0;

  return <PaperFrame>
    <p className="app-eyebrow">For {data.portal.client.companyName || data.portal.client.name}</p>
    <h1>{data.portal.project?.name ?? "Your project"}.</h1>

    {data.tasks.length ? <section className="pub__card">
      <div className="pub__progress-head"><h2>Progress</h2><span className="mono">{done} of {data.tasks.length} done · {pct}%</span></div>
      <div className="progress progress--paper"><span style={{ width: `${Math.max(pct, 2)}%` }} /></div>
      <div className="pub__stages">
        {STAGES.map((stage) => {
          const tasks = data.tasks.filter((t) => t.status === stage);
          return tasks.length ? <div key={stage}>
            <h3>{STAGE_LABEL[stage]} <span className="mono">{tasks.length}</span></h3>
            <ul>{tasks.map((t) => <li key={t.id} data-done={t.status === "done"}>{t.title}{t.dueDate ? <span className="mono"> · {new Date(t.dueDate).toLocaleDateString()}</span> : null}</li>)}</ul>
          </div> : null;
        })}
      </div>
    </section> : null}

    <section className="pub__card">
      <h2>Messages</h2>
      <ol className="thread thread--paper">
        {data.messages.length ? data.messages.map((m) => <li key={m.id} className={m.fromTeam ? "" : "thread__me"}><span className="src">{m.authorName}{m.fromTeam ? " · team" : ""} · {new Date(m.createdAt).toLocaleString()}</span><p>{m.comment}</p></li>)
          : <li className="app-muted">Questions, feedback or approvals — write to the team here.</li>}
      </ol>
      <form className="pub__compose" onSubmit={send}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" aria-label="Your name" maxLength={80} />
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" aria-label="Message" rows={3} maxLength={5000} />
        <button className="btn btn--primary" type="submit" disabled={sending || !text.trim()}>{sending ? "Sending…" : "Send →"}</button>
      </form>
      {error ? <p className="app-error">{error}</p> : null}
    </section>
  </PaperFrame>;
}

/** A shared set of notes: readable, printable, no account. */
export function SharePage({ token }: { token: string }) {
  const [data, setData] = useState<PublicShare | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { getPublicShare(token).then(setData).catch((e) => setError(errorText(e))); }, [token]);

  if (error) return <PaperFrame><p className="app-error">{error}</p></PaperFrame>;
  if (!data) return <PaperFrame><p className="app-muted">Opening…</p></PaperFrame>;
  if (data.passwordRequired || !data.meeting) return <PaperFrame><p>This link is password protected. Ask the sender for access.</p></PaperFrame>;

  const m = data.meeting;
  return <PaperFrame>
    <p className="app-eyebrow">{m.kind === "lecture" ? "Lecture notes" : "Meeting notes"}{m.durationSec ? <span className="mono"> · {formatClock(m.durationSec)}</span> : null}</p>
    <h1>{data.share?.title || m.title}</h1>
    <div className="pub__actions"><button className="btn btn--primary" type="button" onClick={() => window.print()}>Download PDF →</button></div>
    {m.summary ? <article className="pub__card"><Markdown>{summaryToMarkdown(m.summary)}</Markdown></article> : null}
    {m.actionItems.length ? <section className="pub__card"><h2>Action items</h2><ul>{m.actionItems.map((a) => <li key={a.id}>{a.title}{a.ownerName ? ` — ${a.ownerName}` : ""}</li>)}</ul></section> : null}
    {m.transcript.length ? <section className="pub__card"><h2>Transcript</h2><ol className="transcript">{m.transcript.map((s) => <li key={s.id}><span className="src mono">{formatClock(s.startSec)} · {s.speaker}</span><p>{s.text}</p></li>)}</ol></section> : null}
  </PaperFrame>;
}
