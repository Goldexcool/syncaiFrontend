"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { useAuth } from "@/components/AuthProvider";
import { Logo } from "@/components/SiteHeader";
import NewConversation from "@/components/app/NewConversation";
import PortalPanel from "@/components/app/PortalPanel";
import { ApiRequestError } from "@/lib/api/client";
import {
  createMeeting,
  createClient,
  createProject,
  createTask,
  disconnectGoogleCalendar,
  getGoogleCalendarAuthUrl,
  getSubscription,
  getUnreadNotificationCount,
  getWorkspaceUsage,
  listCalendarEvents,
  listClients,
  listCommitments,
  listIntegrations,
  inviteWorkspaceMember,
  listMeetings,
  listNotifications,
  listProjects,
  listTasks,
  listWorkspaceMembers,
  markAllNotificationsRead,
  markNotificationRead,
  updateCommitmentStatus,
  updateTask,
  type CalendarEvent,
  type Client,
  type Commitment,
  type Integration,
  type Meeting,
  type Notification,
  type Project,
  type SubscriptionSummary,
  type Task,
  type UsageSummary,
  type WorkspaceMember,
} from "@/lib/api/dashboard";

type DashboardView = "overview" | "conversations" | "knowledge" | "tasks" | "projects" | "calendar" | "clients" | "team" | "settings";
type Composer = "meeting" | "task" | "project" | "client" | "invite" | null;

type DashboardData = {
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

const emptyData: DashboardData = {
  meetings: [],
  tasks: [],
  commitments: [],
  projects: [],
  events: [],
  clients: [],
  members: [],
  notifications: [],
  unreadCount: 0,
  usage: null,
  subscription: null,
  integrations: [],
};

const primaryNav: Array<{ id: DashboardView; label: string; icon: IconName }> = [
  { id: "overview", label: "Today", icon: "home" },
  { id: "conversations", label: "Conversations", icon: "conversation" },
  { id: "knowledge", label: "Knowledge", icon: "knowledge" },
  { id: "tasks", label: "Tasks", icon: "check" },
  { id: "projects", label: "Projects", icon: "project" },
];

const workspaceNav: Array<{ id: DashboardView; label: string; icon: IconName }> = [
  { id: "calendar", label: "Calendar", icon: "calendar" },
  { id: "clients", label: "Clients", icon: "clients" },
  { id: "team", label: "Team", icon: "team" },
];

type IconName = "home" | "conversation" | "knowledge" | "check" | "project" | "calendar" | "clients" | "team" | "settings" | "search" | "bell" | "plus" | "arrow" | "close" | "refresh" | "external";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 9 9-6 9 6" /><path d="M5 8.5V21h14V8.5" /><path d="M9 21v-7h6v7" /></>,
    conversation: <><path d="M4 5.5h16v11H8l-4 3v-14Z" /><path d="M8 9.5h8M8 13h5" /></>,
    knowledge: <><path d="M5 4.5h12a2 2 0 0 1 2 2V20H7a2 2 0 0 1-2-2V4.5Z" /><path d="M7 20a2 2 0 0 1 2-2h10M9 8h6M9 11.5h5" /></>,
    check: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="m8 12 2.5 2.5L16 9" /></>,
    project: <><path d="M3.5 7.5h6l2 2h9v9.5h-17v-11.5Z" /><path d="M3.5 7.5V5h5l2 2" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M7 3v4M17 3v4M3.5 9h17M7.5 13h.01M11.5 13h.01M15.5 13h.01M7.5 16.5h.01M11.5 16.5h.01" /></>,
    clients: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.5-3 2.3-4.5 5.5-4.5s5 1.5 5.5 4.5M16 5.5a2.6 2.6 0 0 1 0 5M16.5 14.7c1.7.4 2.8 1.8 3 3.8" /></>,
    team: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.2" /><path d="M3.5 19c.5-3 2.3-4.5 5.5-4.5s5 1.5 5.5 4.5M15 15c2.3.2 3.7 1.5 4.2 4" /></>,
    settings: <><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /><circle cx="12" cy="12" r="4" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    arrow: <><path d="M5 19 19 5M8 5h11v11" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14-4L4 9" /><path d="M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2" /><path d="M20 20v-5h-5" /></>,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></>,
  };

  return <svg aria-hidden="true" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 24 24" width={size}>{paths[name]}</svg>;
}

function displayName(fullName?: string | null, email?: string | null) {
  return fullName?.trim() || email?.split("@")[0] || "there";
}

function initials(name?: string | null, email?: string | null) {
  const source = displayName(name, email);
  return source.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function formatDate(value?: string | null, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  if (!value) return "No date";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No date" : new Intl.DateTimeFormat("en-NG", options).format(date);
}

function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit" }).format(date);
}

function sentenceCase(value?: string | null) {
  if (!value) return "Not started";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiRequestError ? error.message : "We couldn’t load this part of your workspace.";
}

function StatusMark({ status }: { status?: string | null }) {
  const normalized = status?.toLowerCase();
  return <span className={`dashboard-status-mark dashboard-status-mark--${normalized === "done" || normalized === "completed" ? "done" : normalized === "failed" || normalized === "overdue" ? "attention" : "quiet"}`} aria-hidden="true" />;
}

