"use client";

import { notFound } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { useAuth } from "@/components/AuthProvider";
import { Logo } from "@/components/SiteHeader";
import { formatDate, getErrorMessage } from "@/components/app/kit";
import {
  getAdminHealth, getAdminStats, listAdminJobs, listAdminLogs, listAdminUsers, listAdminWorkspaces, retryAdminJob,
  setAdminUserStatus, setAdminWorkspaceStatus, setAdminWorkspaceType,
  type AdminHealth, type AdminJob, type AdminLog, type AdminStats, type AdminUser, type AdminWorkspace,
} from "@/lib/api/admin";

const TABS = [["overview", "Overview"], ["users", "Users"], ["workspaces", "Workspaces"], ["jobs", "Processing"], ["audit", "Audit log"]] as const;
type Tab = (typeof TABS)[number][0];

export default function Admin() {
  return <AuthGate><Gate /></AuthGate>;
}

/** The API enforces this on every call; here it only hides the page from everyone else. */
function Gate() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const role = user?.platformRole;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") notFound();
  return <div className="dashboard-page admin" id="main-content">
    <header className="admin__top">
      <Logo /><strong>Admin</strong>
      <span className="app-muted admin__who">{user?.email}</span>
      <button className="dashboard-text-button" type="button" onClick={async () => { await logout(); window.location.assign("/signin"); }}>Sign out</button>
    </header>
    <main className="admin__main">
      <div className="seg" role="tablist" aria-label="Admin sections">
        {TABS.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}>{label}</button>)}
      </div>
      {tab === "overview" ? <Overview /> : null}
      {tab === "users" ? <Users superAdmin={role === "SUPER_ADMIN"} /> : null}
      {tab === "workspaces" ? <Workspaces /> : null}
      {tab === "jobs" ? <Jobs /> : null}
      {tab === "audit" ? (role === "SUPER_ADMIN" ? <Audit /> : <p className="app-muted">Only super admins can see the audit log.</p>) : null}
    </main>
  </div>;
}

function Overview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [health, setHealth] = useState<AdminHealth | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    getAdminStats().then(setStats).catch((e) => setError(getErrorMessage(e)));
    getAdminHealth().then(setHealth).catch(() => undefined);
  }, []);
  if (error) return <p className="app-error" role="alert">{error}</p>;
  if (!stats) return <p className="app-muted">Loading…</p>;
  const cards: Array<[string, number, string]> = [
    ["Users", stats.users.total, `${stats.users.newThisWeek} new this week`],
    ["Workspaces", stats.workspaces.total, `${stats.workspaces.newThisWeek} new this week`],
    ["Meetings", stats.meetings.total, `${stats.meetings.createdThisWeek} this week`],
    ["Failed jobs", stats.processingJobs.failed, `${stats.processingJobs.queued + stats.processingJobs.processing} running or queued`],
  ];
  const queues = health?.checks.rabbitmq?.queues?.filter((q) => q.messages > 0 || q.consumers > 0) ?? [];
  return <>
    <div className="admin__cards">{cards.map(([label, value, note]) => <section key={label} className="dashboard-surface"><span className="app-muted">{label}</span><strong>{value}</strong><small className="app-muted">{note}</small></section>)}</div>
    <section className="dashboard-surface">
      <h2>System: {health?.status ?? "checking…"}</h2>
      {queues.length ? <table className="admin__table"><thead><tr><th>Queue</th><th>Waiting</th><th>Workers</th></tr></thead><tbody>{queues.map((q) => <tr key={q.name}><td>{q.name}</td><td>{q.messages}</td><td>{q.consumers}</td></tr>)}</tbody></table> : <p className="app-muted">No queue has work or a connected worker.</p>}
    </section>
  </>;
}

/** Loads a page of rows, with paging and an optional search box. */
function useList<T>(load: (page: number, search: string) => Promise<{ rows: T[]; totalPages: number }>) {
  const [rows, setRows] = useState<T[] | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const reload = useCallback(() => load(page, search).then((r) => { setRows(r.rows); setPages(r.totalPages); }).catch((e) => setError(getErrorMessage(e))), [load, page, search]);
  useEffect(() => { const t = setTimeout(() => void reload(), 250); return () => clearTimeout(t); }, [reload]);
  const act = async (task: () => Promise<unknown>) => { setError(""); try { await task(); await reload(); } catch (e) { setError(getErrorMessage(e)); } };
  return { rows, page, pages, setPage, search, setSearch: (v: string) => { setSearch(v); setPage(1); }, error, act };
}

function Pager({ page, pages, setPage }: { page: number; pages: number; setPage: (n: number) => void }) {
  if (pages < 2) return null;
  return <div className="admin__pager">
    <button className="dashboard-quiet-button" type="button" disabled={page < 2} onClick={() => setPage(page - 1)}>Previous</button>
    <span className="app-muted">Page {page} of {pages}</span>
    <button className="dashboard-quiet-button" type="button" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
  </div>;
}

