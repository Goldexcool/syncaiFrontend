"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ApiRequestError } from "@/lib/api/client";
import { createPortal, listAllProjects, listPortalMessages, listPortals, replyToPortal, type Portal, type PortalMessage } from "@/lib/api/app";
import type { Project } from "@/lib/api/dashboard";

const portalUrl = (slug: string) => `${window.location.origin}/portal/${slug}`;

/** Team side of a client link: create it, copy it, and talk to the client in one thread. */
export default function PortalPanel({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [portal, setPortal] = useState<Portal | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadMessages = useCallback((id: string) => listPortalMessages(id).then((r) => setMessages(r.messages)).catch(() => undefined), []);

  useEffect(() => {
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

  async function create() {
    try { setPortal((await createPortal({ clientId, projectId: projectId || undefined })).portal); }
    catch (e) { setError(e instanceof ApiRequestError ? e.message : "Could not create the link."); }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!portal || !reply.trim()) return;
    try { await replyToPortal(portal.id, reply.trim()); setReply(""); await loadMessages(portal.id); }
    catch (err) { setError(err instanceof ApiRequestError ? err.message : "Could not send."); }
  }

  if (loading) return <div className="portal-panel"><p className="app-muted">Loading…</p></div>;

  return <div className="portal-panel">
    {error ? <p className="app-error">{error}</p> : null}
    {!portal ? <>
      <p className="app-muted">Give {clientName} a private link to follow progress on a project’s board and message your team. No account needed.</p>
      <div className="copy-row">
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} aria-label="Project to show">
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          {!projects.length ? <option value="">No project yet — messages only</option> : null}
        </select>
        <button className="dashboard-primary-button" type="button" onClick={() => void create()}>Create client link →</button>
      </div>
    </> : <>
      <div className="copy-row">
        <input readOnly value={portalUrl(portal.slug)} onFocus={(e) => e.target.select()} aria-label="Client link" />
        <button className="dashboard-primary-button" type="button" onClick={() => navigator.clipboard.writeText(portalUrl(portal.slug))}>Copy</button>
        <a className="dashboard-quiet-button" href={portalUrl(portal.slug)} target="_blank" rel="noreferrer">Preview</a>
      </div>
      <ol className="thread">
        {messages.length ? messages.map((m) => <li key={m.id} className={m.fromTeam ? "thread__me" : ""}><span className="src">{m.authorName} · {new Date(m.createdAt).toLocaleString()}</span><p>{m.comment}</p></li>)
          : <li className="app-muted">No messages yet.</li>}
      </ol>
      <form method="post" className="copy-row" onSubmit={send}>
        <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder={`Reply to ${clientName}`} aria-label="Reply" />
        <button className="dashboard-primary-button" type="submit" disabled={!reply.trim()}>Send</button>
      </form>
    </>}
  </div>;
}
