"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import AppShell from "@/components/app/AppShell";
import PortalPanel from "@/components/app/PortalPanel";
import { ComposerPanel, SettingsView, type DashboardData } from "@/components/app/parts";
import { EmptyState, Icon, SectionHeading, formatDate, getErrorMessage, initials, sentenceCase } from "@/components/app/kit";
import { confirmAiCommand, listPortals, runAiCommand, type AiResult } from "@/lib/api/app";
import { ensureWorkspace, setAutoApprove, setVocabulary, type AutoApprove } from "@/lib/api/auth";
import {
  disconnectGoogleCalendar, getGoogleCalendarAuthUrl, getSubscription, getWorkspaceUsage, listClients, listIntegrations, listNotifications, listProjects,
  listTasks, listWorkspaceMembers, markAllNotificationsRead, markNotificationRead, updateTask,
  updateProfile, changePassword, deleteAccount, getNotificationPreferences, saveNotificationPreferences,
  listPendingInvites, cancelInvite, updateMemberRole, removeMember,
  type Client, type Notification, type NotificationPreference, type PendingInvite, type Project, type Task, type WorkspaceMember,
} from "@/lib/api/dashboard";
import { useAuth } from "@/components/AuthProvider";

// ── Projects ───────────────────────────────────────────────────────────────

export function ProjectsScreen() {
  return <AppShell crumbs={["Projects"]}><ProjectsBody /></AppShell>;
}

function ProjectsBody() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [composer, setComposer] = useState(false);
  useEffect(() => {
    listProjects(50).then((r) => setProjects(r.projects ?? [])).catch(() => setProjects([]));
    listTasks(100).then((r) => setTasks(r.tasks ?? [])).catch(() => undefined);
  }, []);
  const prog = useMemo(() => {
    const m: Record<string, { total: number; done: number }> = {};
    for (const t of tasks) if (t.projectId) { const p = (m[t.projectId] ??= { total: 0, done: 0 }); p.total++; if (t.status === "done") p.done++; }
    return m;
  }, [tasks]);

  return <>
    <header className="dashboard-content__header">
      <div><p className="dashboard-location">Projects</p><h1>Where the work lives.</h1><p className="dashboard-intro">Each project has a board. Tasks approved from meetings land here, linked to where they were said.</p></div>
      <div className="dashboard-content__actions"><Link className="dashboard-quiet-button" href="/tasks"><Icon name="check" size={15} />All tasks</Link><button className="dashboard-primary-button" type="button" onClick={() => setComposer(true)}><Icon name="plus" size={15} />New project</button></div>
    </header>
    {composer ? <ComposerPanel type="project" meetings={[]} onClose={() => setComposer(false)} onCreated={(c) => { setComposer(false); if (c.kind === "project") setProjects((p) => [c.item, ...(p ?? [])]); }} /> : null}
    {projects === null ? <p className="app-muted">Loading…</p> : projects.length === 0 ? <section className="dashboard-surface"><EmptyState title="No projects yet." body="Create one, or approve tasks from a meeting and VOII sets one up." action="New project" onAction={() => setComposer(true)} /></section>
      : <div className="card-grid">
        {projects.map((p) => {
          const g = prog[p.id] ?? { total: p.taskCount ?? 0, done: 0 };
          const pct = g.total ? Math.round((g.done / g.total) * 100) : 0;
          return <Link key={p.id} href={`/board?project=${p.id}`} className="project-card">
            <div className="project-card__head"><span className="dash-row__icon"><Icon name="board" size={16} /></span><span className="dash-row__main"><strong className="truncate">{p.name}</strong><small>{p.boardCount ?? 1} board{(p.boardCount ?? 1) === 1 ? "" : "s"} · {g.total} tasks</small></span></div>
            {p.description ? <p className="app-muted">{p.description}</p> : null}
            <div><div className="project-card__pct"><span>Progress</span><strong>{pct}%</strong></div><span className="progress"><span style={{ width: `${pct}%` }} /></span></div>
            <span className="dashboard-text-button">Open board <Icon name="arrow" size={13} /></span>
          </Link>;
        })}
      </div>}
  </>;
}

// ── Tasks ──────────────────────────────────────────────────────────────────

const TASK_GROUPS: Array<[string, string]> = [["todo", "To do"], ["in_progress", "In progress"], ["in_review", "In review"], ["done", "Done"]];