function EmptyState({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
  return <div className="dashboard-empty-state">
    <span className="dashboard-empty-state__line" aria-hidden="true" />
    <h3>{title}</h3>
    <p>{body}</p>
    {action && onAction ? <button className="dashboard-text-button" type="button" onClick={onAction}>{action}<Icon name="arrow" size={15} /></button> : null}
  </div>;
}

function SectionHeading({ title, count, action, onAction }: { title: string; count?: number; action?: string; onAction?: () => void }) {
  return <div className="dashboard-section-heading">
    <div className="flex items-baseline gap-3"><h2>{title}</h2>{count !== undefined ? <span className="dashboard-count">{count}</span> : null}</div>
    {action && onAction ? <button className="dashboard-text-button" type="button" onClick={onAction}>{action}<Icon name="arrow" size={14} /></button> : null}
  </div>;
}

function DataLoading({ rows = 3 }: { rows?: number }) {
  void rows;
  return <div className="dashboard-loading-state" aria-label="Loading your workspace" role="status"><span className="dashboard-loading-state__mark" aria-hidden="true" /><p>Bringing your workspace together.</p></div>;
}

export default function DashboardPage() {
  const { user, workspace, logout } = useAuth();
  const [view, setView] = useState<DashboardView>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [composer, setComposer] = useState<Composer>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [data, setData] = useState<DashboardData>(emptyData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [taskFilter, setTaskFilter] = useState<"all" | "open" | "done">("all");
  const [search, setSearch] = useState("");

  const loadData = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError("");
    const results = await Promise.allSettled([
      listMeetings(20),
      listTasks(30),
      listCommitments(20),
      listProjects(20),
      listCalendarEvents(20),
      listClients(20),
      listWorkspaceMembers(),
      listNotifications(8),
      getUnreadNotificationCount(),
      getWorkspaceUsage(),
      getSubscription(),
      listIntegrations(),
    ]);
    const [meetings, tasks, commitments, projects, events, clients, members, notifications, unreadCount, usage, subscription, integrations] = results;
    const nextErrors: Record<string, string> = {};
    const value = <T,>(result: PromiseSettledResult<T>, key: string, fallback: T): T => {
      if (result.status === "fulfilled") return result.value;
      nextErrors[key] = getErrorMessage(result.reason);
      return fallback;
    };
    const fallbackPagination = { page: 1, limit: 0, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false };
    const meetingsData = value(meetings, "meetings", { meetings: [], pagination: fallbackPagination }).meetings ?? [];
    const tasksData = value(tasks, "tasks", { tasks: [], pagination: fallbackPagination }).tasks ?? [];
    const commitmentsData = value(commitments, "commitments", { commitments: [], pagination: fallbackPagination }).commitments ?? [];
    const projectsData = value(projects, "projects", { projects: [], pagination: fallbackPagination }).projects ?? [];
    const eventsData = value(events, "events", { events: [], pagination: fallbackPagination }).events ?? [];
    const clientsData = value(clients, "clients", { clients: [], pagination: fallbackPagination }).clients ?? [];
    const membersData = value(members, "members", { members: [] }).members ?? [];
    const notificationsData = value(notifications, "notifications", { notifications: [], pagination: fallbackPagination }).notifications ?? [];
    const unreadData = value(unreadCount, "unreadCount", { count: 0 }).count ?? 0;
    const usageData = value(usage, "usage", null);
    const subscriptionData = value(subscription, "subscription", null);
    const integrationsData = value(integrations, "integrations", { integrations: [] }).integrations ?? [];
    setData({ meetings: meetingsData, tasks: tasksData, commitments: commitmentsData, projects: projectsData, events: eventsData, clients: clientsData, members: membersData, notifications: notificationsData, unreadCount: unreadData, usage: usageData, subscription: subscriptionData, integrations: integrationsData });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === results.length) setError("Your workspace could not be reached. Check the API and try again.");
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  // Deep links (notifications, emails) arrive as /dashboard?view=clients&client=…
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("view");
    if (requested && [...primaryNav, ...workspaceNav].some((n) => n.id === requested)) setView(requested as DashboardView);
  }, []);

  const navigate = (nextView: DashboardView) => {
    setView(nextView);
    setComposer(null);
    setNotificationsOpen(false);
    setMobileNavOpen(false);
    if (typeof window !== "undefined") window.history.replaceState({}, "", `/dashboard?view=${nextView}`);
  };

  const openComposer = (nextComposer: Exclude<Composer, null>) => {
    setComposer(nextComposer);
    setNotificationsOpen(false);
  };

  async function handleLogout() {
    await logout();
    window.location.assign("/signin");
  }

  async function handleConnectCalendar() {
    setIsConnectingCalendar(true);
    setError("");
    try {
      const result = await getGoogleCalendarAuthUrl();
      window.location.assign(result.authUrl);
    } catch (connectError) {
      setError(getErrorMessage(connectError));
      setIsConnectingCalendar(false);
    }
  }

  async function handleDisconnectCalendar() {
    setIsConnectingCalendar(true);
    setError("");
    try {
      await disconnectGoogleCalendar();
      setData((current) => ({ ...current, integrations: current.integrations.filter((integration) => integration.type !== "google_calendar") }));
      setNotice("Google Calendar has been disconnected.");
    } catch (disconnectError) {
      setError(getErrorMessage(disconnectError));
    } finally {
      setIsConnectingCalendar(false);
    }
  }

  async function handleTaskComplete(task: Task) {
    if (!task.id || task.status === "done") return;
    setData((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, status: "done" } : item) }));
    try {
      await updateTask(task.id, { status: "done" });
    } catch (taskError) {
      setData((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, status: task.status } : item) }));
      setError(getErrorMessage(taskError));
    }
  }

  async function handleCommitmentComplete(commitment: Commitment) {
    if (!commitment.id || commitment.status === "done") return;
    setData((current) => ({ ...current, commitments: current.commitments.map((item) => item.id === commitment.id ? { ...item, status: "done" } : item) }));
    try {
      await updateCommitmentStatus(commitment.id, "done");
    } catch (commitmentError) {
      setData((current) => ({ ...current, commitments: current.commitments.map((item) => item.id === commitment.id ? { ...item, status: commitment.status } : item) }));
      setError(getErrorMessage(commitmentError));
    }
  }

  async function handleMarkAllNotificationsRead() {
    try {
      await markAllNotificationsRead();
      setData((current) => ({ ...current, unreadCount: 0, notifications: current.notifications.map((notification) => ({ ...notification, read: true })) }));
    } catch (notificationError) { setError(getErrorMessage(notificationError)); }
  }

  async function handleNotificationRead(notification: Notification) {
    const href = notification.data?.href;
    if (href?.startsWith("/")) window.location.assign(href);
    if (notification.read) return;
    try {
      await markNotificationRead(notification.id);
      setData((current) => ({ ...current, unreadCount: Math.max(0, current.unreadCount - 1), notifications: current.notifications.map((item) => item.id === notification.id ? { ...item, read: true } : item) }));
    } catch (notificationError) { setError(getErrorMessage(notificationError)); }
  }

  const visibleTasks = useMemo(() => data.tasks.filter((task) => {
    const matchesFilter = taskFilter === "all" || (taskFilter === "done" ? task.status === "done" : task.status !== "done" && task.status !== "cancelled");
    const matchesSearch = !search || task.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  }), [data.tasks, search, taskFilter]);

  const visibleMeetings = useMemo(() => data.meetings.filter((meeting) => !search || meeting.title.toLowerCase().includes(search.toLowerCase()) || meeting.shortSummary?.toLowerCase().includes(search.toLowerCase())), [data.meetings, search]);

  return <AuthGate>
    <div className="dashboard-page" id="main-content">
      <div className={`dashboard-shell ${mobileNavOpen ? "dashboard-shell--nav-open" : ""}`}>
        <aside className="dashboard-sidebar" aria-label="Workspace navigation">
          <div className="dashboard-sidebar__top">
            <Link href="/" aria-label="VOII home"><Logo /></Link>
            <button className="dashboard-mobile-close" type="button" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation"><Icon name="close" /></button>
          </div>
          <div className="dashboard-workspace-switcher"><span className="dashboard-avatar dashboard-avatar--workspace">{initials(workspace?.name, workspace?.slug)}</span><span><strong>{workspace?.name || "Your workspace"}</strong><small>{sentenceCase(workspace?.role || "personal")}</small></span><span className="dashboard-workspace-switcher__dot" aria-hidden="true" /></div>
          <nav className="dashboard-nav" aria-label="Primary workspace views">
            <p className="dashboard-nav__label">Workspace</p>
            {primaryNav.map((item) => <NavItem key={item.id} item={item} active={view === item.id} onClick={() => navigate(item.id)} />)}
            <Link className="dashboard-nav-item" href="/board"><Icon name="project" size={17} /><span>Board</span></Link>
            <p className="dashboard-nav__label dashboard-nav__label--spaced">Connected work</p>
            {workspaceNav.map((item) => <NavItem key={item.id} item={item} active={view === item.id} onClick={() => navigate(item.id)} />)}
          </nav>
          <div className="dashboard-sidebar__bottom">
            <button className={`dashboard-nav-item ${view === "settings" ? "is-active" : ""}`} type="button" onClick={() => navigate("settings")}><Icon name="settings" size={17} /><span>Settings</span></button>
            <div className="dashboard-sidebar__footer"><span className="dashboard-avatar">{initials(user?.fullName, user?.email)}</span><span className="min-w-0"><strong>{displayName(user?.fullName, user?.email)}</strong><small>{user?.email}</small></span><button className="dashboard-icon-button" type="button" onClick={handleLogout} aria-label="Sign out"><Icon name="external" size={15} /></button></div>
          </div>
        </aside>

        <div className="dashboard-main">
          <header className="dashboard-topbar">
            <button className="dashboard-mobile-menu" type="button" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><span /><span /><span /></button>
            <div className="dashboard-search"><Icon name="search" size={17} /><input aria-label="Search your workspace" placeholder="Search your workspace" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ K</kbd></div>
            <div className="dashboard-topbar__actions">
              <button className="dashboard-icon-button dashboard-notification-button" type="button" aria-expanded={notificationsOpen} aria-label={data.unreadCount ? `${data.unreadCount} unread notifications` : "Notifications"} onClick={() => setNotificationsOpen((current) => !current)}><Icon name="bell" size={18} />{data.unreadCount > 0 ? <span>{data.unreadCount > 9 ? "9+" : data.unreadCount}</span> : null}</button>
              <button className="dashboard-profile-button" type="button" onClick={() => navigate("settings")}><span className="dashboard-avatar">{initials(user?.fullName, user?.email)}</span><span className="hidden md:inline">{displayName(user?.fullName, user?.email)}</span></button>
            </div>
            {notificationsOpen ? <NotificationPopover notifications={data.notifications} onRead={handleNotificationRead} onReadAll={handleMarkAllNotificationsRead} onClose={() => setNotificationsOpen(false)} /> : null}
          </header>

          <main className="dashboard-content">
            <div className="dashboard-content__header">
              <div><p className="dashboard-location">{view === "overview" ? "Your workspace" : sentenceCase(view)}</p><h1>{viewTitle(view)}</h1><p className="dashboard-intro">{viewDescription(view)}</p></div>
              <div className="dashboard-content__actions"><button className="dashboard-quiet-button" type="button" onClick={() => void loadData(true)} disabled={isRefreshing}><Icon name="refresh" size={15} />{isRefreshing ? "Refreshing" : "Refresh"}</button><button className="dashboard-primary-button" type="button" onClick={() => openComposer(view === "tasks" ? "task" : view === "projects" ? "project" : view === "clients" ? "client" : view === "team" ? "invite" : "meeting")}><Icon name="plus" size={16} />{view === "tasks" ? "New task" : view === "projects" ? "New project" : view === "clients" ? "Add client" : view === "team" ? "Invite someone" : "Start a conversation"}</button></div>
            </div>
            {error ? <div className="dashboard-alert" role="alert"><span>{error}</span><button type="button" onClick={() => void loadData(true)}><Icon name="refresh" size={15} />Try again</button></div> : null}
            {notice ? <div className="dashboard-alert dashboard-alert--success" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><Icon name="close" size={15} /></button></div> : null}
            {composer === "meeting" ? <NewConversation onClose={() => setComposer(null)} /> : composer ? <ComposerPanel type={composer} meetings={data.meetings} onClose={() => setComposer(null)} onCreated={(created) => { setComposer(null); if (created.kind === "invite") setNotice(`Invite sent to ${created.email}.`); setData((current) => ({ ...current, meetings: created.kind === "meeting" ? [created.item, ...current.meetings] : current.meetings, tasks: created.kind === "task" ? [created.item, ...current.tasks] : current.tasks, projects: created.kind === "project" ? [created.item, ...current.projects] : current.projects, clients: created.kind === "client" ? [created.item, ...current.clients] : current.clients })); }} /> : null}
            {isLoading ? <DataLoading rows={6} /> : <DashboardViewContent view={view} data={data} errors={errors} visibleTasks={visibleTasks} visibleMeetings={visibleMeetings} taskFilter={taskFilter} setTaskFilter={setTaskFilter} onTaskComplete={handleTaskComplete} onCommitmentComplete={handleCommitmentComplete} onNavigate={navigate} onCompose={openComposer} onConnectCalendar={handleConnectCalendar} onDisconnectCalendar={handleDisconnectCalendar} isConnectingCalendar={isConnectingCalendar} />}
          </main>
        </div>
      </div>
    </div>
  </AuthGate>;
}

