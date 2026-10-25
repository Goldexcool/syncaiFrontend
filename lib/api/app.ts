import { apiClient, getAccessToken, request } from "@/lib/api/client";
import type { Meeting, Pagination, Project } from "@/lib/api/dashboard";

export type MeetingKind = "meeting" | "lecture";

export type MeetingDetail = Meeting & {
  kind?: MeetingKind;
  course?: { id: string; name: string; code?: string | null } | null;
};

export type ProcessingStatus = { status: string; stage: string; progress: number; message: string };

export type Summary = {
  short?: string | null;
  long?: string | null;
  notes?: string | null;
  decisions?: Array<{ title: string; description?: string }> | null;
  nextSteps?: Array<{ title: string; description?: string }> | null;
  questions?: Array<{ question: string; context?: string }> | null;
  topics?: string[] | null;
  model?: string | null;
};

export type Segment = { id: string; speaker: string; startSec: number; endSec: number; text: string };

export type ActionItem = {
  id: string;
  title: string;
  description?: string | null;
  ownerName?: string | null;
  dueDate?: string | null;
  priority: string;
  status: "pending_review" | "approved" | "rejected" | "converted";
  sourceQuote?: { text?: string; time?: number; speaker?: string | null } | null;
};

export type Course = { id: string; name: string; code?: string | null; lecturer?: string | null; keyterms: string[] };

export type BoardTask = { id: string; title: string; priority?: string; status?: string; dueDate?: string | null; labels?: string[]; sourceMeetingId?: string | null; assignees?: Array<{ user: { id?: string; fullName?: string | null; email?: string | null } }> };
export type BoardColumn = { id: string; name: string; order: number; tasks: BoardTask[] };
export type Board = { id: string; name: string; projectId: string; columns: BoardColumn[] };

export type Share = { id: string; publicUrl?: string; enabled: boolean; expiresAt?: string | null; includeTranscript: boolean };

export type PortalMessage = { id: string; comment: string; createdAt: string; authorName: string; fromTeam: boolean };
export type Portal = { id: string; slug: string; clientId: string; projectId?: string | null; isActive: boolean };

// ── Meetings ───────────────────────────────────────────────────────────────

export const getMeeting = (id: string) => apiClient.get<{ meeting: MeetingDetail }>(`/meetings/${id}`);
export const listMeetingsFull = () => apiClient.get<{ meetings: MeetingDetail[]; pagination: Pagination }>("/meetings?page=1&limit=50&sortBy=updatedAt&sortOrder=desc");
export const createMeetingFull = (payload: {
  title: string;
  source: "upload" | "meeting_link";
  provider?: "upload" | "google_meet" | "zoom" | "teams";
  meetingUrl?: string;
  kind: MeetingKind;
  courseId?: string;
}) => apiClient.post<{ meeting: MeetingDetail }>("/meetings", payload);
export const getProcessingStatus = (id: string) => apiClient.get<ProcessingStatus>(`/meetings/${id}/processing-status`);
export const reprocessMeeting = (id: string) => apiClient.post(`/meetings/${id}/reprocess`, {});
export const getSummary = (id: string) => apiClient.get<{ summary: Summary | null }>(`/meetings/${id}/summary`);
export const getTranscript = (id: string) => apiClient.get<{ segments: Segment[] }>(`/meetings/${id}/transcript?page=1&limit=500`);

/** Signed URL → PUT the file → tell the API it landed (which queues processing). */
export async function uploadRecording(meetingId: string, file: Blob, fileName: string, onProgress?: (fraction: number) => void) {
  const mimeType = file.type || "audio/webm";
  const { asset, upload } = await apiClient.post<{ asset: { id: string }; upload: { method: string; url: string; headers: Record<string, string> } }>(
    `/meetings/${meetingId}/upload-url`,
    { fileName, mimeType, sizeBytes: file.size, assetType: mimeType.startsWith("video/") ? "video" : "audio" },
  );
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(upload.method, upload.url);
    Object.entries(upload.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    // Local dev uploads go to our own API, which needs the session.
    const token = getAccessToken();
    if (token && upload.url.includes("/api/dev/")) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Upload failed — check your connection."));
    xhr.send(file);
  });
  return apiClient.post(`/meetings/${meetingId}/upload-complete`, { assetId: asset.id });
}

// ── Action items → board ───────────────────────────────────────────────────

export const listActionItems = (meetingId: string) => apiClient.get<{ actionItems: ActionItem[] }>(`/meetings/${meetingId}/action-items?page=1&limit=100`);
export const updateActionItem = (meetingId: string, itemId: string, payload: Partial<Pick<ActionItem, "status" | "title">>) =>
  apiClient.patch<{ actionItem: ActionItem }>(`/meetings/${meetingId}/action-items/${itemId}`, payload);
export const convertToTasks = (meetingId: string, payload: { itemIds: string[]; projectId: string; boardId: string; columnId: string }) =>
  apiClient.post<{ tasks: unknown[] }>(`/meetings/${meetingId}/action-items/convert-to-tasks`, payload);

// ── Projects / boards ──────────────────────────────────────────────────────

