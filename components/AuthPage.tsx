"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Logo } from "@/components/SiteHeader";
import { forgotPassword, loginUser, registerUser } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";

export type AuthMode = "login" | "signup" | "forgot-password";
type FormField = "fullName" | "workspaceName" | "email" | "password";
type FormState = Record<FormField, string>;

const authContent: Record<AuthMode, { kicker: string; title: ReactNode; description: string; submit: string }> = {
  login: {
    kicker: "Welcome back",
    title: <>Keep the thread <em>moving.</em></>,
    description: "Sign in to find your recordings, summaries, decisions, and tasks.",
    submit: "Sign in to VOII",
  },
  signup: {
    kicker: "Start with a conversation",
    title: <>Make space for the work <em>ahead.</em></>,
    description: "Create an account to record conversations, search transcripts, and turn decisions into tasks.",
    submit: "Create your account",
  },
  "forgot-password": {
    kicker: "Find your way back",
    title: <>Your work is still <em>here.</em></>,
    description: "Enter your email and we’ll send you a quiet way back into VOII.",
    submit: "Send reset link",
  },
};

const initialForm: FormState = { fullName: "", workspaceName: "", email: "", password: "" };

function getSafeReturnPath() {
  if (typeof window === "undefined") return "/dashboard";
  const returnTo = new URLSearchParams(window.location.search).get("returnTo");
  return returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard";
}

function validateForm(mode: AuthMode, form: FormState) {
  const errors: Record<string, string> = {};
  const email = form.email.trim();

  if (mode === "signup" && !form.fullName.trim()) errors.fullName = "Enter your full name.";
  if (mode === "signup" && form.fullName.trim().length > 100) errors.fullName = "Keep your name under 100 characters.";
  if (!email) errors.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  if (mode !== "forgot-password" && form.password.length < 8) errors.password = "Use at least 8 characters.";
  if (mode === "signup" && form.workspaceName.trim().length > 100) errors.workspaceName = "Keep your workspace name under 100 characters.";

  return errors;
}

function AuthAside({ mode }: { mode: AuthMode }) {
  return (
    <aside className="auth-page__aside">
      <Link className="auth-page__logo" href="/" aria-label="VOII home"><Logo /></Link>
      <div className="auth-page__aside-copy">
        <p className="eyebrow">The work after the words</p>
        <p className="auth-page__aside-heading">{mode === "forgot-password" ? <>Nothing important is <em>lost.</em></> : <>The conversation becomes <em>work.</em></>}</p>
        <p>VOII turns conversations into searchable summaries, decisions, and tasks.</p>
      </div>
      <div className="auth-page__aside-footer"><span>Conversation · Knowledge · Tasks · Momentum</span><span>01 — 04</span></div>
    </aside>
  );
}

export function AuthPageShell({ mode, children, className = "" }: { mode: AuthMode; children: ReactNode; className?: string }) {
  return (
    <main className={`auth-page auth-page--${mode} ${className}`.trim()} id="main-content">
      <AuthAside mode={mode} />
      <section className="auth-page__main">
        <div className="auth-page__mobile-logo"><Link href="/" aria-label="VOII home"><Logo /></Link></div>
        {children}
      </section>
    </main>
  );
}

export function AuthStatePanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`auth-state-panel ${className}`.trim()}>{children}</div>;
}

