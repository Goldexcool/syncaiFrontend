"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createCourse } from "@/lib/api/app";
import { renameWorkspace, saveUsagePath, setWorkspaceType, type UsagePath, type WorkspaceType } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";
import { createClient, inviteWorkspaceMember } from "@/lib/api/dashboard";

const TYPES: Array<{ value: WorkspaceType; usagePath: UsagePath; title: string; body: string; gets: string[] }> = [
  { value: "student", usagePath: "meeting_notes", title: "I’m a student", body: "For lectures and revision.", gets: ["Notes for every lecture", "Lectures sorted by course", "Quizzes and lessons from your notes"] },
  { value: "team", usagePath: "both", title: "We’re a team", body: "For companies and organisations.", gets: ["Notes for every meeting", "Tasks on a shared board", "Your team in one workspace"] },
  { value: "agency", usagePath: "both", title: "We work with clients", body: "For agencies and consultants.", gets: ["Everything a team gets", "Notes from client calls", "A page each client can follow"] },
];

const STEPS = ["Your account", "Set up", "First recording"];

const FIRST_MOVES: Record<WorkspaceType, Array<{ href: string; title: string; body: string }>> = {
  student: [
    { href: "/meetings/new?method=upload", title: "Upload a lecture", body: "A recording you already have." },
    { href: "/meetings/new?method=link", title: "Join an online class", body: "VOII joins your Meet, Zoom or Teams class." },
    { href: "/courses", title: "Add more courses", body: "Set up the rest of your term." },
  ],
  team: [
    { href: "/meetings/new?method=link", title: "Send VOII to a meeting", body: "Paste a Meet, Zoom or Teams link." },
    { href: "/meetings/new?method=upload", title: "Upload a recording", body: "A meeting you already have." },
    { href: "/meetings/new?method=calendar", title: "Connect your calendar", body: "VOII can join scheduled calls." },
  ],
  agency: [
    { href: "/meetings/new?method=link", title: "Send VOII to a client call", body: "Paste a Meet, Zoom or Teams link." },
    { href: "/meetings/new?method=upload", title: "Upload a recording", body: "A call you already have." },
    { href: "/clients", title: "Add your clients", body: "Give each client a page to follow." },
  ],
};

const message = (e: unknown) => (e instanceof ApiRequestError ? e.message : "Connection issue. Check your internet and try again.");

/**
 * Three steps: choose the account type (locked once saved), create the first
 * real thing for that type, then go straight to a first recording.
 */
