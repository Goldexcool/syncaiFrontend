"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Logo } from "@/components/SiteHeader";
import { forgotPassword, loginUser, registerUser } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";

export type AuthMode = "login" | "signup" | "forgot-password" | "reset-password";
type FormField = "fullName" | "email" | "password";
type FormState = Record<FormField, string>;

/** Auth in the Dusk language: the form on paper, a note card on the dusk sky beside it. */
const authContent: Record<AuthMode, { step: string; kicker: string; title: ReactNode; description: string; submit: string }> = {
  login: {
    step: "01",
    kicker: "Sign in",
    title: <>Pick the thread back <em>up.</em></>,
    description: "Your recordings, decisions, tasks and follow-ups are where you left them.",
    submit: "Sign in to VOII",
  },
  signup: {
    step: "01",
    kicker: "Create account",
    title: <>Start with one <em>conversation.</em></>,
    description: "Record it once. VOII returns the decisions, the owners and the dates — sourced, and linked back to the words.",
    submit: "Create your account",
  },
  "forgot-password": {
    step: "01",
    kicker: "Recover access",
    title: <>Your work is still <em>here.</em></>,
    description: "Enter your email and we’ll send a link back into VOII. It stays good for an hour.",
    submit: "Email me a reset link",
  },
  "reset-password": {
    step: "02",
    kicker: "Reset password",
    title: <>Choose a new <em>password.</em></>,
    description: "Pick something you’ll keep. Setting it signs out every other device.",
    submit: "Update password",
  },
};

const initialForm: FormState = { fullName: "", email: "", password: "" };

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
  return errors;
}

/** Three filled bars, in the three canvas colours. Length carries most of the
 *  weight because it is the only rule the backend actually enforces. */
function strengthOf(password: string) {
  if (!password) return { score: 0, label: "" };
  let score = password.length >= 8 ? 1 : 0;
  if (password.length >= 12) score += 1;
  if (/[^A-Za-z0-9]/.test(password) || (/[A-Z]/.test(password) && /[0-9]/.test(password))) score += 1;
  return { score, label: ["Too short", "Workable", "Good", "Strong"][score] };
}

export function AuthPageShell({
  mode,
  children,
  className = "",
}: {
  mode: AuthMode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={`av av--${mode} ${className}`.trim()} id="main-content">
      <section className="av__col">
        <header className="av__top">
          <Link className="av__logo" href="/" aria-label="VOII home"><Logo /></Link>
          <Link className="av__back" href="/"><span aria-hidden="true">←</span> Back to home</Link>
        </header>

        <div className="av__body">{children}</div>

        <footer className="av__base">
          <span>© VOII</span>
          <span className="av__legal">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </span>
        </footer>
      </section>

      <aside className="av__aside" aria-hidden="true">
        <p className="av__quote">Sit at the back. <em>Hear the front.</em></p>
        <div className="av__card">
          <div className="win__bar"><span>Lectures / MTH 201</span><span className="chip chip--sage"><span className="dot" />Speaker isolated</span></div>
          <p className="win__title">Integration by parts</p>
          <div className="formula"><div className="formula__eq">∫ u dv = uv − ∫ v du</div><span className="src">12:04 · stated on the board</span></div>
          <div className="row-item"><span>Problem set 4 · Q1–9</span><span className="chip chip--peach">Due Fri</span></div>
        </div>
      </aside>
    </main>
  );
}

export function AuthStatePanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`auth-state-panel av-panel ${className}`.trim()}>{children}</div>;
}

/** The heading block every auth route shares, so a code-entry screen and the
 *  sign-in screen sit at the same optical height. */
export function AuthHeading({ mode }: { mode: AuthMode }) {
  const copy = authContent[mode];
  return (
    <div className="auth-form-heading av-head">
      <p className="eyebrow av-step"><b>{copy.step}</b>{copy.kicker}</p>
      <h1>{copy.title}</h1>
      <p>{copy.description}</p>
    </div>
  );
}

