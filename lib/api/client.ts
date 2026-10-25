export type ApiFieldError = {
  field: string;
  message: string;
};

/** Error codes the API returns that the client reacts to structurally. */
export const API_ERROR_CODES = {
  NETWORK: "NETWORK_ERROR",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_TOKEN: "INVALID_TOKEN",
  AUTH_REQUIRED: "AUTH_REQUIRED",
  REFRESH_TOKEN_MISSING: "REFRESH_TOKEN_MISSING",
  REFRESH_TOKEN_INVALID: "REFRESH_TOKEN_INVALID",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",
  ACCOUNT_DEACTIVATED: "ACCOUNT_DEACTIVATED",
  VALIDATION: "VALIDATION_ERROR",
  RATE_LIMIT: "RATE_LIMIT_EXCEEDED",
  PLAN_LIMIT: "PLAN_LIMIT_EXCEEDED",
  VERIFICATION_TOKEN_INVALID: "VERIFICATION_TOKEN_INVALID",
  EMAIL_ALREADY_VERIFIED: "EMAIL_ALREADY_VERIFIED",
  RESET_TOKEN_INVALID: "RESET_TOKEN_INVALID",
} as const;

export class ApiRequestError extends Error {
  readonly status?: number;
  /** Machine-readable code from the API. `NETWORK_ERROR` when the request never landed. */
  readonly code?: string;
  /** Correlation id from the API — quote this in bug reports. */
  readonly requestId?: string;
  /** Seconds the server asked us to wait, from the Retry-After header. */
  readonly retryAfter?: number;
  readonly fieldErrors: Record<string, string>;

  constructor(
    message: string,
    status?: number,
    errors: ApiFieldError[] = [],
    options: { code?: string; requestId?: string; retryAfter?: number } = {},
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = options.code;
    this.requestId = options.requestId;
    this.retryAfter = options.retryAfter;
    this.fieldErrors = Object.fromEntries(errors.map((error) => [error.field, error.message]));
  }

  /** The request never reached the server (offline, DNS, connection refused). */
  get isNetworkError() {
    return this.status === undefined;
  }

  /** A temporary condition — the same request is worth sending again. */
  get isRetryable() {
    return this.isNetworkError || this.status === 503 || this.status === 504;
  }

  /** The session is gone for good; the user has to sign in again. */
  get isSessionExpired() {
    return this.status === 401 || this.code === API_ERROR_CODES.TOKEN_EXPIRED;
  }

  /** The account itself is blocked — signing in again will not help. */
  get isAccountBlocked() {
    return (
      this.code === API_ERROR_CODES.ACCOUNT_SUSPENDED ||
      this.code === API_ERROR_CODES.ACCOUNT_DEACTIVATED
    );
  }
}

type ApiPayload = {
  success?: boolean;
  message?: string;
  code?: string;
  requestId?: string;
  data?: unknown;
  errors?: ApiFieldError[];
};

export type RequestOptions = {
  /**
   * Retry once more on 503/504/network failure. GET requests do this by
   * default; anything that writes must opt in, because a 503 does not
   * guarantee the server never applied the change.
   */
  retry?: boolean;
  /** Retry attempts after the first try. Defaults to 2 for GET, 0 otherwise. */
  maxRetries?: number;
};

const configuredApiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "");
const DEFAULT_GET_RETRIES = 2;
const MAX_BACKOFF_MS = 8000;

let accessToken: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;
let onSessionExpired: (() => void) | null = null;

function getApiBaseUrl() {
  if (typeof window !== "undefined" && !["localhost", "127.0.0.1"].includes(window.location.hostname) && configuredApiBaseUrl.includes("localhost")) {
    return "/api";
  }
  return configuredApiBaseUrl;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

/**
 * Registers a single app-level callback fired when the session cannot be
 * recovered, so redirecting to sign-in lives in one place instead of in
 * every component's catch block.
 */
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

function expireSession() {
  clearAccessToken();
  onSessionExpired?.();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function shouldAttemptRefresh(path: string) {
  return ![
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/logout",
    "/auth/verify-email",
    "/auth/resend-verification",
    "/auth/forgot-password",
    "/auth/reset-password",
  ].includes(path);
}

async function readPayload(response: Response): Promise<ApiPayload | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    const parsed: unknown = JSON.parse(text);
    return isRecord(parsed) ? (parsed as ApiPayload) : null;
  } catch {
    return null;
  }
}

function parseRetryAfter(response: Response): number | undefined {
  const header = response.headers.get("Retry-After");
  if (!header) return undefined;

  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);

  // Retry-After also allows an HTTP date.
  const timestamp = Date.parse(header);
  return Number.isNaN(timestamp) ? undefined : Math.max(0, Math.round((timestamp - Date.now()) / 1000));
}

