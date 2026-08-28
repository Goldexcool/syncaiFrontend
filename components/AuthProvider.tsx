"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { clearAccessToken, getAccessToken, setAccessToken, setSessionExpiredHandler } from "@/lib/api/client";
import { getCurrentUser, getCurrentWorkspace, logoutUser, refreshSession, type AuthData, type User, type Workspace } from "@/lib/api/auth";

type AuthContextValue = {
  user: User | null;
  workspace: Workspace | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  setAuth: (data: AuthData) => void;
  clearAuth: () => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeCurrentUser(payload: Awaited<ReturnType<typeof getCurrentUser>>["user"]): User {
  const id = payload.id ?? payload.sub;
  return { ...payload, id, sub: payload.sub ?? id };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(() => getAccessToken());
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mutationVersion = useRef(0);

  const setAuth = useCallback((data: AuthData) => {
    mutationVersion.current += 1;
    setAccessToken(data.accessToken);
    setAccessTokenState(data.accessToken);
    setUser(normalizeCurrentUser(data.user));
    setWorkspace(data.workspace ?? null);
  }, []);

  const clearAuth = useCallback(() => {
    mutationVersion.current += 1;
    clearAccessToken();
    setAccessTokenState(null);
    setUser(null);
    setWorkspace(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const [currentUser, currentWorkspace] = await Promise.all([
      getCurrentUser(),
      getCurrentWorkspace(),
    ]);
    setUser(normalizeCurrentUser(currentUser.user));
    setWorkspace(currentWorkspace.workspace);
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(clearAuth);
    return () => setSessionExpiredHandler(null);
  }, [clearAuth]);

  useEffect(() => {
    let active = true;
    const versionAtStart = mutationVersion.current;

    async function initialize() {
      try {
        const refreshed = await refreshSession();
        if (!active || mutationVersion.current !== versionAtStart) return;

        setAccessToken(refreshed.accessToken);
        setAccessTokenState(refreshed.accessToken);
        const [currentUser, currentWorkspace] = await Promise.all([
          getCurrentUser(),
          getCurrentWorkspace(),
        ]);
        if (!active || mutationVersion.current !== versionAtStart) return;

        setUser(normalizeCurrentUser(currentUser.user));
        setWorkspace(currentWorkspace.workspace);
      } catch {
        if (!active || mutationVersion.current !== versionAtStart) return;
        clearAuth();
      } finally {
        if (active) setIsInitialized(true);
      }
    }

    void initialize();
    return () => {
      active = false;
    };
  }, [clearAuth]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutUser();
    } catch {
      // Clear the local session even when the API is unavailable.
    } finally {
      clearAuth();
      setIsLoading(false);
    }
  }, [clearAuth]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    workspace,
    accessToken,
    isAuthenticated: Boolean(accessToken && user),
    isInitialized,
    isLoading,
    setAuth,
    clearAuth,
    refreshUser,
    logout,
  }), [accessToken, clearAuth, isInitialized, isLoading, logout, refreshUser, setAuth, user, workspace]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
