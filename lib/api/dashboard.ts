import { apiClient, request } from "@/lib/api/client";

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PersonReference = {
  id: string;
  fullName?: string | null;
  email?: string | null;
};

export type Meeting = {
  id: string;
  title: string;
  description?: string | null;
  source?: string | null;
  provider?: string | null;
  status?: string | null;
  meetingUrl?: string | null;
  scheduledAt?: string | null;
  durationSec?: number | null;
  tags?: string[];
  shortSummary?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: PersonReference | null;
  _count?: { participants?: number };
  participantCount?: number;
  participants?: Array<{ id: string; name: string; email?: string | null; role?: string | null }>;
}

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  priority?: "urgent" | "high" | "medium" | "low" | string | null;
  status?: "todo" | "in_progress" | "in_review" | "done" | "cancelled" | string | null;
  dueDate?: string | null;
  labels?: string[];
  projectId?: string | null;
  boardId?: string | null;
  columnId?: string | null;
  sourceMeetingId?: string | null;
  sourceActionItemId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: PersonReference | null;
  assignees?: Array<{ user: PersonReference; assignedAt?: string }>;
};

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  createdAt?: string;
  updatedAt?: string;
  boardCount?: number;
  taskCount?: number;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: string;
  endAt: string;
  meetingUrl?: string | null;
  meetingProvider?: string | null;
  attendeeCount?: number | null;
  botEnabled?: boolean;
  meetingId?: string | null;
};

export type Client = {
  id: string;
  name: string;
  companyName?: string | null;
  contactEmail?: string | null;
  status?: "active" | "inactive" | string | null;
  contactCount?: number;
  projectCount?: number;
  createdAt?: string;
};

export type WorkspaceMember = {
  id: string;
  role: string;
  joinedAt?: string;
  user: PersonReference & { avatarUrl?: string | null };
};

export type Integration = {
  id: string;
  type: string;
  provider?: string | null;
  status?: string | null;
  externalEmail?: string | null;
  connectedAt?: string | null;
  disconnectedAt?: string | null;
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: { href?: string } | null;
  meetingId?: string | null;
  taskId?: string | null;
};

function queryString(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const result = params.toString();
  return result ? `?${result}` : "";
}

export async function createMeeting(payload: {
  title: string;
  description?: string;
  source: "manual" | "meeting_link" | "calendar_event" | "upload";
  provider?: "manual" | "upload" | "google_meet" | "zoom" | "teams";
  meetingUrl?: string;
  scheduledAt?: string;
}) {
  return apiClient.post<{ meeting: Meeting }>("/meetings", payload);
}

export async function listTasks(limit = 20, sortBy: "createdAt" | "dueDate" = "dueDate") {
  return apiClient.get<{ tasks: Task[]; pagination: Pagination }>(
    `/tasks${queryString({ page: 1, limit, sortBy, sortOrder: sortBy === "dueDate" ? "asc" : "desc" })}`,
  );
}

export async function updateTask(id: string, payload: { status?: string; title?: string; priority?: string; dueDate?: string | null }) {
  return apiClient.patch<{ task: Task }>(`/tasks/${id}`, payload);
}

export async function createTask(payload: {
  title: string;
  description?: string;
  priority?: "urgent" | "high" | "medium" | "low";
  status?: "todo" | "in_progress" | "in_review" | "done" | "cancelled";
  dueDate?: string;
  projectId?: string;
  sourceMeetingId?: string;
}) {
  return apiClient.post<{ task: Task }>("/tasks", payload);
}

export async function listProjects(limit = 8) {
  return apiClient.get<{ projects: Project[]; pagination: Pagination }>(
    `/projects${queryString({ page: 1, limit, sortBy: "createdAt", sortOrder: "desc" })}`,
  );
}

export async function createProject(payload: { name: string; description?: string }) {
  return apiClient.post<{ project: Project }>("/projects", payload);
}

export async function createClient(payload: { name: string; companyName?: string; contactEmail?: string }) {
  return apiClient.post<{ client: Client }>("/clients", payload);
}