/**
 * Shown after /auth/forgot-password. The endpoint returns the same 200 and the
 * same message whether or not the account exists, so this copy is careful to
 * describe what we asked for, never what was delivered.
 */
function ResetLinkSent({ email, onResend }: { email: string; onResend: () => void }) {
  return (
    <div className="auth-state-panel av-panel">
      <span className="auth-success__mark" aria-hidden="true">✓</span>
      <p className="eyebrow">Check your inbox</p>
      <h1>A way back is <em>on its way.</em></h1>
      <p>
        If an account exists for <strong>{email}</strong>, we’ve sent it a reset link.
        It works once and expires in an hour.
      </p>
      <p className="av-note">
        Nothing in your inbox after a few minutes? Check spam, then request another —
        each new link cancels the one before it.
      </p>
      <div className="av-actions">
        <button className="auth-secondary-link" onClick={onResend} type="button">
          Use a different address <span aria-hidden="true">→</span>
        </button>
        <Link className="auth-secondary-link" href="/signin">
          Back to sign in <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
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
  const [sentTo, setSentTo] = useState("");
  const strength = useMemo(() => strengthOf(form.password), [form.password]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    if (email) setForm((current) => ({ ...current, email }));
    // A password must never sit in the address bar (history, autocomplete, logs). If an old
    // link or a no-JS submit put it there, scrub it immediately and never use it.
    if (params.has("password")) {
      params.delete("password");
      const query = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    }
  }, []);

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
        // A workspace may not exist yet — onboarding is what creates it.
        router.push(data.workspace ? getSafeReturnPath() : "/onboarding");
      } else if (mode === "signup") {
        const data = await registerUser({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
        });
        setAuth(data);
        // Registration signs the user in even though the address is unverified,
        // and nothing server-side gates on verification — so they go straight to
        // onboarding and are nudged about the email by a banner, not a wall.
        router.push("/onboarding");
      } else {
        await forgotPassword(form.email.trim());
        // The API answers identically whether or not the address is registered,
        // so the confirmation must never claim the mail definitely went out.
        setSentTo(form.email.trim());
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
  const renderField = (field: FormField, label: string, type: string, placeholder: string, autoComplete: string, hint?: string) => (
    <div className="auth-field" key={field}>
      <div className="auth-label-row">
        <label htmlFor={fieldId(field)}>{label}</label>
        {hint ? <span className="auth-field__hint">{hint}</span> : null}
      </div>
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

  if (sentTo) return <ResetLinkSent email={sentTo} onResend={() => setSentTo("")} />;

  return (
    <div className="auth-form-shell av-panel">
      <AuthHeading mode={mode} />

      {formError ? <p className="auth-form__alert" role="alert">{formError}</p> : null}
      {rateLimitSeconds > 0 ? <p className="auth-form__status" role="status">Try again in {rateLimitSeconds}s.</p> : null}

      <form method="post" className="auth-form" onSubmit={handleSubmit} noValidate>
        {mode === "signup" ? renderField("fullName", "Full name", "text", "Your name", "name") : null}
        {renderField("email", "Email address", "email", "you@example.com", "email")}

        {mode !== "forgot-password" ? (
          <div className="auth-field auth-field--password">
            <div className="auth-label-row">
              <label htmlFor={fieldId("password")}>Password</label>
              {mode === "login" ? <Link href="/forgot-password">Forgot password?</Link> : null}
            </div>
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
            {mode === "signup" && form.password ? (
              <p className="av-meter" data-score={strength.score}>
                <i /><i /><i />
                <span>{strength.label}</span>
              </p>
            ) : null}
            {fieldErrors.password ? <p className="auth-field__error" id={errorId("password")}>{fieldErrors.password}</p> : null}
          </div>
        ) : null}

        <button className="auth-submit" type="submit" disabled={isSubmitting || rateLimitSeconds > 0} aria-busy={isSubmitting}>
            <span>{isSubmitting ? "Working…" : copy.submit}</span><span aria-hidden="true">→</span>
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
  return (
    <AuthPageShell mode={mode}>
      <AuthForm mode={mode} />
    </AuthPageShell>
  );
}
