import { apiClient } from "@/lib/api/client";

type Page = { pagination: { page: number; total: number; totalPages: number } };

export type AdminStats = {
  users: { total: number; active: number; suspended: number; newToday: number; newThisWeek: number };
  workspaces: { total: number; active: number; suspended: number; newToday: number; newThisWeek: number };
  meetings: { total: number; createdToday: number; createdThisWeek: number };
  processingJobs: { queued: number; processing: number; completed: number; failed: number };
};
export type AdminHealth = { status: string; checks: { rabbitmq?: { queues?: Array<{ name: string; messages: number; consumers: number }> } } & Record<string, unknown> };
export type AdminUser = { id: string; fullName: string | null; email: string; platformRole: string; status: string; emailVerified: boolean; lastLoginAt: string | null; createdAt: string };
export type AdminWorkspace = { id: string; name: string; plan: string; type: "team" | "student" | "agency" | null; status: string; memberCount: number; meetingCount: number; createdAt: string; owner?: { email: string } | null };
export type AdminJob = { id: string; status: string; attempts: number; errorMessage: string | null; meetingId: string | null; queuedAt: string | null };
export type AdminLog = { id: string; action: string; entityType: string; createdAt: string; adminUser?: { email: string } | null };

const qs = (page: number, search?: string) => `?page=${page}&limit=25${search ? `&search=${encodeURIComponent(search)}` : ""}`;

export const getAdminStats = () => apiClient.get<AdminStats>("/admin/stats");
export const getAdminHealth = () => apiClient.get<AdminHealth>("/admin/system/health");
export const listAdminUsers = (page: number, search: string) => apiClient.get<Page & { users: AdminUser[] }>(`/admin/users${qs(page, search)}`);
export const setAdminUserStatus = (id: string, status: string) => apiClient.patch(`/admin/users/${id}/status`, { status });
export const listAdminWorkspaces = (page: number, search: string) => apiClient.get<Page & { workspaces: AdminWorkspace[] }>(`/admin/workspaces${qs(page, search)}`);
export const setAdminWorkspaceStatus = (id: string, status: string) => apiClient.patch(`/admin/workspaces/${id}/status`, { status });
export const setAdminWorkspaceType = (id: string, type: string) => apiClient.patch(`/admin/workspaces/${id}/type`, { type });
export const listAdminJobs = (page: number) => apiClient.get<Page & { jobs: AdminJob[] }>(`/admin/processing-jobs${qs(page)}`);
export const retryAdminJob = (id: string) => apiClient.post(`/admin/processing-jobs/${id}/retry`);
export const listAdminLogs = (page: number) => apiClient.get<Page & { logs: AdminLog[] }>(`/admin/audit-logs${qs(page)}`);