function NavItem({ item, active, onClick }: { item: { id: DashboardView; label: string; icon: IconName }; active: boolean; onClick: () => void }) {
  return <button className={`dashboard-nav-item ${active ? "is-active" : ""}`} type="button" aria-current={active ? "page" : undefined} onClick={onClick}><Icon name={item.icon} size={17} /><span>{item.label}</span></button>;
}

function viewTitle(view: DashboardView) {
  const titles: Record<DashboardView, string> = { overview: "Good to have you back.", conversations: "Keep the conversation close.", knowledge: "Keep what matters.", tasks: "Make the next move visible.", projects: "See the work take shape.", calendar: "Know what is coming next.", clients: "Keep client work connected.", team: "Keep everyone in the thread.", settings: "Shape your workspace." };
  return titles[view];
}

function viewDescription(view: DashboardView) {
  const descriptions: Record<DashboardView, string> = { overview: "Your conversations, decisions, and next moves stay close together here.", conversations: "Every useful conversation stays searchable, understandable, and connected to what follows.", knowledge: "The decisions and commitments worth returning to, with their source still attached.", tasks: "The work that came out of a conversation, with owners and due dates in view.", projects: "A clear home for the work that continues after the call.", calendar: "Meetings and the work around them, in one quiet rhythm.", clients: "Client relationships, projects, and shared workspaces without losing the thread.", team: "A shared memory for the people moving the work forward.", settings: "Your profile, workspace, plan, and connected services." };
  return descriptions[view];
}

