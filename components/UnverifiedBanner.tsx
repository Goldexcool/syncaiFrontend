"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ApiRequestError } from "@/lib/api/client";
import { resendVerificationEmail } from "@/lib/api/auth";

/**
 * Nothing server-side gates on verification today, so an unverified address is a
 * nudge rather than a wall. It shows once the user record has actually loaded —
 * before that, emailVerified is simply unknown, and flashing a warning at a
 * verified user is worse than showing nothing for a beat.
 */
export default function UnverifiedBanner() {
  const { user } = useAuth();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!user || user.emailVerified !== false) return null;

  async function resend() {
    if (!user?.email) return;
    setState("sending");
    try {
      await resendVerificationEmail(user.email);
      setState("sent");
    } catch (error) {
      setMessage(error instanceof ApiRequestError ? error.message : "Couldn’t send that just now. Try again shortly.");
      setState("error");
    }
  }

  return (
    <aside className="verify-banner" role="status">
      <span className="verify-banner__dot" aria-hidden="true" />
      <p>
        {state === "sent"
          ? <>A new link is on its way to <strong>{user.email}</strong>. It’s good for 24 hours.</>
          : <>Confirm <strong>{user.email}</strong> to secure your account. Everything works in the meantime.</>}
      </p>
      {state === "sent" ? null : (
        <button onClick={resend} type="button" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Resend link"}
        </button>
      )}
      {state === "error" ? <span className="verify-banner__error">{message}</span> : null}
    </aside>
  );
}
