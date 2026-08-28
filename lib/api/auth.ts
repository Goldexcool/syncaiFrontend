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
  workspaceId?: string;
};

export type Workspace = {
  id: string;
  name: string;
  slug?: string;
  role?: string;
  plan?: string;
  status?: string;
};

export type AuthData = {
  user: User;
  workspace?: Workspace | null;
  accessToken: string;
  refreshToken?: string;
};

export type CurrentUserData = {
  user: User;
};

export type CurrentWorkspaceData = {
  workspace: Workspace;
  member: {
    role: string;
    joinedAt: string;
  };
  memberCount: number;
};

export function registerUser(payload: {
  fullName: string;
  email: string;
  password: string;
  workspaceName?: string;
}) {
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

export function getCurrentUser() {
  return apiClient.get<CurrentUserData>("/users/me");
}

export function getCurrentWorkspace() {
  return apiClient.get<CurrentWorkspaceData>("/workspaces/me");
}

/**
 * Confirms an email address with the six-digit code from the verification email.
 * The address is required because a six-digit code is not unique on its own.
 */
export function verifyEmail(email: string, code: string) {
  return apiClient.post<void>("/auth/verify-email", { email, code });
}

export function resendVerificationEmail(email: string) {
  return apiClient.post<void>("/auth/resend-verification", { email });
}

export function forgotPassword(email: string) {
  return apiClient.post<void>("/auth/forgot-password", { email });
}

// Reset uses a 6-digit code now, scoped to the email it was sent to.
export function resetPassword(payload: { email: string; code: string; password: string }) {
  return apiClient.post<void>("/auth/reset-password", payload);
}

export type UsagePath = "meeting_notes" | "task_boards" | "both";

export function saveUsagePath(usagePath: UsagePath) {
  return apiClient.post<{ user: User }>("/auth/onboarding/usage-path", { usagePath });
}
