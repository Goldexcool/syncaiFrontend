"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import AppShell from "@/components/app/AppShell";
import { formatClock } from "@/components/app/Notes";
import { Icon, displayName, formatDate, formatTime, type IconName } from "@/components/app/kit";
import { ApiRequestError } from "@/lib/api/client";
import { createCourse, createMeetingFull, listCourses, scheduleBot, sendBot, setEventBot, uploadRecording, type Course, type MeetingKind } from "@/lib/api/app";
import { listCalendarEvents, type CalendarEvent } from "@/lib/api/dashboard";

type Method = "upload" | "link" | "calendar";
const msg = (e: unknown) => (e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Something went wrong.");

function providerFor(url: string): "google_meet" | "zoom" | "teams" | undefined {
  if (/meet\.google\./.test(url)) return "google_meet";
  if (/zoom\.(us|com)/.test(url)) return "zoom";
  if (/teams\.(microsoft|live)\./.test(url)) return "teams";
  return undefined;
}
const PROVIDER_LABEL = { google_meet: "Google Meet", zoom: "Zoom", teams: "Microsoft Teams" } as const;

export default function NewMeeting() {
  return <AppShell crumbs={["Meetings", "New meeting"]}><NewMeetingBody /></AppShell>;
}

function NewMeetingBody() {
  const router = useRouter();
  const { user } = useAuth();
  const [method, setMethod] = useState<Method>("upload");
  const [kind, setKind] = useState<MeetingKind>("meeting");
  const [title, setTitle] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [newCourse, setNewCourse] = useState({ name: "", code: "", keyterms: "" });
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [timing, setTiming] = useState<"now" | "later">("now");
  const [joinAt, setJoinAt] = useState("");
  const [botName, setBotName] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("method");
    if (m === "upload" || m === "link" || m === "calendar") setMethod(m);
    listCourses().then((r) => { setCourses(r.courses); setCourseId(r.courses[0]?.id ?? "new"); }).catch(() => setCourseId("new"));
  }, []);
  useEffect(() => { setBotName(`VOII Notetaker (for ${displayName(user?.fullName, user?.email).split(" ")[0]})`); }, [user]);

  const provider = providerFor(link.trim());

  async function resolveCourse() {
    if (kind !== "lecture") return undefined;
    if (courseId !== "new") return courseId;
    if (!newCourse.name.trim()) return undefined;
    return (await createCourse({ name: newCourse.name.trim(), code: newCourse.code.trim() || undefined, keyterms: newCourse.keyterms.split(",").map((k) => k.trim()).filter(Boolean) })).course.id;
  }

  async function submit() {
    setError("");
    try {
      if (method === "upload") {
        if (!file) return setError("Choose a recording first.");
        setBusy("Creating…");
        const { meeting } = await createMeetingFull({ title: title.trim() || file.name.replace(/\.[^.]+$/, ""), kind, courseId: await resolveCourse(), source: "upload", provider: "upload" });
        await uploadRecording(meeting.id, file, file.name, (f) => setBusy(`Uploading… ${Math.round(f * 100)}%`));
        router.push(`/meetings/${meeting.id}`);
      } else if (method === "link") {
        if (!provider) return setError("Paste a Google Meet, Zoom or Teams link.");
        if (!consent) return setError("Confirm everyone on the call knows it’s being recorded.");
        if (timing === "later" && !joinAt) return setError("Pick when the notetaker should join.");
        setBusy("Sending the notetaker…");
        const { meeting } = await createMeetingFull({ title: title.trim() || `${PROVIDER_LABEL[provider]} call`, kind: "meeting", source: "meeting_link", provider, meetingUrl: link.trim() });
        if (timing === "now") await sendBot(meeting.id, botName.trim() || "VOII Notetaker");
        else await scheduleBot(meeting.id, new Date(joinAt).toISOString(), botName.trim() || "VOII Notetaker");
        router.push(`/meetings/${meeting.id}`);
      }
    } catch (e) { setError(msg(e)); setBusy(""); }
  }

  const tiles: Array<{ id: Method; icon: IconName; title: string; sub: string }> = [
    { id: "upload", icon: "upload", title: "Upload recording", sub: "MP3, M4A, WAV, MP4 or WebM — or record here" },
    { id: "link", icon: "link", title: "Paste meeting link", sub: "Send the VOII notetaker to Meet, Zoom or Teams" },
    { id: "calendar", icon: "calendar", title: "From calendar", sub: "Have it join events from Google Calendar" },
  ];

  return <div className="flow-wide">
    <header className="dashboard-content__header">
      <div><p className="dashboard-location">New meeting</p><h1>Capture a conversation.</h1><p className="dashboard-intro">From a file, a live call, or your calendar. VOII writes it up and suggests the tasks.</p></div>
      <div className="dashboard-content__actions"><button className="dashboard-quiet-button" type="button" onClick={() => router.push("/dashboard")}>Cancel</button></div>
    </header>

    <div className="flow-split"><div className="flow-split__main">
    <div className="method-tiles" role="radiogroup" aria-label="How to capture">
      {tiles.map((t) => <button key={t.id} type="button" role="radio" aria-checked={method === t.id} className={`method-tile ${method === t.id ? "is-active" : ""}`} onClick={() => setMethod(t.id)}>
        <span className="method-tile__icon"><Icon name={t.icon} size={18} /></span>
        <strong>{t.title}</strong><small>{t.sub}</small>
      </button>)}
    </div>

    {method === "upload" ? <section className="dashboard-surface flow-form">
      <Dropzone file={file} onFile={setFile} />
      <div className="seg-toggle" role="radiogroup" aria-label="Kind">
        <button type="button" role="radio" aria-checked={kind === "meeting"} className={kind === "meeting" ? "is-active" : ""} onClick={() => setKind("meeting")}>Meeting or client call</button>
        <button type="button" role="radio" aria-checked={kind === "lecture"} className={kind === "lecture" ? "is-active" : ""} onClick={() => setKind("lecture")}>Lecture</button>
      </div>
      <label className="field"><span>Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "lecture" ? "Week 6 — Quadratics" : "Northstar weekly sync"} /></label>
      {kind === "lecture" ? <>
        <label className="field"><span>Course</span>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.code ? `${c.code} — ` : ""}{c.name}</option>)}
            <option value="new">+ New course</option>
          </select>
        </label>
        {courseId === "new" ? <div className="field-grid">
          <label className="field"><span>Course name</span><input value={newCourse.name} onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })} placeholder="Calculus I" /></label>
          <label className="field"><span>Code <small>Optional</small></span><input value={newCourse.code} onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })} placeholder="MTH 201" /></label>
          <label className="field span-2"><span>Words it should spell right <small>Comma separated</small></span><input value={newCourse.keyterms} onChange={(e) => setNewCourse({ ...newCourse, keyterms: e.target.value })} placeholder="Dr. Adeyemi, eigenvalue, Laplace" /></label>
        </div> : null}
      </> : null}
    </section> : null}

    {method === "link" ? <section className="dashboard-surface flow-form">
      <label className="field"><span>Meeting link</span><input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://meet.google.com/abc-defg-hij" autoFocus />
        {link.trim() ? <small className={provider ? "field-ok" : "field-bad"}>{provider ? `Detected: ${PROVIDER_LABEL[provider]}` : "Paste a Google Meet, Zoom or Teams link"}</small> : null}</label>
      <label className="field"><span>Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Northstar weekly sync" /></label>
      <div className="field"><span>When should the notetaker join?</span>
        <div className="seg-toggle" role="radiogroup">
          <button type="button" role="radio" aria-checked={timing === "now"} className={timing === "now" ? "is-active" : ""} onClick={() => setTiming("now")}>Now</button>
          <button type="button" role="radio" aria-checked={timing === "later"} className={timing === "later" ? "is-active" : ""} onClick={() => setTiming("later")}>At a set time</button>
        </div>
      </div>
      {timing === "later" ? <label className="field"><span>Join at</span><input type="datetime-local" value={joinAt} min={new Date(Date.now() + 120000).toISOString().slice(0, 16)} onChange={(e) => setJoinAt(e.target.value)} /></label> : null}
      <label className="field"><span>Notetaker name</span><input value={botName} onChange={(e) => setBotName(e.target.value)} maxLength={80} /><small>Shown to everyone on the call, so its presence is clear.</small></label>
      <label className="consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>I confirm recording this meeting is allowed and everyone on the call will know it’s being recorded.</span></label>
    </section> : null}

    {method === "calendar" ? <CalendarPicker onError={setError} /> : null}

    {error ? <p className="app-error" role="alert">{error}</p> : null}
    {method !== "calendar" ? <footer className="flow-footer">
      <span className="app-muted"><Icon name="check" size={14} /> Recordings stay private to your workspace.</span>
      <div className="dashboard-content__actions">
        <button className="dashboard-quiet-button" type="button" onClick={() => router.push("/dashboard")}>Cancel</button>
        <button className="dashboard-primary-button" type="button" disabled={!!busy} onClick={() => void submit()}>{busy || (method === "upload" ? "Start processing" : timing === "now" ? "Send notetaker now" : "Schedule notetaker")} <Icon name="arrow" size={14} /></button>
      </div>
    </footer> : null}
    </div>
    <aside className="flow-split__aside"><NextSteps bot={method !== "upload"} lecture={method === "upload" && kind === "lecture"} /></aside>
    </div>
  </div>;
}

