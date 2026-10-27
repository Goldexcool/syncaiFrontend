"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ApiRequestError } from "@/lib/api/client";
import { createPortal, listAllProjects, listPortalMessages, listPortals, replyToPortal, type Portal, type PortalMessage } from "@/lib/api/app";
import type { Project } from "@/lib/api/dashboard";
import { Picker } from "@/components/app/Picker";
import { Icon } from "@/components/app/kit";

const portalUrl = (slug: string) => `${window.location.origin}/portal/${slug}`;
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** Team side of a client link: create it, share it, and talk to the client in one thread. */
export default function PortalPanel({ clientId, clientName, onLive }: { clientId: string; clientName: string; onLive?: (live: boolean) => void }) {
  const [portal, setPortal] = useState<Portal | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const threadRef = useRef<HTMLOListElement>(null);

  const loadMessages = useCallback((id: string) => listPortalMessages(id).then((r) => setMessages(r.messages)).catch(() => undefined), []);

  useEffect(() => {
    setLoading(true);
    setPortal(null);
    setMessages([]);
    Promise.all([listPortals(clientId), listAllProjects()])
      .then(([p, pr]) => {
        const active = p.portals.find((x) => x.isActive) ?? null;
        setPortal(active);
        setProjects(pr.projects);
        setProjectId(pr.projects[0]?.id ?? "");
        if (active) void loadMessages(active.id);
      })
      .catch((e) => setError(e instanceof ApiRequestError ? e.message : "Could not load the client link."))
      .finally(() => setLoading(false));
  }, [clientId, loadMessages]);

  // Light polling keeps the thread live without a socket.
  useEffect(() => {
    if (!portal) return;
    const t = setInterval(() => void loadMessages(portal.id), 15000);
    return () => clearInterval(t);
  }, [portal, loadMessages]);

  useEffect(() => { const el = threadRef.current; if (el) el.scrollTop = el.scrollHeight; }, [messages.length]);

  async function create() {
    try { const p = (await createPortal({ clientId, projectId: projectId || undefined })).portal; setPortal(p); onLive?.(true); }
    catch (e) { setError(e instanceof ApiRequestError ? e.message : "Could not create the link."); }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!portal || !reply.trim()) return;
    try { await replyToPortal(portal.id, reply.trim()); setReply(""); await loadMessages(portal.id); }
    catch (err) { setError(err instanceof ApiRequestError ? err.message : "Could not send."); }
  }

  function copy() {
    if (!portal) return;
    void navigator.clipboard.writeText(portalUrl(portal.slug));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (loading) return <p className="app-muted">Loading…</p>;

  return <>
    {error ? <p className="app-error" role="alert">{error}</p> : null}

    <section className="dashboard-surface">
      <div className="dashboard-section-heading"><h2>Client link</h2>{portal ? <span className="chip chip--sage"><Icon name="check" size={12} />Live</span> : null}</div>
      {!portal ? <>
        <p className="app-muted">Give {clientName} a private link to follow a project’s progress and message your team. No account needed.</p>
        <div className="portal-create">
          {projects.length
            ? <Picker label="Project to show" value={projectId} onChange={setProjectId} options={projects.map((p) => ({ value: p.id, label: p.name }))} />
            : <span className="app-muted">No project yet — the link will show messages only.</span>}
          <button className="dashboard-primary-button" type="button" onClick={() => void create()}>Create client link</button>
        </div>
      </> : <div className="portal-link">
        <code className="portal-link__url" title={portalUrl(portal.slug)}>{portalUrl(portal.slug).replace(/^https?:\/\//, "")}</code>
        <button className="dashboard-primary-button" type="button" onClick={copy}><Icon name={copied ? "check" : "link"} size={14} />{copied ? "Copied" : "Copy link"}</button>
        <a className="dashboard-quiet-button" href={portalUrl(portal.slug)} target="_blank" rel="noreferrer"><Icon name="external" size={14} />Open</a>
      </div>}
    </section>

    {portal ? <section className="dashboard-surface chat">
      <div className="dashboard-section-heading"><h2>Conversation</h2><span className="dashboard-count">{messages.length}</span></div>
      <ol className="chat__thread" ref={threadRef}>
        {messages.length ? messages.map((m) => <li key={m.id} className={`chat__msg${m.fromTeam ? " chat__msg--team" : ""}`}>
          <div className="chat__bubble">{m.comment}</div>
          <span className="chat__meta">{m.authorName} · {when(m.createdAt)}</span>
        </li>) : <li className="app-muted chat__empty">No messages yet. When {clientName} writes on their link, it shows up here.</li>}
      </ol>
      <form method="post" className="chat__compose" onSubmit={send}>
        <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} placeholder={`Write to ${clientName}…`} aria-label="Reply"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} />
        <button className="dashboard-primary-button" type="submit" disabled={!reply.trim()}>Send</button>
      </form>
    </section> : null}
  </>;
}
