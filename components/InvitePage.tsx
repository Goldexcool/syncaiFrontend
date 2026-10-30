"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthPageShell, AuthStatePanel } from "@/components/AuthPage";
import { useAuth } from "@/components/AuthProvider";
import { ApiRequestError } from "@/lib/api/client";
import { acceptInvite, getInvite, type InviteDetails } from "@/lib/api/auth";

/**
 * The landing page for a team invite email. Anyone can read who invited them;
 * joining needs an account with the invited address, so signed-out visitors are
 * sent to sign up / sign in and returned here afterwards.
 */
export default function InvitePage({ token }: { token: string }) {
  return <AuthPageShell mode="signup" className="auth-page--state"><InviteContent token={token} /></AuthPageShell>;
}

function InviteContent({ token }: { token: string }) {
  const router = useRouter();
  const { isAuthenticated, isInitialized, user, refreshUser } = useAuth();
  const [details, setDetails] = useState<InviteDetails | null>(null);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    getInvite(token).then(setDetails).catch((e) => setError(
      e instanceof ApiRequestError && e.status === 404
        ? "This invite link is no longer valid. It may have expired, been cancelled, or already been used."
        : e instanceof ApiRequestError ? e.message : "We couldn’t reach VOII. Check your connection and try again.",
    ));
  }, [token]);

  async function join() {
    setJoining(true);
    setError("");
    try {
      await acceptInvite(token);
      await refreshUser().catch(() => undefined);
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Couldn’t join the workspace. Try again.");
      setJoining(false);
    }
  }

  const back = `?returnTo=${encodeURIComponent(`/invite/${token}`)}`;

  if (!details) {
    return (
      <AuthStatePanel>
        <p className="eyebrow">Team invite</p>
        {error ? <><h1>Invite <em>unavailable.</em></h1><p role="alert">{error}</p><Link className="auth-secondary-link" href="/">Go to VOII <span aria-hidden="true">→</span></Link></>
          : <><h1>Opening your <em>invite.</em></h1><p role="status">One moment.</p></>}
      </AuthStatePanel>
    );
  }

  const inviter = details.inviter.fullName || details.inviter.email;
  const wrongAccount = isAuthenticated && user && user.email.toLowerCase() !== details.invite.email.toLowerCase();

  return (
    <AuthStatePanel>
      <p className="eyebrow">Team invite</p>
      <h1>Join <em>{details.workspace.name}.</em></h1>
      <p>{inviter} invited <strong>{details.invite.email}</strong> to join as {details.invite.role.toLowerCase()}.</p>
      {error ? <p className="auth-form__alert" role="alert">{error}</p> : null}
      {!isInitialized ? null : !isAuthenticated ? (
        <div className="av-actions">
          <Link className="auth-submit" href={`/signup${back}&email=${encodeURIComponent(details.invite.email)}`}><span>Create an account</span><span aria-hidden="true">→</span></Link>
          <Link className="auth-secondary-link" href={`/signin${back}`}>I already have an account <span aria-hidden="true">→</span></Link>
        </div>
      ) : wrongAccount ? (
        <p className="av-note">You’re signed in as {user.email}. Sign out and sign in as {details.invite.email} to accept.</p>
      ) : (
        <button className="auth-submit" disabled={joining} onClick={join} type="button">
          <span>{joining ? "Joining…" : `Join ${details.workspace.name}`}</span><span aria-hidden="true">→</span>
        </button>
      )}
    </AuthStatePanel>
  );
}
