"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import AppShell from "@/components/app/AppShell";
import { formatClock } from "@/components/app/Notes";
import { EmptyState, Icon, SectionHeading, displayName, formatDate, formatTime, useWords } from "@/components/app/kit";
import { listActionItems, listMeetingsFull, type ActionItem, type MeetingDetail } from "@/lib/api/app";
import { listCalendarEvents, listTasks, updateTask, type CalendarEvent, type Task } from "@/lib/api/dashboard";

const WORKING = new Set(["uploaded", "queued", "processing", "transcribing", "summarizing", "extracting_action_items", "scheduled"]);

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function Dashboard() {
  return <AppShell crumbs={["Home"]}><DashboardBody /></AppShell>;
}

function DashboardBody() {
  const { user } = useAuth();
  const words = useWords();
  const [meetings, setMeetings] = useState<MeetingDetail[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [pendingByMeeting, setPendingByMeeting] = useState<Record<string, ActionItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([listMeetingsFull(), listTasks(100), listCalendarEvents(6)]).then(async ([m, t, e]) => {
      const ms = m.status === "fulfilled" ? m.value.meetings : [];
      setMeetings(ms);
      if (t.status === "fulfilled") setTasks(t.value.tasks ?? []);
      if (e.status === "fulfilled") setEvents(e.value.events ?? []);
      setLoading(false);
      // Suggested items for the meetings waiting on a person.
      const review = ms.filter((x) => x.status === "pending_review").slice(0, 3);
      const lists = await Promise.allSettled(review.map((x) => listActionItems(x.id)));
      setPendingByMeeting(Object.fromEntries(review.map((x, i) => [x.id, lists[i].status === "fulfilled" ? (lists[i] as PromiseFulfilledResult<{ actionItems: ActionItem[] }>).value.actionItems.filter((a) => a.status === "pending_review") : []])));
    });
  }, []);

  const review = meetings.filter((m) => m.status === "pending_review");
  const working = meetings.filter((m) => WORKING.has(m.status ?? ""));
  const recent = meetings.filter((m) => !WORKING.has(m.status ?? "") && m.status !== "draft").slice(0, 6);
  const pendingCount = Object.values(pendingByMeeting).reduce((n, l) => n + l.length, 0);
  const openTasks = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  async function complete(t: Task) {
    setTasks((all) => all.map((x) => (x.id === t.id ? { ...x, status: "done" } : x)));
    updateTask(t.id, { status: "done" }).catch(() => setTasks((all) => all.map((x) => (x.id === t.id ? { ...x, status: t.status } : x))));
  }

  return <>
    <header className="dashboard-content__header">
      <div>
        <h1>{greeting()}, {displayName(user?.fullName, user?.email).split(" ")[0]}.</h1>
        <p className="dashboard-intro">{review.length
          ? <><strong>{pendingCount || "New"} suggested task{pendingCount === 1 ? "" : "s"}</strong> from {review.length} {words.meeting}{review.length === 1 ? "" : "s"} need{pendingCount === 1 ? "s" : ""} review.</>
          : "Nothing needs you right now."}</p>
      </div>
      <div className="dashboard-content__actions">
        <Link className="dashboard-primary-button" href="/meetings/new"><Icon name="plus" size={15} />New {words.meeting}</Link>
      </div>
    </header>

    {loading ? <p className="app-muted">Loading…</p> : <div className="dash-grid">
      <div className="dash-col">
        {review.map((m) => <ReviewCard key={m.id} meeting={m} items={pendingByMeeting[m.id]} />)}

        {working.length ? <section className="dashboard-surface">
          <SectionHeading title="In progress" count={working.length} />
          <div className="dash-rows">
            {working.map((m) => <Link key={m.id} href={`/meetings/${m.id}`} className="dash-row">
              <span className="dash-row__icon"><Icon name={m.status === "scheduled" ? "calendar" : "sparkles"} size={16} /></span>
              <span className="dash-row__main"><strong className="truncate">{m.title}</strong><small>{m.status === "scheduled" ? "Notetaker will join" : <><span className="live-dot" />Processing · {m.status?.replaceAll("_", " ")}</>}</small></span>
              <span className="dashboard-text-button">Open</span>
            </Link>)}
          </div>
        </section> : null}

        <section className="dashboard-surface">
          <SectionHeading title={`Recent ${words.meeting}s`} action="View all" onAction={() => (window.location.href = "/meetings")} />
          {recent.length === 0 ? <EmptyState title={`No ${words.meeting}s yet.`} body="Upload a recording or send the notetaker to a call." action={`New ${words.meeting}`} onAction={() => (window.location.href = "/meetings/new")} />
            : <MeetingTable meetings={recent} />}
        </section>
      </div>

      <div className="dash-col">
        <section className="dashboard-surface">
          <SectionHeading title="Your tasks" action="View all" onAction={() => (window.location.href = "/tasks")} />
          {openTasks.length === 0 ? <p className="app-muted">No open tasks.</p> : <div className="dash-rows">
            {openTasks.slice(0, 6).map((t) => <div key={t.id} className="dash-task">
              <button className="dashboard-task-check" type="button" aria-label={`Complete ${t.title}`} onClick={() => void complete(t)}><span /></button>
              <span className="dash-row__main"><strong className="truncate">{t.title}</strong>{t.sourceMeetingId ? <Link href={`/meetings/${t.sourceMeetingId}`} className="dash-sub-link"><Icon name="conversation" size={12} /> From a meeting</Link> : null}</span>
              <span className={`prio prio--${t.priority ?? "medium"}`}>{t.priority ?? "medium"}</span>
            </div>)}
          </div>}
        </section>

        {events.length ? <section className="dashboard-surface">
          <SectionHeading title="Upcoming" action="Calendar" onAction={() => (window.location.href = "/meetings/new?method=calendar")} />
          <div className="dash-rows">
            {events.slice(0, 4).map((ev) => <div key={ev.id} className="dash-event">
              <span className="dash-event__date"><small>{formatDate(ev.startAt, { month: "short" })}</small><strong>{new Date(ev.startAt).getDate()}</strong></span>
              <span className="dash-row__main"><strong className="truncate">{ev.title}</strong><small>{formatTime(ev.startAt)}{ev.attendeeCount ? ` · ${ev.attendeeCount} attending` : ""}</small></span>
              {ev.botEnabled ? <span className="chip chip--peach"><Icon name="bot" size={12} /> Notetaker</span> : null}
            </div>)}
          </div>
        </section> : null}

      </div>
    </div>}
  </>;
}

