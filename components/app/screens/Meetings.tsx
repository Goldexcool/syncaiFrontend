"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/app/AppShell";
import { formatClock } from "@/components/app/Notes";
import { EmptyState, Icon, formatDate, formatTime } from "@/components/app/kit";
import { listMeetingsFull, type MeetingDetail } from "@/lib/api/app";

const FILTERS = [
  { id: "all", label: "All", test: () => true },
  { id: "review", label: "Ready for review", test: (m: MeetingDetail) => m.status === "pending_review" },
  { id: "processing", label: "Processing", test: (m: MeetingDetail) => ["uploaded", "queued", "processing", "transcribing", "summarizing", "extracting_action_items"].includes(m.status ?? "") },
  { id: "complete", label: "Complete", test: (m: MeetingDetail) => ["tasks_created", "completed"].includes(m.status ?? "") },
  { id: "lectures", label: "Lectures", test: (m: MeetingDetail) => m.kind === "lecture" },
] as const;

export const STATUS: Record<string, { label: string; tone: string }> = {
  draft: { label: "Waiting for recording", tone: "" },
  scheduled: { label: "Scheduled", tone: "" },
  ready_for_upload: { label: "Waiting for recording", tone: "" },
  uploaded: { label: "Processing", tone: "info" },
  queued: { label: "Processing", tone: "info" },
  processing: { label: "Processing", tone: "info" },
  transcribing: { label: "Transcribing", tone: "info" },
  summarizing: { label: "Summarising", tone: "info" },
  extracting_action_items: { label: "Finding tasks", tone: "info" },
  pending_review: { label: "Ready for review", tone: "peach" },
  tasks_created: { label: "Complete", tone: "sage" },
  completed: { label: "Complete", tone: "sage" },
  failed: { label: "Failed", tone: "clay" },
};

export function StatusChip({ status }: { status?: string | null }) {
  const s = STATUS[status ?? ""] ?? { label: status ?? "—", tone: "" };
  return <span className={`chip ${s.tone ? `chip--${s.tone}` : ""}`}>{s.label}</span>;
}

export default function Meetings() {
  return <AppShell crumbs={["Meetings"]}><MeetingsBody /></AppShell>;
}

function MeetingsBody() {
  const [meetings, setMeetings] = useState<MeetingDetail[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [q, setQ] = useState("");
  useEffect(() => { listMeetingsFull().then((r) => setMeetings(r.meetings)).catch(() => setMeetings([])); }, []);

  const f = FILTERS.find((x) => x.id === filter)!;
  const shown = (meetings ?? []).filter((m) => f.test(m) && (!q || m.title.toLowerCase().includes(q.toLowerCase())));

  return <>
    <header className="dashboard-content__header">
      <div><p className="dashboard-location">Meetings</p><h1>Every conversation.</h1><p className="dashboard-intro">{meetings ? `${meetings.length} in this workspace.` : "Loading…"}</p></div>
      <div className="dashboard-content__actions"><Link className="dashboard-primary-button" href="/meetings/new"><Icon name="plus" size={15} />New meeting</Link></div>
    </header>
    <div className="list-toolbar">
      <div className="seg" role="tablist" aria-label="Filter meetings">
        {FILTERS.map((x) => <button key={x.id} role="tab" aria-selected={filter === x.id} className={filter === x.id ? "is-active" : ""} onClick={() => setFilter(x.id)}>{x.label}{x.id !== "all" && meetings ? <span>{meetings.filter(x.test).length}</span> : null}</button>)}
      </div>
      <label className="kb__search"><span aria-hidden="true">⌕</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search meetings" aria-label="Search meetings" /></label>
    </div>
    <section className="dashboard-surface">
      {meetings === null ? <p className="app-muted">Loading…</p> : shown.length === 0 ? <EmptyState title="Nothing here yet." body="Upload a recording or send the notetaker to a call." action="New meeting" onAction={() => (window.location.href = "/meetings/new")} />
        : <div className="mlist">
          <div className="mlist__head" aria-hidden="true"><span>Meeting</span><span>Status</span><span>Length</span><span>Date</span></div>
          {shown.map((m) => <Link key={m.id} href={`/meetings/${m.id}${m.status === "pending_review" ? "?tab=action-items" : ""}`} className="mlist__row">
            <span className="mtable__title"><Icon name={m.source === "meeting_link" ? "bot" : m.kind === "lecture" ? "mic" : "upload"} size={15} /><span className="dash-row__main"><strong className="truncate">{m.title}</strong>{m.course ? <small>{m.course.code ? `${m.course.code} · ` : ""}{m.course.name}</small> : m.shortSummary ? <small className="truncate">{m.shortSummary}</small> : null}</span></span>
            <span><StatusChip status={m.status} /></span>
            <span className="mono app-muted">{m.durationSec ? formatClock(m.durationSec) : "—"}</span>
            <span className="app-muted">{formatDate(m.createdAt)}<small className="mlist__time">{formatTime(m.createdAt)}</small></span>
          </Link>)}
        </div>}
    </section>
  </>;
}
