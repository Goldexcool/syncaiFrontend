"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AuthGate from "@/components/AuthGate";
import { useAuth } from "@/components/AuthProvider";
import { Logo } from "@/components/SiteHeader";
import Onboarding from "@/components/Onboarding";
import UnverifiedBanner from "@/components/UnverifiedBanner";

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
        {isOnboarding ? <Onboarding /> : <section className="workspace-entry-page__content"><WorkspaceEntry /></section>}
      </main>
    </AuthGate>
  );
}