export function TasksScreen() {
  return <AppShell crumbs={["Projects", "Tasks"]}><TasksBody /></AppShell>;
}

function TasksBody() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [filter, setFilter] = useState<"open" | "all" | "done">("open");
  useEffect(() => { listTasks(100).then((r) => setTasks(r.tasks ?? [])).catch(() => setTasks([])); }, []);

  async function toggle(t: Task) {
    const next = t.status === "done" ? "todo" : "done";
    setTasks((all) => all?.map((x) => (x.id === t.id ? { ...x, status: next } : x)) ?? null);
    updateTask(t.id, { status: next }).catch(() => setTasks((all) => all?.map((x) => (x.id === t.id ? t : x)) ?? null));
  }

  const shown = (tasks ?? []).filter((t) => t.status !== "cancelled" && (filter === "all" || (filter === "done" ? t.status === "done" : t.status !== "done")));
  return <>
    <header className="dashboard-content__header">
      <div><p className="dashboard-location">Tasks</p><h1>Everything to do.</h1><p className="dashboard-intro">Across every board, each linked back to the meeting it came from.</p></div>
    </header>
    <div className="seg" role="tablist" aria-label="Filter tasks">
      {([["open", "Open"], ["all", "All"], ["done", "Completed"]] as const).map(([id, label]) => <button key={id} role="tab" aria-selected={filter === id} className={filter === id ? "is-active" : ""} onClick={() => setFilter(id)}>{label}{tasks ? <span>{tasks.filter((t) => t.status !== "cancelled" && (id === "all" || (id === "done" ? t.status === "done" : t.status !== "done"))).length}</span> : null}</button>)}
    </div>
    {tasks === null ? <p className="app-muted">Loading…</p> : shown.length === 0 ? <section className="dashboard-surface"><EmptyState title="Nothing here." body="Approve action items from a meeting and they show up as tasks." /></section>
      : TASK_GROUPS.map(([status, label]) => {
        const list = shown.filter((t) => (t.status ?? "todo") === status);
        return list.length ? <section key={status} className="dashboard-surface">
          <SectionHeading title={label} count={list.length} />
          <div className="dash-rows">{list.map((t) => <div key={t.id} className={`dash-task ${t.status === "done" ? "is-done" : ""}`}>
            <button className="dashboard-task-check" type="button" aria-pressed={t.status === "done"} aria-label={t.status === "done" ? `Reopen ${t.title}` : `Complete ${t.title}`} onClick={() => void toggle(t)}><span>{t.status === "done" ? "✓" : ""}</span></button>
            <span className="dash-row__main"><Link href={t.boardId ? `/board?board=${t.boardId}&task=${t.id}` : "/tasks"}><strong className="truncate">{t.title}</strong></Link>{t.sourceMeetingId ? <Link href={`/meetings/${t.sourceMeetingId}`} className="dash-sub-link"><Icon name="conversation" size={12} /> From a meeting</Link> : null}</span>
            {t.dueDate ? <span className="app-muted mono">{formatDate(t.dueDate)}</span> : null}
            <span className={`prio prio--${t.priority ?? "medium"}`}>{t.priority ?? "medium"}</span>
          </div>)}</div>
        </section> : null;
      })}
  </>;
}

// ── Client Workspace ───────────────────────────────────────────────────────

export function ClientsScreen() {
  return <AppShell crumbs={["Client Workspace"]}><ClientsBody /></AppShell>;
}

