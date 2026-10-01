import { tokenStorage } from './tokenStorage';
import type { Tokens } from '../types/api';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function getErrorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
}

type RawOptions = { method?: string; body?: unknown; accessToken?: string };

async function rawFetch<T>(path: string, opts: RawOptions): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opts.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(opts.accessToken ? { Authorization: `Bearer ${opts.accessToken}` } : {}),
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', "Can't reach the server. Check your internet connection and try again.");
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error;
    throw new ApiError(res.status, err?.code ?? 'REQUEST_FAILED', err?.message ?? `Request failed (${res.status})`, err?.details);
  }
  return data as T;
}

// One refresh at a time: refresh tokens rotate, so parallel refreshes would invalidate each other.
let refreshing: Promise<boolean> | null = null;
let onSessionExpired: () => void = () => {};
export const setSessionExpiredHandler = (fn: () => void) => {
  onSessionExpired = fn;
};

async function doRefresh(): Promise<boolean> {
  const current = await tokenStorage.load();
  if (!current) return false;
  try {
    const res = await rawFetch<{ tokens: Tokens }>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken: current.refreshToken },
    });
    await tokenStorage.save(res.tokens);
    return true;
  } catch (err) {
    if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
      await tokenStorage.clear();
      return false;
    }
    throw err; // Network trouble: keep the session and let the caller report it.
  }
}

function refreshTokens(): Promise<boolean> {
  if (!refreshing) {
    refreshing = doRefresh().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

type RequestOptions = { method?: string; body?: unknown; auth?: boolean };

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const auth = opts.auth ?? true;
  const call = async () => {
    const tokens = auth ? await tokenStorage.load() : null;
    return rawFetch<T>(path, { method: opts.method, body: opts.body, accessToken: tokens?.accessToken });
  };

  try {
    return await call();
  } catch (err) {
    if (auth && err instanceof ApiError && err.status === 401 && err.code === 'INVALID_TOKEN') {
      if (await refreshTokens()) return call();
      onSessionExpired();
    }
    throw err;
  }
}

export type HealthResponse = { status: 'ok' | 'degraded'; database: 'up' | 'down'; timestamp: string };
export const fetchHealth = () => request<HealthResponse>('/health', { auth: false });