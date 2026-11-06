"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import AppShell from "@/components/app/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { ComposerPanel } from "@/components/app/parts";
import { Icon, formatDate, getErrorMessage, initials, sentenceCase } from "@/components/app/kit";
import { getUsageInfo, type UsageInfo } from "@/lib/api/app";
import { ensureWorkspace, renameWorkspace, setAiMemory, setAutoApprove, setVocabulary, type AutoApprove } from "@/lib/api/auth";
import {
  cancelInvite, changePassword, deleteAccount, disconnectGoogleCalendar, getGoogleCalendarAuthUrl, getNotificationPreferences,
  listIntegrations, listPendingInvites, listWorkspaceMembers, removeMember, saveNotificationPreferences, updateMemberRole, updateProfile,
  type Integration, type NotificationPreference, type PendingInvite, type WorkspaceMember,
} from "@/lib/api/dashboard";

/**
 * Settings follows the layout people know from GitHub, Vercel and Linear: a section
 * index on the left, and each section as a row — what it is on the left, the controls
 * on the right — so every block lines up and nothing leaves a hole beside it.
 */
const SECTIONS: Array<{ group: string; items: Array<[id: string, label: string]> }> = [
  { group: "Account", items: [["profile", "Profile"], ["password", "Password"], ["notifications", "Notifications"]] },
  { group: "Workspace", items: [["workspace", "General"], ["members", "Members"], ["action-items", "Action items"], ["vocabulary", "Vocabulary"], ["memory", "What VOII remembers"], ["integrations", "Integrations"], ["plan", "Plan & usage"]] },
  { group: "", items: [["danger", "Delete account"]] },
];

export function SettingsScreen() {
  return <AppShell crumbs={["Settings"]}><SettingsBody /></AppShell>;
}

function SettingsBody() {
  const active = useActiveSection(SECTIONS.flatMap((g) => g.items.map(([id]) => id)));
  return <>
    <CalendarReturnNotice />
    <header className="dashboard-content__header"><div><p className="dashboard-location">Settings</p><h1>Settings.</h1><p className="dashboard-intro">Your account, your workspace, and the people in it.</p></div></header>
    <div className="settings">
      <nav className="settings__nav" aria-label="Settings sections">
        {SECTIONS.map((g, i) => <div key={i} className="settings__nav-group">
          {g.group ? <p className="settings__nav-label">{g.group}</p> : null}
          {g.items.map(([id, label]) => <a key={id} href={`#${id}`} className={active === id ? "is-active" : ""} aria-current={active === id ? "true" : undefined}>{label}</a>)}
        </div>)}
      </nav>
      <div className="settings__body">
        <ProfileSection />
        <PasswordSection />
        <NotificationSection />
        <WorkspaceSection />
        <MembersSection />
        <AutoApproveSection />
        <VocabularySection />
        <MemorySection />
        <IntegrationsSection />
        <PlanSection />
        <DeleteAccountSection />
      </div>
    </div>
  </>;
}

/** Highlights the section currently in view. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: "-20% 0px -70% 0px" });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return active;
}

function Section({ id, title, description, children, footer, danger }: { id: string; title: string; description: ReactNode; children: ReactNode; footer?: ReactNode; danger?: boolean }) {
  return <section id={id} className={`settings-section${danger ? " settings-section--danger" : ""}`} aria-labelledby={`${id}-title`}>
    <div className="settings-section__intro">
      <h2 id={`${id}-title`}>{title}</h2>
      <p>{description}</p>
    </div>
    <div className="settings-card">
      <div className="settings-card__body">{children}</div>
      {footer ? <div className="settings-card__footer">{footer}</div> : null}
    </div>
  </section>;
}

/** Status line under a form: one place for "Saved" and errors. */
function Status({ error, ok }: { error?: string; ok?: string }) {
  if (error) return <p className="app-error" role="alert">{error}</p>;
  if (ok) return <p className="field-ok" role="status">{ok}</p>;
  return <span />;
}