function ReviewCard({ meeting, items }: { meeting: MeetingDetail; items?: ActionItem[] }) {
  return <article className="review-card">
    <header>
      <span className="chip chip--peach"><Icon name="sparkles" size={12} /> Needs review</span>
      <span className="app-muted">{formatDate(meeting.updatedAt ?? meeting.createdAt)}</span>
      {meeting.durationSec ? <span className="mono app-muted">{formatClock(meeting.durationSec)}</span> : null}
    </header>
    <h3>{meeting.title}</h3>
    {meeting.shortSummary ? <p>{meeting.shortSummary}</p> : null}
    {items?.length ? <>
      <p className="review-card__label">{items.length} suggested task{items.length === 1 ? "" : "s"}</p>
      <ul>{items.slice(0, 3).map((a) => <li key={a.id}><span className="review-card__box" />{a.title}{a.ownerName ? <small>{a.ownerName}</small> : null}</li>)}</ul>
      {items.length > 3 ? <p className="app-muted">+ {items.length - 3} more</p> : null}
    </> : null}
    <footer>
      <Link className="dashboard-quiet-button" href={`/meetings/${meeting.id}`}>Open notes</Link>
      <Link className="dashboard-primary-button" href={`/meetings/${meeting.id}?tab=tasks`}>Review tasks <Icon name="arrow" size={14} /></Link>
    </footer>
  </article>;
}

export function MeetingTable({ meetings }: { meetings: MeetingDetail[] }) {
  return <div className="mtable" role="table">
    {meetings.map((m) => <Link key={m.id} href={`/meetings/${m.id}`} className="mtable__row" role="row">
      <span className="mtable__title" role="cell"><Icon name={m.source === "meeting_link" ? "bot" : m.kind === "lecture" ? "mic" : "upload"} size={15} /><strong className="truncate">{m.title}</strong>{m.kind === "lecture" ? <span className="chip">Lecture</span> : null}</span>
      <span className="mono app-muted" role="cell">{m.durationSec ? formatClock(m.durationSec) : "—"}</span>
      <span className="app-muted" role="cell">{formatDate(m.createdAt)}</span>
    </Link>)}
  </div>;
}