function AuthForm({ mode }: { mode: AuthMode }) {
  const copy = authContent[mode];
  const router = useRouter();
  const { setAuth } = useAuth();
  const [form, setForm] = useState<FormState>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);

  useEffect(() => {
    if (rateLimitSeconds <= 0) return;
    const timer = window.setInterval(() => setRateLimitSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [rateLimitSeconds]);

  function updateField(field: FormField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setFormError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateForm(mode, form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Take a quick look at the highlighted fields.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    setFieldErrors({});

    try {
      if (mode === "login") {
        const data = await loginUser({ email: form.email.trim(), password: form.password });
        setAuth(data);
        router.push(data.user.emailVerified === false ? `/check-email?email=${encodeURIComponent(data.user.email)}` : getSafeReturnPath());
      } else if (mode === "signup") {
        const data = await registerUser({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          ...(form.workspaceName.trim() ? { workspaceName: form.workspaceName.trim() } : {}),
        });
        setAuth(data);
        router.push(`/check-email?email=${encodeURIComponent(data.user.email)}`);
      } else {
        await forgotPassword(form.email.trim());
        router.push(`/check-email?email=${encodeURIComponent(form.email.trim())}&reason=reset`);
      }
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setFieldErrors(error.fieldErrors);
        if (error.status === 401 && mode === "login") {
          setFormError("We couldn’t sign you in. Please check your email and password.");
        } else {
          setFormError(error.message);
        }
        if (error.status === 429) setRateLimitSeconds(Math.max(1, Math.ceil(error.retryAfter ?? 60)));
      } else {
        setFormError("Connection issue. Check your internet and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldId = (field: FormField) => `auth-${field}`;
  const errorId = (field: FormField) => `${fieldId(field)}-error`;
  const renderField = (field: FormField, label: string, type: string, placeholder: string, autoComplete: string) => (
    <div className="auth-field" key={field}>
      <label htmlFor={fieldId(field)}>{label}</label>
      <input
        id={fieldId(field)}
        name={field}
        type={type}
        value={form[field]}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(fieldErrors[field])}
        aria-describedby={fieldErrors[field] ? errorId(field) : undefined}
        onChange={(event) => updateField(field, event.target.value)}
      />
      {fieldErrors[field] ? <p className="auth-field__error" id={errorId(field)}>{fieldErrors[field]}</p> : null}
    </div>
  );

  return (
    <div className="auth-form-shell">
      <div className="auth-form-heading"><p className="eyebrow">{copy.kicker}</p><h1>{copy.title}</h1><p>{copy.description}</p></div>
      {formError ? <p className="auth-form__alert" role="alert">{formError}</p> : null}
      {rateLimitSeconds > 0 ? <p className="auth-form__status" role="status">Try again in {rateLimitSeconds}s.</p> : null}
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {mode === "signup" ? renderField("fullName", "Full name", "text", "Your name", "name") : null}
        {mode === "signup" ? renderField("workspaceName", "Workspace name", "text", "Optional", "organization") : null}
        {renderField("email", "Email address", "email", "you@example.com", "email")}
        {mode !== "forgot-password" ? (
          <div className="auth-field auth-field--password">
            <div className="auth-label-row"><label htmlFor={fieldId("password")}>Password</label>{mode === "login" ? <Link href="/forgot-password">Forgot password?</Link> : null}</div>
            <div className="auth-password-field">
              <input
                id={fieldId("password")}
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={form.password}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? errorId("password") : undefined}
                onChange={(event) => updateField("password", event.target.value)}
              />
              <button className="auth-password-toggle" type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button>
            </div>
            {fieldErrors.password ? <p className="auth-field__error" id={errorId("password")}>{fieldErrors.password}</p> : null}
          </div>
        ) : null}
        <button className="auth-submit" type="submit" disabled={isSubmitting || rateLimitSeconds > 0} aria-busy={isSubmitting}>
          <span>{isSubmitting ? "Working…" : copy.submit}</span><span aria-hidden="true">↗</span>
        </button>
      </form>
      <div className="auth-form-footer">
        {mode === "login" ? <p>New to VOII? <Link href="/signup">Create an account</Link></p> : mode === "signup" ? <p>Already have an account? <Link href="/signin">Sign in</Link></p> : <p>Remembered your password? <Link href="/signin">Sign in</Link></p>}
        <span>By continuing, you agree to VOII&apos;s <Link href="/terms">terms</Link> and <Link href="/privacy">privacy policy</Link>.</span>
      </div>
    </div>
  );
}

export default function AuthPage({ mode }: { mode: AuthMode }) {
  return <AuthPageShell mode={mode}><AuthForm mode={mode} /></AuthPageShell>;
}