function ClientsBody() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [portalCount, setPortalCount] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [composer, setComposer] = useState(false);

  useEffect(() => {
    setOpen(new URLSearchParams(window.location.search).get("client"));
    listClients(50).then(async (r) => {
      const list = r.clients ?? [];
      setClients(list);
      const portals = await Promise.allSettled(list.map((c) => listPortals(c.id)));
      setPortalCount(Object.fromEntries(list.map((c, i) => [c.id, portals[i].status === "fulfilled" && (portals[i] as PromiseFulfilledResult<{ portals: Array<{ isActive: boolean }> }>).value.portals.some((p) => p.isActive)])));
    }).catch(() => setClients([]));
  }, []);

  const active = Object.values(portalCount).filter(Boolean).length;
  const selected = clients?.find((c) => c.id === open) ?? clients?.[0] ?? null;
  return <>
    <header className="dashboard-content__header">
      <div><p className="dashboard-location">Client Workspace</p><h1>Keep clients in the loop.</h1><p className="dashboard-intro">{clients ? `${clients.length} client${clients.length === 1 ? "" : "s"} · ${active} link${active === 1 ? "" : "s"} live.` : "Loading…"} Each client gets a private link to follow progress and message your team.</p></div>
      <div className="dashboard-content__actions"><button className="dashboard-primary-button" type="button" onClick={() => setComposer(true)}><Icon name="plus" size={15} />Add client</button></div>
    </header>
    {composer ? <ComposerPanel type="client" meetings={[]} onClose={() => setComposer(false)} onCreated={(c) => { setComposer(false); if (c.kind === "client") { setClients((all) => [c.item, ...(all ?? [])]); setOpen(c.item.id); } }} /> : null}
    {clients === null ? <p className="app-muted">Loading…</p> : clients.length === 0 ? <section className="dashboard-surface"><EmptyState title="Bring your clients into the loop." body="Add a client, then share a private link where they see progress and can message you." action="Add your first client" onAction={() => setComposer(true)} /></section>
      : <div className={`clients${open ? " clients--open" : ""}`}>
        <nav className="dashboard-surface clients__list" aria-label="Clients">
          {clients.map((c) => <button key={c.id} type="button" className={`clients__row${selected?.id === c.id ? " is-active" : ""}`} aria-current={selected?.id === c.id ? "true" : undefined} onClick={() => setOpen(c.id)}>
            <span className="dashboard-avatar dashboard-avatar--client">{initials(c.name, c.companyName)}</span>
            <span className="dash-row__main"><strong className="truncate">{c.name}</strong><small className="truncate">{c.companyName || c.contactEmail || "No company details"}</small></span>
            <span className={`clients__dot${portalCount[c.id] ? " is-live" : ""}`} title={portalCount[c.id] ? "Client link live" : "No client link yet"} aria-label={portalCount[c.id] ? "Client link live" : "No client link yet"} />
          </button>)}
        </nav>
        {selected ? <div className="clients__detail">
          <section className="dashboard-surface clients__head">
            <button type="button" className="dashboard-text-button clients__back" onClick={() => setOpen(null)}>← All clients</button>
            <div className="project-card__head">
              <span className="dashboard-avatar dashboard-avatar--client clients__avatar">{initials(selected.name, selected.companyName)}</span>
              <span className="dash-row__main"><strong className="clients__name">{selected.name}</strong><small>{[selected.companyName, selected.contactEmail].filter(Boolean).join(" · ") || "No company details"}</small></span>
            </div>
            <div className="clients__stats"><span><strong>{selected.projectCount ?? 0}</strong> projects</span><span><strong>{selected.contactCount ?? 0}</strong> contacts</span></div>
          </section>
          <PortalPanel key={selected.id} clientId={selected.id} clientName={selected.name} onLive={(live) => setPortalCount((m) => ({ ...m, [selected.id]: live }))} />
        </div> : null}
      </div>}
  </>;
}

// ── AI Assistant ───────────────────────────────────────────────────────────

const AI_SUGGESTIONS: Array<[string, IconNameish, string[]]> = [
  ["From your meetings", "sparkles", ["What did we decide this week?", "What did Ada say about pricing over the last 3 months?", "Create tasks from my latest meeting"]],
  ["For your boards", "board", ["Show me overdue tasks", "Which tasks are in review?", "Move my finished tasks to Done"]],
  ["For your workspace", "home", ["What needs my attention today?", "Who has the most open tasks?"]],
];
type IconNameish = "sparkles" | "board" | "home";

export function AiScreen() {
  return <AppShell crumbs={["AI Assistant"]}><AiBody /></AppShell>;
}

