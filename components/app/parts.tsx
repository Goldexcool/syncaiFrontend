"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { EmptyState, Icon, SectionHeading, formatDate, getErrorMessage, sentenceCase } from "@/components/app/kit";
import { createMeeting, createClient, createProject, createTask, inviteWorkspaceMember, type Client, type Commitment, type Integration, type Meeting, type Notification, type Project, type SubscriptionSummary, type Task, type UsageSummary, type WorkspaceMember, type CalendarEvent } from "@/lib/api/dashboard";


/* Pieces shared by the app screens: create forms, settings, notifications. */

export type Composer = "meeting" | "task" | "project" | "client" | "invite" | null;

export type DashboardData = {
  meetings: Meeting[];
  tasks: Task[];
  commitments: Commitment[];
  projects: Project[];
  events: CalendarEvent[];
  clients: Client[];
  members: WorkspaceMember[];
  notifications: Notification[];
  unreadCount: number;
  usage: UsageSummary | null;
  subscription: SubscriptionSummary;
  integrations: Integration[];
};

export function SettingsView({ data, onConnectCalendar, onDisconnectCalendar, isConnectingCalendar }: { data: DashboardData; onConnectCalendar: () => Promise<void>; onDisconnectCalendar: () => Promise<void>; isConnectingCalendar: boolean }) {
  // GET /billing/subscription wraps the record: { subscription: {...} }
  const sub = (data.subscription?.subscription ?? data.subscription) as { plan?: unknown } | null;
  const plan = typeof sub?.plan === "string" ? sub.plan : "free";
  const calendar = data.integrations.find((integration) => integration.type === "google_calendar");
  const calendarConnected = calendar?.status === "connected";
  return <div className="dashboard-settings-grid">
    <section className="dashboard-surface">
      <SectionHeading title="Workspace plan" />
      <div className="dashboard-plan-line"><span className="dashboard-plan-name">{sentenceCase(plan)}</span><span>Current plan</span></div>
      <p className="dashboard-settings-copy">Every plan includes VOII’s core memory engine. Your conversations stay searchable and connected to the work that follows.</p>
      <Link className="dashboard-outline-button" href="/settings/billing">Plan and billing <Icon name="arrow" size={15} /></Link>
    </section>
    <section className="dashboard-surface">
      <SectionHeading title="Integrations" />
      <div className="dashboard-integration-row"><div><h3>Google Calendar</h3><p>{calendarConnected ? calendar?.externalEmail || "Connected" : "Bring meetings into the same view as your work."}</p></div><button className={calendarConnected ? "dashboard-quiet-button" : "dashboard-primary-button"} type="button" onClick={() => void (calendarConnected ? onDisconnectCalendar() : onConnectCalendar())} disabled={isConnectingCalendar}>{isConnectingCalendar ? "Working…" : calendarConnected ? "Disconnect" : "Connect"}</button></div>
    </section>
    <section className="dashboard-surface dashboard-surface--full"><SectionHeading title="Usage" /><UsageSummary usage={data.usage} /></section>
  </div>;
}

export function UsageSummary({ usage }: { usage: UsageSummary | null }) {
  if (!usage) return <EmptyState title="Usage is not available." body="We could not read your current usage. Refresh the workspace to try again." />;
  const entries = Object.entries(usage).filter(([, value]) => typeof value === "string" || typeof value === "number").slice(0, 5);
  if (entries.length === 0) return <EmptyState title="Your usage will appear here." body="As you capture conversations and create work, VOII will keep the workspace limits visible." />;
  return <div className="dashboard-usage-list">{entries.map(([key, value]) => <div className="dashboard-usage-row" key={key}><span>{sentenceCase(key)}</span><strong>{String(value)}</strong></div>)}</div>;
}

export function InlineError({ message }: { message: string }) {
  return <div className="dashboard-inline-error" role="status"><span>{message}</span><Icon name="refresh" size={14} /></div>;
}

