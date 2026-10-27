import { apiClient, refreshAccessToken } from "@/lib/api/client";

export type User = {
  id?: string;
  sub?: string;
  fullName?: string;
  email: string;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  usagePath?: string | null;
  platformRole?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Workspace = {
  id: string;
  name: string;
  slug?: string;
  role?: string;
  plan?: string;
  status?: string;
  actionItemAutoApprove?: AutoApprove;
  vocabulary?: string[];
};

export type AutoApprove = "off" | "confident" | "all";

/**
 * `workspace` is null until the user first touches a workspace-scoped endpoint.
 * Registration never returns one, and login only does if the account already has
 * a workspace — so this is nullable everywhere, not optional.
 */
export type AuthData = {
  user: User;
  workspace: Workspace | null;
  accessToken: string;
  /**
   * Also delivered as the httpOnly `sync_refresh_token` cookie, which is what the
   * browser actually uses. This field exists for non-browser clients; web code
   * should ignore it rather than persist a long-lived credential in JS.
   */
  refreshToken?: string;
};

export type CurrentUserData = {
  user: User;
  workspace: Workspace | null;
};

export type CurrentWorkspaceData = {
  workspace: Workspace;
  member: {
    role: string;
    joinedAt: string;
  };
  memberCount: number;
};

/** Creates a user only — no workspace. See ensureWorkspace. */
export function registerUser(payload: { fullName: string; email: string; password: string }) {
  return apiClient.post<AuthData>("/auth/register", payload);
}

export function loginUser(payload: { email: string; password: string }) {
  return apiClient.post<AuthData>("/auth/login", payload);
}

export function logoutUser() {
  return apiClient.post<void>("/auth/logout", {});
}

export function refreshSession() {
  return refreshAccessToken().then((accessToken) => ({ accessToken }));
}

/**
 * Reads the database live rather than echoing the JWT, so a name change,
 * verification or role change lands without a re-login. Does not create a
 * workspace — it reports null until one exists.
 */
export function getCurrentUser() {
  return apiClient.get<CurrentUserData>("/auth/me");
}

/**
 * The call that lazily creates the workspace. Anything that only wants to *read*
 * workspace state should use getCurrentUser instead, or a user who has not
 * finished onboarding silently gets a default-named workspace behind their back.
 */
export function ensureWorkspace() {
  return apiClient.get<CurrentWorkspaceData>("/workspaces/me");
}

export function setAutoApprove(actionItemAutoApprove: AutoApprove) {
  return apiClient.patch<CurrentWorkspaceData>("/workspaces/me", { actionItemAutoApprove });
}

export function setVocabulary(vocabulary: string[]) {
  return apiClient.patch<CurrentWorkspaceData>("/workspaces/me", { vocabulary });
}

export function renameWorkspace(name: string) {
  return apiClient.patch<CurrentWorkspaceData>("/workspaces/me", { name });
}

/**
 * Confirms an email address with the token from the verification link.
 * The token is 64 hex characters and single-use; it carries the identity, so no
 * email address is needed alongside it.
 */
export function verifyEmail(token: string) {
  return apiClient.post<void>("/auth/verify-email", { token });
}

export function resendVerificationEmail(email: string) {
  return apiClient.post<void>("/auth/resend-verification", { email });
}

export function forgotPassword(email: string) {
  return apiClient.post<void>("/auth/forgot-password", { email });
}

/**
 * Succeeding here revokes every refresh token the user has, so the caller must
 * treat the session as gone and send them to sign in.
 */
export function resetPassword(payload: { token: string; password: string }) {
  return apiClient.post<void>("/auth/reset-password", payload);
}

export type UsagePath = "meeting_notes" | "task_boards" | "both";

/** A personalisation preference. It must never gate access to a feature. */
export function saveUsagePath(usagePath: UsagePath) {
  return apiClient.post<{ user: User }>("/auth/onboarding/usage-path", { usagePath });
}

/** The link tokens are 32 random bytes, rendered as 64 hex characters. */
export const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

export function isWellFormedToken(token: string | null | undefined): token is string {
  return typeof token === "string" && TOKEN_PATTERN.test(token);
}