function AiBody() {
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState<Array<{ q: string; r?: AiResult; error?: string; confirmed?: boolean }>>([]);
  const [busy, setBusy] = useState(false);

  // Dev mode runs effects twice; ask the ⌘K question only once.
  const asked = useRef(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q && !asked.current) { asked.current = true; void ask(q); }
  }, []);

  async function ask(q: string) {
    if (q.trim().length < 2) return;
    setBusy(true);
    setPrompt("");
    setHistory((h) => [{ q }, ...h]);
    try { const r = await runAiCommand(q.trim()); setHistory((h) => [{ q, r }, ...h.slice(1)]); }
    catch (e) { setHistory((h) => [{ q, error: getErrorMessage(e) }, ...h.slice(1)]); }
    finally { setBusy(false); }
  }

  async function confirm(i: number) {
    const item = history[i];
    if (!item.r?.commandId) return;
    try { const r = await confirmAiCommand(item.r.commandId); setHistory((h) => h.map((x, j) => (j === i ? { ...x, r, confirmed: true } : x))); }
    catch (e) { setHistory((h) => h.map((x, j) => (j === i ? { ...x, error: getErrorMessage(e) } : x))); }
  }

  return <div className="flow-narrow ai-page">
    <div className="ai-hero"><span className="dash-row__icon"><Icon name="sparkles" size={22} /></span><h1>What should we do next?</h1><p className="dashboard-intro">Ask about your meetings, tasks or workspace. Anything that changes your work is shown to you first.</p></div>
    <form method="post" className="ai-input" onSubmit={(e: FormEvent) => { e.preventDefault(); void ask(prompt); }}>
      <Icon name="sparkles" size={18} />
      <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask VOII to find, summarise or organise…" aria-label="Ask VOII" autoFocus maxLength={500} />
      <button className="dashboard-primary-button" type="submit" disabled={busy || prompt.trim().length < 2}>{busy ? "Thinking…" : "Ask"}</button>
    </form>

    {history.map((h, i) => <section key={i} className="dashboard-surface ai-answer">
      <p className="ai-answer__q"><Icon name="search" size={14} />{h.q}</p>
      {!h.r && !h.error ? <p className="app-muted">Thinking…</p> : null}
      {h.error ? <p className="app-error">{h.error}</p> : null}
      {h.r ? <>
        <p className="lead">{h.r.summary}</p>
        <AiResultView result={h.r.result} />
        {h.r.plan?.length ? <ol className="ai-plan">{h.r.plan.map((s, j) => <li key={j}>{s}</li>)}</ol> : null}
        {h.r.requiresConfirmation && !h.confirmed ? <div className="ai-confirm"><Icon name="check" size={15} /><span>This changes your workspace. Review the plan, then confirm.</span><button className="dashboard-primary-button" type="button" onClick={() => void confirm(i)}>Confirm</button></div> : null}
        {h.confirmed ? <span className="chip chip--sage"><Icon name="check" size={12} /> Done</span> : null}
      </> : null}
    </section>)}

    {!history.length ? <div className="ai-groups">{AI_SUGGESTIONS.map(([label, icon, items]) => <div key={label}>
      <p className="dashboard-location ai-label"><Icon name={icon} size={13} /> {label}</p>
      <div className="ai-suggestions">{items.map((s) => <button key={s} type="button" className="ai-suggestion" onClick={() => void ask(s)}><Icon name="arrow" size={13} />{s}</button>)}</div>
    </div>)}</div> : null}
  </div>;
}

type AiTask = { id: string; title: string; status?: string; priority?: string; dueDate?: string | null; boardId?: string | null };
type AiMeeting = { id: string; title: string; shortSummary?: string | null; createdAt?: string };
type AiActionItem = { id: string; title: string; ownerName?: string | null; meetingId: string; meeting?: { title: string } | null };

/** Show what the assistant found, not just its sentence about finding it. */
function AiResultView({ result }: { result?: Record<string, unknown> }) {
  if (!result) return null;
  if (result.found === false) return <p className="app-muted">I couldn’t find a match. Try naming the meeting or project.</p>;
  const tasks = Array.isArray(result.tasks) ? (result.tasks as AiTask[]) : null;
  const meetings = Array.isArray(result.meetings) ? (result.meetings as AiMeeting[]) : result.meeting ? [result.meeting as AiMeeting] : null;
  const actionItems = Array.isArray(result.actionItems) ? (result.actionItems as AiActionItem[]) : null;
  if (actionItems) return actionItems.length ? <div className="dash-rows">{actionItems.map((a) => <Link key={a.id} href={`/meetings/${a.meetingId}?tab=action-items`} className="dash-row">
    <span className="dash-row__icon"><Icon name="check" size={15} /></span>
    <span className="dash-row__main"><strong className="truncate">{a.title}</strong><small>{[a.ownerName, a.meeting?.title].filter(Boolean).join(" · ")}</small></span>
  </Link>)}</div> : null;
  if (tasks) return tasks.length ? <div className="dash-rows">{tasks.slice(0, 12).map((t) => <Link key={t.id} href={t.boardId ? `/board?board=${t.boardId}&task=${t.id}` : "/tasks"} className="dash-row">
    <span className="dash-row__main"><strong className="truncate">{t.title}</strong><small>{(t.status ?? "todo").replaceAll("_", " ")}{t.dueDate ? ` · due ${formatDate(t.dueDate)}` : ""}</small></span>
    <span className={`prio prio--${t.priority ?? "medium"}`}>{t.priority ?? "medium"}</span>
  </Link>)}</div> : <p className="app-muted">Nothing matched.</p>;
  if (meetings) return <div className="dash-rows">{meetings.map((m) => <Link key={m.id} href={`/meetings/${m.id}`} className="dash-row">
    <span className="dash-row__icon"><Icon name="conversation" size={15} /></span>
    <span className="dash-row__main"><strong>{m.title}</strong>{m.shortSummary || m.createdAt ? <small>{[m.createdAt && formatDate(m.createdAt), m.shortSummary].filter(Boolean).join(" · ")}</small> : null}</span>
  </Link>)}</div>;
  return null;
}