// ── Account ────────────────────────────────────────────────────────────────

function ProfileSection() {
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
  return <form method="post" onSubmit={save}>
    <Section id="profile" title="Profile" description="How you appear to your team, in meetings and on tasks."
      footer={<><Status error={error} ok={state === "saved" ? "Saved." : ""} /><button className="dashboard-primary-button" type="submit" disabled={state === "saving"}>{state === "saving" ? "Saving…" : "Save"}</button></>}>
      <div className="field-grid">
        <label className="field"><span>Name</span><input value={name} onChange={(e) => { setName(e.target.value); setState("idle"); }} maxLength={100} autoComplete="name" /></label>
        <label className="field"><span>Email</span><input value={user?.email ?? ""} readOnly aria-readonly="true" /><small>Your sign-in address. It can’t be changed here.</small></label>
      </div>
    </Section>
  </form>;
}

function PasswordSection() {
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
  return <form method="post" onSubmit={save}>
    <Section id="password" title="Password" description="Changing it signs you out on your other devices."
      footer={<><Status error={error} ok={state === "saved" ? "Password changed." : ""} /><button className="dashboard-primary-button" type="submit" disabled={state === "saving" || !current || !next}>{state === "saving" ? "Changing…" : "Change password"}</button></>}>
      <div className="field-grid">
        <label className="field"><span>Current password</span><input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required /></label>
        <label className="field"><span>New password</span><input type="password" value={next} onChange={(e) => { setNext(e.target.value); setState("idle"); }} autoComplete="new-password" minLength={8} maxLength={128} required /><small>At least 8 characters.</small></label>
      </div>
    </Section>
  </form>;
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

function NotificationSection() {
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
  const label = (t: string) => NOTIFICATION_LABELS[t] ?? sentenceCase(t.replace(/_/g, " "));
  return <Section id="notifications" title="Notifications" description="Choose what reaches you inside VOII and by email. Changes save as you go.">
    {prefs ? <table className="pref-table">
      <thead><tr><th scope="col">When</th><th scope="col">In app</th><th scope="col">Email</th></tr></thead>
      <tbody>{types.map((t) => <tr key={t}>
        <th scope="row">{label(t)}</th>
        <td><input type="checkbox" checked={on(t, "in_app")} onChange={() => void toggle(t, "in_app")} aria-label={`${label(t)}: in app`} /></td>
        <td><input type="checkbox" checked={on(t, "email")} onChange={() => void toggle(t, "email")} aria-label={`${label(t)}: email`} /></td>
      </tr>)}</tbody>
    </table> : error ? null : <p className="app-muted">Loading…</p>}
    {error ? <p className="app-error" role="alert">{error}</p> : null}
  </Section>;
}

// ── Workspace ──────────────────────────────────────────────────────────────

function WorkspaceSection() {
  const { workspace } = useAuth();
  const [name, setName] = useState(workspace?.name ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");
  const canEdit = workspace?.role === "OWNER" || workspace?.role === "ADMIN";
  useEffect(() => { if (workspace?.name) setName(workspace.name); }, [workspace?.name]);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Give the workspace a name."); return; }
    setState("saving"); setError("");
    try { await renameWorkspace(name.trim()); setState("saved"); }
    catch (err) { setError(getErrorMessage(err)); setState("idle"); }
  }
  return <form method="post" onSubmit={save}>
    <Section id="workspace" title="General" description="The workspace holds your meetings, boards and clients, shared with your team."
      footer={canEdit ? <><Status error={error} ok={state === "saved" ? "Saved." : ""} /><button className="dashboard-primary-button" type="submit" disabled={state === "saving"}>{state === "saving" ? "Saving…" : "Save"}</button></> : undefined}>
      <label className="field settings-field--narrow"><span>Workspace name</span><input value={name} onChange={(e) => { setName(e.target.value); setState("idle"); }} maxLength={80} readOnly={!canEdit} />
        {canEdit ? null : <small>Only owners and admins can rename the workspace.</small>}</label>
      <div className="field settings-field--narrow"><span>Account type</span><p>{workspace?.type === "student" ? "Student" : workspace?.type === "agency" ? "Client work" : "Team"}</p><small>This was set when you joined and can’t be changed.</small></div>
    </Section>
  </form>;
}

function MembersSection() {
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

  return <Section id="members" title="Members" description={<>People in this workspace and what they can do. Admins can invite and manage members; members can work on meetings and tasks.</>}
    footer={canManage && !inviting ? <><span className="app-muted">{members.length} member{members.length === 1 ? "" : "s"}{invites.length ? ` · ${invites.length} invited` : ""}</span><button className="dashboard-primary-button" type="button" onClick={() => setInviting(true)}><Icon name="plus" size={14} />Invite someone</button></> : undefined}>
    {inviting ? <ComposerPanel type="invite" meetings={[]} onClose={() => setInviting(false)} onCreated={() => { setInviting(false); load(); }} /> : null}
    {error ? <p className="app-error" role="alert">{error}</p> : null}
    <ul className="settings-list">
      {members.map((m) => {
        const editable = canManage && m.role !== "OWNER" && m.user.id !== me;
        const who = m.user.fullName || m.user.email || "Member";
        return <li key={m.id}>
          <span className="dashboard-avatar">{initials(m.user.fullName, m.user.email)}</span>
          <span className="settings-list__main"><strong>{who}{m.user.id === me ? " (you)" : ""}</strong><small>{m.user.email}</small></span>
          {editable ? <span className="settings-list__actions">
            <select className="member-role" aria-label={`Role for ${who}`} value={m.role} onChange={(e) => void act(() => updateMemberRole(m.user.id, e.target.value as "ADMIN" | "MEMBER"))}>
              <option value="ADMIN">Admin</option><option value="MEMBER">Member</option>
            </select>
            <button type="button" className="dashboard-quiet-button" onClick={() => { if (window.confirm(`Remove ${who} from this workspace?`)) void act(() => removeMember(m.user.id)); }}>Remove</button>
          </span> : <span className="chip">{sentenceCase(m.role)}</span>}
        </li>;
      })}
      {invites.map((i) => <li key={i.id}>
        <span className="dashboard-avatar" aria-hidden="true">@</span>
        <span className="settings-list__main"><strong>{i.email}</strong><small>Invited as {i.role.toLowerCase()} · expires {formatDate(i.expiresAt)}</small></span>
        <span className="settings-list__actions"><span className="chip">Pending</span><button type="button" className="dashboard-quiet-button" onClick={() => void act(() => cancelInvite(i.id))}>Cancel</button></span>
      </li>)}
    </ul>
  </Section>;
}

const AUTO_APPROVE: Array<[AutoApprove, string, string]> = [
  ["off", "Review everything", "Every action item waits for you to approve it."],
  ["confident", "Approve the clear ones", "VOII approves items it is sure about and that have an owner. The rest wait for you."],
  ["all", "Approve everything", "Every action item is approved as soon as the meeting is processed."],
];

function AutoApproveSection() {
  const [mode, setMode] = useState<AutoApprove | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { ensureWorkspace().then((r) => setMode(r.workspace?.actionItemAutoApprove ?? "off")).catch(() => setMode("off")); }, []);
  async function choose(next: AutoApprove) {
    const prev = mode;
    setMode(next);
    setError("");
    try { await setAutoApprove(next); } catch (e) { setMode(prev); setError(getErrorMessage(e)); }
  }
  return <Section id="action-items" title="Action items" description="What happens to the tasks VOII finds in a meeting. Applies to meetings processed from now on.">
    <div className="choice-list" role="radiogroup" aria-label="Approve action items">
      {AUTO_APPROVE.map(([value, label, description]) => <button key={value} type="button" role="radio" aria-checked={mode === value} className={`choice${mode === value ? " is-selected" : ""}`} onClick={() => void choose(value)} disabled={mode === null}>
        <span className="choice__copy"><strong>{label}</strong><span>{description}</span></span>
        <span className="choice__mark" aria-hidden="true">{mode === value ? <Icon name="check" size={13} /> : null}</span>
      </button>)}
    </div>
    {error ? <p className="app-error" role="alert">{error}</p> : null}
  </Section>;
}