function DashboardViewContent({ view, data, errors, visibleTasks, visibleMeetings, taskFilter, setTaskFilter, onTaskComplete, onCommitmentComplete, onNavigate, onCompose, onConnectCalendar, onDisconnectCalendar, isConnectingCalendar }: { view: DashboardView; data: DashboardData; errors: Record<string, string>; visibleTasks: Task[]; visibleMeetings: Meeting[]; taskFilter: "all" | "open" | "done"; setTaskFilter: (value: "all" | "open" | "done") => void; onTaskComplete: (task: Task) => Promise<void>; onCommitmentComplete: (commitment: Commitment) => Promise<void>; onNavigate: (view: DashboardView) => void; onCompose: (composer: Exclude<Composer, null>) => void; onConnectCalendar: () => Promise<void>; onDisconnectCalendar: () => Promise<void>; isConnectingCalendar: boolean }) {
  if (view === "overview") return <OverviewView data={data} errors={errors} onTaskComplete={onTaskComplete} onNavigate={onNavigate} onCompose={onCompose} />;
  if (view === "conversations") return <ConversationsView meetings={visibleMeetings} errors={errors} onCompose={() => onCompose("meeting")} />;
  if (view === "knowledge") return <KnowledgeView meetings={data.meetings} commitments={data.commitments} errors={errors} onCommitmentComplete={onCommitmentComplete} />;
  if (view === "tasks") return <TasksView tasks={visibleTasks} filter={taskFilter} setFilter={setTaskFilter} errors={errors} onTaskComplete={onTaskComplete} onCompose={() => onCompose("task")} />;
  if (view === "projects") return <ProjectsView projects={data.projects} errors={errors} onCompose={() => onCompose("project")} />;
  if (view === "calendar") return <CalendarView events={data.events} errors={errors} onConnect={() => onNavigate("settings")} />;
  if (view === "clients") return <ClientsView clients={data.clients} errors={errors} onCompose={() => onCompose("client")} />;
  if (view === "team") return <TeamView members={data.members} errors={errors} onCompose={() => onCompose("invite")} />;
  return <SettingsView data={data} onConnectCalendar={onConnectCalendar} onDisconnectCalendar={onDisconnectCalendar} isConnectingCalendar={isConnectingCalendar} />;
}

