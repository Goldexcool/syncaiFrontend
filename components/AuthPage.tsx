"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { Logo } from "@/components/SiteHeader";

type AuthMode = "login" | "signup" | "forgot-password";

const authContent: Record<AuthMode, { kicker: string; title: ReactNode; description: string; submit: string }> = {
  login: {
    kicker: "Welcome back",
    title: <>Keep the thread <em>moving.</em></>,
    description: "Return to the conversations, decisions, and next moves you kept close.",
    submit: "Sign in to VOII",
  },
  signup: {
    kicker: "Start with a conversation",
    title: <>Make space for the work <em>ahead.</em></>,
    description: "Create a calm place for what was said, what matters, and what comes next.",
    submit: "Create your account",
  },
  "forgot-password": {
    kicker: "Find your way back",
    title: <>Your work is still <em>here.</em></>,
    description: "Enter your email and we’ll send you a quiet way back into VOII.",
    submit: "Send reset link",
  },
};

function GoogleMark() {
  return <span className="auth-google-mark" aria-hidden="true">G</span>;
}

function AuthAside({ mode }: { mode: AuthMode }) {
  return (
    <aside className="auth-page__aside">
      <Link className="auth-page__logo" href="/" aria-label="VOII home"><Logo /></Link>
      <div className="auth-page__aside-copy">
        <p className="eyebrow">The work after the words</p>
        <h2>{mode === "forgot-password" ? <>Nothing important is <em>lost.</em></> : <>The conversation becomes <em>work.</em></>}</h2>
        <p>VOII keeps the useful part close — from what happened to what moves next.</p>
      </div>
      <div className="auth-page__aside-footer"><span>Conversation · Knowledge · Tasks · Momentum</span><span>01 — 04</span></div>
    </aside>
  );
}

function AuthForm({ mode }: { mode: AuthMode }) {
  const copy = authContent[mode];
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="auth-success" role="status">
        <span className="auth-success__mark">✓</span>
        <p className="eyebrow">{mode === "forgot-password" ? "Check your inbox" : "You’re ready"}</p>
        <h2>{mode === "forgot-password" ? <>A link is on its <em>way.</em></> : <>Welcome to the <em>thread.</em></>}</h2>
        <p>{mode === "forgot-password" ? "If an account exists for that address, you’ll receive instructions shortly." : "This prototype keeps the experience local. Your VOII workspace begins with the next conversation."}</p>
        <Link className="auth-secondary-link" href={mode === "forgot-password" ? "/login" : "/#story"}>{mode === "forgot-password" ? "Back to sign in" : "Enter your workspace"}<span aria-hidden="true">↗</span></Link>
      </div>
    );
  }

  return (
    <div className="auth-form-shell">
      <div className="auth-form-heading"><p className="eyebrow">{copy.kicker}</p><h1>{copy.title}</h1><p>{copy.description}</p></div>
      {mode !== "forgot-password" ? <button className="auth-google" type="button" onClick={() => setSubmitted(true)}><GoogleMark />Continue with Google<span aria-hidden="true">↗</span></button> : null}
      {mode !== "forgot-password" ? <div className="auth-divider"><span>or continue with email</span></div> : null}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="auth-email">Email address</label>
        <input id="auth-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
        {mode !== "forgot-password" ? <>
          <div className="auth-label-row"><label htmlFor="auth-password">Password</label>{mode === "login" ? <Link href="/forgot-password">Forgot password?</Link> : null}</div>
          <div className="auth-password-field"><input id="auth-password" name="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button></div>
        </> : null}
        <button className="auth-submit" type="submit">{copy.submit}<span aria-hidden="true">↗</span></button>
      </form>
      <div className="auth-form-footer">{mode === "login" ? <p>New to VOII? <Link href="/signup">Create an account</Link></p> : mode === "signup" ? <p>Already have an account? <Link href="/login">Sign in</Link></p> : <p>Remembered your password? <Link href="/login">Sign in</Link></p>}<span>By continuing, you agree to VOII’s terms and privacy policy.</span></div>
    </div>
  );
}

export default function AuthPage({ mode }: { mode: AuthMode }) {
  return <main className={`auth-page auth-page--${mode}`}><AuthAside mode={mode} /><section className="auth-page__main"><div className="auth-page__mobile-logo"><Link href="/" aria-label="VOII home"><Logo /></Link></div><AuthForm mode={mode} /></section></main>;
}