function errorForResponse(response: Response, payload: ApiPayload | null) {
  const meta = {
    code: payload?.code,
    // The API echoes X-Request-Id even on responses with no JSON body.
    requestId: payload?.requestId ?? response.headers.get("X-Request-Id") ?? undefined,
    retryAfter: parseRetryAfter(response),
  };

  if (response.status === 429) {
    const wait = meta.retryAfter;
    return new ApiRequestError(
      wait
        ? `Too many attempts. Please try again in ${wait} second${wait === 1 ? "" : "s"}.`
        : "Too many attempts. Please wait a few minutes and try again.",
      429,
      payload?.errors,
      meta,
    );
  }

  // The service is up but a dependency is not. Distinct from a real 500 so the
  // UI can say "try again" instead of "something broke".
  if (response.status === 503 || response.status === 504) {
    return new ApiRequestError(
      "We're having trouble reaching our servers. Please try again in a moment.",
      response.status,
      payload?.errors,
      meta,
    );
  }

  // A genuine bug on our side — never show the raw message.
  if (response.status >= 500) {
    return new ApiRequestError(
      "Something went wrong on our end. Please try again shortly.",
      response.status,
      payload?.errors,
      meta,
    );
  }

  if (meta.code === API_ERROR_CODES.ACCOUNT_SUSPENDED || meta.code === API_ERROR_CODES.ACCOUNT_DEACTIVATED) {
    return new ApiRequestError(
      payload?.message || "This account is no longer active. Please contact support.",
      response.status,
      payload?.errors,
      meta,
    );
  }

  // 4xx messages are written for end users, so they are safe to show as-is.
  return new ApiRequestError(
    payload?.message || "We couldn't complete that request. Please try again.",
    response.status,
    payload?.errors,
    meta,
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Honour Retry-After when the server sent one, otherwise exponential backoff. */
function backoffMs(attempt: number, retryAfter?: number) {
  if (retryAfter !== undefined) return Math.min(retryAfter * 1000, MAX_BACKOFF_MS);
  return Math.min(2 ** attempt * 500, MAX_BACKOFF_MS);
}

async function performRequest<T>(path: string, init: RequestInit = {}, includeAuth = true): Promise<T> {
  const normalizedPath = normalizePath(path);
  const headers = new Headers(init.headers);
  const hasBody = init.body !== undefined && init.body !== null;

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (includeAuth && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${normalizedPath}`, {
      ...init,
      credentials: "include",
      headers,
    });
  } catch {
    throw new ApiRequestError("Connection issue. Check your internet and try again.", undefined, [], {
      code: API_ERROR_CODES.NETWORK,
    });
  }

  const payload = await readPayload(response);
  if (!response.ok || payload?.success === false) {
    throw errorForResponse(response, payload);
  }

  return (payload?.data ?? undefined) as T;
}

async function tryRefreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const data = await performRequest<{ accessToken: string }>(
        "/auth/refresh",
        { method: "POST", body: JSON.stringify({}) },
        false,
      );

      if (!data?.accessToken) {
        clearAccessToken();
        return null;
      }

      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch (error) {
      // A refresh that failed because the API is unreachable is not a dead
      // session — rethrow so the caller retries instead of signing the user out.
      if (error instanceof ApiRequestError && error.isRetryable) throw error;
      clearAccessToken();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function refreshAccessToken() {
  const token = await tryRefreshAccessToken();
  if (!token) {
    throw new ApiRequestError("Your session has expired. Please sign in again.", 401, [], {
      code: API_ERROR_CODES.TOKEN_EXPIRED,
    });
  }
  return token;
}

/**
 * TOKEN_EXPIRED is the only 401 that a refresh can fix. Treating any other one
 * as refreshable is what produces the infinite refresh loop: REFRESH_TOKEN_INVALID
 * would trigger a refresh, which fails the same way, forever.
 *
 * A 401 carrying no code at all is the one ambiguous case — an edge or proxy can
 * strip the body. We refresh once there rather than sign the user out on a blank
 * response; the retry either succeeds or fails with a code we can read.
 */
function shouldRefreshForError(error: ApiRequestError) {
  if (error.status !== 401) return false;
  return error.code === API_ERROR_CODES.TOKEN_EXPIRED || error.code === undefined;
}

export async function request<T>(path: string, init: RequestInit = {}, options: RequestOptions = {}): Promise<T> {
  const normalizedPath = normalizePath(path);
  const method = (init.method ?? "GET").toUpperCase();
  const isRead = method === "GET" || method === "HEAD";
  const retryEnabled = options.retry ?? isRead;
  const maxRetries = options.maxRetries ?? (retryEnabled ? DEFAULT_GET_RETRIES : 0);

  let attempt = 0;

  for (;;) {
    try {
      return await performRequest<T>(normalizedPath, init);
    } catch (error) {
      if (!(error instanceof ApiRequestError)) {
        throw new ApiRequestError("Something went wrong on our end. Please try again shortly.");
      }

      if (shouldRefreshForError(error) && shouldAttemptRefresh(normalizedPath)) {
        const refreshedToken = await tryRefreshAccessToken();
        if (refreshedToken) {
          return performRequest<T>(normalizedPath, init);
        }
        expireSession();
        throw error;
      }

      if (error.status === 401 && shouldAttemptRefresh(normalizedPath)) {
        expireSession();
        throw error;
      }

      // Temporary failure — back off and try the same request again.
      if (error.isRetryable && attempt < maxRetries) {
        await delay(backoffMs(attempt, error.retryAfter));
        attempt += 1;
        continue;
      }

      throw error;
    }
  }
}

export const apiClient = {
  get<T>(path: string, options?: RequestOptions) {
    return request<T>(path, { method: "GET" }, options);
  },
  post<T>(path: string, body: unknown = {}, options?: RequestOptions) {
    return request<T>(path, { method: "POST", body: JSON.stringify(body) }, options);
  },
  patch<T>(path: string, body: unknown = {}, options?: RequestOptions) {
    return request<T>(path, { method: "PATCH", body: JSON.stringify(body) }, options);
  },
  put<T>(path: string, body: unknown = {}, options?: RequestOptions) {
    return request<T>(path, { method: "PUT", body: JSON.stringify(body) }, options);
  },
  delete<T>(path: string, options?: RequestOptions) {
    return request<T>(path, { method: "DELETE" }, options);
  },
};
