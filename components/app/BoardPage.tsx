"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { Logo } from "@/components/SiteHeader";
import { ApiRequestError } from "@/lib/api/client";
import {
  addTaskComment, createBoard, createBoardTask, createProjectQuick, getBoard, getTask, listAllProjects, listBoards, listTaskComments, moveTask, patchTask,
  type Board, type BoardTask, type TaskComment, type TaskDetail,
} from "@/lib/api/app";
import { listWorkspaceMembers, type Project, type WorkspaceMember } from "@/lib/api/dashboard";

const msg = (e: unknown) => (e instanceof ApiRequestError ? e.message : "Something went wrong.");
const PRIORITIES = ["urgent", "high", "medium", "low"] as const;
const PRIORITY_GLYPH: Record<string, string> = { urgent: "⇈", high: "↑", medium: "=", low: "↓" };
const taskKey = (id: string) => `#${id.slice(0, 4).toUpperCase()}`;
const initials = (name?: string | null, email?: string | null) => (name || email || "?").split(/[\s@]/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
/** Column accent by name — mirrors how the API infers status from column names. */
function columnTone(name: string) {
  const n = name.toLowerCase();
  if (n.includes("done") || n.includes("complete")) return "sage";
  if (n.includes("review")) return "mauve";
  if (n.includes("progress") || n.includes("doing")) return "peach";
  return "muted";
}

export default function BoardPage() {
  return <AuthGate><BoardView /></AuthGate>;
}

function BoardView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [boards, setBoards] = useState<Array<{ id: string; name: string }>>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [projectId, setProjectId] = useState("");
  const [board, setBoard] = useState<Board | null>(null);
  const [dragging, setDragging] = useState<BoardTask | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [openTask, setOpenTask] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<string | null>(null);
  const [assignee, setAssignee] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (boardId: string) => setBoard((await getBoard(boardId)).board), []);
  // Stable, so the task panel doesn't refetch on every board refresh.
  const closeTask = useCallback(() => setOpenTask(null), []);

  // Start from ?board= (e.g. after approving tasks), else the first project's first board.
  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const [{ projects }, m] = await Promise.all([listAllProjects(), listWorkspaceMembers().catch(() => ({ members: [] }))]);
        setProjects(projects);
        setMembers(m.members);
        const wanted = params.get("board");
        if (wanted) {
          const b = (await getBoard(wanted)).board;
          setBoard(b);
          setProjectId(b.projectId);
          setBoards((await listBoards(b.projectId)).boards);
        } else if (projects[0]) await openProject(projects[0].id);
        setOpenTask(params.get("task"));
      } catch (e) { setError(msg(e)); } finally { setLoading(false); }
    })();
  }, []);

  async function openProject(id: string) {
    setProjectId(id);
    const list = (await listBoards(id)).boards;
    setBoards(list);
    setBoard(list[0] ? (await getBoard(list[0].id)).board : null);
  }

  async function move(task: BoardTask, columnId: string) {
    if (!board) return;
    const from = board.columns.find((c) => c.tasks.some((t) => t.id === task.id));
    if (!from || from.id === columnId) return;
    const before = board;
    // Optimistic move; roll back if the API refuses.
    setBoard({ ...board, columns: board.columns.map((c) => c.id === from.id ? { ...c, tasks: c.tasks.filter((t) => t.id !== task.id) } : c.id === columnId ? { ...c, tasks: [...c.tasks, task] } : c) });
    try { await moveTask(task.id, { columnId, order: board.columns.find((c) => c.id === columnId)!.tasks.length }); }
    catch (e) { setBoard(before); setError(msg(e)); }
  }

  const visible = useCallback((t: BoardTask) =>
    (!query || t.title.toLowerCase().includes(query.toLowerCase()) || taskKey(t.id).toLowerCase().includes(query.toLowerCase()))
    && (!priority || t.priority === priority)
    && (!assignee || t.assignees?.some((a) => a.user.id === assignee)), [query, priority, assignee]);

  const total = useMemo(() => board?.columns.reduce((n, c) => n + c.tasks.length, 0) ?? 0, [board]);
  const project = projects.find((p) => p.id === projectId);

  return <div className="app-page" id="main-content">
    <header className="app-bar"><Link href="/dashboard" aria-label="Back to workspace"><Logo /></Link><Link className="dashboard-text-button" href="/dashboard">← Workspace</Link></header>
    <main className="app-main app-main--wide kb">
      <header className="kb__head">
        <nav className="kb__crumbs" aria-label="Breadcrumb">
          <span>Projects</span><span aria-hidden="true">/</span>
          {projects.length > 1 ? <select value={projectId} onChange={(e) => void openProject(e.target.value)} aria-label="Project">{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select> : <span>{project?.name ?? "—"}</span>}
          {boards.length > 1 ? <><span aria-hidden="true">/</span><select value={board?.id} onChange={(e) => void refresh(e.target.value)} aria-label="Board">{boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></> : null}
        </nav>
        <h1>{board?.name ?? "Board"}</h1>
      </header>

      {board ? <div className="kb__toolbar" role="toolbar" aria-label="Filter tasks">
        <label className="kb__search"><span aria-hidden="true">⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search this board" aria-label="Search tasks" /></label>
        {members.length > 1 ? <div className="kb__avatars" aria-label="Filter by assignee">
          {members.slice(0, 6).map((m) => <button key={m.id} type="button" title={m.user.fullName ?? m.user.email ?? ""} aria-pressed={assignee === m.user.id} className={`kb__avatar ${assignee === m.user.id ? "is-on" : ""}`} onClick={() => setAssignee(assignee === m.user.id ? null : m.user.id)}>{initials(m.user.fullName, m.user.email)}</button>)}
        </div> : null}
        <div className="kb__chips">
          {PRIORITIES.map((p) => <button key={p} type="button" aria-pressed={priority === p} className={`kb__chip ${priority === p ? "is-on" : ""}`} onClick={() => setPriority(priority === p ? null : p)}><span className={`kb__prio kb__prio--${p}`}>{PRIORITY_GLYPH[p]}</span>{p}</button>)}
        </div>
        {query || priority || assignee ? <button className="dashboard-text-button" type="button" onClick={() => { setQuery(""); setPriority(null); setAssignee(null); }}>Clear filters</button> : null}
        <span className="kb__total mono">{total} tasks</span>
      </div> : null}

      {error ? <p className="app-error" role="alert">{error} <button className="dashboard-text-button" type="button" onClick={() => setError("")}>Dismiss</button></p> : null}

      {loading ? <p className="app-muted">Loading…</p> : !board ? <div className="app-card">
        <p>No board yet. Approve tasks from a conversation and they land here — or start one now.</p>
        <button className="dashboard-primary-button" type="button" onClick={async () => {
          try {
            const pid = projectId || (await createProjectQuick("My work")).project.id;
            await refresh((await createBoard(pid, "Board")).board.id);
          } catch (e) { setError(msg(e)); }
        }}>Create a board →</button>
      </div> : <div className="kb__columns">
        {board.columns.map((col) => {
          const tasks = col.tasks.filter(visible);
          return <section key={col.id} className={`kb__col ${overColumn === col.id ? "is-over" : ""}`} aria-label={col.name}
            onDragOver={(e) => { e.preventDefault(); setOverColumn(col.id); }} onDragLeave={() => setOverColumn(null)}
            onDrop={() => { setOverColumn(null); if (dragging) void move(dragging, col.id); setDragging(null); }}>
            <h2 className="kb__col-head"><span className={`kb__tone kb__tone--${columnTone(col.name)}`} />{col.name}<span className="kb__count">{col.tasks.length}</span></h2>
            <div className="kb__cards">
              {tasks.map((t) => <article key={t.id} className={`kb__card ${dragging?.id === t.id ? "is-dragging" : ""}`} draggable
                onDragStart={() => setDragging(t)} onDragEnd={() => { setDragging(null); setOverColumn(null); }}
                onClick={() => setOpenTask(t.id)} onKeyDown={(e) => e.key === "Enter" && setOpenTask(t.id)} tabIndex={0} role="button" aria-label={`Open ${t.title}`}>
                <h3>{t.title}</h3>
                {t.labels?.length ? <div className="kb__labels">{t.labels.slice(0, 3).map((l) => <span key={l} className="kb__label">{l}</span>)}</div> : null}
                <footer>
                  <span className={`kb__prio kb__prio--${t.priority ?? "medium"}`} title={`${t.priority ?? "medium"} priority`}>{PRIORITY_GLYPH[t.priority ?? "medium"]}</span>
                  <span className="kb__key mono">{taskKey(t.id)}</span>
                  {t.sourceMeetingId ? <span className="kb__src" title="Came from a conversation">◉</span> : null}
                  {t.dueDate ? <Due date={t.dueDate} done={columnTone(col.name) === "sage"} /> : null}
                  <span className="kb__spacer" />
                  {t.assignees?.[0] ? <span className="kb__avatar kb__avatar--sm" title={t.assignees[0].user.fullName ?? ""}>{initials(t.assignees[0].user.fullName, t.assignees[0].user.email)}</span> : null}
                </footer>
              </article>)}
              {tasks.length === 0 && col.tasks.length > 0 ? <p className="kb__empty">No matches</p> : null}
            </div>
            <QuickCreate onCreate={async (title) => {
              try {
                await createBoardTask({ title, projectId: board.projectId, boardId: board.id, columnId: col.id, priority: "medium" });
                await refresh(board.id);
              } catch (e) { setError(msg(e)); }
            }} />
          </section>;
        })}
      </div>}
    </main>
    {openTask && board ? <TaskPanel id={openTask} board={board} members={members} onClose={closeTask} onChanged={() => void refresh(board.id)} onMove={move} onError={setError} /> : null}
  </div>;
}

function Due({ date, done }: { date: string; done: boolean }) {
  const d = new Date(date);
  const overdue = !done && d.getTime() < Date.now() - 864e5;
  return <span className={`kb__due ${overdue ? "is-overdue" : done ? "is-done" : ""}`}>{d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>;
}

function QuickCreate({ onCreate }: { onCreate: (title: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (title.trim().length < 2) return;
    await onCreate(title.trim());
    setTitle("");
  }
  return open
    ? <form className="kb__create" onSubmit={submit}>
        <textarea autoFocus rows={2} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" aria-label="New task title"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submit(); } if (e.key === "Escape") setOpen(false); }} />
        <div><button className="dashboard-primary-button" type="submit">Create</button><button className="dashboard-text-button" type="button" onClick={() => setOpen(false)}>Cancel</button></div>
      </form>
    : <button className="kb__add" type="button" onClick={() => setOpen(true)}>+ Create</button>;
}

/** Side panel, Jira-style: everything editable in place, comments underneath. */
function TaskPanel({ id, board, members, onClose, onChanged, onMove, onError }: {
  id: string; board: Board; members: WorkspaceMember[]; onClose: () => void; onChanged: () => void;
  onMove: (t: BoardTask, columnId: string) => Promise<void>; onError: (m: string) => void;
}) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [comment, setComment] = useState("");

  useEffect(() => {
    getTask(id).then((r) => setTask(r.task)).catch((e) => onError(msg(e)));
    listTaskComments(id).then((r) => setComments(r.comments)).catch(() => undefined);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [id, onClose, onError]);

  async function save(patch: Parameters<typeof patchTask>[1]) {
    if (!task) return;
    try { setTask({ ...task, ...(await patchTask(task.id, patch)).task }); onChanged(); }
    catch (e) { onError(msg(e)); }
  }

  const column = board.columns.find((c) => c.tasks.some((t) => t.id === id));
  const assigned = new Set((task?.assignees ?? []).flatMap((a) => (a.user.id ? [a.user.id] : [])));

  return <>
    <div className="kb__scrim" onClick={onClose} aria-hidden="true" />
    <aside className="kb__panel" role="dialog" aria-modal="true" aria-label="Task details">
      {!task ? <p className="app-muted">Loading…</p> : <>
        <header className="kb__panel-head">
          <span className="kb__key mono">{taskKey(task.id)}</span>
          <button className="dashboard-icon-button" type="button" onClick={onClose} aria-label="Close">✕</button>
        </header>
        <textarea className="kb__title-input" rows={2} defaultValue={task.title} aria-label="Title" onBlur={(e) => e.target.value.trim() !== task.title && e.target.value.trim().length >= 2 && void save({ title: e.target.value.trim() })} />

        <dl className="kb__fields">
          <dt>Status</dt>
          <dd><select value={column?.id} onChange={async (e) => { await onMove(task, e.target.value); onChanged(); }} aria-label="Status">{board.columns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></dd>
          <dt>Priority</dt>
          <dd><select value={task.priority ?? "medium"} onChange={(e) => void save({ priority: e.target.value })} aria-label="Priority">{PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_GLYPH[p]} {p}</option>)}</select></dd>
          <dt>Assignees</dt>
          <dd className="kb__assignees">
            {members.length ? members.map((m) => <button key={m.id} type="button" aria-pressed={assigned.has(m.user.id)} className={`kb__person ${assigned.has(m.user.id) ? "is-on" : ""}`}
              onClick={() => { const next = new Set(assigned); if (next.has(m.user.id)) next.delete(m.user.id); else next.add(m.user.id); void save({ assigneeIds: [...next] }); }}>
              <span className="kb__avatar kb__avatar--sm">{initials(m.user.fullName, m.user.email)}</span>{m.user.fullName ?? m.user.email}
            </button>) : <span className="app-muted">Invite teammates to assign work.</span>}
          </dd>
          <dt>Due</dt>
          <dd><input type="date" defaultValue={task.dueDate?.slice(0, 10) ?? ""} onChange={(e) => void save({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })} aria-label="Due date" /></dd>
          <dt>Labels</dt>
          <dd><input defaultValue={task.labels?.join(", ") ?? ""} placeholder="design, client" aria-label="Labels" onBlur={(e) => void save({ labels: e.target.value.split(",").map((l) => l.trim()).filter(Boolean) })} /></dd>
          {task.sourceMeetingId ? <><dt>Source</dt><dd><Link className="src kb__srclink" href={`/meetings/${task.sourceMeetingId}`}>◉ From the conversation →</Link></dd></> : null}
        </dl>

        <section>
          <h3 className="kb__section">Description</h3>
          <textarea className="kb__desc" rows={5} defaultValue={task.description ?? ""} placeholder="Add more detail…" aria-label="Description" onBlur={(e) => e.target.value !== (task.description ?? "") && void save({ description: e.target.value })} />
        </section>

        <section>
          <h3 className="kb__section">Activity</h3>
          <ol className="kb__comments">
            {comments.map((c) => <li key={c.id}><span className="kb__avatar kb__avatar--sm">{initials(c.user.fullName, c.user.email)}</span><div><span className="src">{c.user.fullName ?? c.user.email} · {new Date(c.createdAt).toLocaleString()}</span><p>{c.body}</p></div></li>)}
          </ol>
          <form className="copy-row" onSubmit={async (e) => {
            e.preventDefault();
            if (!comment.trim()) return;
            try { const r = await addTaskComment(task.id, comment.trim()); setComments((all) => [...all, r.comment]); setComment(""); } catch (err) { onError(msg(err)); }
          }}>
            <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment…" aria-label="Comment" />
            <button className="dashboard-primary-button" type="submit" disabled={!comment.trim()}>Save</button>
          </form>
        </section>
      </>}
    </aside>
  </>;
}
