"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { useAuth } from "@/components/AuthProvider";
import { Logo } from "@/components/SiteHeader";
import UnverifiedBanner from "@/components/UnverifiedBanner";
import { ApiRequestError } from "@/lib/api/client";
import { renameWorkspace, saveUsagePath, type UsagePath } from "@/lib/api/auth";

const usagePathOptions: Array<{ value: UsagePath; label: string; description: string }> = [
  {
    value: "meeting_notes",
    label: "Capture the conversation",
    description: "Record meetings, lectures, and calls, then find the useful part again.",
  },
  {
    value: "task_boards",
    label: "Move the work forward",
    description: "Turn decisions into tasks, owners, and next steps.",
  },
  {
    value: "both",
    label: "Keep the whole thread",
    description: "Connect conversations to the work that follows them.",
  },
];

const FIRST_MOVES = [
  { href: "/meetings/new?method=upload", label: "Upload a recording", description: "A meeting, client call or lecture you already have." },
  { href: "/meetings/new?method=link", label: "Send the notetaker to a call", description: "Paste a Google Meet, Zoom or Teams link." },
  { href: "/projects", label: "Set up a board", description: "Organise the work before the first meeting." },
  { href: "/settings", label: "Invite my team", description: "Bring people into the workspace." },
  { href: "/dashboard", label: "Look around first", description: "Open the workspace and explore." },
];

function isUsagePath(value: string | null | undefined): value is UsagePath {
  return value === "meeting_notes" || value === "task_boards" || value === "both";
}

function messageFor(error: unknown) {
  return error instanceof ApiRequestError ? error.message : "Connection issue. Check your internet and try again.";
}

/**
 * Onboarding runs in two steps because the account arrives with no workspace at
 * all — registration creates only a user. Step one records a personalisation
 * preference; step two is what actually calls the workspace endpoint, so the
 * person naming the workspace is the one who owns it.
 */