function OverviewView({ data, errors, onTaskComplete, onNavigate, onCompose }: { data: DashboardData; errors: Record<string, string>; onTaskComplete: (task: Task) => Promise<void>; onNavigate: (view: DashboardView) => void; onCompose: (composer: Exclude<Composer, null>) => void }) {
  const latest = data.meetings[0];
  const openTasks = data.tasks.filter((task) => task.status !== "done" && task.status !== "cancelled");
  const openCommitments = data.commitments.filter((commitment) => commitment.status !== "done" && commitment.status !== "cancelled");
  return <div className="dashboard-overview">
    <section className="dashboard-thread-intro"><div><span className="dashboard-thread-intro__rule" aria-hidden="true" /><p>The work after the words</p><h2>{latest ? <>Pick up where <em>you left off.</em></> : <>Start with a <em>conversation.</em></>}</h2><p className="dashboard-thread-intro__body">{latest ? `Your latest conversation is ${latest.title}. The useful part is already close to the work it set in motion.` : "Capture a conversation, keep the useful decision, and let the next move find its place."}</p></div><button className="dashboard-outline-button" type="button" onClick={() => latest ? onNavigate("conversations") : onCompose("meeting")}>{latest ? "Open conversations" : "Start a conversation"}<Icon name="arrow" size={16} /></button></section>
    <div className="dashboard-thread-line" aria-label="Workspace at a glance"><span><strong>{data.meetings.length}</strong> conversations</span><i /><span><strong>{openCommitments.length}</strong> commitments to keep</span><i /><span><strong>{openTasks.length}</strong> next moves</span></div>
    <div className="dashboard-overview-grid">
      <section className="dashboard-surface dashboard-surface--tasks"><SectionHeading title="Next moves" count={openTasks.length} action="See all tasks" onAction={() => onNavigate("tasks")} />{errors.tasks ? <InlineError message={errors.tasks} /> : openTasks.length === 0 ? <EmptyState title="Nothing is waiting on you." body="Create a task or turn a useful decision into a next move." action="Add a task" onAction={() => onCompose("task")} /> : <div className="dashboard-list">{openTasks.slice(0, 5).map((task) => <TaskRow key={task.id} task={task} onComplete={onTaskComplete} />)}</div>}</section>
      <section className="dashboard-surface"><SectionHeading title="Coming up" count={data.events.length} action="Open calendar" onAction={() => onNavigate("calendar")} />{errors.events ? <InlineError message={errors.events} /> : data.events.length === 0 ? <EmptyState title="Your calendar is quiet." body="Connect Google Calendar when you are ready to bring the next conversation into view." action="Open calendar" onAction={() => onNavigate("calendar")} /> : <div className="dashboard-list">{data.events.slice(0, 4).map((event) => <CalendarRow key={event.id} event={event} />)}</div>}</section>
      <section className="dashboard-surface dashboard-surface--wide"><SectionHeading title="Recent conversations" count={data.meetings.length} action="See all conversations" onAction={() => onNavigate("conversations")} />{errors.meetings ? <InlineError message={errors.meetings} /> : data.meetings.length === 0 ? <EmptyState title="The first conversation belongs here." body="Start with a meeting, voice note, or client call. VOII will keep the useful thread close." action="Start a conversation" onAction={() => onCompose("meeting")} /> : <div className="dashboard-list">{data.meetings.slice(0, 4).map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} />)}</div>}</section>
    </div>
  </div>;
}

function ConversationsView({ meetings, errors, onCompose }: { meetings: Meeting[]; errors: Record<string, string>; onCompose: () => void }) {
  return <section className="dashboard-surface dashboard-surface--full"><SectionHeading title="All conversations" count={meetings.length} action="New conversation" onAction={onCompose} />{errors.meetings ? <InlineError message={errors.meetings} /> : meetings.length === 0 ? <EmptyState title="No conversations yet." body="Start with the conversation that should not disappear between the call and the work." action="Start a conversation" onAction={onCompose} /> : <div className="dashboard-list dashboard-list--roomy">{meetings.map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} detailed />)}</div>}</section>;
}

function KnowledgeView({ meetings, commitments, errors, onCommitmentComplete }: { meetings: Meeting[]; commitments: Commitment[]; errors: Record<string, string>; onCommitmentComplete: (commitment: Commitment) => Promise<void> }) {
  const summaries = meetings.filter((meeting) => meeting.shortSummary);
  return <div className="dashboard-split-view">
    <section className="dashboard-surface">
      <SectionHeading title="Durable knowledge" count={summaries.length} />
      {errors.meetings ? <InlineError message={errors.meetings} /> : summaries.length === 0 ? <EmptyState title="Knowledge follows the conversation." body="Once a conversation has a summary, it will stay connected to the source here." /> : <div className="dashboard-list dashboard-list--roomy">
        {summaries.map((meeting) => <article className="dashboard-knowledge-row" key={meeting.id}>
          <div className="dashboard-row-meta"><StatusMark status={meeting.status} /><span>{sentenceCase(meeting.source || "conversation")}</span><span>{formatDate(meeting.updatedAt || meeting.createdAt)}</span></div>
          <h3>{meeting.title}</h3>
          <p>{meeting.shortSummary}</p>
          <span className="dashboard-source-link">Source conversation attached <Icon name="arrow" size={14} /></span>
        </article>)}
      </div>}
    </section>
    <section className="dashboard-surface">
      <SectionHeading title="Commitments" count={commitments.length} />
      {errors.commitments ? <InlineError message={errors.commitments} /> : commitments.length === 0 ? <EmptyState title="No commitments yet." body="Decisions with an owner and a due date will collect here." /> : <div className="dashboard-list">{commitments.map((commitment) => <CommitmentRow key={commitment.id} commitment={commitment} onComplete={onCommitmentComplete} />)}</div>}
    </section>
  </div>;
}

