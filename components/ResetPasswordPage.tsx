"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AuthPageShell, AuthStatePanel } from "@/components/AuthPage";
import { useAuth } from "@/components/AuthProvider";
import { API_ERROR_CODES, ApiRequestError } from "@/lib/api/client";
import { isWellFormedToken, resetPassword } from "@/lib/api/auth";

/**
 * The landing page for the link in the reset email. The token identifies the
 * account, so the only thing to collect is the new password.
 *
 * Succeeding revokes every refresh token the user holds, this session included,
 * so the end state is deliberately a sign-in link rather than a redirect into
 * the app — the credentials in memory are already dead.
 */
function ResetPasswordContent() {
  const params = useSearchParams();
  const { clearAuth } = useAuth();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isLinkDead, setIsLinkDead] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isWellFormedToken(token)) {
      setIsLinkDead(true);
      return;
    }

    const nextErrors: Record<string, string> = {};
    if (password.length < 8) nextErrors.password = "Use at least 8 characters.";
    if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords need to match.";
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError("Take a quick look at the highlighted fields.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setFieldErrors({});
    try {
      await resetPassword({ token, password });
      // Every session for this user is now revoked, including whatever we hold.
      clearAuth();
      setIsComplete(true);
    } catch (requestError) {
      if (requestError instanceof ApiRequestError) {
        if (requestError.code === API_ERROR_CODES.RESET_TOKEN_INVALID || requestError.code === API_ERROR_CODES.VALIDATION) {
          setIsLinkDead(true);
          return;
        }
        setFieldErrors(requestError.fieldErrors);
        setError(requestError.message);
      } else {
        setError("Connection issue. Check your internet and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isComplete) {
    return (
      <AuthStatePanel>
        <span className="auth-success__mark" aria-hidden="true">✓</span>
        <p className="eyebrow">Password updated</p>
        <h1>You can sign in <em>again.</em></h1>
        <p>
          Your new password is ready. Every other device has been signed out, so sign in once
          more to pick the thread back up.
        </p>
        <Link className="auth-submit" href="/signin">
          <span>Sign in to VOII</span><span aria-hidden="true">→</span>
        </Link>
      </AuthStatePanel>
    );
  }

  if (isLinkDead || !isWellFormedToken(token)) {
    return (
      <AuthStatePanel>
        <span className="auth-success__mark" aria-hidden="true">↺</span>
        <p className="eyebrow">Link no longer valid</p>
        <h1>Request a fresh <em>link.</em></h1>
        <p>
          Reset links work once and expire after an hour. Ask for another and the new one
          replaces anything sent before it.
        </p>
        <Link className="auth-submit" href="/forgot-password">
          <span>Send a new reset link</span><span aria-hidden="true">→</span>
        </Link>
        <Link className="auth-secondary-link" href="/signin">Back to sign in <span aria-hidden="true">→</span></Link>
      </AuthStatePanel>
    );
  }

  return (
    <AuthStatePanel>
      <p className="eyebrow">Reset password</p>
      <h1>Choose a new <em>password.</em></h1>
      <p>At least 8 characters. Setting it signs out every other device on this account.</p>
      {error ? <p className="auth-form__alert" role="alert">{error}</p> : null}

      <form method="post" className="auth-form auth-state-panel__form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <div className="auth-label-row"><label htmlFor="reset-password">New password</label></div>
          <div className="auth-password-field">
            <input
              id="reset-password"
              type={showPassword ? "text" : "password"}
              value={password}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              aria-invalid={Boolean(fieldErrors.password)}
              onChange={(event) => { setPassword(event.target.value); setFieldErrors((current) => ({ ...current, password: "" })); }}
            />
            <button className="auth-password-toggle" type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button>
          </div>
          {fieldErrors.password ? <p className="auth-field__error">{fieldErrors.password}</p> : null}
        </div>

        <div className="auth-field">
          <div className="auth-label-row"><label htmlFor="reset-confirm-password">Confirm new password</label></div>
          <div className="auth-password-field">
            <input
              id="reset-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              autoComplete="new-password"
              placeholder="Repeat your password"
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              onChange={(event) => { setConfirmPassword(event.target.value); setFieldErrors((current) => ({ ...current, confirmPassword: "" })); }}
            />
            <button className="auth-password-toggle" type="button" onClick={() => setShowConfirmPassword((current) => !current)} aria-label={showConfirmPassword ? "Hide confirmation" : "Show confirmation"}>{showConfirmPassword ? "Hide" : "Show"}</button>
          </div>
          {fieldErrors.confirmPassword ? <p className="auth-field__error">{fieldErrors.confirmPassword}</p> : null}
        </div>

        <button className="auth-submit" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          <span>{isSubmitting ? "Updating…" : "Update password"}</span><span aria-hidden="true">→</span>
        </button>
      </form>
    </AuthStatePanel>
  );
}

function ResetPasswordFallback() {
  return (
    <AuthStatePanel>
      <p className="eyebrow">Reset password</p>
      <h1>Choose a new <em>password.</em></h1>
      <p>One moment.</p>
    </AuthStatePanel>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthPageShell mode="reset-password" className="auth-page--state">
      <Suspense fallback={<ResetPasswordFallback />}>
        <ResetPasswordContent />
      </Suspense>
    </AuthPageShell>
  );
}
