"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ApiRequestError } from "@/lib/api/client";
import { createCourse, createMeetingFull, listCourses, type Course, type MeetingKind } from "@/lib/api/app";

function providerFor(url: string): "google_meet" | "zoom" | "teams" | undefined {
  if (/meet\.google\./.test(url)) return "google_meet";
  if (/zoom\.(us|com)/.test(url)) return "zoom";
  if (/teams\.(microsoft|live)\./.test(url)) return "teams";
  return undefined;
}

/** Creates the conversation, then the meeting page takes over capture (upload, record or bot). */
export default function NewConversation({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [kind, setKind] = useState<MeetingKind>("meeting");
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [newCourse, setNewCourse] = useState({ name: "", code: "", keyterms: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { listCourses().then((r) => { setCourses(r.courses); setCourseId(r.courses[0]?.id ?? "new"); }).catch(() => setCourseId("new")); }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const url = link.trim();
    if (url && !providerFor(url)) return setError("Paste a Google Meet, Zoom or Teams link.");
    setSaving(true);
    try {
      let cid: string | undefined;
      if (kind === "lecture") {
        cid = courseId !== "new" ? courseId : newCourse.name.trim()
          ? (await createCourse({ name: newCourse.name.trim(), code: newCourse.code.trim() || undefined, keyterms: newCourse.keyterms.split(",").map((k) => k.trim()).filter(Boolean) })).course.id
          : undefined;
      }
      const { meeting } = await createMeetingFull({
        title: title.trim() || (kind === "lecture" ? "Lecture" : "Meeting"),
        kind,
        courseId: cid,
        ...(url ? { source: "meeting_link", provider: providerFor(url), meetingUrl: url } : { source: "upload", provider: "upload" }),
      });
      router.push(`/meetings/${meeting.id}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not create it. Try again.");
      setSaving(false);
    }
  }

  return <section className="dashboard-composer" aria-label="New conversation">
    <div className="dashboard-composer__header">
      <div><p className="dashboard-location">New</p><h2>What are we capturing?</h2></div>
      <button className="dashboard-icon-button" type="button" onClick={onClose} aria-label="Close form">✕</button>
    </div>
    <form onSubmit={submit}>
      <div className="seg-toggle" role="radiogroup" aria-label="Kind">
        <button type="button" role="radio" aria-checked={kind === "meeting"} className={kind === "meeting" ? "is-active" : ""} onClick={() => setKind("meeting")}>Meeting or client call</button>
        <button type="button" role="radio" aria-checked={kind === "lecture"} className={kind === "lecture" ? "is-active" : ""} onClick={() => setKind("lecture")}>Lecture</button>
      </div>
      <label><span>Title</span><input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "lecture" ? "Week 6 — Quadratics" : "Northstar weekly sync"} /></label>
      {kind === "lecture" ? <>
        <label><span>Course</span>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.code ? `${c.code} — ` : ""}{c.name}</option>)}
            <option value="new">+ New course</option>
          </select>
        </label>
        {courseId === "new" ? <div className="dashboard-form-grid">
          <label><span>Course name</span><input value={newCourse.name} onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })} placeholder="Calculus I" /></label>
          <label><span>Code <small>Optional</small></span><input value={newCourse.code} onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })} placeholder="MTH 201" /></label>
          <label className="span-2"><span>Words it should spell right <small>Comma separated</small></span><input value={newCourse.keyterms} onChange={(e) => setNewCourse({ ...newCourse, keyterms: e.target.value })} placeholder="Dr. Adeyemi, eigenvalue, Laplace" /></label>
        </div> : null}
      </> : <label><span>Call link <small>Optional — VOII’s notetaker will join</small></span><input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://meet.google.com/abc-defg-hij" /></label>}
      {error ? <p className="dashboard-form-error" role="alert">{error}</p> : null}
      <div className="dashboard-composer__actions">
        <button className="dashboard-quiet-button" type="button" onClick={onClose}>Cancel</button>
        <button className="dashboard-primary-button" type="submit" disabled={saving}>{saving ? "Creating…" : link ? "Create and send bot →" : "Continue →"}</button>
      </div>
    </form>
  </section>;
}