/** Words VOII must spell exactly in transcripts and notes. */
function VocabularySection() {
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
  return <Section id="vocabulary" title="Vocabulary" description={<>Company names, products and people VOII should always spell right — “Providus”, not “Profidus”. Used for every new meeting, along with your team’s and clients’ names.</>}>
    <form method="post" className="vocab" onSubmit={add}>
      {words?.map((w) => <span key={w} className="vocab__word">{w}<button type="button" aria-label={`Remove ${w}`} onClick={() => void save(words.filter((x) => x !== w))}>×</button></span>)}
      <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={words?.length ? "Add another…" : "Type a word and press Enter"} aria-label="Add a word" disabled={words === null} maxLength={60} />
    </form>
    {error ? <p className="app-error" role="alert">{error}</p> : null}
  </Section>;
}

/** What people taught VOII by correcting it; used for every later set of notes. */
function MemorySection() {
  const [notes, setNotes] = useState<string[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { ensureWorkspace().then((r) => setNotes(r.workspace?.aiMemory ?? [])).catch(() => setNotes([])); }, []);
  async function forget(note: string) {
    const prev = notes;
    const next = (notes ?? []).filter((n) => n !== note);
    setNotes(next); setError("");
    try { await setAiMemory(next); } catch (e) { setNotes(prev); setError(getErrorMessage(e)); }
  }
  return <Section id="memory" title="What VOII remembers" description="When you correct a set of notes, VOII keeps the correction here and uses it for every later meeting in this workspace.">
    {notes?.length ? <ul className="memory">{notes.map((n) => <li key={n}><span>{n}</span><button className="dashboard-text-button" type="button" onClick={() => void forget(n)}>Forget</button></li>)}</ul>
      : <p className="app-muted">{notes ? "Nothing yet. Open a meeting and choose “Something wrong?” under the summary." : "Loading…"}</p>}
    {error ? <p className="app-error" role="alert">{error}</p> : null}
  </Section>;
}