export function NotificationPopover({ notifications, onRead, onReadAll, onClose }: { notifications: Notification[]; onRead: (notification: Notification) => Promise<void>; onReadAll: () => Promise<void>; onClose: () => void }) {
  return <div className="dashboard-notification-popover" role="dialog" aria-label="Notifications"><div className="dashboard-notification-popover__header"><strong>Notifications</strong><button className="dashboard-icon-button" type="button" onClick={onClose} aria-label="Close notifications"><Icon name="close" size={16} /></button></div>{notifications.length === 0 ? <p className="dashboard-notification-empty">Nothing new here.</p> : <div className="dashboard-notification-list">{notifications.map((notification) => <button className={`dashboard-notification-row ${notification.read ? "is-read" : ""}`} key={notification.id} type="button" onClick={() => void onRead(notification)}><span className="dashboard-notification-dot" aria-hidden="true" /><span><strong>{notification.title}</strong><small>{notification.message}</small><time>{formatDate(notification.createdAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time></span></button>)}</div>}<button className="dashboard-notification-popover__footer" type="button" onClick={() => void onReadAll()}>Mark all as read</button></div>;
}

export function ComposerPanel({ type, meetings, onClose, onCreated }: { type: Exclude<Composer, null>; meetings: Meeting[]; onClose: () => void; onCreated: (created: { kind: "meeting"; item: Meeting } | { kind: "task"; item: Task } | { kind: "project"; item: Project } | { kind: "client"; item: Client } | { kind: "invite"; email: string }) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"urgent" | "high" | "medium" | "low">("medium");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [sourceMeetingId, setSourceMeetingId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) { setFormError("Give this a short, useful title."); return; }
    setIsSaving(true);
    setFormError("");
    try {
      if (type === "meeting") {
        const result = await createMeeting({ title: title.trim(), description: description.trim() || undefined, source: "manual", provider: "manual" });
        onCreated({ kind: "meeting", item: result.meeting });
      } else if (type === "task") {
        const result = await createTask({ title: title.trim(), description: description.trim() || undefined, priority, dueDate: dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : undefined, sourceMeetingId: sourceMeetingId || undefined });
        onCreated({ kind: "task", item: result.task });
      } else if (type === "project") {
        const result = await createProject({ name: title.trim(), description: description.trim() || undefined });
        onCreated({ kind: "project", item: result.project });
      } else if (type === "client") {
        const result = await createClient({ name: title.trim(), companyName: description.trim() || undefined, contactEmail: contactEmail.trim() || undefined });
        onCreated({ kind: "client", item: result.client });
      } else {
        await inviteWorkspaceMember({ email: title.trim(), role });
        onCreated({ kind: "invite", email: title.trim() });
      }
    } catch (saveError) {
      setFormError(getErrorMessage(saveError));
    } finally { setIsSaving(false); }
  }

  const labels: Record<Exclude<Composer, null>, string> = { meeting: "Start a conversation", task: "Add a next move", project: "Create a project", client: "Add a client", invite: "Invite someone" };
  const titleLabels: Record<Exclude<Composer, null>, string> = { meeting: "Conversation title", task: "Task title", project: "Project name", client: "Client name", invite: "Email address" };
  return <section className="dashboard-composer" aria-label={labels[type]}><div className="dashboard-composer__header"><div><p className="dashboard-location">A small beginning</p><h2>{labels[type]}</h2></div><button className="dashboard-icon-button" type="button" onClick={onClose} aria-label="Close form"><Icon name="close" size={18} /></button></div><form method="post" onSubmit={submit}><label><span>{titleLabels[type]}</span><input autoFocus type={type === "invite" ? "email" : "text"} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={type === "meeting" ? "Client kickoff" : type === "task" ? "Prepare the first draft" : type === "project" ? "Northstar launch" : type === "client" ? "Northstar team" : "teammate@example.com"} /></label>{type !== "invite" ? <label><span>{type === "client" ? "Company" : "Description"} <small>Optional</small></span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder={type === "client" ? "Northstar Studio" : "What should stay close to this work?"} rows={3} /></label> : null}{type === "client" ? <label><span>Contact email <small>Optional</small></span><input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="hello@northstar.studio" /></label> : null}{type === "invite" ? <label><span>Workspace role</span><select value={role} onChange={(event) => setRole(event.target.value as typeof role)}><option value="MEMBER">Member</option><option value="ADMIN">Admin</option></select></label> : null}{type === "task" ? <div className="dashboard-form-grid"><label><span>Due date <small>Optional</small></span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label><label><span>Priority</span><select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label></div> : null}{type === "task" && meetings.length > 0 ? <label><span>Source conversation <small>Optional</small></span><select value={sourceMeetingId} onChange={(event) => setSourceMeetingId(event.target.value)}><option value="">Keep this independent</option>{meetings.slice(0, 12).map((meeting) => <option key={meeting.id} value={meeting.id}>{meeting.title}</option>)}</select></label> : null}{formError ? <p className="dashboard-form-error" role="alert">{formError}</p> : null}<div className="dashboard-composer__actions"><button className="dashboard-quiet-button" type="button" onClick={onClose}>Cancel</button><button className="dashboard-primary-button" type="submit" disabled={isSaving}>{isSaving ? "Saving…" : type === "meeting" ? "Create conversation" : type === "task" ? "Add task" : type === "project" ? "Create project" : type === "client" ? "Add client" : "Send invite"}<Icon name="arrow" size={15} /></button></div></form></section>;
}