// ── Inbox ──────────────────────────────────────────────────────────────────

export function InboxScreen() {
  return <AppShell crumbs={["Inbox"]}><InboxBody /></AppShell>;
}

function InboxBody() {
  const [items, setItems] = useState<Notification[] | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  useEffect(() => { listNotifications(50).then((r) => setItems(r.notifications ?? [])).catch(() => setItems([])); }, []);

  async function open(n: Notification) {
    if (!n.read) { setItems((all) => all?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? null); markNotificationRead(n.id).catch(() => undefined); }
    if (n.data?.href?.startsWith("/")) window.location.assign(n.data.href);
    else if (n.meetingId) window.location.assign(`/meetings/${n.meetingId}`);
  }

  const shown = (items ?? []).filter((n) => filter === "all" || !n.read);
  return <div className="flow-narrow">
    <header className="dashboard-content__header">
      <div><p className="dashboard-location">Inbox</p><h1>What happened.</h1><p className="dashboard-intro">Updates from your meetings, tasks and clients.</p></div>
      <div className="dashboard-content__actions"><button className="dashboard-quiet-button" type="button" onClick={async () => { await markAllNotificationsRead().catch(() => undefined); setItems((all) => all?.map((n) => ({ ...n, read: true })) ?? null); }}><Icon name="check" size={15} />Mark all read</button></div>
    </header>
    <div className="seg">{(["all", "unread"] as const).map((f) => <button key={f} type="button" className={filter === f ? "is-active" : ""} onClick={() => setFilter(f)}>{f === "all" ? "All" : "Unread"}<span>{f === "all" ? items?.length ?? 0 : items?.filter((n) => !n.read).length ?? 0}</span></button>)}</div>
    <section className="dashboard-surface">
      {items === null ? <p className="app-muted">Loading…</p> : shown.length === 0 ? <EmptyState title="You’re all caught up." body="New meeting notes, tasks and client messages show up here." />
        : <div className="dash-rows">{shown.map((n) => <button key={n.id} type="button" className={`inbox-row ${n.read ? "" : "is-unread"}`} onClick={() => void open(n)}>
          <span className="dash-row__icon"><Icon name={n.type.includes("meeting") ? "conversation" : n.type.includes("task") ? "check" : n.type.includes("action") ? "sparkles" : "bell"} size={15} /></span>
          <span className="dash-row__main"><strong>{n.title}</strong><small>{n.message}</small></span>
          <span className="app-muted inbox-row__time">{formatDate(n.createdAt)}</span>
        </button>)}</div>}
    </section>
  </div>;
}

// ── Settings ───────────────────────────────────────────────────────────────

const AUTO_APPROVE: Array<[AutoApprove, string, string]> = [
  ["off", "Review everything", "Every action item waits for you to approve it."],
  ["confident", "Approve the clear ones", "VOII approves items it is sure about and that have an owner. The rest wait for you."],
  ["all", "Approve everything", "Every action item is approved as soon as the meeting is processed."],
];