function IntegrationsSection() {
  const [integrations, setIntegrations] = useState<Integration[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { listIntegrations().then((r) => setIntegrations(r.integrations ?? [])).catch(() => setIntegrations([])); }, []);
  const calendar = integrations?.find((i) => i.type === "google_calendar");
  const connected = calendar?.status === "connected";

  async function connect() {
    setBusy(true); setError("");
    try { window.location.assign((await getGoogleCalendarAuthUrl()).authUrl); }
    catch (e) { setError(getErrorMessage(e)); setBusy(false); }
  }
  async function disconnect() {
    setBusy(true); setError("");
    try { await disconnectGoogleCalendar(); setIntegrations((all) => all?.filter((i) => i.type !== "google_calendar") ?? null); }
    catch (e) { setError(getErrorMessage(e)); }
    finally { setBusy(false); }
  }

  return <Section id="integrations" title="Integrations" description="Connect the tools your meetings already live in.">
    <ul className="settings-list">
      <li>
        <span className="settings-list__icon"><Icon name="calendar" size={18} /></span>
        <span className="settings-list__main"><strong>Google Calendar</strong><small>{connected ? `Connected as ${calendar?.externalEmail || "your Google account"}. Upcoming calls show under New meeting → From calendar.` : "See your upcoming calls in VOII and send the notetaker to them in one click."}</small></span>
        <span className="settings-list__actions">
          {integrations === null ? null : connected
            ? <button className="dashboard-quiet-button" type="button" disabled={busy} onClick={() => void disconnect()}>{busy ? "Disconnecting…" : "Disconnect"}</button>
            : <button className="dashboard-primary-button" type="button" disabled={busy} onClick={() => void connect()}>{busy ? "Opening Google…" : "Connect"}</button>}
        </span>
      </li>
    </ul>
    {error ? <p className="app-error" role="alert">{error}</p> : null}
  </Section>;
}

