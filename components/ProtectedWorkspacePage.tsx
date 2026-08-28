"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { useAuth } from "@/components/AuthProvider";
import { Logo } from "@/components/SiteHeader";
import { ApiRequestError } from "@/lib/api/client";
import { saveUsagePath, type UsagePath } from "@/lib/api/auth";

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

function isUsagePath(value: string | null | undefined): value is UsagePath {
  return value === "meeting_notes" || value === "task_boards" || value === "both";
}

export default function ProtectedWorkspacePage({ kind }: { kind: "dashboard" | "onboarding" }) {
  const router = useRouter();
  const { user, workspace, isLoading, logout, refreshUser } = useAuth();
  const isOnboarding = kind === "onboarding";
  const [selectedPath, setSelectedPath] = useState<UsagePath>("both");
  const [isSavingPath, setIsSavingPath] = useState(false);
  const [pathError, setPathError] = useState("");

  useEffect(() => {
    if (isOnboarding && isUsagePath(user?.usagePath)) setSelectedPath(user.usagePath);
  }, [isOnboarding, user?.usagePath]);

  async function handleLogout() {
    await logout();
    router.replace("/signin");
  }

  async function handleUsagePathSubmit() {
    setIsSavingPath(true);
    setPathError("");
    try {
      await saveUsagePath(selectedPath);
      await refreshUser();
      router.replace("/dashboard");
    } catch (error) {
      setPathError(error instanceof ApiRequestError ? error.message : "Connection issue. Check your internet and try again.");
    } finally {
      setIsSavingPath(false);
    }
  }

  return (
    <AuthGate>
      <main className="workspace-entry-page" id="main-content">
        <header className="workspace-entry-page__header"><Link href="/" aria-label="VOII home"><Logo /></Link><button className="workspace-entry-page__logout" type="button" onClick={handleLogout} disabled={isLoading}>{isLoading ? "Signing out…" : "Sign out"}</button></header>
        <section className="workspace-entry-page__content">
          <p className="eyebrow">{isOnboarding ? "A clear place to begin" : "Your VOII workspace"}</p>
          <h1>{isOnboarding ? <>Start with a <em>conversation.</em></> : <>Good to have you <em>back.</em></>}</h1>
          <p>{isOnboarding ? "Your account is ready. The next conversation can become the first useful shape of your workspace." : "Your conversations, decisions, and next moves stay close together here."}</p>
          {isOnboarding ? (
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
                      onClick={() => { setSelectedPath(option.value); setPathError(""); }}
                    >
                      <span className="workspace-onboarding__choice-copy"><strong>{option.label}</strong><span>{option.description}</span></span>
                      <span className="workspace-onboarding__choice-mark" aria-hidden="true">{isSelected ? "✓" : ""}</span>
                    </button>
                  );
                })}
              </div>
              {pathError ? <p className="auth-form__alert" role="alert">{pathError}</p> : null}
              <button className="workspace-entry-page__continue" type="button" onClick={handleUsagePathSubmit} disabled={isSavingPath} aria-busy={isSavingPath}>
                {isSavingPath ? "Saving your starting point…" : "Continue to your workspace"}<span aria-hidden="true">↗</span>
              </button>
            </div>
          ) : (
            <>
              <div className="workspace-entry-page__details"><span>{user?.fullName || user?.email || "Your account"}</span><span>{workspace?.name || "Personal workspace"}</span><span>{user?.email}</span></div>
              <Link className="workspace-entry-page__link" href="/how-it-works">See how VOII works <span aria-hidden="true">↗</span></Link>
            </>
          )}
        </section>
      </main>
    </AuthGate>
  );
}