function Onboarding() {
  const router = useRouter();
  const { user, workspace, createWorkspaceIfMissing, refreshUser } = useAuth();

  const [step, setStep] = useState<"path" | "workspace" | "start">("path");
  const [selectedPath, setSelectedPath] = useState<UsagePath>("both");
  const [workspaceName, setWorkspaceName] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isUsagePath(user?.usagePath)) setSelectedPath(user.usagePath);
  }, [user?.usagePath]);

  async function handlePathSubmit() {
    setIsBusy(true);
    setError("");
    try {
      await saveUsagePath(selectedPath);
      // Creating the workspace here rather than on the next click means the
      // default name is on screen to edit instead of an empty field.
      const created = workspace ?? (await createWorkspaceIfMissing());
      setWorkspaceName(created.name);
      setStep("workspace");
    } catch (requestError) {
      setError(messageFor(requestError));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleWorkspaceSubmit() {
    const name = workspaceName.trim();
    if (!name) {
      setError("Give your workspace a name.");
      return;
    }
    if (name.length > 100) {
      setError("Keep the name under 100 characters.");
      return;
    }

    setIsBusy(true);
    setError("");
    try {
      if (name !== workspace?.name) await renameWorkspace(name);
      await refreshUser();
      setStep("start");
    } catch (requestError) {
      setError(messageFor(requestError));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <>
      <p className="eyebrow">{step === "path" ? "01 — A clear place to begin" : step === "workspace" ? "02 — Name the space" : "03 — First move"}</p>
      <h1>{step === "path" ? <>Start with a <em>conversation.</em></> : step === "workspace" ? <>Somewhere to keep <em>all of it.</em></> : <>How do you want to <em>start?</em></>}</h1>
      <p>
        {step === "path"
          ? "Your account is ready. Tell VOII what to lead with and the workspace will open on the thing you actually came for."
          : step === "workspace" ? "Everything VOII files lands here. You can rename it any time from settings."
          : "Your workspace is ready. Pick a first move and we’ll take you straight there."}
      </p>

      {step === "start" ? (
        <div className="workspace-onboarding">
          <div className="workspace-onboarding__choices">
            {FIRST_MOVES.map((move) => <button key={move.href} className="workspace-onboarding__choice" type="button" onClick={() => router.replace(move.href)}>
              <span className="workspace-onboarding__choice-copy"><strong>{move.label}</strong><span>{move.description}</span></span>
              <span className="workspace-onboarding__choice-mark" aria-hidden="true">→</span>
            </button>)}
          </div>
        </div>
      ) : step === "path" ? (
        <div className="workspace-onboarding">
          <p className="workspace-onboarding__label">What should VOII help with first?</p>
          <div className="workspace-onboarding__choices" role="radiogroup" aria-label="Choose your starting point">
            {usagePathOptions.map((option) => {
              const isSelected = option.value === selectedPath;
              return (
                <button
                  className={`workspace-onboarding__choice${isSelected ? " is-selected" : ""}`}
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => { setSelectedPath(option.value); setError(""); }}
                >
                  <span className="workspace-onboarding__choice-copy"><strong>{option.label}</strong><span>{option.description}</span></span>
                  <span className="workspace-onboarding__choice-mark" aria-hidden="true">{isSelected ? "✓" : ""}</span>
                </button>
              );
            })}
          </div>
          {error ? <p className="auth-form__alert" role="alert">{error}</p> : null}
          <button className="workspace-entry-page__continue" type="button" onClick={handlePathSubmit} disabled={isBusy} aria-busy={isBusy}>
            {isBusy ? "Setting things up…" : "Continue"}<span aria-hidden="true">→</span>
          </button>
        </div>
      ) : (
        <div className="workspace-onboarding">
          <form method="post"
            className="auth-form"
            onSubmit={(event) => { event.preventDefault(); void handleWorkspaceSubmit(); }}
            noValidate
          >
            <div className="auth-field">
              <div className="auth-label-row"><label htmlFor="workspace-name">Workspace name</label></div>
              <input
                id="workspace-name"
                name="workspaceName"
                type="text"
                value={workspaceName}
                autoComplete="organization"
                placeholder="Northstar launch"
                maxLength={100}
                aria-invalid={Boolean(error)}
                onChange={(event) => { setWorkspaceName(event.target.value); setError(""); }}
              />
            </div>
            {error ? <p className="auth-form__alert" role="alert">{error}</p> : null}
            <button className="workspace-entry-page__continue" type="submit" disabled={isBusy} aria-busy={isBusy}>
              {isBusy ? "Saving…" : "Open your workspace"}<span aria-hidden="true">→</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function WorkspaceEntry() {
  const { user, workspace } = useAuth();
  return (
    <>
      <p className="eyebrow">Your VOII workspace</p>
      <h1>Good to have you <em>back.</em></h1>
      <p>Your conversations, decisions, and next moves stay close together here.</p>
      <div className="workspace-entry-page__details">
        <span>{user?.fullName || user?.email || "Your account"}</span>
        {/* No workspace yet is a real state — onboarding is what creates one. */}
        <span>{workspace?.name ?? "No workspace yet"}</span>
        <span>{user?.email}</span>
      </div>
      <Link className="workspace-entry-page__link" href="/how-it-works">See how VOII works <span aria-hidden="true">→</span></Link>
    </>
  );
}

export default function ProtectedWorkspacePage({ kind }: { kind: "dashboard" | "onboarding" }) {
  const router = useRouter();
  const { workspace, isInitialized, isLoading, logout } = useAuth();
  const isOnboarding = kind === "onboarding";

  // Nothing creates a workspace implicitly any more, so a signed-in user without
  // one has not finished onboarding — send them there rather than rendering a
  // workspace view with nothing behind it.
  useEffect(() => {
    if (!isOnboarding && isInitialized && !workspace) router.replace("/onboarding");
  }, [isInitialized, isOnboarding, router, workspace]);

  async function handleLogout() {
    await logout();
    router.replace("/signin");
  }

  return (
    <AuthGate>
      <main className="workspace-entry-page" id="main-content">
        <header className="workspace-entry-page__header">
          <Link href="/" aria-label="VOII home"><Logo /></Link>
          <button className="workspace-entry-page__logout" type="button" onClick={handleLogout} disabled={isLoading}>
            {isLoading ? "Signing out…" : "Sign out"}
          </button>
        </header>
        <UnverifiedBanner />
        <section className="workspace-entry-page__content">
          {isOnboarding ? <Onboarding /> : <WorkspaceEntry />}
        </section>
      </main>
    </AuthGate>
  );
}
