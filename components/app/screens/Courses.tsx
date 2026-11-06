"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import AppShell from "@/components/app/AppShell";
import { formatClock } from "@/components/app/Notes";
import { Icon, StartPanel, formatDate, getErrorMessage } from "@/components/app/kit";
import { DocList } from "@/components/app/screens/Library";
import { StatusChip } from "@/components/app/screens/Meetings";
import { createCourse, deleteCourse, getCourse, listCourses, updateCourse, type Course, type CourseLecture } from "@/lib/api/app";

export default function Courses() {
  return <AppShell crumbs={["Courses"]}><CoursesBody /></AppShell>;
}

function CoursesBody() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", code: "", lecturer: "" });
  const [error, setError] = useState("");
  const load = () => listCourses().then((r) => setCourses(r.courses)).catch((e) => { setCourses([]); setError(getErrorMessage(e)); });
  useEffect(() => { void load(); }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await createCourse({ name: draft.name.trim(), code: draft.code.trim() || undefined, lecturer: draft.lecturer.trim() || undefined });
      setDraft({ name: "", code: "", lecturer: "" }); setAdding(false); await load();
    } catch (err) { setError(getErrorMessage(err)); }
  }

  return <>
    <header className="dashboard-content__header">
      <div><h1>Courses</h1><p className="dashboard-intro">Each course keeps its lectures, notes and study tools together.</p></div>
      <div className="dashboard-content__actions"><button className="dashboard-primary-button" type="button" onClick={() => setAdding(true)}><Icon name="plus" size={15} />Add a course</button></div>
    </header>
    {error ? <p className="app-error" role="alert">{error}</p> : null}
    {adding ? <form method="post" className="dashboard-surface course-form" onSubmit={add}>
      <label className="field"><span>Course name</span><input autoFocus required maxLength={160} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Organic Chemistry" /></label>
      <label className="field"><span>Code</span><input maxLength={40} value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="CHM 201" /></label>
      <label className="field"><span>Lecturer</span><input maxLength={160} value={draft.lecturer} onChange={(e) => setDraft({ ...draft, lecturer: e.target.value })} placeholder="Dr. Bello" /></label>
      <div className="tp-fix__actions">
        <button className="dashboard-quiet-button" type="button" onClick={() => setAdding(false)}>Cancel</button>
        <button className="dashboard-primary-button" type="submit" disabled={!draft.name.trim()}>Add course</button>
      </div>
    </form> : null}
    {courses === null ? <p className="app-muted">Loading…</p> : courses.length === 0 && !adding
      ? <StartPanel title="Add your first course." body="Lectures you record go under a course, so every subject's notes stay in one place." actions={[
        { icon: "plus", title: "Add a course", body: "Name it now; you can add the code and lecturer too.", onClick: () => setAdding(true) },
        { icon: "upload", title: "Upload a lecture", body: "Start with a recording and pick the course as you go.", href: "/meetings/new?method=upload" },
      ]} />
      : <div className="course-grid">{courses.map((c) => <Link key={c.id} href={`/courses/${c.id}`} className="dashboard-surface course-card">
        <span className="app-muted">{c.code || "Course"}</span>
        <strong>{c.name}</strong>
        <span className="app-muted">{c.lectureCount ?? 0} lecture{c.lectureCount === 1 ? "" : "s"}{c.lecturer ? ` · ${c.lecturer}` : ""}</span>
      </Link>)}</div>}
  </>;
}

export function CoursePage({ id }: { id: string }) {
  return <AppShell crumbs={["Courses", "Course"]}><CourseBody id={id} /></AppShell>;
}

function CourseBody({ id }: { id: string }) {
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [lectures, setLectures] = useState<CourseLecture[]>([]);
  const [terms, setTerms] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    getCourse(id).then((r) => { setCourse(r.course); setLectures(r.lectures); setTerms(r.course.keyterms.join(", ")); }).catch((e) => setError(getErrorMessage(e)));
  }, [id]);

  async function saveTerms(e: FormEvent) {
    e.preventDefault();
    setError(""); setSaved(false);
    try { await updateCourse(id, { keyterms: terms.split(",").map((t) => t.trim()).filter(Boolean) }); setSaved(true); }
    catch (err) { setError(getErrorMessage(err)); }
  }
  async function remove() {
    if (!window.confirm(`Delete ${course?.name}? Its lectures stay in your library.`)) return;
    try { await deleteCourse(id); router.push("/courses"); } catch (e) { setError(getErrorMessage(e)); }
  }

  if (!course) return error ? <p className="app-error" role="alert">{error}</p> : <p className="app-muted">Loading…</p>;
  return <>
    <header className="dashboard-content__header">
      <div><h1>{course.name}</h1><p className="dashboard-intro">{course.code ? `${course.code} · ` : ""}{course.lecturer ? `${course.lecturer} · ` : ""}{lectures.length} lecture{lectures.length === 1 ? "" : "s"}</p></div>
      <div className="dashboard-content__actions"><Link className="dashboard-primary-button" href={`/meetings/new?method=upload&course=${id}`}><Icon name="plus" size={15} />New lecture</Link></div>
    </header>
    {error ? <p className="app-error" role="alert">{error}</p> : null}
    <section className="dashboard-surface">
      {lectures.length ? <div className="mlist">
        <div className="mlist__head" aria-hidden="true"><span>Lecture</span><span>Status</span><span>Length</span><span>Date</span></div>
        {lectures.map((l) => <Link key={l.id} href={`/meetings/${l.id}?tab=study`} className="mlist__row">
          <span className="mtable__title"><Icon name="mic" size={15} /><span className="dash-row__main"><strong className="truncate">{l.title}</strong></span></span>
          <span><StatusChip status={l.status} /></span>
          <span className="mono app-muted">{l.durationSec ? formatClock(l.durationSec) : "—"}</span>
          <span className="app-muted">{formatDate(l.createdAt)}</span>
        </Link>)}
      </div> : <p className="app-muted">No lectures yet. Add one and its notes and study tools appear here.</p>}
    </section>
    <DocList courseId={id} />
    <form method="post" className="dashboard-surface course-form" onSubmit={saveTerms}>
      <label className="field"><span>Words VOII should spell right</span>
        <input value={terms} onChange={(e) => { setTerms(e.target.value); setSaved(false); }} placeholder="Benzene, Hückel, nucleophile" />
        <small>Separate with commas. Used for every lecture in this course.</small></label>
      <div className="tp-fix__actions">
        {saved ? <span className="app-muted" role="status">Saved.</span> : null}
        <button className="dashboard-quiet-button danger-outline" type="button" onClick={() => void remove()}>Delete course</button>
        <button className="dashboard-primary-button" type="submit">Save</button>
      </div>
    </form>
  </>;
}
