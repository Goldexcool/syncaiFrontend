"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import AuthGate from "@/components/AuthGate";
import { useAuth } from "@/components/AuthProvider";
import { Logo } from "@/components/SiteHeader";
import { NotificationPopover } from "@/components/app/parts";
import { Icon, displayName, initials, type IconName } from "@/components/app/kit";
import { getUsageInfo, listMeetingsFull, type MeetingDetail, type UsageInfo } from "@/lib/api/app";
import { getUnreadNotificationCount, listNotifications, listProjects, markAllNotificationsRead, markNotificationRead, type Notification, type Project } from "@/lib/api/dashboard";

/** The flow's navigation: one place per job, in the order the work happens. */
const NAV: Array<{ href: string; label: string; icon: IconName; match: (p: string) => boolean }> = [
  { href: "/dashboard", label: "Dashboard", icon: "home", match: (p) => p === "/dashboard" },
  { href: "/meetings", label: "Meetings", icon: "conversation", match: (p) => p.startsWith("/meetings") },
  { href: "/projects", label: "Projects & boards", icon: "board", match: (p) => p.startsWith("/projects") || p.startsWith("/board") || p.startsWith("/tasks") },
  { href: "/clients", label: "Client Workspace", icon: "globe", match: (p) => p.startsWith("/clients") },
  { href: "/ai", label: "AI Assistant", icon: "sparkles", match: (p) => p.startsWith("/ai") },
  { href: "/inbox", label: "Inbox", icon: "inbox", match: (p) => p.startsWith("/inbox") },
];

export default function AppShell({ crumbs, children, full = false }: { crumbs: string[]; children: ReactNode; full?: boolean }) {
  return <AuthGate><Shell crumbs={crumbs} full={full}>{children}</Shell></AuthGate>;
}