export const listAllProjects = () => apiClient.get<{ projects: Project[] }>("/projects?page=1&limit=50");
export const createProjectQuick = (name: string) => apiClient.post<{ project: Project }>("/projects", { name });
export const listBoards = (projectId: string) => apiClient.get<{ boards: Array<{ id: string; name: string }> }>(`/projects/${projectId}/boards`);
export const createBoard = (projectId: string, name: string) => apiClient.post<{ board: Board }>(`/projects/${projectId}/boards`, { name });
export const getBoard = (id: string) => apiClient.get<{ board: Board }>(`/boards/${id}`);
export const moveTask = (taskId: string, payload: { columnId: string; order: number }) => apiClient.patch(`/tasks/${taskId}/move`, payload);

// ── Courses ────────────────────────────────────────────────────────────────

export const listCourses = () => apiClient.get<{ courses: Course[] }>("/courses");
export const createCourse = (payload: { name: string; code?: string; lecturer?: string; keyterms?: string[] }) => apiClient.post<{ course: Course }>("/courses", payload);

// ── Bot ────────────────────────────────────────────────────────────────────

export const sendBot = (meetingId: string) => apiClient.post<{ botSession: { id: string; status: string } }>(`/meetings/${meetingId}/bot/join`, { botName: "VOII Notetaker" });
export const getBotStatus = (meetingId: string) => apiClient.get<{ botSession?: { status: string; failureReason?: string | null } | null }>(`/meetings/${meetingId}/bot/status`);

// ── Sharing ────────────────────────────────────────────────────────────────

export const createShare = (meetingId: string, payload: { includeTranscript: boolean; includeTasks: boolean; expiresAt?: string }) =>
  apiClient.post<{ share: Share }>(`/meetings/${meetingId}/share`, payload);
export const listShares = (meetingId: string) => apiClient.get<{ shares: Share[] }>(`/meetings/${meetingId}/shares`);
export const revokeShare = (meetingId: string, shareId: string) => apiClient.delete(`/meetings/${meetingId}/shares/${shareId}`);

// ── Client portal ──────────────────────────────────────────────────────────

export const listPortals = (clientId: string) => apiClient.get<{ portals: Portal[] }>(`/portals?clientId=${clientId}`);
export const createPortal = (payload: { clientId: string; projectId?: string }) =>
  apiClient.post<{ portal: Portal; publicUrl: string }>("/portals", { ...payload, accessMode: "public_link" });
export const listPortalMessages = (portalId: string) => apiClient.get<{ messages: PortalMessage[] }>(`/portals/${portalId}/messages`);
export const replyToPortal = (portalId: string, comment: string) => apiClient.post(`/portals/${portalId}/messages`, { comment });

// ── Public (no session) ────────────────────────────────────────────────────

const noAuth = (path: string, init?: RequestInit) => request(path, { ...init, credentials: "omit" });

export type PublicPortal = {
  portal: { slug: string; client: { name: string; companyName?: string | null }; project?: { name: string } | null };
  tasks: Array<{ id: string; title: string; status: string; dueDate?: string | null; updatedAt: string; column?: { name: string } | null }>;
  messages: PortalMessage[];
};
export const getPublicPortal = (slug: string) => noAuth(`/public/portals/${slug}`) as Promise<PublicPortal>;
export const postPortalMessage = (slug: string, comment: string, name?: string) =>
  noAuth(`/public/portals/${slug}/messages`, { method: "POST", body: JSON.stringify({ comment, name }) });

export type PublicShare = {
  passwordRequired?: boolean;
  share?: { title?: string | null; expiresAt?: string | null };
  meeting?: {
    title: string;
    kind?: MeetingKind;
    durationSec?: number | null;
    startedAt?: string | null;
    summary?: Summary | null;
    actionItems: ActionItem[];
    transcript: Segment[];
    tasks: Array<{ id: string; title: string; status: string }>;
  };
};
export const getPublicShare = (token: string) => noAuth(`/share/${token}`) as Promise<PublicShare>;

// ── Tasks (board detail panel) ─────────────────────────────────────────────

export type TaskDetail = BoardTask & {
  description?: string | null;
  labels?: string[];
  columnId?: string | null;
  assignees?: Array<{ user: { id: string; fullName?: string | null; email?: string | null } }>;
};
export type TaskComment = { id: string; body: string; createdAt: string; user: { fullName?: string | null; email?: string | null } };

export const getTask = (id: string) => apiClient.get<{ task: TaskDetail }>(`/tasks/${id}`);
export const createBoardTask = (payload: { title: string; projectId: string; boardId: string; columnId: string; priority?: string }) =>
  apiClient.post<{ task: TaskDetail }>("/tasks", payload);
export const patchTask = (id: string, payload: Partial<{ title: string; description: string; priority: string; dueDate: string | null; labels: string[]; assigneeIds: string[] }>) =>
  apiClient.patch<{ task: TaskDetail }>(`/tasks/${id}`, payload);
export const listTaskComments = (id: string) => apiClient.get<{ comments: TaskComment[] }>(`/tasks/${id}/comments?page=1&limit=100`);
export const addTaskComment = (id: string, body: string) => apiClient.post<{ comment: TaskComment }>(`/tasks/${id}/comments`, { body });