function Dropzone({ file, onFile }: { file: File | null; onFile: (f: File | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [recording, setRecording] = useState<MediaRecorder | null>(null);
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  async function record() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true } });
    const r = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    r.ondataavailable = (e) => chunks.push(e.data);
    r.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const type = r.mimeType.split(";")[0] || "audio/webm";
      onFile(new File(chunks, `recording-${new Date().toISOString().slice(0, 16).replace(":", "")}.webm`, { type }));
    };
    r.start(1000);
    setSecs(0);
    setRecording(r);
  }

  if (file) return <div className="file-pill">
    <span className="dash-row__icon"><Icon name="mic" size={18} /></span>
    <span className="dash-row__main"><strong className="truncate">{file.name}</strong><small>{(file.size / 1048576).toFixed(1)} MB · ready</small></span>
    <button className="dashboard-text-button" type="button" onClick={() => onFile(null)}>Remove</button>
  </div>;

  if (recording) return <div className="dropzone is-drag">
    <span className="rec-dot" aria-hidden="true" />
    <strong>Recording · <span className="mono">{formatClock(secs)}</span></strong>
    <small>Browser noise suppression is on.</small>
    <button className="dashboard-primary-button" type="button" onClick={() => { recording.stop(); setRecording(null); }}>■ Stop</button>
  </div>;

  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); };
  return <div className={`dropzone ${drag ? "is-drag" : ""}`} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop}>
    <span className="dash-row__icon"><Icon name="upload" size={20} /></span>
    <strong>Drop your recording here</strong>
    <small>MP3, M4A, WAV, MP4 or WebM, up to 250 MB</small>
    <div className="dashboard-content__actions">
      <button className="dashboard-quiet-button" type="button" onClick={() => input.current?.click()}>Browse files</button>
      <button className="dashboard-quiet-button" type="button" onClick={() => void record()}><Icon name="mic" size={15} />Record here</button>
    </div>
    <input ref={input} hidden type="file" accept="audio/*,video/*" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
  </div>;
}