function AutoApproveSetting() {
  const [mode, setMode] = useState<AutoApprove | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { ensureWorkspace().then((r) => setMode(r.workspace?.actionItemAutoApprove ?? "off")).catch(() => setMode("off")); }, []);
  async function choose(next: AutoApprove) {
    const prev = mode;
    setMode(next);
    setError("");
    try { await setAutoApprove(next); } catch (e) { setMode(prev); setError(getErrorMessage(e)); }
  }
  return <section className="dashboard-surface">
    <SectionHeading title="Action items" />
    <p className="app-muted">What happens to the action items VOII finds in a meeting. Applies to meetings processed from now on.</p>
    <div className="choice-list" role="radiogroup" aria-label="Approve action items">
      {AUTO_APPROVE.map(([value, label, description]) => <button key={value} type="button" role="radio" aria-checked={mode === value} className={`choice${mode === value ? " is-selected" : ""}`} onClick={() => void choose(value)} disabled={mode === null}>
        <span className="choice__copy"><strong>{label}</strong><span>{description}</span></span>
        <span className="choice__mark" aria-hidden="true">{mode === value ? <Icon name="check" size={13} /> : null}</span>
      </button>)}
    </div>
    {error ? <p className="app-error" role="alert">{error}</p> : null}
  </section>;
}

/** Words VOII must spell exactly in transcripts and notes. */
function VocabularySetting() {
  const [words, setWords] = useState<string[] | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { ensureWorkspace().then((r) => setWords(r.workspace?.vocabulary ?? [])).catch(() => setWords([])); }, []);
  async function save(next: string[]) {
    const prev = words;
    setWords(next);
    setError("");
    try { await setVocabulary(next); } catch (e) { setWords(prev); setError(getErrorMessage(e)); }
  }
  function add(e: FormEvent) {
    e.preventDefault();
    const fresh = draft.split(",").map((w) => w.trim()).filter((w) => w && !words?.some((x) => x.toLowerCase() === w.toLowerCase()));
    setDraft("");
    if (fresh.length && words) void save([...words, ...fresh]);
  }
  return <section className="dashboard-surface">
    <SectionHeading title="Vocabulary" count={words?.length} />
    <p className="app-muted">Company names, products and people VOII should always spell right — for example “Providus” rather than “Profidus”. Used for every new meeting, together with your team’s and clients’ names.</p>
    <form method="post" className="vocab" onSubmit={add}>
      {words?.map((w) => <span key={w} className="vocab__word">{w}<button type="button" aria-label={`Remove ${w}`} onClick={() => void save(words.filter((x) => x !== w))}>×</button></span>)}
      <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={words?.length ? "Add another…" : "Type a word and press Enter"} aria-label="Add a word" disabled={words === null} maxLength={60} />
    </form>
    {error ? <p className="app-error" role="alert">{error}</p> : null}
  </section>;
}

export function SettingsScreen() {
  return <AppShell crumbs={["Settings"]}><SettingsBody /></AppShell>;
}

function SettingsBody() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.allSettled([getWorkspaceUsage(), getSubscription(), listIntegrations()]).then(([u, s, i]) => {
      setData({ meetings: [], tasks: [], commitments: [], projects: [], events: [], clients: [], members: [], notifications: [], unreadCount: 0,
        usage: u.status === "fulfilled" ? u.value : null, subscription: s.status === "fulfilled" ? s.value : null, integrations: i.status === "fulfilled" ? i.value.integrations ?? [] : [] });
    });
  }, []);

  return <>
    <header className="dashboard-content__header"><div><p className="dashboard-location">Settings</p><h1>Settings.</h1><p className="dashboard-intro">Your account, your workspace, and the people in it.</p></div></header>
    <div className="dashboard-settings-grid">
      <ProfileSetting />
      <PasswordSetting />
      <MembersSetting />
      <AutoApproveSetting />
      <VocabularySetting />
      <NotificationSetting />
    </div>
    {data ? <SettingsView data={data} isConnectingCalendar={busy}
      onConnectCalendar={async () => { setBusy(true); try { window.location.assign((await getGoogleCalendarAuthUrl()).authUrl); } catch { setBusy(false); } }}
      onDisconnectCalendar={async () => { setBusy(true); await disconnectGoogleCalendar().catch(() => undefined); setData((d) => d && { ...d, integrations: d.integrations.filter((x) => x.type !== "google_calendar") }); setBusy(false); }} /> : <p className="app-muted">Loading…</p>}
    <DeleteAccountSetting />
  </>;
}