export default function Onboarding() {
  const router = useRouter();
  const { user, workspace, isInitialized, createWorkspaceIfMissing, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [type, setType] = useState<WorkspaceType | null>(null);
  const [name, setName] = useState("");
  const [extra, setExtra] = useState("");
  const [invites, setInvites] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Already chosen (an invited teammate, or someone coming back): nothing to do here.
  const checked = useRef(false);
  useEffect(() => {
    if (!isInitialized || checked.current) return;
    checked.current = true;
    if (user?.platformRole === "ADMIN" || user?.platformRole === "SUPER_ADMIN") router.replace("/enoch");
    else if (workspace?.type) router.replace("/dashboard");
  }, [isInitialized, router, user?.platformRole, workspace?.type]);

  async function choose() {
    if (!type) return;
    setBusy(true); setError("");
    try {
      await saveUsagePath(TYPES.find((t) => t.value === type)!.usagePath);
      const current = workspace ?? (await createWorkspaceIfMissing());
      if (!current.type) await setWorkspaceType(type);
      await refreshUser();
      setStep(1);
    } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }

  async function setUp(e: FormEvent) {
    e.preventDefault();
    if (!type) return;
    setBusy(true); setError("");
    try {
      if (type === "student") {
        await renameWorkspace(`${user?.fullName?.split(" ")[0] ?? "My"}’s notes`);
        if (name.trim()) await createCourse({ name: name.trim(), code: extra.trim() || undefined });
      } else {
        await renameWorkspace(name.trim());
        if (type === "agency" && extra.trim()) await createClient({ name: extra.trim() });
        const emails = invites.split(/[\s,]+/).filter(Boolean);
        const sent = await Promise.allSettled(emails.map((email) => inviteWorkspaceMember({ email, role: "MEMBER" })));
        const failed = emails.filter((_, i) => sent[i].status === "rejected");
        if (failed.length) setNotice(`We couldn’t invite ${failed.join(", ")}. You can try again in Settings.`);
      }
      await refreshUser();
      setStep(2);
    } catch (err) { setError(message(err)); } finally { setBusy(false); }
  }

  return <div className="onb">
    <ol className="onb__steps" aria-label="Progress">
      {STEPS.map((label, i) => <li key={label} className={i === step ? "is-current" : i < step ? "is-done" : ""} aria-current={i === step ? "step" : undefined}><span>{i + 1}</span>{label}</li>)}
    </ol>

    {step === 0 ? <>
      <h1>What will you use VOII for?</h1>
      <div className="onb__types" role="radiogroup" aria-label="Account type">
        {TYPES.map((t) => <button key={t.value} type="button" role="radio" aria-checked={type === t.value} className={`onb__type ${type === t.value ? "is-selected" : ""}`} onClick={() => { setType(t.value); setError(""); }}>
          <strong>{t.title}</strong>
          <span>{t.body}</span>
          <ul>{t.gets.map((g) => <li key={g}>{g}</li>)}</ul>
        </button>)}
      </div>
      {error ? <p className="auth-form__alert" role="alert">{error}</p> : null}
      <div className="onb__foot">
        <p>You can’t change this later, so pick the one that fits best.</p>
        <button className="workspace-entry-page__continue" type="button" disabled={!type || busy} aria-busy={busy} onClick={() => void choose()}>{busy ? "Setting up…" : "Continue"}<span aria-hidden="true">→</span></button>
      </div>
    </> : null}

    {step === 1 && type ? <>
      <h1>{type === "student" ? "What’s your first course?" : type === "team" ? "Name your team." : "Name your company."}</h1>
      <form method="post" className="onb__form" onSubmit={setUp} noValidate>
        {type === "student" ? <>
          <div className="auth-field"><label htmlFor="onb-name">Course name</label><input id="onb-name" autoFocus maxLength={160} value={name} onChange={(e) => setName(e.target.value)} placeholder="Organic Chemistry" /></div>
          <div className="auth-field"><label htmlFor="onb-extra">Course code (optional)</label><input id="onb-extra" maxLength={40} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="CHM 201" /></div>
        </> : <>
          <div className="auth-field"><label htmlFor="onb-name">{type === "team" ? "Team or company name" : "Company name"}</label><input id="onb-name" autoFocus required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Northstar" autoComplete="organization" /></div>
          {type === "agency" ? <div className="auth-field"><label htmlFor="onb-extra">First client (optional)</label><input id="onb-extra" maxLength={120} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Acme Ltd" /></div> : null}
          <div className="auth-field"><label htmlFor="onb-invites">Invite teammates (optional)</label><input id="onb-invites" value={invites} onChange={(e) => setInvites(e.target.value)} placeholder="ada@company.com, tunde@company.com" autoComplete="off" /></div>
        </>}
        {error ? <p className="auth-form__alert" role="alert">{error}</p> : null}
        <div className="onb__foot">
          {type === "student" ? <button className="workspace-entry-page__link" type="submit" disabled={busy} onClick={() => { setName(""); setExtra(""); }}>Skip for now</button> : <span />}
          <button className="workspace-entry-page__continue" type="submit" disabled={busy || (type !== "student" && name.trim().length < 2)} aria-busy={busy}>{busy ? "Saving…" : "Continue"}<span aria-hidden="true">→</span></button>
        </div>
      </form>
    </> : null}

    {step === 2 && type ? <>
      <h1>You’re in. Let’s get your first {type === "student" ? "lecture" : "recording"}.</h1>
      {notice ? <p className="auth-form__alert" role="status">{notice}</p> : null}
      <div className="onb__types">
        {FIRST_MOVES[type].map((m) => <button key={m.href} type="button" className="onb__type" onClick={() => router.replace(m.href)}><strong>{m.title}</strong><span>{m.body}</span></button>)}
      </div>
      <div className="onb__foot"><span /><button className="workspace-entry-page__link" type="button" onClick={() => router.replace("/dashboard")}>Go to my dashboard</button></div>
    </> : null}
  </div>;
}