export async function inviteWorkspaceMember(payload: { email: string; role: "ADMIN" | "MEMBER" }) {
  return apiClient.post<{ invite: { id: string; email: string; role: string; expiresAt: string } }>("/workspaces/me/members/invite", payload);
}

export async function listCalendarEvents(limit = 8) {
  return apiClient.get<{ events: CalendarEvent[]; pagination: Pagination }>(
    `/calendar/events${queryString({ page: 1, limit })}`,
  );
}

export async function listClients(limit = 8) {
  return apiClient.get<{ clients: Client[]; pagination: Pagination }>(
    `/clients${queryString({ page: 1, limit, sortBy: "createdAt", sortOrder: "desc" })}`,
  );
}

export async function listWorkspaceMembers() {
  return apiClient.get<{ members: WorkspaceMember[] }>("/workspaces/me/members");
}

export async function listNotifications(limit = 5) {
  return apiClient.get<{ notifications: Notification[]; pagination: Pagination }>(
    `/notifications${queryString({ page: 1, limit, read: "false" })}`,
  );
}

export async function getUnreadNotificationCount() {
  return apiClient.get<{ count: number }>("/notifications/unread-count");
}

export async function markNotificationRead(id: string) {
  return apiClient.patch<{ notification: Notification }>(`/notifications/${id}/read`, {});
}

export async function markAllNotificationsRead() {
  return apiClient.post<{ updatedCount: number }>("/notifications/read-all", {});
}

export async function listIntegrations() {
  return apiClient.get<{ integrations: Integration[] }>("/integrations");
}

export async function getGoogleCalendarAuthUrl() {
  return apiClient.get<{ authUrl: string }>("/integrations/google-calendar/auth-url");
}

export async function disconnectGoogleCalendar() {
  return apiClient.delete<void>("/integrations/google-calendar");
}

// ── Account + members (Settings) ─────────────────────────────────────────────

export function updateProfile(payload: { fullName: string }) {
  return apiClient.patch<{ user: { fullName: string } }>("/users/me", payload);
}

export function changePassword(payload: { currentPassword: string; newPassword: string }) {
  return apiClient.post<unknown>("/users/me/change-password", payload);
}

/** Soft-deactivates the account. The API wants the password and the word DELETE. */
export function deleteAccount(password: string) {
  return request<unknown>("/users/me", { method: "DELETE", body: JSON.stringify({ password, confirm: "DELETE" }) });
}

export type NotificationPreference = { type: string; channel: "in_app" | "email"; enabled: boolean };

export function getNotificationPreferences() {
  return apiClient.get<{ preferences: NotificationPreference[] }>("/notifications/preferences");
}

export function saveNotificationPreferences(preferences: NotificationPreference[]) {
  return apiClient.put<{ preferences: NotificationPreference[] }>("/notifications/preferences", { preferences });
}

export type PendingInvite = { id: string; email: string; role: string; expiresAt: string; createdAt: string };

export function listPendingInvites() {
  return apiClient.get<{ invites: PendingInvite[] }>("/workspaces/me/invites");
}

export function cancelInvite(inviteId: string) {
  return apiClient.delete<unknown>(`/workspaces/me/invites/${inviteId}`);
}

export function updateMemberRole(userId: string, role: "ADMIN" | "MEMBER") {
  return apiClient.patch<unknown>(`/workspaces/me/members/${userId}`, { role });
}

export function removeMember(userId: string) {
  return apiClient.delete<unknown>(`/workspaces/me/members/${userId}`);
}

/** Pull fresh events from Google. Resolves when the worker finishes (or after ~20s). */
export async function syncCalendarNow() {
  const { jobId } = await apiClient.post<{ jobId: string }>("/calendar/sync", {});
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const { status } = await apiClient.get<{ status: { status: string } | null }>(`/calendar/sync/status/${jobId}`);
    if (status && ["completed", "failed"].includes(status.status)) return status.status;
  }
  return "pending";
}