const loadUsers = (p: number, s: string) => listAdminUsers(p, s).then((r) => ({ rows: r.users, totalPages: r.pagination.totalPages }));
function Users({ superAdmin }: { superAdmin: boolean }) {
  const l = useList<AdminUser>(loadUsers);
  return <section className="dashboard-surface">
    <label className="kb__search"><span aria-hidden="true">⌕</span><input value={l.search} onChange={(e) => l.setSearch(e.target.value)} placeholder="Search name or email" aria-label="Search users" /></label>
    {l.error ? <p className="app-error" role="alert">{l.error}</p> : null}
    <div className="admin__scroll"><table className="admin__table">
      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th /></tr></thead>
      <tbody>{l.rows?.map((u) => <tr key={u.id}>
        <td>{u.fullName ?? "—"}</td><td>{u.email}</td><td>{u.platformRole}</td><td>{u.status}</td><td>{formatDate(u.createdAt)}</td>
        <td>{u.platformRole === "USER" || superAdmin ? <button className="dashboard-text-button" type="button" onClick={() => {
          const next = u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
          if (window.confirm(`${next === "ACTIVE" ? "Reactivate" : "Suspend"} ${u.email}?`)) void l.act(() => setAdminUserStatus(u.id, next));
        }}>{u.status === "ACTIVE" ? "Suspend" : "Reactivate"}</button> : null}</td>
      </tr>)}</tbody>
    </table></div>
    <Pager page={l.page} pages={l.pages} setPage={l.setPage} />
  </section>;
}

const loadWorkspaces = (p: number, s: string) => listAdminWorkspaces(p, s).then((r) => ({ rows: r.workspaces, totalPages: r.pagination.totalPages }));
function Workspaces() {
  const l = useList<AdminWorkspace>(loadWorkspaces);
  return <section className="dashboard-surface">
    <label className="kb__search"><span aria-hidden="true">⌕</span><input value={l.search} onChange={(e) => l.setSearch(e.target.value)} placeholder="Search workspaces" aria-label="Search workspaces" /></label>
    {l.error ? <p className="app-error" role="alert">{l.error}</p> : null}
    <div className="admin__scroll"><table className="admin__table">
      <thead><tr><th>Name</th><th>Owner</th><th>Type</th><th>Plan</th><th>Members</th><th>Meetings</th><th>Status</th><th /></tr></thead>
      <tbody>{l.rows?.map((w) => <tr key={w.id}>
        <td>{w.name}</td><td>{w.owner?.email ?? "—"}</td>
        <td><select value={w.type ?? ""} aria-label={`Type of ${w.name}`} onChange={(e) => { if (window.confirm(`Change ${w.name} to ${e.target.value}?`)) void l.act(() => setAdminWorkspaceType(w.id, e.target.value)); }}>
          {w.type ? null : <option value="">Not chosen</option>}
          <option value="student">Student</option><option value="team">Team</option><option value="agency">Agency</option>
        </select></td>
        <td>{w.plan}</td><td>{w.memberCount}</td><td>{w.meetingCount}</td><td>{w.status}</td>
        <td><button className="dashboard-text-button" type="button" onClick={() => {
          const next = w.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
          if (window.confirm(`${next === "ACTIVE" ? "Reactivate" : "Suspend"} ${w.name}?`)) void l.act(() => setAdminWorkspaceStatus(w.id, next));
        }}>{w.status === "ACTIVE" ? "Suspend" : "Reactivate"}</button></td>
      </tr>)}</tbody>
    </table></div>
    <Pager page={l.page} pages={l.pages} setPage={l.setPage} />
  </section>;
}

const loadJobs = (p: number) => listAdminJobs(p).then((r) => ({ rows: r.jobs, totalPages: r.pagination.totalPages }));
function Jobs() {
  const l = useList<AdminJob>(loadJobs);
  return <section className="dashboard-surface">
    {l.error ? <p className="app-error" role="alert">{l.error}</p> : null}
    <div className="admin__scroll"><table className="admin__table">
      <thead><tr><th>Status</th><th>Tries</th><th>Queued</th><th>Error</th><th /></tr></thead>
      <tbody>{l.rows?.map((j) => <tr key={j.id}>
        <td>{j.status}</td><td>{j.attempts}</td><td>{formatDate(j.queuedAt)}</td><td className="admin__error">{j.errorMessage ?? "—"}</td>
        <td>{j.status === "failed" ? <button className="dashboard-text-button" type="button" onClick={() => void l.act(() => retryAdminJob(j.id))}>Retry</button> : null}</td>
      </tr>)}</tbody>
    </table></div>
    <Pager page={l.page} pages={l.pages} setPage={l.setPage} />
  </section>;
}

const loadLogs = (p: number) => listAdminLogs(p).then((r) => ({ rows: r.logs, totalPages: r.pagination.totalPages }));
function Audit() {
  const l = useList<AdminLog>(loadLogs);
  return <section className="dashboard-surface">
    {l.error ? <p className="app-error" role="alert">{l.error}</p> : null}
    <div className="admin__scroll"><table className="admin__table">
      <thead><tr><th>When</th><th>Who</th><th>Action</th><th>On</th></tr></thead>
      <tbody>{l.rows?.map((a) => <tr key={a.id}><td>{formatDate(a.createdAt)}</td><td>{a.adminUser?.email ?? "—"}</td><td>{a.action}</td><td>{a.entityType}</td></tr>)}</tbody>
    </table></div>
    <Pager page={l.page} pages={l.pages} setPage={l.setPage} />
  </section>;
}