function NextSteps({ bot, lecture }: { bot: boolean; lecture: boolean }) {
  const steps: Array<{ icon: IconName; label: string }> = [
    ...(bot ? [{ icon: "bot" as IconName, label: "Notetaker joins and records" }] : []),
    ...(lecture ? [{ icon: "mic" as IconName, label: "Room noise filtered out" }] : []),
    { icon: "conversation", label: "Transcript, with who said what" },
    { icon: "sparkles", label: lecture ? "Study notes, maths included" : "Summary and decisions" },
    { icon: "check", label: "Tasks suggested for your approval" },
    { icon: "bell", label: "You’re told when it’s ready" },
  ];
  return <div className="next-steps"><p className="dashboard-location">What happens next</p><ol>{steps.map((s) => <li key={s.label}><span className="dash-row__icon"><Icon name={s.icon} size={15} /></span><small>{s.label}</small></li>)}</ol></div>;
}

/** Calendar events: switch the notetaker on per event; it joins at start time. */
function CalendarPicker({ onError }: { onError: (m: string) => void }) {
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  useEffect(() => { listCalendarEvents(20).then((r) => setEvents(r.events ?? [])).catch(() => setEvents([])); }, []);

  async function toggle(ev: CalendarEvent) {
    try {
      const { event } = await setEventBot(ev.id, !ev.botEnabled);
      setEvents((all) => all?.map((e) => (e.id === ev.id ? { ...e, botEnabled: event.botEnabled, meetingId: event.meetingId } : e)) ?? null);
    } catch (e) { onError(msg(e)); }
  }

  if (events === null) return <p className="app-muted">Loading your calendar…</p>;
  if (!events.length) return <section className="dashboard-surface"><p>No upcoming events. Connect Google Calendar in <a className="dashboard-text-button" href="/settings">Settings</a> and your calls with a Meet, Zoom or Teams link show up here.</p></section>;
  return <section className="dashboard-surface">
    <div className="dash-rows">
      {events.map((ev) => <div key={ev.id} className="dash-event">
        <span className="dash-event__date"><small>{formatDate(ev.startAt, { weekday: "short" })}</small><strong>{new Date(ev.startAt).getDate()}</strong></span>
        <span className="dash-row__main"><strong className="truncate">{ev.title}</strong><small>{formatTime(ev.startAt)} – {formatTime(ev.endAt)}{ev.attendeeCount ? ` · ${ev.attendeeCount} attendees` : ""}{ev.meetingUrl ? "" : " · no call link"}</small></span>
        {ev.meetingUrl ? <button className={ev.botEnabled ? "dashboard-quiet-button" : "dashboard-primary-button"} type="button" onClick={() => void toggle(ev)}><Icon name="bot" size={14} />{ev.botEnabled ? "Notetaker on" : "Add notetaker"}</button> : null}
      </div>)}
    </div>
  </section>;
}
