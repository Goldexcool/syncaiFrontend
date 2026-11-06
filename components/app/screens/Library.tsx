"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import AppShell from "@/components/app/AppShell";
import { Markdown } from "@/components/app/Notes";
import { Icon, StartPanel, formatDate, getErrorMessage } from "@/components/app/kit";
import { createLibraryDoc, deleteLibraryDoc, getLibraryDoc, listLibraryDocs, updateLibraryDoc, type LibraryDoc } from "@/lib/api/app";

const MAX_CHARS = 400_000;

/** PDFs are read here in the browser, so the server only ever handles text. */
async function pdfText(file: File) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const { items } = await (await pdf.getPage(n)).getTextContent();
    pages.push(items.map((i) => ("str" in i ? i.str + (i.hasEOL ? "\n" : " ") : "")).join(""));
  }
  return pages.join("\n\n").trim();
}

export default function Library() {
  return <AppShell crumbs={["Library"]}><DocList /></AppShell>;
}

/** The workspace's Library, or one course's documents when given a `courseId`. */
export function DocList({ courseId }: { courseId?: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<LibraryDoc[] | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    listLibraryDocs(courseId).then((r) => setDocs(r.docs)).catch((e) => { setDocs([]); setError(getErrorMessage(e)); });
  }, [courseId]);

  async function newPage() {
    setError(""); setBusy("Creating…");
    try { router.push(`/library/${(await createLibraryDoc({ title: "Untitled", body: "", courseId })).doc.id}?edit=1`); }
    catch (e) { setError(getErrorMessage(e)); setBusy(""); }
  }

  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    e.target.value = "";
    setError("");
    try {
      for (const file of files) {
        setBusy(`Reading ${file.name}…`);
        const body = /\.pdf$/i.test(file.name) ? await pdfText(file) : await file.text();
        if (!body.trim()) throw new Error(`${file.name} has no text VOII can read. Scanned PDFs need copying into a page.`);
        if (body.length > MAX_CHARS) throw new Error(`${file.name} is too long. Split it into smaller files.`);
        const { doc } = await createLibraryDoc({ title: file.name.replace(/\.[^.]+$/, ""), body, fileName: file.name, courseId });
        setDocs((d) => [doc, ...(d ?? [])]);
      }
    } catch (err) { setError(getErrorMessage(err)); }
    setBusy("");
  }

  const actions = <div className="dashboard-content__actions">
    <button className="dashboard-quiet-button" type="button" disabled={!!busy} onClick={() => input.current?.click()}><Icon name="upload" size={15} />Upload</button>
    <button className="dashboard-primary-button" type="button" disabled={!!busy} onClick={() => void newPage()}><Icon name="plus" size={15} />New page</button>
    <input ref={input} type="file" hidden multiple accept=".md,.markdown,.txt,.pdf" aria-label="Upload documents" onChange={(e) => void upload(e)} />
  </div>;

  return <>
    {courseId
      ? <div className="library-head"><h2>Old notes and past questions</h2>{actions}</div>
      : <header className="dashboard-content__header">
        <div><h1>Library</h1><p className="dashboard-intro">Your team&apos;s documents. VOII reads them to get your names and terms right.</p></div>
        {actions}
      </header>}
    {busy ? <p className="app-muted" role="status">{busy}</p> : null}
    {error ? <p className="app-error" role="alert">{error}</p> : null}
    {docs === null ? <p className="app-muted">Loading…</p> : docs.length === 0
      ? courseId
        ? <p className="app-muted">Add past questions or old notes and VOII will use them for this course&apos;s lectures and study tools.</p>
        : <StartPanel title="Add your first document." body="Product docs, client lists and team guides all help VOII hear your names and terms correctly." actions={[
          { icon: "plus", title: "Write a page", body: "Start with what your company does and who's on the team.", onClick: () => void newPage() },
          { icon: "upload", title: "Upload a file", body: "Markdown, text or PDF.", onClick: () => input.current?.click() },
        ]} />
      : <section className="dashboard-surface library-list">{docs.map((d) => <Link key={d.id} href={`/library/${d.id}`} className="library-row">
        <span className="library-row__main"><strong className="truncate">{d.title}</strong>{d.about ? <span className="app-muted truncate">{d.about}</span> : null}</span>
        <span className="app-muted">{d.terms.length} term{d.terms.length === 1 ? "" : "s"}</span>
        <span className="app-muted">{formatDate(d.updatedAt)}</span>
      </Link>)}</section>}
  </>;
}

