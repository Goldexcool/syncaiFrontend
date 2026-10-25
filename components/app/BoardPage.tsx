"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { Logo } from "@/components/SiteHeader";
import { ApiRequestError } from "@/lib/api/client";
import { createBoard, createProjectQuick, getBoard, listAllProjects, listBoards, moveTask, type Board, type BoardTask } from "@/lib/api/app";
import type { Project } from "@/lib/api/dashboard";

export default function BoardPage() {
  return <AuthGate><BoardView /></AuthGate>;
}

function BoardView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [boards, setBoards] = useState<Array<{ id: string; name: string }>>([]);
  const [projectId, setProjectId] = useState("");
  const [board, setBoard] = useState<Board | null>(null);
  const [dragging, setDragging] = useState<BoardTask | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Start from ?board= (e.g. after approving tasks), else the first project's first board.
  useEffect(() => {
    (async () => {
      try {
        const wanted = new URLSearchParams(window.location.search).get("board");
        const { projects } = await listAllProjects();
        setProjects(projects);
        if (wanted) {
          const b = (await getBoard(wanted)).board;
          setBoard(b);
          setProjectId(b.projectId);
          setBoards((await listBoards(b.projectId)).boards);
        } else if (projects[0]) {
          await openProject(projects[0].id);
        }
      } catch (e) { setError(e instanceof ApiRequestError ? e.message : "Could not load the board."); }
      finally { setLoading(false); }
    })();
  }, []);

  async function openProject(id: string) {
    setProjectId(id);
    const list = (await listBoards(id)).boards;
    setBoards(list);
    setBoard(list[0] ? (await getBoard(list[0].id)).board : null);
  }

  async function drop(columnId: string) {
    const task = dragging;
    setDragging(null);
    if (!task || !board) return;
    const from = board.columns.find((c) => c.tasks.some((t) => t.id === task.id));
    if (!from || from.id === columnId) return;
    const before = board;
    // Optimistic move; roll back if the API refuses.
    setBoard({ ...board, columns: board.columns.map((c) => c.id === from.id ? { ...c, tasks: c.tasks.filter((t) => t.id !== task.id) } : c.id === columnId ? { ...c, tasks: [...c.tasks, task] } : c) });
    try { await moveTask(task.id, { columnId, order: board.columns.find((c) => c.id === columnId)!.tasks.length }); }
    catch (e) { setBoard(before); setError(e instanceof ApiRequestError ? e.message : "Could not move that task."); }
  }

  return <div className="app-page" id="main-content">
    <header className="app-bar"><Link href="/dashboard" aria-label="Back to workspace"><Logo /></Link><Link className="dashboard-text-button" href="/dashboard">← Workspace</Link></header>
    <main className="app-main app-main--wide">
      <header className="mtg-head">
        <div><p className="app-eyebrow">Board</p><h1>{board?.name ?? "Your board"}.</h1></div>
        <div className="mtg-actions">
          {projects.length ? <select value={projectId} onChange={(e) => void openProject(e.target.value)} aria-label="Project">{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select> : null}
          {boards.length > 1 ? <select value={board?.id} onChange={async (e) => setBoard((await getBoard(e.target.value)).board)} aria-label="Board">{boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select> : null}
        </div>
      </header>
      {error ? <p className="app-error" role="alert">{error}</p> : null}
      {loading ? <p className="app-muted">Loading…</p> : !board ? <div className="app-card">
        <p>No board yet. Approve tasks from a conversation and they land here — or start one now.</p>
        <button className="dashboard-primary-button" type="button" onClick={async () => {
          try {
            const pid = projectId || (await createProjectQuick("My work")).project.id;
            const b = (await createBoard(pid, "Board")).board;
            setBoard((await getBoard(b.id)).board);
          } catch (e) { setError(e instanceof ApiRequestError ? e.message : "Could not create a board."); }
        }}>Create a board →</button>
      </div> : <div className="board">
        {board.columns.map((col) => <section key={col.id} className={`board__col ${dragging ? "is-droppable" : ""}`} onDragOver={(e) => e.preventDefault()} onDrop={() => void drop(col.id)} aria-label={col.name}>
          <h2>{col.name} <span className="mono">{col.tasks.length}</span></h2>
          {col.tasks.map((t) => <article key={t.id} className="board__card" draggable onDragStart={() => setDragging(t)} onDragEnd={() => setDragging(null)}>
            <h3>{t.title}</h3>
            <p className="app-muted">
              {[t.priority, t.dueDate && `due ${new Date(t.dueDate).toLocaleDateString()}`, t.assignees?.[0]?.user.fullName].filter(Boolean).join(" · ")}
            </p>
            {t.sourceMeetingId ? <Link className="src" href={`/meetings/${t.sourceMeetingId}`}><span className="dot" />From the conversation</Link> : null}
          </article>)}
        </section>)}
      </div>}
    </main>
  </div>;
}
