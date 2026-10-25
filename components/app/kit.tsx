"use client";

import { ApiRequestError } from "@/lib/api/client";

/* Shared building blocks for the signed-in app (VOII "Dusk" look). */

export type IconName = "home" | "conversation" | "knowledge" | "check" | "project" | "calendar" | "clients" | "team" | "settings" | "search" | "bell" | "plus" | "arrow" | "close" | "refresh" | "external" | "sparkles" | "inbox" | "upload" | "link" | "bot" | "globe" | "share" | "download" | "mic" | "menu" | "board";

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
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
    sparkles: <><path d="M12 3l1.9 4.9L19 10l-5.1 2.1L12 17l-1.9-4.9L5 10l5.1-2.1z" /><path d="M18.5 15.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z" /></>,
    inbox: <><path d="M3.5 13h4.5l1.5 3h5l1.5-3h4.5v5.5a1.5 1.5 0 0 1-1.5 1.5h-14a1.5 1.5 0 0 1-1.5-1.5z" /><path d="M5.5 4.5h13l2 8.5h-4.5l-1.5 3h-5l-1.5-3h-4.5z" /></>,
    upload: <><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" /><path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" /></>,
    link: <><path d="M10 14l4-4" /><path d="M13.5 8l1.5-1.5a3.5 3.5 0 0 1 5 5L18.5 13M10.5 16 9 17.5a3.5 3.5 0 0 1-5-5L5.5 11" /></>,
    bot: <><rect x="4.5" y="7.5" width="15" height="12" rx="3" /><path d="M12 7.5V4M9.5 4h5M9 13h.01M15 13h.01M2.5 13v3M21.5 13v3" /></>,
    globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.3 2.6 3.5 5.5 3.5 8.5s-1.2 5.9-3.5 8.5c-2.3-2.6-3.5-5.5-3.5-8.5s1.2-5.9 3.5-8.5z" /></>,
    share: <><circle cx="6" cy="12" r="2.3" /><circle cx="18" cy="6" r="2.3" /><circle cx="18" cy="18" r="2.3" /><path d="m8 11 8-4M8 13l8 4" /></>,
    download: <><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" /><path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" /></>,
    mic: <><rect x="9" y="3.5" width="6" height="11" rx="3" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    board: <><rect x="3.5" y="4.5" width="5" height="15" rx="1.5" /><rect x="10" y="4.5" width="5" height="10" rx="1.5" /><rect x="16.5" y="4.5" width="4" height="7" rx="1.5" /></>,
  };

  return <svg aria-hidden="true" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 24 24" width={size}>{paths[name]}</svg>;
}


export function displayName(fullName?: string | null, email?: string | null) {
  return fullName?.trim() || email?.split("@")[0] || "there";
}

export function initials(name?: string | null, email?: string | null) {
  const source = displayName(name, email);
  return source.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function formatDate(value?: string | null, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  if (!value) return "No date";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No date" : new Intl.DateTimeFormat("en-NG", options).format(date);
}

export function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit" }).format(date);
}

export function sentenceCase(value?: string | null) {
  if (!value) return "Not started";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getErrorMessage(error: unknown) {
  return error instanceof ApiRequestError ? error.message : "We couldn’t load this part of your workspace.";
}

export function StatusMark({ status }: { status?: string | null }) {
  const normalized = status?.toLowerCase();
  return <span className={`dashboard-status-mark dashboard-status-mark--${normalized === "done" || normalized === "completed" ? "done" : normalized === "failed" || normalized === "overdue" ? "attention" : "quiet"}`} aria-hidden="true" />;
}

export function EmptyState({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
  return <div className="dashboard-empty-state">
    <span className="dashboard-empty-state__line" aria-hidden="true" />
    <h3>{title}</h3>
    <p>{body}</p>
    {action && onAction ? <button className="dashboard-text-button" type="button" onClick={onAction}>{action}<Icon name="arrow" size={15} /></button> : null}
  </div>;
}

export function SectionHeading({ title, count, action, onAction }: { title: string; count?: number; action?: string; onAction?: () => void }) {
  return <div className="dashboard-section-heading">
    <div className="flex items-baseline gap-3"><h2>{title}</h2>{count !== undefined ? <span className="dashboard-count">{count}</span> : null}</div>
    {action && onAction ? <button className="dashboard-text-button" type="button" onClick={onAction}>{action}<Icon name="arrow" size={14} /></button> : null}
  </div>;
}

export function DataLoading({ rows = 3 }: { rows?: number }) {
  void rows;
  return <div className="dashboard-loading-state" aria-label="Loading your workspace" role="status"><span className="dashboard-loading-state__mark" aria-hidden="true" /><p>Bringing your workspace together.</p></div>;
}

