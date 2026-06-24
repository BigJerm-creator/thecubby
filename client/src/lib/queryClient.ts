import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getServerUrl, isNativePlatform } from "./capacitor";

export function resolveUrl(url: string): string {
  const base = getServerUrl();
  if (base && url.startsWith('/')) {
    return `${base}${url}`;
  }
  return url;
}

const NATIVE_SESSION_KEY = "_native_session";

export function saveNativeSession(sid: string): void {
  localStorage.setItem(NATIVE_SESSION_KEY, sid);
}

export function clearNativeSession(): void {
  localStorage.removeItem(NATIVE_SESSION_KEY);
}

export function getNativeAuthHeaders(): Record<string, string> {
  const isStandalone =
    (window.navigator as any).standalone === true ||
    window.matchMedia?.('(display-mode: standalone)').matches === true;
  if (!isNativePlatform() && !isStandalone) return {};
  const sid = localStorage.getItem(NATIVE_SESSION_KEY);
  return sid ? { Authorization: `Bearer ${sid}` } : {};
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(resolveUrl(url), {
    method,
    headers: { ...getNativeAuthHeaders(), ...(data ? { "Content-Type": "application/json" } : {}) },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = resolveUrl(queryKey.join("/") as string);
    const res = await fetch(url, {
      credentials: "include",
      headers: getNativeAuthHeaders(),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

let redirecting = false;
function handleUnauthorized() {
  if (!redirecting) {
    redirecting = true;
    window.location.href = "/";
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 1000 * 60 * 5,
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.startsWith("401:")) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
      onError: (error) => {
        if (error instanceof Error && error.message.startsWith("401:")) {
          handleUnauthorized();
        }
      },
    },
  },
});

queryClient.getQueryCache().config.onError = (error, query) => {
  if (error instanceof Error && error.message.startsWith("401:")) {
    const queryKey = query.queryKey as string[];
    if (queryKey[0] === "/api/auth/user") return;
    handleUnauthorized();
  }
};
