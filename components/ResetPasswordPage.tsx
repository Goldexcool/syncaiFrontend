"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AuthPageShell, AuthStatePanel } from "@/components/AuthPage";
import { ApiRequestError } from "@/lib/api/client";
import { resetPassword } from "@/lib/api/auth";

function ResetPasswordContent() {
  const params = useSearchParams();
  // Prefilled from /forgot-password so the user only types the code.
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const normalizedCode = code.replace(/[\s-]/g, "");
    if (!email.trim()) nextErrors.email = "Enter the email you requested the reset for.";
    if (!/^\d{6}$/.test(normalizedCode)) nextErrors.code = "Enter the 6-digit code from your email.";
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
      await resetPassword({ email: email.trim(), code: normalizedCode, password });
      setIsComplete(true);
    } catch (requestError) {
      if (requestError instanceof ApiRequestError) {
        if (requestError.code === "RESET_ATTEMPTS_EXCEEDED") {
          setError("Too many incorrect codes. Request a new one to continue.");
        } else if (requestError.isNetworkError || requestError.isRetryable) {
          setError(requestError.message);
        } else {
          setError("That code is invalid or has expired. Request a new one to continue.");
        }
      } else {
        setError("That code is invalid or has expired. Request a new one to continue.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isComplete) {
    return (
      <AuthPageShell mode="forgot-password" className="auth-page--state">
        <AuthStatePanel>
          <span className="auth-success__mark" aria-hidden="true">✓</span>
          <p className="eyebrow">Password updated</p>
          <h1>You can sign in <em>again.</em></h1>
          <p>Your new password is ready. Continue to VOII with the account you just secured.</p>
          <Link className="auth-secondary-link" href="/signin">Back to sign in <span aria-hidden="true">↗</span></Link>
        </AuthStatePanel>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell mode="forgot-password" className="auth-page--state">
      <AuthStatePanel>
        <p className="eyebrow">Find your way back</p>
        <h1>Choose a new <em>password.</em></h1>
        <p>Enter the 6-digit code we emailed you, then choose a new password of at least 8 characters. Resetting signs out every other device.</p>
        {error ? <p className="auth-form__alert" role="alert">{error}</p> : null}
        <form className="auth-form auth-state-panel__form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field"><label htmlFor="reset-email">Email address</label><input id="reset-email" type="email" value={email} autoComplete="email" placeholder="you@example.com" aria-invalid={Boolean(fieldErrors.email)} onChange={(event) => { setEmail(event.target.value); setFieldErrors((current) => ({ ...current, email: "" })); }} />{fieldErrors.email ? <p className="auth-field__error">{fieldErrors.email}</p> : null}</div>
          <div className="auth-field"><label htmlFor="reset-code">Reset code</label><input id="reset-code" type="text" value={code} autoComplete="one-time-code" inputMode="numeric" maxLength={7} placeholder="6-digit code" aria-invalid={Boolean(fieldErrors.code)} onChange={(event) => { setCode(event.target.value); setFieldErrors((current) => ({ ...current, code: "" })); }} />{fieldErrors.code ? <p className="auth-field__error">{fieldErrors.code}</p> : null}</div>
          <div className="auth-field"><label htmlFor="reset-password">New password</label><div className="auth-password-field"><input id="reset-password" type={showPassword ? "text" : "password"} value={password} autoComplete="new-password" placeholder="At least 8 characters" aria-invalid={Boolean(fieldErrors.password)} onChange={(event) => { setPassword(event.target.value); setFieldErrors((current) => ({ ...current, password: "" })); }} /><button className="auth-password-toggle" type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button></div>{fieldErrors.password ? <p className="auth-field__error">{fieldErrors.password}</p> : null}</div>
          <div className="auth-field"><label htmlFor="reset-confirm-password">Confirm new password</label><div className="auth-password-field"><input id="reset-confirm-password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} autoComplete="new-password" placeholder="Repeat your password" aria-invalid={Boolean(fieldErrors.confirmPassword)} onChange={(event) => { setConfirmPassword(event.target.value); setFieldErrors((current) => ({ ...current, confirmPassword: "" })); }} /><button className="auth-password-toggle" type="button" onClick={() => setShowConfirmPassword((current) => !current)} aria-label={showConfirmPassword ? "Hide confirmation" : "Show confirmation"}>{showConfirmPassword ? "Hide" : "Show"}</button></div>{fieldErrors.confirmPassword ? <p className="auth-field__error">{fieldErrors.confirmPassword}</p> : null}</div>
          <button className="auth-submit" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}><span>{isSubmitting ? "Updating…" : "Update password"}</span><span aria-hidden="true">↗</span></button>
        </form>
        <Link className="auth-secondary-link" href="/forgot-password">Request a new code <span aria-hidden="true">↗</span></Link>
      </AuthStatePanel>
    </AuthPageShell>
  );
}

function ResetPasswordFallback() {
  return <AuthPageShell mode="forgot-password" className="auth-page--state"><AuthStatePanel><p className="eyebrow">Find your way back</p><h1>Choose a new <em>password.</em></h1><p>Use at least 8 characters.</p></AuthStatePanel></AuthPageShell>;
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<ResetPasswordFallback />}><ResetPasswordContent /></Suspense>;
}