function ProfileSetting() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.fullName ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");
  useEffect(() => { if (user?.fullName) setName(user.fullName); }, [user?.fullName]);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Enter your name."); return; }
    setState("saving"); setError("");
    try { await updateProfile({ fullName: name.trim() }); await refreshUser().catch(() => undefined); setState("saved"); }
    catch (err) { setError(getErrorMessage(err)); setState("idle"); }
  }
  return <section className="dashboard-surface">
    <SectionHeading title="Your profile" />
    <form method="post" className="flow-form" onSubmit={save}>
      <label className="field"><span>Name</span><input value={name} onChange={(e) => { setName(e.target.value); setState("idle"); }} maxLength={100} autoComplete="name" /></label>
      <label className="field"><span>Email <small>— can’t be changed here</small></span><input value={user?.email ?? ""} readOnly aria-readonly="true" /></label>
      {error ? <p className="app-error" role="alert">{error}</p> : null}
      <div><button className="dashboard-primary-button" type="submit" disabled={state === "saving"}>{state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Save"}</button></div>
    </form>
  </section>;
}

function PasswordSetting() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");
  async function save(e: FormEvent) {
    e.preventDefault();
    if (next.length < 8) { setError("Use at least 8 characters for the new password."); return; }
    setState("saving"); setError("");
    try { await changePassword({ currentPassword: current, newPassword: next }); setCurrent(""); setNext(""); setState("saved"); }
    catch (err) { setError(getErrorMessage(err)); setState("idle"); }
  }
  return <section className="dashboard-surface">
    <SectionHeading title="Password" />
    <form method="post" className="flow-form" onSubmit={save}>
      <label className="field"><span>Current password</span><input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required /></label>
      <label className="field"><span>New password <small>— at least 8 characters</small></span><input type="password" value={next} onChange={(e) => { setNext(e.target.value); setState("idle"); }} autoComplete="new-password" minLength={8} maxLength={128} required /></label>
      {error ? <p className="app-error" role="alert">{error}</p> : null}
      {state === "saved" ? <p className="field-ok" role="status">Password changed.</p> : null}
      <div><button className="dashboard-primary-button" type="submit" disabled={state === "saving"}>{state === "saving" ? "Changing…" : "Change password"}</button></div>
    </form>
  </section>;
}

function MembersSetting() {
  const { user, workspace } = useAuth();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const canManage = workspace?.role === "OWNER" || workspace?.role === "ADMIN";
  const me = user?.id ?? user?.sub;

  const load = () => {
    listWorkspaceMembers().then((r) => setMembers(r.members ?? [])).catch(() => undefined);
    if (canManage) listPendingInvites().then((r) => setInvites(r.invites ?? [])).catch(() => undefined);
  };
  useEffect(load, [canManage]);

  async function act(fn: () => Promise<unknown>) {
    setError("");
    try { await fn(); load(); } catch (err) { setError(getErrorMessage(err)); }
  }

  return <section className="dashboard-surface">
    <SectionHeading title="Members" count={members.length} action={canManage ? "Invite someone" : undefined} onAction={canManage ? () => setInviting(true) : undefined} />
    {inviting ? <ComposerPanel type="invite" meetings={[]} onClose={() => setInviting(false)} onCreated={() => { setInviting(false); load(); }} /> : null}
    {error ? <p className="app-error" role="alert">{error}</p> : null}
    <div className="dash-rows">
      {members.map((m) => {
        const editable = canManage && m.role !== "OWNER" && m.user.id !== me;
        return <div key={m.id} className="dash-row">
          <span className="dashboard-avatar">{initials(m.user.fullName, m.user.email)}</span>
          <span className="dash-row__main"><strong>{m.user.fullName || m.user.email}{m.user.id === me ? " (you)" : ""}</strong><small>{m.user.email}</small></span>
          {editable ? <>
            <select className="member-role" aria-label={`Role for ${m.user.fullName || m.user.email}`} value={m.role} onChange={(e) => void act(() => updateMemberRole(m.user.id, e.target.value as "ADMIN" | "MEMBER"))}>
              <option value="ADMIN">Admin</option><option value="MEMBER">Member</option>
            </select>
            <button type="button" className="dashboard-quiet-button" onClick={() => { if (window.confirm(`Remove ${m.user.fullName || m.user.email} from this workspace?`)) void act(() => removeMember(m.user.id)); }}>Remove</button>
          </> : <span className="chip">{sentenceCase(m.role)}</span>}
        </div>;
      })}
      {invites.map((i) => <div key={i.id} className="dash-row">
        <span className="dashboard-avatar" aria-hidden="true">@</span>
        <span className="dash-row__main"><strong>{i.email}</strong><small>Invited as {i.role.toLowerCase()} · expires {formatDate(i.expiresAt)}</small></span>
        <span className="chip">Pending</span>
        <button type="button" className="dashboard-quiet-button" onClick={() => void act(() => cancelInvite(i.id))}>Cancel</button>
      </div>)}
    </div>
  </section>;
}

