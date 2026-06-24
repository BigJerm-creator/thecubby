import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";
import { resolveUrl, saveNativeSession, clearNativeSession, getNativeAuthHeaders } from "@/lib/queryClient";

async function fetchUser(): Promise<User | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(resolveUrl("/api/auth/user"), {
      credentials: "include",
      signal: controller.signal,
      headers: getNativeAuthHeaders(),
    });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function loginRequest(body: { email: string; password: string }): Promise<User> {
  const res = await fetch(resolveUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as any;
    throw new Error(data.error || `${res.status}: ${res.statusText}`);
  }
  const data = await res.json() as User & { _sid?: string };
  if (data._sid) saveNativeSession(data._sid);
  const { _sid: _, ...user } = data as any;
  return user as User;
}

async function registerRequest(body: { email: string; password: string; firstName?: string }): Promise<User> {
  const res = await fetch(resolveUrl("/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as any;
    throw new Error(data.error || `${res.status}: ${res.statusText}`);
  }
  const data = await res.json() as User & { _sid?: string };
  if (data._sid) saveNativeSession(data._sid);
  const { _sid: _, ...user } = data as any;
  return user as User;
}

async function logoutRequest(): Promise<void> {
  await fetch(resolveUrl("/api/auth/logout"), {
    method: "POST",
    credentials: "include",
    headers: getNativeAuthHeaders(),
  });
  clearNativeSession();
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (user) => { queryClient.setQueryData(["/api/auth/user"], user); },
  });

  const registerMutation = useMutation({
    mutationFn: registerRequest,
    onSuccess: (user) => { queryClient.setQueryData(["/api/auth/user"], user); },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => { queryClient.setQueryData(["/api/auth/user"], null); queryClient.clear(); },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: (body: { email: string; password: string }) => loginMutation.mutateAsync(body),
    register: (body: { email: string; password: string; firstName?: string }) => registerMutation.mutateAsync(body),
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