function TasksView({ tasks, filter, setFilter, errors, onTaskComplete, onCompose }: { tasks: Task[]; filter: "all" | "open" | "done"; setFilter: (value: "all" | "open" | "done") => void; errors: Record<string, string>; onTaskComplete: (task: Task) => Promise<void>; onCompose: () => void }) {
  return <section className="dashboard-surface dashboard-surface--full"><div className="dashboard-section-heading"><div className="dashboard-filter-group" role="tablist" aria-label="Task status filter">{(["all", "open", "done"] as const).map((item) => <button className={filter === item ? "is-active" : ""} key={item} type="button" role="tab" aria-selected={filter === item} onClick={() => setFilter(item)}>{item === "all" ? "All tasks" : item === "open" ? "Open" : "Completed"}</button>)}</div><button className="dashboard-text-button" type="button" onClick={onCompose}>New task <Icon name="plus" size={14} /></button></div>{errors.tasks ? <InlineError message={errors.tasks} /> : tasks.length === 0 ? <EmptyState title={filter === "done" ? "No completed tasks yet." : "Nothing is waiting here."} body="Tasks can come from a conversation or be added directly when the next move is already clear." action="Add a task" onAction={onCompose} /> : <div className="dashboard-list dashboard-list--roomy">{tasks.map((task) => <TaskRow key={task.id} task={task} detailed onComplete={onTaskComplete} />)}</div>}</section>;
}

function ProjectsView({ projects, errors, onCompose }: { projects: Project[]; errors: Record<string, string>; onCompose: () => void }) {
  return <section className="dashboard-surface dashboard-surface--full">
    <SectionHeading title="Projects" count={projects.length} action="New project" onAction={onCompose} />
    {errors.projects ? <InlineError message={errors.projects} /> : projects.length === 0 ? <EmptyState title="Give the work a home." body="Projects keep conversations, tasks, and client work moving in the same direction." action="Create a project" onAction={onCompose} /> : <div className="dashboard-project-list">
      {projects.map((project) => <article className="dashboard-project-row" key={project.id}>
        <span className="dashboard-project-mark" aria-hidden="true" />
        <div><h3>{project.name}</h3><p>{project.description || "A place for the work that follows the conversation."}</p></div>
        <div className="dashboard-project-row__counts"><span>{project.boardCount || 0} boards</span><span>{project.taskCount || 0} tasks</span></div>
      </article>)}
    </div>}
  </section>;
}

function CalendarView({ events, errors, onConnect }: { events: CalendarEvent[]; errors: Record<string, string>; onConnect: () => void }) {
  return <section className="dashboard-surface dashboard-surface--full"><SectionHeading title="Upcoming calendar" count={events.length} action="View integrations" onAction={onConnect} />{errors.events ? <InlineError message={errors.events} /> : events.length === 0 ? <EmptyState title="Your calendar is not connected yet." body="Connect Google Calendar to bring meetings and the VOII bot into the same view. No sync starts until you choose it." action="View integrations" onAction={onConnect} /> : <div className="dashboard-list dashboard-list--roomy">{events.map((event) => <CalendarRow key={event.id} event={event} detailed />)}</div>}</section>;
}

function ClientsView({ clients, errors, onCompose }: { clients: Client[]; errors: Record<string, string>; onCompose: () => void }) {
  const [openClient, setOpenClient] = useState<string | null>(typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("client") : null);
  return <section className="dashboard-surface dashboard-surface--full">
    <SectionHeading title="Clients" count={clients.length} action="Add client" onAction={onCompose} />
    {errors.clients ? <InlineError message={errors.clients} /> : clients.length === 0 ? <EmptyState title="Client work has a place here." body="When you are ready, add a client to connect their conversations, projects, and shared portal." action="Add a client" onAction={onCompose} /> : <div className="dashboard-list dashboard-list--roomy">
      {clients.map((client) => <div key={client.id}><article className="dashboard-client-row">
        <span className="dashboard-avatar dashboard-avatar--client">{initials(client.name, client.companyName)}</span>
        <div><h3>{client.name}</h3><p>{client.companyName || client.contactEmail || "No company details yet"}</p></div>
        <div className="dashboard-client-row__counts"><span>{client.projectCount || 0} projects</span><button className="dashboard-text-button" type="button" onClick={() => setOpenClient(openClient === client.id ? null : client.id)}>{openClient === client.id ? "Close" : "Client link"}</button></div>
      </article>{openClient === client.id ? <PortalPanel clientId={client.id} clientName={client.name} /> : null}</div>)}
    </div>}
  </section>;
}