const NOTIFICATION_LABELS: Record<string, string> = {
  meeting_processing_completed: "Notes are ready",
  meeting_processing_failed: "A meeting couldn’t be processed",
  action_items_ready: "Action items to review",
  action_items_converted: "Action items sent to a board",
  task_assigned: "A task is assigned to you",
  task_comment_added: "Someone comments on your task",
  task_status_changed: "A task changes status",
  task_completed: "A task is completed",
  workspace_invite_accepted: "Someone accepts an invite",
  workspace_member_joined: "Someone joins the workspace",
  system_notice: "Notices from VOII",
  commitment_reminder: "Commitment reminders",
};

function NotificationSetting() {
  const [prefs, setPrefs] = useState<NotificationPreference[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { getNotificationPreferences().then((r) => setPrefs(r.preferences)).catch((e) => setError(getErrorMessage(e))); }, []);
  async function toggle(type: string, channel: NotificationPreference["channel"]) {
    if (!prefs) return;
    const prev = prefs;
    const next = prefs.map((p) => (p.type === type && p.channel === channel ? { ...p, enabled: !p.enabled } : p));
    setPrefs(next); setError("");
    try { await saveNotificationPreferences(next.filter((p) => p.type === type && p.channel === channel)); }
    catch (err) { setPrefs(prev); setError(getErrorMessage(err)); }
  }
  const types = prefs ? [...new Set(prefs.map((p) => p.type))] : [];
  const on = (type: string, channel: string) => prefs?.find((p) => p.type === type && p.channel === channel)?.enabled ?? false;
  return <section className="dashboard-surface">
    <SectionHeading title="Notifications" />
    <p className="app-muted">Choose what reaches you in VOII and by email.</p>
    {prefs ? <table className="pref-table">
      <thead><tr><th scope="col">When</th><th scope="col">In app</th><th scope="col">Email</th></tr></thead>
      <tbody>{types.map((t) => <tr key={t}>
        <th scope="row">{NOTIFICATION_LABELS[t] ?? sentenceCase(t.replace(/_/g, " "))}</th>
        <td><input type="checkbox" checked={on(t, "in_app")} onChange={() => void toggle(t, "in_app")} aria-label={`${NOTIFICATION_LABELS[t] ?? t}: in app`} /></td>
        <td><input type="checkbox" checked={on(t, "email")} onChange={() => void toggle(t, "email")} aria-label={`${NOTIFICATION_LABELS[t] ?? t}: email`} /></td>
      </tr>)}</tbody>
    </table> : error ? null : <p className="app-muted">Loading…</p>}
    {error ? <p className="app-error" role="alert">{error}</p> : null}
  </section>;
}

function DeleteAccountSetting() {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try { await deleteAccount(password); await logout().catch(() => undefined); window.location.assign("/"); }
    catch (err) { setError(getErrorMessage(err)); setBusy(false); }
  }
  return <section className="dashboard-surface danger-zone">
    <SectionHeading title="Delete account" />
    <p className="app-muted">Deactivates your account and signs you out everywhere. Workspaces you own stay with their other members.</p>
    {open ? <form method="post" className="flow-form" onSubmit={remove}>
      <div className="field-grid">
        <label className="field"><span>Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
        <label className="field"><span>Type DELETE to confirm</span><input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" required /></label>
      </div>
      {error ? <p className="app-error" role="alert">{error}</p> : null}
      <div className="danger-zone__actions">
        <button className="dashboard-primary-button danger-button" type="submit" disabled={busy || typed !== "DELETE" || !password}>{busy ? "Deleting…" : "Delete my account"}</button>
        <button className="dashboard-quiet-button" type="button" onClick={() => setOpen(false)}>Keep my account</button>
      </div>
    </form> : <div><button className="dashboard-quiet-button" type="button" onClick={() => setOpen(true)}>Delete my account…</button></div>}
  </section>;
}