function Shell({ crumbs, children, full }: { crumbs: string[]; children: ReactNode; full: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, workspace, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [meetings, setMeetings] = useState<MeetingDetail[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    listMeetingsFull().then((r) => setMeetings(r.meetings)).catch(() => undefined);
    listProjects(6).then((r) => setProjects(r.projects ?? [])).catch(() => undefined);
    getUsageInfo().then(setUsage).catch(() => undefined);
    getUnreadNotificationCount().then((r) => setUnread(r.count ?? 0)).catch(() => undefined);
    listNotifications(8).then((r) => setNotifications(r.notifications ?? [])).catch(() => undefined);
  }, []);

  // ⌘K / Ctrl+K opens search · ask AI from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen((v) => !v); }
      if (e.key === "Escape") { setPaletteOpen(false); setNotifOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { setNavOpen(false); setPaletteOpen(false); }, [pathname]);

  const reviewCount = meetings.filter((m) => m.status === "pending_review").length;
  const meetingsPct = usage?.percentages.meetingsPerMonth;

  async function readNotification(n: Notification) {
    const href = n.data?.href;
    if (!n.read) {
      setUnread((c) => Math.max(0, c - 1));
      setNotifications((all) => all.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      markNotificationRead(n.id).catch(() => undefined);
    }
    if (href?.startsWith("/")) router.push(href);
  }

  return <div className="dashboard-page" id="main-content">
    <div className={`dashboard-shell ${navOpen ? "dashboard-shell--nav-open" : ""}`}>
      <aside className="dashboard-sidebar" aria-label="Workspace navigation">
        <div className="dashboard-sidebar__top">
          <Link href="/dashboard" aria-label="VOII home"><Logo /></Link>
          <button className="dashboard-mobile-close" type="button" onClick={() => setNavOpen(false)} aria-label="Close navigation"><Icon name="close" /></button>
        </div>
        <button className="shell-search" type="button" onClick={() => setPaletteOpen(true)}><Icon name="search" size={15} /><span>Search · Ask AI</span><kbd>⌘K</kbd></button>
        <Link className="dashboard-primary-button shell-new" href="/meetings/new"><Icon name="plus" size={15} />New meeting</Link>

        <nav className="dashboard-nav" aria-label="Primary">
          <p className="dashboard-nav__label">Workspace</p>
          {NAV.map((item) => <Link key={item.href} href={item.href} className={`dashboard-nav-item ${item.match(pathname) ? "is-active" : ""}`} aria-current={item.match(pathname) ? "page" : undefined}>
            <Icon name={item.icon} size={17} /><span>{item.label}</span>
            {item.href === "/meetings" && reviewCount ? <span className="shell-count shell-count--peach" title="Ready for review">{reviewCount}</span> : null}
            {item.href === "/inbox" && unread ? <span className="shell-count">{unread}</span> : null}
          </Link>)}

          {projects.length ? <>
            <p className="dashboard-nav__label dashboard-nav__label--spaced">Projects</p>
            {projects.slice(0, 5).map((p) => <Link key={p.id} href={`/board?project=${p.id}`} className="dashboard-nav-item shell-sub"><span className="shell-swatch" /><span className="truncate">{p.name}</span></Link>)}
          </> : null}

          {meetings.length ? <>
            <p className="dashboard-nav__label dashboard-nav__label--spaced">Recent meetings</p>
            {meetings.slice(0, 3).map((m) => <Link key={m.id} href={`/meetings/${m.id}`} className="dashboard-nav-item shell-sub"><span className={`shell-dot ${m.status === "pending_review" ? "is-review" : ""}`} /><span className="truncate">{m.title}</span></Link>)}
          </> : null}
        </nav>

        <div className="dashboard-sidebar__bottom">
          <Link className={`dashboard-nav-item ${pathname.startsWith("/settings") ? "is-active" : ""}`} href="/settings"><Icon name="settings" size={17} /><span>Settings</span></Link>
          {usage && usage.limits.meetingsPerMonth > 0 && usage.limits.meetingsPerMonth < 1e6 ? <div className="shell-usage">
            <div><span>Meetings this month</span><strong>{usage.usage.meetingsCreated} / {usage.limits.meetingsPerMonth}</strong></div>
            <div className="progress"><span style={{ width: `${Math.min(100, meetingsPct ?? 0)}%` }} /></div>
          </div> : null}
          <div className="dashboard-sidebar__footer"><span className="dashboard-avatar">{initials(user?.fullName, user?.email)}</span><span className="min-w-0"><strong>{displayName(user?.fullName, user?.email)}</strong><small>{workspace?.name ?? user?.email}</small></span><button className="dashboard-icon-button" type="button" onClick={async () => { await logout(); window.location.assign("/signin"); }} aria-label="Sign out"><Icon name="external" size={15} /></button></div>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <button className="dashboard-mobile-menu" type="button" onClick={() => setNavOpen(true)} aria-label="Open navigation"><span /><span /><span /></button>
          <nav className="shell-crumbs" aria-label="Breadcrumb">{crumbs.map((c, i) => <span key={i} className={i === crumbs.length - 1 ? "is-current" : ""}>{i > 0 ? <span className="shell-crumbs__sep" aria-hidden="true">/</span> : null}{c}</span>)}</nav>
          <div className="dashboard-topbar__actions">
            <button className="dashboard-icon-button dashboard-notification-button" type="button" aria-expanded={notifOpen} aria-label={unread ? `${unread} unread notifications` : "Notifications"} onClick={() => setNotifOpen((v) => !v)}><Icon name="bell" size={18} />{unread ? <span>{unread > 9 ? "9+" : unread}</span> : null}</button>
            <button className="dashboard-icon-button" type="button" aria-label="Ask VOII AI" onClick={() => setPaletteOpen(true)}><Icon name="sparkles" size={18} /></button>
          </div>
          {notifOpen ? <NotificationPopover notifications={notifications} onRead={readNotification} onReadAll={async () => { await markAllNotificationsRead().catch(() => undefined); setUnread(0); setNotifications((a) => a.map((n) => ({ ...n, read: true }))); }} onClose={() => setNotifOpen(false)} /> : null}
        </header>
        <main className={full ? "shell-content shell-content--full" : "dashboard-content"}>{children}</main>
      </div>
    </div>
    {paletteOpen ? <CommandPalette meetings={meetings} onClose={() => setPaletteOpen(false)} /> : null}
  </div>;
}

/** ⌘K: jump anywhere, or hand the question to the AI assistant. */
function CommandPalette({ meetings, onClose }: { meetings: MeetingDetail[]; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const go = useCallback((href: string) => { router.push(href); onClose(); }, [router, onClose]);

  const groups = useMemo(() => {
    const all: Array<{ label: string; items: Array<{ icon: IconName; title: string; sub?: string; href: string }> }> = [
      { label: "Ask VOII AI", items: q ? [{ icon: "sparkles", title: q, sub: "Send to the AI assistant", href: `/ai?q=${encodeURIComponent(q)}` }] : [{ icon: "sparkles", title: "What needs my review?", href: "/ai?q=" + encodeURIComponent("What needs my review?") }] },
      { label: "Navigate", items: NAV.map((n) => ({ icon: n.icon, title: n.label, href: n.href })).concat([{ icon: "check", title: "Tasks", href: "/tasks" }, { icon: "settings", title: "Settings", href: "/settings" }]) },
      { label: "Quick actions", items: [{ icon: "plus", title: "New meeting", href: "/meetings/new" }, { icon: "upload", title: "Upload a recording", href: "/meetings/new?method=upload" }, { icon: "link", title: "Send the notetaker to a call", href: "/meetings/new?method=link" }] },
      { label: "Meetings", items: meetings.map((m) => ({ icon: "conversation" as IconName, title: m.title, sub: m.course?.name, href: `/meetings/${m.id}` })) },
    ];
    if (!q) return all.map((g) => (g.label === "Meetings" ? { ...g, items: g.items.slice(0, 4) } : g));
    const needle = q.toLowerCase();
    return all.map((g) => (g.label === "Ask VOII AI" ? g : { ...g, items: g.items.filter((i) => i.title.toLowerCase().includes(needle)) })).filter((g) => g.items.length);
  }, [q, meetings]);

  const first = groups[0]?.items[0];

  return <>
    <div className="kb__scrim" onClick={onClose} aria-hidden="true" />
    <div className="palette" role="dialog" aria-modal="true" aria-label="Search or ask AI">
      <div className="palette__input"><Icon name="sparkles" size={17} /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && first && go(first.href)} placeholder="Search or ask VOII anything…" aria-label="Search or ask" /><kbd>Esc</kbd></div>
      <div className="palette__list">
        {groups.map((g) => <div key={g.label}>
          <p className="palette__label">{g.label}</p>
          {g.items.map((it, i) => <button key={g.label + i} type="button" className="palette__item" onClick={() => go(it.href)}><Icon name={it.icon} size={16} /><span><strong>{it.title}</strong>{it.sub ? <small>{it.sub}</small> : null}</span></button>)}
        </div>)}
      </div>
    </div>
  </>;
}
