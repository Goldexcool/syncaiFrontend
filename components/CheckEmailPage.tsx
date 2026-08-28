"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { AuthPageShell, AuthStatePanel } from "@/components/AuthPage";
import { useAuth } from "@/components/AuthProvider";
import { ApiRequestError } from "@/lib/api/client";
import { forgotPassword, resendVerificationEmail, verifyEmail } from "@/lib/api/auth";

function CheckEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const emailFromUrl = params.get("email") ?? "";
  const isReset = params.get("reason") === "reset";
  const [email, setEmail] = useState(emailFromUrl);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);

  useEffect(() => setEmail(emailFromUrl), [emailFromUrl]);

  useEffect(() => {
    if (rateLimitSeconds <= 0) return;
    const timer = window.setInterval(() => setRateLimitSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [rateLimitSeconds]);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Accept "123 456" and "123-456" — people paste codes with the spacing intact.
    const normalizedCode = verificationCode.replace(/[\s-]/g, "");
    if (!normalizedCode) {
      setVerificationError("Enter the 6-digit code from your email.");
      setVerificationStatus("");
      return;
    }
    if (!/^\d{6}$/.test(normalizedCode)) {
      setVerificationError("The code is 6 digits.");
      setVerificationStatus("");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setVerificationError("Enter the email address you signed up with.");
      setVerificationStatus("");
      return;
    }

    setIsVerifying(true);
    setVerificationError("");
    setVerificationStatus("");
    try {
      await verifyEmail(email.trim(), normalizedCode);
      await refreshUser().catch(() => undefined);
      setVerificationStatus("Email verified. Opening your VOII workspace…");
      window.setTimeout(() => router.replace("/dashboard"), 700);
    } catch (requestError) {
      if (requestError instanceof ApiRequestError) {
        // The backend distinguishes these; surfacing them separately tells the
        // user whether to retype the code or request a fresh one.
        if (requestError.code === "EMAIL_ALREADY_VERIFIED") {
          setVerificationStatus("This email is already verified. Opening your workspace…");
          window.setTimeout(() => router.replace("/dashboard"), 700);
          return;
        }
        if (requestError.code === "VERIFICATION_ATTEMPTS_EXCEEDED") {
          setVerificationError("Too many incorrect codes. Request a new one below.");
        } else if (requestError.isNetworkError || requestError.isRetryable) {
          setVerificationError(requestError.message);
        } else {
          setVerificationError("That code is invalid or has expired. Use the latest email or request another.");
        }
      } else {
        setVerificationError("That code is invalid or has expired. Use the latest email or request another.");
      }
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      setStatus("");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setStatus("");
    try {
      if (isReset) await forgotPassword(normalizedEmail);
      else await resendVerificationEmail(normalizedEmail);
      setStatus(isReset ? "If an account exists, a reset code has been sent." : "If an account exists, a verification email has been sent.");
    } catch (requestError) {
      if (requestError instanceof ApiRequestError) {
        setError(requestError.message);
        if (requestError.status === 429) setRateLimitSeconds(Math.max(1, Math.ceil(requestError.retryAfter ?? 60)));
      } else {
        setError("Connection issue. Check your internet and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageShell mode={isReset ? "forgot-password" : "signup"} className="auth-page--state">
      <AuthStatePanel>
        <span className="auth-success__mark" aria-hidden="true">✓</span>
        <p className="eyebrow">{isReset ? "Check your inbox" : "One step closer"}</p>
        <h1>{isReset ? <>A way back is <em>on its way.</em></> : <>Check your <em>inbox.</em></>}</h1>
        <p>{isReset ? "If an account exists for that address, we’ve emailed a 6-digit reset code. It expires in 10 minutes." : "We sent a 6-digit code so your workspace can stay connected to you."}</p>
        {isReset ? (
          <Link className="auth-submit auth-submit--link" href={`/reset-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`}>
            <span>Enter your reset code</span><span aria-hidden="true">↗</span>
          </Link>
        ) : null}
        {!isReset ? (
          <div className="auth-code-entry">
            <div className="auth-code-entry__intro"><p className="eyebrow">Have a code?</p><p>Enter the 6-digit code we emailed you.</p></div>
            <form className="auth-form" onSubmit={handleVerify} noValidate>
              <div className="auth-field"><label htmlFor="verification-code">Verification code</label><input id="verification-code" type="text" value={verificationCode} autoComplete="one-time-code" inputMode="numeric" maxLength={7} placeholder="6-digit code" aria-invalid={Boolean(verificationError)} onChange={(event) => { setVerificationCode(event.target.value); setVerificationError(""); setVerificationStatus(""); }} /></div>
              {verificationError ? <p className="auth-form__alert" role="alert">{verificationError}</p> : null}
              {verificationStatus ? <p className="auth-form__status" role="status">{verificationStatus}</p> : null}
              <button className="auth-submit" type="submit" disabled={isVerifying} aria-busy={isVerifying}><span>{isVerifying ? "Checking…" : "Verify email"}</span><span aria-hidden="true">↗</span></button>
            </form>
          </div>
        ) : null}
        <form className="auth-form auth-state-panel__form auth-resend-form" onSubmit={handleResend} noValidate>
          <div className="auth-code-entry__intro"><p className="eyebrow">{isReset ? "Need another code?" : "Didn’t receive it?"}</p><p>We’ll send a fresh message without confirming whether an account exists.</p></div>
          <div className="auth-field">
            <label htmlFor="check-email-address">Email address</label>
            <input id="check-email-address" type="email" value={email} autoComplete="email" placeholder="you@example.com" onChange={(event) => { setEmail(event.target.value); setError(""); setStatus(""); }} />
          </div>
          {error ? <p className="auth-form__alert" role="alert">{error}</p> : null}
          {status ? <p className="auth-form__status" role="status">{status}</p> : null}
          {rateLimitSeconds > 0 ? <p className="auth-form__status" role="status">Try again in {rateLimitSeconds}s.</p> : null}
          <button className="auth-submit" type="submit" disabled={isSubmitting || rateLimitSeconds > 0} aria-busy={isSubmitting}><span>{isSubmitting ? "Sending…" : isReset ? "Send another reset code" : "Resend verification email"}</span><span aria-hidden="true">↗</span></button>
        </form>
        <Link className="auth-secondary-link" href="/signin">Back to sign in <span aria-hidden="true">↗</span></Link>
      </AuthStatePanel>
    </AuthPageShell>
  );
}

function CheckEmailFallback() {
  return <AuthPageShell mode="forgot-password" className="auth-page--state"><AuthStatePanel><span className="auth-success__mark" aria-hidden="true">✓</span><p className="eyebrow">Check your inbox</p><h1>A way back is <em>on its way.</em></h1><p>Keep this window open while you check your email.</p></AuthStatePanel></AuthPageShell>;
}

export default function CheckEmailPage() {
  return <Suspense fallback={<CheckEmailFallback />}><CheckEmailContent /></Suspense>;
}
