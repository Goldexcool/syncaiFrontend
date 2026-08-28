"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Logo } from "@/components/SiteHeader";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized || isAuthenticated) return;
    const returnTo = `${pathname}${window.location.search}`;
    router.replace(`/signin?returnTo=${encodeURIComponent(returnTo)}`);
  }, [isAuthenticated, isInitialized, pathname, router]);

  if (!isInitialized) {
    return (
      <main className="auth-gate" id="main-content" aria-busy="true">
        <div className="auth-gate__brand"><Logo /></div>
        <div className="auth-gate__loading" aria-label="Loading your workspace" role="status">
          <span className="auth-gate__loading-mark" aria-hidden="true" />
          <p>Bringing your workspace together.</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) return null;
  return children;
}
