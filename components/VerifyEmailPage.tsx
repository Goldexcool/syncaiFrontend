"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AuthPageShell, AuthStatePanel } from "@/components/AuthPage";
import { useAuth } from "@/components/AuthProvider";
import { API_ERROR_CODES, ApiRequestError } from "@/lib/api/client";
import { isWellFormedToken, resendVerificationEmail, verifyEmail } from "@/lib/api/auth";

/**
 * The landing page for the link in the verification email. It reads the token
 * out of the query string and posts it on mount — there is nothing for the user
 * to type, so the only states are working, done, and a way to get a fresh link.
 */
type Status = "verifying" | "verified" | "no-token" | "failed";

function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, refreshUser } = useAuth();
  const token = params.get("token");

  const [status, setStatus] = useState<Status>(() => (isWellFormedToken(token) ? "verifying" : "no-token"));
  const [failureMessage, setFailureMessage] = useState("");
  // StrictMode mounts effects twice in development. The second POST would return
  // EMAIL_ALREADY_VERIFIED — handled as success below — but the flash of a second
  // request is confusing in the network log, so it is guarded outright.
  const submitted = useRef(false);

  useEffect(() => {
    if (!isWellFormedToken(token) || submitted.current) return;
    submitted.current = true;

    let active = true;

    (async () => {
      try {
        await verifyEmail(token);
        if (active) setStatus("verified");
      } catch (error) {
        // Clicking the link twice, or a mail client prefetching it, lands here.
        // From the user's side the address is verified, which is all they asked.
        if (error instanceof ApiRequestError && error.code === API_ERROR_CODES.EMAIL_ALREADY_VERIFIED) {
          if (active) setStatus("verified");
          return;
        }
        if (!active) return;
        setFailureMessage(
          error instanceof ApiRequestError && !error.isNetworkError
            ? error.message
            : "We couldn’t reach VOII to confirm that link. Check your connection and try again.",
        );
        setStatus("failed");
      }
    })();

    return () => {
      active = false;
    };
  }, [token]);

  // Pick up emailVerified: true so nothing downstream keeps nagging. Only for a
  // signed-in session — verifying from a different device has no session to update.
  useEffect(() => {
    if (status !== "verified" || !isAuthenticated) return;
    void refreshUser().catch(() => undefined);
  }, [isAuthenticated, refreshUser, status]);

  if (status === "verifying") {
    return (
      <AuthStatePanel>
        <span className="auth-success__mark av-spin" aria-hidden="true">◠</span>
        <p className="eyebrow">One moment</p>
        <h1>Confirming your <em>email.</em></h1>
        <p role="status">Checking the link you followed.</p>
      </AuthStatePanel>
    );
  }

  if (status === "verified") {
    return (
      <AuthStatePanel>
        <span className="auth-success__mark" aria-hidden="true">✓</span>
        <p className="eyebrow">Email confirmed</p>
        <h1>You’re all <em>set.</em></h1>
        <p>Your address is verified. Everything VOII files from here is tied to this account.</p>
        <button
          className="auth-submit"
          onClick={() => router.replace(isAuthenticated ? "/dashboard" : "/signin")}
          type="button"
        >
          <span>{isAuthenticated ? "Open your workspace" : "Sign in to VOII"}</span>
          <span aria-hidden="true">↗</span>
        </button>
      </AuthStatePanel>
    );
  }

  return <VerifyFailed reason={status} message={failureMessage} />;
}

/** Both failure paths end in the same place: get a new link sent. */
function VerifyFailed({ reason, message }: { reason: "no-token" | "failed"; message: string }) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  const handleResend = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError("Enter the email address you signed up with.");
      return;
    }

    setIsSending(true);
    setError("");
    try {
      await resendVerificationEmail(address);
      setSent(true);
    } catch (requestError) {
      setError(
        requestError instanceof ApiRequestError
          ? requestError.message
          : "Connection issue. Check your internet and try again.",
      );
    } finally {
      setIsSending(false);
    }
  }, [email]);

  return (
    <AuthStatePanel>
      <span className="auth-success__mark" aria-hidden="true">↺</span>
      <p className="eyebrow">{reason === "no-token" ? "Link incomplete" : "Link expired"}</p>
      <h1>Let’s send a fresh <em>one.</em></h1>
      <p>
        {reason === "no-token"
          ? "That address is missing its confirmation token — some mail clients trim long links. Requesting another takes a second."
          : message || "That link has already been used or has expired. Verification links are good for 24 hours."}
      </p>

      {sent ? (
        <p className="auth-form__status" role="status">
          If an account exists for that address, a new link is on its way. It replaces any earlier one.
        </p>
      ) : (
        <form className="auth-form auth-state-panel__form" onSubmit={handleResend} noValidate>
          <div className="auth-field">
            <div className="auth-label-row"><label htmlFor="verify-resend-email">Email address</label></div>
            <input
              id="verify-resend-email"
              type="email"
              value={email}
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(error)}
              onChange={(event) => { setEmail(event.target.value); setError(""); }}
            />
            {error ? <p className="auth-field__error">{error}</p> : null}
          </div>
          <button className="auth-submit" type="submit" disabled={isSending} aria-busy={isSending}>
            <span>{isSending ? "Sending…" : "Send a new link"}</span><span aria-hidden="true">↗</span>
          </button>
        </form>
      )}

      <Link className="auth-secondary-link" href="/signin">Back to sign in <span aria-hidden="true">↗</span></Link>
    </AuthStatePanel>
  );
}

function VerifyEmailFallback() {
  return (
    <AuthStatePanel>
      <span className="auth-success__mark av-spin" aria-hidden="true">◠</span>
      <p className="eyebrow">One moment</p>
      <h1>Confirming your <em>email.</em></h1>
      <p>Checking the link you followed.</p>
    </AuthStatePanel>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthPageShell mode="signup" className="auth-page--state">
      <Suspense fallback={<VerifyEmailFallback />}>
        <VerifyEmailContent />
      </Suspense>
    </AuthPageShell>
  );
}
