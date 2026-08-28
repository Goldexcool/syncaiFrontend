"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { AuthPageShell, AuthStatePanel } from "@/components/AuthPage";

/**
 * Verification moved from a link to a six-digit code, so this route no longer
 * verifies anything. It stays because emails sent before the change still point
 * here — rather than showing a dead end, it forwards to the code entry and
 * carries the address along so the field is prefilled.
 */
function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const email = params.get("email") ?? "";

  useEffect(() => {
    const target = email
      ? `/check-email?email=${encodeURIComponent(email)}`
      : "/check-email";
    router.replace(target);
  }, [email, router]);

  return (
    <AuthPageShell mode="signup" className="auth-page--state">
      <AuthStatePanel>
        <span className="auth-success__mark" aria-hidden="true">…</span>
        <p className="eyebrow">Verification moved</p>
        <h1>
          Enter your <em>code.</em>
        </h1>
        <p>
          We now send a 6-digit code instead of a link. Taking you to where you can
          enter it.
        </p>
        <Link className="auth-secondary-link" href="/check-email">
          Enter your code <span aria-hidden="true">↗</span>
        </Link>
      </AuthStatePanel>
    </AuthPageShell>
  );
}

function VerifyEmailFallback() {
  return (
    <AuthPageShell mode="signup" className="auth-page--state">
      <AuthStatePanel>
        <span className="auth-success__mark" aria-hidden="true">…</span>
        <p className="eyebrow">Verification moved</p>
        <h1>
          Enter your <em>code.</em>
        </h1>
        <p>One moment.</p>
      </AuthStatePanel>
    </AuthPageShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