function TeamView({ members, errors, onCompose }: { members: WorkspaceMember[]; errors: Record<string, string>; onCompose: () => void }) {
  return <section className="dashboard-surface dashboard-surface--full"><SectionHeading title="Workspace members" count={members.length} action="Invite someone" onAction={onCompose} />{errors.members ? <InlineError message={errors.members} /> : members.length === 0 ? <EmptyState title="You are the first person here." body="Invite teammates when shared memory and shared projects become useful." action="Invite someone" onAction={onCompose} /> : <div className="dashboard-list dashboard-list--roomy">{members.map((member) => <article className="dashboard-member-row" key={member.id}><span className="dashboard-avatar">{initials(member.user.fullName, member.user.email)}</span><div><h3>{displayName(member.user.fullName, member.user.email)}</h3><p>{member.user.email}</p></div><span className="dashboard-role">{sentenceCase(member.role)}</span></article>)}</div>}</section>;
}

function SettingsView({ data, onConnectCalendar, onDisconnectCalendar, isConnectingCalendar }: { data: DashboardData; onConnectCalendar: () => Promise<void>; onDisconnectCalendar: () => Promise<void>; isConnectingCalendar: boolean }) {
  const plan = typeof data.subscription?.plan === "string" ? data.subscription.plan : "free";
  const calendar = data.integrations.find((integration) => integration.type === "google_calendar");
  const calendarConnected = calendar?.status === "connected";
  return <div className="dashboard-settings-grid">
    <section className="dashboard-surface">
      <SectionHeading title="Your profile" />
      <div className="dashboard-settings-row"><span>Name and email</span><strong>Managed from your account</strong></div>
      <div className="dashboard-settings-row"><span>Notifications</span><strong>In-app notifications are on</strong></div>
      <p className="dashboard-settings-copy">Profile and password controls stay with your account settings while this workspace keeps the work in view.</p>
    </section>
    <section className="dashboard-surface">
      <SectionHeading title="Workspace plan" />
      <div className="dashboard-plan-line"><span className="dashboard-plan-name">{sentenceCase(plan)}</span><span>Current plan</span></div>
      <p className="dashboard-settings-copy">Every plan includes VOII’s core memory engine. Your conversations stay searchable and connected to the work that follows.</p>
      <Link className="dashboard-outline-button" href="/pricing">Review plans <Icon name="arrow" size={15} /></Link>
    </section>
    <section className="dashboard-surface">
      <SectionHeading title="Integrations" />
      <div className="dashboard-integration-row"><div><h3>Google Calendar</h3><p>{calendarConnected ? calendar?.externalEmail || "Connected" : "Bring meetings into the same view as your work."}</p></div><button className={calendarConnected ? "dashboard-quiet-button" : "dashboard-primary-button"} type="button" onClick={() => void (calendarConnected ? onDisconnectCalendar() : onConnectCalendar())} disabled={isConnectingCalendar}>{isConnectingCalendar ? "Working…" : calendarConnected ? "Disconnect" : "Connect"}</button></div>
    </section>
    <section className="dashboard-surface dashboard-surface--full"><SectionHeading title="Usage" /><UsageSummary usage={data.usage} /></section>
  </div>;
}

function UsageSummary({ usage }: { usage: UsageSummary | null }) {
  if (!usage) return <EmptyState title="Usage is not available." body="We could not read your current usage. Refresh the workspace to try again." />;
  const entries = Object.entries(usage).filter(([, value]) => typeof value === "string" || typeof value === "number").slice(0, 5);
  if (entries.length === 0) return <EmptyState title="Your usage will appear here." body="As you capture conversations and create work, VOII will keep the workspace limits visible." />;
  return <div className="dashboard-usage-list">{entries.map(([key, value]) => <div className="dashboard-usage-row" key={key}><span>{sentenceCase(key)}</span><strong>{String(value)}</strong></div>)}</div>;
}

function MeetingRow({ meeting, detailed = false }: { meeting: Meeting; detailed?: boolean }) {
  return <Link href={`/meetings/${meeting.id}`} className={`dashboard-meeting-row ${detailed ? "dashboard-meeting-row--detailed" : ""}`}>
    <div className="dashboard-row-meta"><StatusMark status={meeting.status} /><span>{sentenceCase(meeting.source || "conversation")}</span><span>{formatDate(meeting.updatedAt || meeting.createdAt)}</span></div>
    <div className="dashboard-meeting-row__main">
      <div><h3>{meeting.title}</h3>{meeting.shortSummary ? <p>{meeting.shortSummary}</p> : <p>{sentenceCase(meeting.status || "Ready to capture")}</p>}</div>
      <div className="dashboard-row-end"><span>{meeting._count?.participants || 0} people</span></div>
    </div>
  </Link>;
}

function TaskRow({ task, detailed = false, onComplete }: { task: Task; detailed?: boolean; onComplete: (task: Task) => Promise<void> }) {
  const done = task.status === "done";
  return <article className={`dashboard-task-row ${detailed ? "dashboard-task-row--detailed" : ""} ${done ? "is-done" : ""}`}><button className="dashboard-task-check" type="button" aria-label={done ? `${task.title} completed` : `Complete ${task.title}`} aria-pressed={done} onClick={() => void onComplete(task)}><span>{done ? "✓" : ""}</span></button><div className="dashboard-task-row__main"><h3>{task.title}</h3><div className="dashboard-row-meta"><span className={`dashboard-priority dashboard-priority--${task.priority || "medium"}`}>{sentenceCase(task.priority || "medium")}</span>{task.dueDate ? <span>Due {formatDate(task.dueDate)}</span> : <span>No due date</span>}{task.assignees?.[0]?.user ? <span>For {displayName(task.assignees[0].user.fullName, task.assignees[0].user.email)}</span> : null}</div></div>{detailed && task.sourceMeetingId ? <span className="dashboard-source-pill">Source linked</span> : null}</article>;
}