export function LibraryPage({ id }: { id: string }) {
  return <AppShell crumbs={["Library", "Document"]}><DocBody id={id} /></AppShell>;
}

function DocBody({ id }: { id: string }) {
  const router = useRouter();
  const [doc, setDoc] = useState<LibraryDoc | null>(null);
  const [draft, setDraft] = useState<{ title: string; body: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    getLibraryDoc(id).then((r) => {
      setDoc(r.doc);
      if (new URLSearchParams(window.location.search).has("edit")) setDraft({ title: r.doc.title, body: r.doc.body ?? "" });
    }).catch((e) => setError(getErrorMessage(e)));
  }, [id]);
  const back = doc?.courseId ? `/courses/${doc.courseId}` : "/library";

  async function save() {
    if (!draft) return;
    setError(""); setSaving(true);
    try { setDoc((await updateLibraryDoc(id, draft)).doc); setDraft(null); }
    catch (e) { setError(getErrorMessage(e)); }
    setSaving(false);
  }
  async function dropTerm(term: string) {
    if (!doc) return;
    try { setDoc((await updateLibraryDoc(id, { terms: doc.terms.filter((t) => t !== term) })).doc); }
    catch (e) { setError(getErrorMessage(e)); }
  }
  async function remove() {
    if (!window.confirm(`Delete ${doc?.title}?`)) return;
    try { await deleteLibraryDoc(id); router.push(back); } catch (e) { setError(getErrorMessage(e)); }
  }

  if (!doc) return error ? <p className="app-error" role="alert">{error}</p> : <p className="app-muted">Loading…</p>;
  return <>
    <header className="dashboard-content__header">
      <div>
        {draft
          ? <input className="library-title" aria-label="Title" autoFocus required maxLength={200} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          : <h1>{doc.title}</h1>}
        <p className="dashboard-intro">Updated {formatDate(doc.updatedAt)}{doc.fileName ? ` · from ${doc.fileName}` : ""}</p>
      </div>
      <div className="dashboard-content__actions">
        {draft ? <>
          <button className="dashboard-quiet-button" type="button" onClick={() => setDraft(null)}>Cancel</button>
          <button className="dashboard-primary-button" type="button" disabled={saving || !draft.title.trim()} onClick={() => void save()}>{saving ? "Saving…" : "Save"}</button>
        </> : <>
          <button className="dashboard-quiet-button danger-outline" type="button" onClick={() => void remove()}>Delete</button>
          <button className="dashboard-primary-button" type="button" onClick={() => setDraft({ title: doc.title, body: doc.body ?? "" })}>Edit</button>
        </>}
      </div>
    </header>
    {error ? <p className="app-error" role="alert">{error}</p> : null}
    {draft
      ? <textarea className="library-editor" aria-label="Page text, in Markdown" maxLength={MAX_CHARS} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} placeholder="Write in Markdown. Names, products and jargon here help VOII hear them." />
      : <section className="dashboard-surface">{doc.body?.trim() ? <Markdown>{doc.body}</Markdown> : <p className="app-muted">This page is empty.</p>}</section>}
    {!draft ? <section className="dashboard-surface library-terms">
      <h2>Terms VOII learned</h2>
      {doc.terms.length
        ? <div className="chips">{doc.terms.map((t) => <button key={t} type="button" className="chip" aria-label={`Remove ${t}`} onClick={() => void dropTerm(t)}>{t}<Icon name="close" size={12} /></button>)}</div>
        : <p className="app-muted">None yet. Add some text and save.</p>}
    </section> : null}
  </>;
}