function PlanSection() {
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  useEffect(() => { getUsageInfo().then(setUsage).catch(() => undefined); }, []);
  const meters: Array<[label: string, used: number, limit: number]> = usage ? [
    ["Meetings this month", usage.usage.meetingsCreated, usage.limits.meetingsPerMonth],
    ["Processing minutes", usage.usage.processingMinutesUsed, usage.limits.processingMinutesPerMonth],
  ] : [];
  return <Section id="plan" title="Plan & usage" description="Your current plan and how much of it this month has used."
    footer={<><span className="app-muted">Payments, invoices and plan changes live on the billing page.</span><Link className="dashboard-primary-button" href="/settings/billing">Plan and billing <Icon name="arrow" size={14} /></Link></>}>
    <div className="settings-plan">
      <p className="settings-plan__name">{sentenceCase(usage?.plan ?? "free")} <span className="chip">Current plan</span></p>
      <div className="settings-meters">
        {meters.map(([label, used, limit]) => {
          const unlimited = limit < 0;
          return <div key={label} className="billing-meter">
            <div className="dashboard-usage-row"><span>{label}</span><strong>{used}{unlimited ? " · unlimited" : ` / ${limit}`}</strong></div>
            {unlimited ? null : <div className="progress"><span style={{ width: `${Math.min(100, limit === 0 ? 100 : (used / limit) * 100)}%` }} /></div>}
          </div>;
        })}
      </div>
    </div>
  </Section>;
}

function DeleteAccountSection() {
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
  return <form method="post" onSubmit={remove}>
    <Section id="danger" danger title="Delete account" description="Deactivates your account and signs you out everywhere. Workspaces you own stay with their other members."
      footer={open
        ? <><button className="dashboard-quiet-button" type="button" onClick={() => setOpen(false)}>Keep my account</button><button className="dashboard-primary-button danger-button" type="submit" disabled={busy || typed !== "DELETE" || !password}>{busy ? "Deleting…" : "Delete my account"}</button></>
        : <><span /><button className="dashboard-quiet-button danger-outline" type="button" onClick={() => setOpen(true)}>Delete my account…</button></>}>
      {open ? <div className="field-grid">
        <label className="field"><span>Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
        <label className="field"><span>Type DELETE to confirm</span><input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" required /></label>
      </div> : <p className="app-muted">This can’t be undone from the app.</p>}
      {error ? <p className="app-error" role="alert">{error}</p> : null}
    </Section>
  </form>;
}

/** Google sends people back here after the calendar consent screen. */
function CalendarReturnNotice() {
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const reason = q.get("reason");
    if (q.get("calendar") === "connected") setNotice({ ok: true, text: "Google Calendar is connected. Your upcoming calls show under New meeting → From calendar." });
    else if (q.get("calendar") === "failed") setNotice({ ok: false, text:
      reason === "access_denied" ? "Google Calendar wasn’t connected: access was declined on Google’s screen. Try again and choose Allow."
      : reason === "expired" ? "That Google sign-in took too long. Connect again below."
      : "Google Calendar couldn’t be connected. Try again below." });
  }, []);
  if (!notice) return null;
  return <div className={`dashboard-alert${notice.ok ? " dashboard-alert--success" : ""}`} role="status"><span>{notice.text}</span><button type="button" aria-label="Dismiss" onClick={() => setNotice(null)}>×</button></div>;
}