function CommitmentRow({ commitment, onComplete }: { commitment: Commitment; onComplete: (commitment: Commitment) => Promise<void> }) {
  const done = commitment.status === "done";
  return <article className={`dashboard-commitment-row ${done ? "is-done" : ""}`}><button className="dashboard-task-check" type="button" aria-label={done ? `${commitment.title} completed` : `Complete ${commitment.title}`} aria-pressed={done} onClick={() => void onComplete(commitment)}><span>{done ? "✓" : ""}</span></button><div><h3>{commitment.title}</h3><div className="dashboard-row-meta"><span>{commitment.project?.name || "Workspace"}</span>{commitment.dueDate ? <span>Due {formatDate(commitment.dueDate)}</span> : null}</div></div></article>;
}

function CalendarRow({ event, detailed = false }: { event: CalendarEvent; detailed?: boolean }) {
  return <article className={`dashboard-calendar-row ${detailed ? "dashboard-calendar-row--detailed" : ""}`}><div className="dashboard-calendar-date"><strong>{new Intl.DateTimeFormat("en-NG", { day: "2-digit" }).format(new Date(event.startAt))}</strong><span>{new Intl.DateTimeFormat("en-NG", { month: "short" }).format(new Date(event.startAt))}</span></div><div><h3>{event.title}</h3><p>{formatTime(event.startAt)}{event.endAt ? ` – ${formatTime(event.endAt)}` : ""}{event.location ? ` · ${event.location}` : ""}</p></div>{event.botEnabled ? <span className="dashboard-source-pill">VOII bot on</span> : null}</article>;
}

function InlineError({ message }: { message: string }) {
  return <div className="dashboard-inline-error" role="status"><span>{message}</span><Icon name="refresh" size={14} /></div>;
}

function NotificationPopover({ notifications, onRead, onReadAll, onClose }: { notifications: Notification[]; onRead: (notification: Notification) => Promise<void>; onReadAll: () => Promise<void>; onClose: () => void }) {
  return <div className="dashboard-notification-popover" role="dialog" aria-label="Notifications"><div className="dashboard-notification-popover__header"><strong>Notifications</strong><button className="dashboard-icon-button" type="button" onClick={onClose} aria-label="Close notifications"><Icon name="close" size={16} /></button></div>{notifications.length === 0 ? <p className="dashboard-notification-empty">Nothing new here.</p> : <div className="dashboard-notification-list">{notifications.map((notification) => <button className={`dashboard-notification-row ${notification.read ? "is-read" : ""}`} key={notification.id} type="button" onClick={() => void onRead(notification)}><span className="dashboard-notification-dot" aria-hidden="true" /><span><strong>{notification.title}</strong><small>{notification.message}</small><time>{formatDate(notification.createdAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time></span></button>)}</div>}<button className="dashboard-notification-popover__footer" type="button" onClick={() => void onReadAll()}>Mark all as read</button></div>;
}

function ComposerPanel({ type, meetings, onClose, onCreated }: { type: Exclude<Composer, null>; meetings: Meeting[]; onClose: () => void; onCreated: (created: { kind: "meeting"; item: Meeting } | { kind: "task"; item: Task } | { kind: "project"; item: Project } | { kind: "client"; item: Client } | { kind: "invite"; email: string }) => void }) {
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
  return <section className="dashboard-composer" aria-label={labels[type]}><div className="dashboard-composer__header"><div><p className="dashboard-location">A small beginning</p><h2>{labels[type]}</h2></div><button className="dashboard-icon-button" type="button" onClick={onClose} aria-label="Close form"><Icon name="close" size={18} /></button></div><form onSubmit={submit}><label><span>{titleLabels[type]}</span><input autoFocus type={type === "invite" ? "email" : "text"} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={type === "meeting" ? "Client kickoff" : type === "task" ? "Prepare the first draft" : type === "project" ? "Northstar launch" : type === "client" ? "Northstar team" : "teammate@example.com"} /></label>{type !== "invite" ? <label><span>{type === "client" ? "Company" : "Description"} <small>Optional</small></span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder={type === "client" ? "Northstar Studio" : "What should stay close to this work?"} rows={3} /></label> : null}{type === "client" ? <label><span>Contact email <small>Optional</small></span><input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="hello@northstar.studio" /></label> : null}{type === "invite" ? <label><span>Workspace role</span><select value={role} onChange={(event) => setRole(event.target.value as typeof role)}><option value="MEMBER">Member</option><option value="ADMIN">Admin</option></select></label> : null}{type === "task" ? <div className="dashboard-form-grid"><label><span>Due date <small>Optional</small></span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label><label><span>Priority</span><select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label></div> : null}{type === "task" && meetings.length > 0 ? <label><span>Source conversation <small>Optional</small></span><select value={sourceMeetingId} onChange={(event) => setSourceMeetingId(event.target.value)}><option value="">Keep this independent</option>{meetings.slice(0, 12).map((meeting) => <option key={meeting.id} value={meeting.id}>{meeting.title}</option>)}</select></label> : null}{formError ? <p className="dashboard-form-error" role="alert">{formError}</p> : null}<div className="dashboard-composer__actions"><button className="dashboard-quiet-button" type="button" onClick={onClose}>Cancel</button><button className="dashboard-primary-button" type="submit" disabled={isSaving}>{isSaving ? "Saving…" : type === "meeting" ? "Create conversation" : type === "task" ? "Add task" : type === "project" ? "Create project" : type === "client" ? "Add client" : "Send invite"}<Icon name="arrow" size={15} /></button></div></form></section>;
}
